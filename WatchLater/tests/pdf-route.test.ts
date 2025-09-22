import fs from 'fs';
import path from 'path';
import { getSummaryPdf } from '../server.js';
import { shutdownPdfRenderer } from '../server/pdf-renderer.js';

type PdfRequest = Parameters<typeof getSummaryPdf>[0];
type PdfResponse = Parameters<typeof getSummaryPdf>[1];

const summariesDir = path.resolve(process.cwd(), 'exports', 'summaries');

class MockResponse
  implements Pick<PdfResponse, 'status' | 'setHeader' | 'getHeader' | 'json' | 'send'>
{
  statusCode = 200;
  headers = new Map<string, string>();
  body: unknown = undefined;

  status(code: number) {
    this.statusCode = code;
    return this;
  }

  setHeader(name: string, value: string) {
    this.headers.set(name.toLowerCase(), value);
  }

  getHeader(name: string) {
    return this.headers.get(name.toLowerCase());
  }

  json(payload: unknown) {
    this.body = payload;
    return this;
  }

  send(payload: unknown) {
    this.body = payload;
    return this;
  }
}

describe('GET /api/summary/:videoId/pdf', () => {
  const videoId = 'testvideo123';
  const summaryFilename = `${videoId}__Sample-Video-summary-2024-01-01T00-00-00.md`;
  const summaryPath = path.join(summariesDir, summaryFilename);

  beforeAll(async () => {
    process.env.SKIP_PDF_RENDER = 'true';
    process.env.NODE_ENV = 'test';
    await fs.promises.mkdir(summariesDir, { recursive: true });
    const sampleContent = `# YouTube Video Summary\n\n**Video ID:** ${videoId}  \n**Title:** Sample Video  \n**Generated:** 2024-01-01T00:00:00.000Z  \n**Length:** 1200 characters\n\n---\n\n## Heading\n\n- Bullet point\n\n`;
    await fs.promises.writeFile(summaryPath, sampleContent, 'utf8');
  });

  afterAll(async () => {
    delete process.env.SKIP_PDF_RENDER;
    await fs.promises.rm(summaryPath, { force: true });
    await shutdownPdfRenderer();
  });

  it('returns a PDF stream with headers for an existing summary', async () => {
    const req = { params: { videoId } } as unknown as PdfRequest;
    const res = new MockResponse();

    await getSummaryPdf(req, res as unknown as PdfResponse);

    expect(res.statusCode).toBe(200);
    expect(res.getHeader('content-type')).toBe('application/pdf');
    expect(res.getHeader('content-disposition')).toContain('.pdf');
    expect(Buffer.isBuffer(res.body)).toBe(true);
    const pdfBuffer = res.body as Buffer;
    expect(pdfBuffer.length).toBeGreaterThan(10);
  });

  it('returns 404 when a summary cannot be found', async () => {
    const req = { params: { videoId: 'missing-id' } } as unknown as PdfRequest;
    const res = new MockResponse();

    await getSummaryPdf(req, res as unknown as PdfResponse);

    expect(res.statusCode).toBe(404);
    expect(res.body).toBeDefined();
    const payload = res.body as { error?: string };
    expect(payload.error).toMatch(/not found/i);
  });
});
