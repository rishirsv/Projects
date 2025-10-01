import { test, expect } from '@playwright/test';

const HERO_MODEL_SELECTOR = '.hero-overline .model-selector';
const PIPELINE_CARD = '.progress-card';
const SUMMARY_CARD = '.summary-card';
const HISTORY_PANEL = '.history-panel';

const within = (value: number, upperBound: number, tolerance = 0.5) => value <= upperBound + tolerance;

test.describe('WatchLater UI layout refinements', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('model selector is subtle within the hero overline', async ({ page }) => {
    const selector = page.locator(HERO_MODEL_SELECTOR);
    await expect(selector).toHaveCount(1);
    await expect(selector).toHaveClass(/model-selector--subtle/);

    const { width, height } = await selector.evaluate((el) => {
      const rect = el.getBoundingClientRect();
      return { width: rect.width, height: rect.height };
    });

    expect(within(width, 260)).toBeTruthy();
    expect(within(height, 32)).toBeTruthy();
  });

  test('processing pipeline container width is constrained', async ({ page }) => {
    const pipeline = page.locator(PIPELINE_CARD);
    await expect(pipeline).toHaveCount(1);

    const width = await pipeline.evaluate((el) => el.getBoundingClientRect().width);
    expect(within(width, 720)).toBeTruthy();

    const summaryWidth = await page.locator(SUMMARY_CARD).evaluate((el) => el.getBoundingClientRect().width);
    expect(within(summaryWidth, 720)).toBeTruthy();

    const gridLayout = await page.locator('.progress-grid').evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return {
        display: styles.display,
        flexWrap: styles.flexWrap
      };
    });

    expect(gridLayout.display).toBe('flex');
    expect(gridLayout.flexWrap).toBe('nowrap');
  });

  test('history panel stays pinned with internal scroll after loading a summary', async ({ page }) => {
    await page.locator('.history-item').first().click();

    await expect(page.locator('.summary-markdown')).toBeVisible();

    const historyPanel = page.locator(HISTORY_PANEL);
    await expect(historyPanel).toHaveCount(1);

    const computed = await historyPanel.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return {
        position: styles.position,
        overflowY: styles.overflowY,
        maxHeight: styles.maxHeight,
        clientHeight: el.clientHeight,
        viewportHeight: window.innerHeight,
        scrollable: el.scrollHeight > el.clientHeight,
        right: el.getBoundingClientRect().right,
        viewportWidth: window.innerWidth
      };
    });

    expect(computed.position).toBe('sticky');
    expect(computed.overflowY).toBe('auto');
    expect(computed.scrollable).toBeTruthy();
    expect(within(computed.clientHeight, computed.viewportHeight)).toBeTruthy();
    expect(computed.right).toBeLessThanOrEqual(computed.viewportWidth + 0.5);

    await page.evaluate(() => window.scrollBy(0, 800));
    const topAfterScroll = await historyPanel.evaluate((el) => el.getBoundingClientRect().top);
    expect(within(topAfterScroll, 40)).toBeTruthy();
  });

  test('summary metadata omits saved file pill', async ({ page }) => {
    await page.locator('.history-item').first().click();
    await expect(page.locator('.summary-markdown')).toBeVisible();

    const metaItems = page.locator('.summary-meta__item');
    expect(await metaItems.count()).toBeGreaterThan(0);
    await expect(page.locator('.summary-meta__item[data-meta="file"]')).toHaveCount(0);
    await expect(page.getByText('Saved file', { exact: false })).toHaveCount(0);
  });
});
