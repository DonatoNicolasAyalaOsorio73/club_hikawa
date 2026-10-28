import { expect, test } from '@playwright/test';
import { PAGES, watchErrors } from './helpers';

for (const { path, name } of PAGES) {
  test.describe(name, () => {
    test('loads without errors, broken files or horizontal scroll', async ({ page }) => {
      const errors = watchErrors(page);
      const res = await page.goto(path);
      expect(res?.status()).toBe(200);
      await page.waitForLoadState('networkidle');
      // Scroll through the page so lazy images, clips and reveals load too.
      await page.evaluate(async () => {
        for (let y = 0; y < document.body.scrollHeight; y += innerHeight * 0.8) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); }
      });
      await page.waitForLoadState('networkidle');
      expect(errors).toEqual([]);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      expect(overflow).toBeLessThanOrEqual(1);
    });

    test('has the basic document structure', async ({ page }) => {
      await page.goto(path);
      await expect(page.locator('html')).toHaveAttribute('lang', 'es');
      await expect(page).toHaveTitle(/Hikawa/);
      await expect(page.locator('h1')).toHaveCount(1);
      await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /.{40,}/);
      await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /^https:\/\/.+\/assets\/hikawa-logo\.png$/);
      await expect(page.locator('header [data-header], [data-header]')).toBeVisible();
      await expect(page.locator('footer')).toBeAttached();
    });
  });
}
