import { hasContent } from '../shared/content-validation.js';

const parsedConcurrency = Number.parseInt(process.env.PDF_MAX_CONCURRENT || '2', 10);
const MAX_CONCURRENT_EXPORTS = Number.isFinite(parsedConcurrency) && parsedConcurrency > 0 ? parsedConcurrency : 2;
const parsedTimeout = Number.parseInt(process.env.PDF_RENDER_TIMEOUT_MS || '45000', 10);
const RENDER_TIMEOUT_MS = Number.isFinite(parsedTimeout) && parsedTimeout > 0 ? parsedTimeout : 45000;

let puppeteerModulePromise = null;
let browserPromise = null;
let activeJobs = 0;
const queue = [];

function log(message, context = {}) {
  const { jobId, videoId } = context;
  const parts = ['[pdf-renderer]', message];
  if (jobId) parts.push(`job=${jobId}`);
  if (videoId) parts.push(`video=${videoId}`);
  console.log(parts.join(' '));
}

function logError(error, context = {}) {
  const { jobId, videoId } = context;
  const parts = ['[pdf-renderer]', 'error'];
  if (jobId) parts.push(`job=${jobId}`);
  if (videoId) parts.push(`video=${videoId}`);
  parts.push(error?.message || error);
  console.error(parts.join(' '));
}

function parseArgs(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  return `${value}`
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

async function loadPuppeteer() {
  if (!puppeteerModulePromise) {
    puppeteerModulePromise = import('puppeteer')
      .then((module) => module?.default ?? module)
      .catch((error) => {
        puppeteerModulePromise = null;
        const guidance = 'Puppeteer is required for PDF export. Install dependencies with `npm install` and ensure Chromium can launch in this environment.';
        error.message = guidance + `\nOriginal error: ${error.message}`;
        throw error;
      });
  }
  return puppeteerModulePromise;
}

function getLaunchOptions() {
  const args = ['--no-sandbox', '--disable-setuid-sandbox', ...parseArgs(process.env.PUPPETEER_EXTRA_ARGS)];
  const options = {
    headless: 'new',
    args
  };

  if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    options.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
  }

  if (process.env.PUPPETEER_HEADLESS) {
    options.headless = process.env.PUPPETEER_HEADLESS === 'false' ? false : process.env.PUPPETEER_HEADLESS;
  }

  return options;
}

async function ensureBrowser() {
  const puppeteer = await loadPuppeteer();

  if (!browserPromise) {
    browserPromise = puppeteer.launch(getLaunchOptions());

    browserPromise.catch((error) => {
      logError(error, { jobId: 'launch' });
      browserPromise = null;
    });
  }

  const browser = await browserPromise;

  browser.on('disconnected', () => {
    browserPromise = null;
  });

  return browser;
}

function enqueue(task, context) {
  return new Promise((resolve, reject) => {
    queue.push({ task, resolve, reject, context });
    drainQueue();
  });
}

function drainQueue() {
  if (!queue.length) return;
  if (activeJobs >= MAX_CONCURRENT_EXPORTS) return;

  const nextJob = queue.shift();
  if (!nextJob) return;

  activeJobs += 1;

  nextJob
    .task()
    .then((result) => nextJob.resolve(result))
    .catch((error) => nextJob.reject(error))
    .finally(() => {
      activeJobs -= 1;
      drainQueue();
    });
}

function withTimeout(promise, timeoutMs, context) {
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    return promise;
  }

  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      const timeoutError = new Error(`PDF rendering exceeded ${timeoutMs}ms timeout`);
      timeoutError.code = 'PDF_RENDER_TIMEOUT';
      reject(timeoutError);
    }, timeoutMs);
  });

  return Promise.race([
    promise.finally(() => clearTimeout(timeoutId)),
    timeoutPromise
  ]).finally(() => clearTimeout(timeoutId));
}

async function executeRender(html, options) {
  const { jobId, videoId } = options;

  if (!hasContent(html)) {
    throw new Error('Empty HTML payload received for PDF rendering');
  }

  log('starting render', { jobId, videoId });
  const browser = await ensureBrowser();
  const page = await browser.newPage();

  try {
    await page.setContent(html, { waitUntil: ['load', 'domcontentloaded'] });
    await page.emulateMediaType('print');
    await page.waitForNetworkIdle({ idleTime: 500, timeout: 2000 }).catch(() => {});

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        bottom: '20mm',
        left: '20mm',
        right: '20mm'
      }
    });

    log('render complete', { jobId, videoId });
    return pdfBuffer;
  } catch (error) {
    logError(error, { jobId, videoId });
    throw error;
  } finally {
    await page.close().catch(() => {});
  }
}

export async function renderPdfBuffer(html, options = {}) {
  const jobId = options.jobId || `job-${Date.now()}`;
  const videoId = options.videoId;
  if (!hasContent(html)) {
    throw new Error('Empty HTML payload received for PDF rendering');
  }
  if (process.env.SKIP_PDF_RENDER === 'true') {
    log('skip flag enabled, returning stub PDF buffer', { jobId, videoId });
    return Buffer.from('%PDF-1.4\n%watchlater-test\n', 'utf8');
  }
  const renderPromise = enqueue(() => executeRender(html, { jobId, videoId }), { jobId, videoId });
  return withTimeout(renderPromise, RENDER_TIMEOUT_MS, { jobId, videoId });
}

export async function shutdownPdfRenderer() {
  if (browserPromise) {
    const browser = await browserPromise.catch(() => null);
    browserPromise = null;
    if (browser) {
      await browser.close().catch(() => {});
    }
  }
}

export default {
  renderPdfBuffer,
  shutdownPdfRenderer
};
