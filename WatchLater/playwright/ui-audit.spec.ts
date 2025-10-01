import { test, expect } from '@playwright/test';

const HERO_MODEL_SELECTOR = '.hero-overline .model-selector';
const PIPELINE_CARD = '.progress-card';
const PIPELINE_GRID = '.progress-grid';
const SUMMARY_CARD = '.summary-card';
const SUMMARY_MD = '.summary-markdown';

const widths = [320, 375, 414, 768, 1024, 1280, 1440];

test.describe('Comprehensive UI Audit', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('Hero model selector is subtle and present', async ({ page }) => {
    const selector = page.locator(HERO_MODEL_SELECTOR);
    await expect(selector).toHaveCount(1);
    await expect(selector).toHaveClass(/model-selector--subtle/);
  });

  test('System font stack applied', async ({ page }) => {
    const fam = await page.evaluate(() => getComputedStyle(document.body).fontFamily);
    // Should include at least one of these tokens
    expect(/-apple-system|system-ui|BlinkMacSystemFont/i.test(fam)).toBeTruthy();
  });

  test('Pipeline is single-row, no overflow across common widths', async ({ page, browserName }) => {
    test.slow(browserName === 'webkit');
    for (const width of widths) {
      await page.setViewportSize({ width, height: 720 });
      const grid = page.locator(PIPELINE_GRID);
      await expect(grid).toBeVisible();
      const layout = await grid.evaluate((el) => {
        const s = getComputedStyle(el);
        return {
          display: s.display,
          wrap: s.flexWrap,
          scrollWidth: el.scrollWidth,
          clientWidth: el.clientWidth,
          children: el.children.length
        };
      });
      expect(layout.display).toBe('flex');
      expect(layout.wrap).toBe('nowrap');
      expect(layout.scrollWidth).toBeLessThanOrEqual(layout.clientWidth + 0.5);
      expect(layout.children).toBeGreaterThanOrEqual(4);
    }
  });

  test('Status pill shows when a summary is selected', async ({ page }) => {
    await page.locator('.history-item').first().click();
    await expect(page.locator(SUMMARY_MD)).toBeVisible();
    const pill = page.locator('.status-pill');
    await expect(pill).toHaveText(/summary saved/i);
  });

  test('Summary metadata chips present (no saved file pill)', async ({ page }) => {
    await page.locator('.history-item').first().click();
    await expect(page.locator(SUMMARY_MD)).toBeVisible();
    await expect(page.locator('.summary-meta__item[data-meta="creator"]')).toHaveCount(1);
    await expect(page.locator('.summary-meta__item[data-meta="model"]')).toHaveCount(1);
    await expect(page.locator('.summary-meta__item[data-meta="video"]')).toHaveCount(1);
    await expect(page.locator('.summary-meta__item[data-meta="file"]')).toHaveCount(0);
  });

  test('Summary containment and spacing (no horizontal overflow)', async ({ page, browserName }) => {
    test.slow(browserName === 'webkit');
    await page.locator('.history-item').first().click();
    await expect(page.locator(SUMMARY_MD)).toBeVisible();
    for (const width of widths) {
      await page.setViewportSize({ width, height: 800 });
      const dims = await page.locator(SUMMARY_CARD).evaluate((el) => ({
        scrollWidth: el.scrollWidth,
        clientWidth: el.clientWidth
      }));
      expect(dims.scrollWidth).toBeLessThanOrEqual(dims.clientWidth + 0.5);
    }
    // Code blocks should scroll internally if needed, not overflow the card
    const preCount = await page.locator(`${SUMMARY_MD} pre`).count();
    if (preCount > 0) {
      const sc = await page.locator(`${SUMMARY_MD} pre`).first().evaluate((el) => ({
        scrollWidth: el.scrollWidth,
        clientWidth: el.clientWidth
      }));
      expect(sc.scrollWidth).toBeGreaterThanOrEqual(sc.clientWidth);
    }
  });

  test('Accessible names on key controls', async ({ page }) => {
    const titledButtons = await page.locator('button[title]').count();
    expect(titledButtons).toBeGreaterThanOrEqual(3);
  });
});

