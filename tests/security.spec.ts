import { expect, test } from '@playwright/test';
import { PAGES, open } from './helpers';

test('pages only load files from the site itself (no third-party requests)', async ({ page, baseURL }) => {
  const site = new URL(baseURL!).origin;
  const external: string[] = [];
  page.on('request', (r) => {
    const u = new URL(r.url());
    if (['http:', 'https:'].includes(u.protocol) && u.origin !== site) external.push(r.url());
  });
  for (const { path } of PAGES) { await page.goto(path); await page.waitForLoadState('networkidle'); }
  expect(external).toEqual([]);
});

test('no cookies or browser storage are written', async ({ page, context }) => {
  for (const { path } of PAGES) { await page.goto(path); await page.waitForLoadState('networkidle'); }
  expect(await context.cookies()).toEqual([]);
  expect(await page.evaluate(() => [localStorage.length, sessionStorage.length])).toEqual([0, 0]);
});

for (const { path, name } of PAGES) {
  test(`${name}: no inline event handlers, external scripts or unsafe links`, async ({ page }) => {
    await page.goto(path);
    const report = await page.evaluate(() => {
      const handlers = [...document.querySelectorAll('*')].flatMap((el) => [...el.attributes].filter((a) => /^on/i.test(a.name)).map((a) => `${el.tagName} ${a.name}`));
      const scripts = [...document.querySelectorAll('script[src]')].map((s) => (s as HTMLScriptElement).src).filter((s) => new URL(s).origin !== location.origin);
      const styles = [...document.querySelectorAll('link[rel="stylesheet"]')].map((l) => (l as HTMLLinkElement).href).filter((s) => new URL(s).origin !== location.origin);
      const jsLinks = [...document.querySelectorAll('a[href]')].map((a) => a.getAttribute('href')!).filter((h) => /^\s*javascript:/i.test(h));
      const blankNoOpener = [...document.querySelectorAll('a[target="_blank"]')].filter((a) => !/\bnoopener\b/.test(a.getAttribute('rel') ?? '')).map((a) => a.getAttribute('href'));
      return { handlers, scripts, styles, jsLinks, blankNoOpener };
    });
    expect(report).toEqual({ handlers: [], scripts: [], styles: [], jsLinks: [], blankNoOpener: [] });
  });
}

test('old home anchors redirect only to the allowlisted sections', async ({ page }) => {
  await open(page, '#sensei');
  await expect(page).toHaveURL(/\/el-judo\/#sensei$/);

  for (const hash of ['javascript:alert(1)', '%2F%2Fevil.example', '../el-judo', 'sensei%22%3E%3Cimg']) {
    await open(page, `#${hash}`);
    await page.waitForTimeout(200);
    expect(new URL(page.url()).pathname, hash).toMatch(/\/club_hikawa\/$/);
  }
});

test('the belt data island cannot break out of its script tag', async ({ page }) => {
  await open(page, 'el-judo/#grados');
  const raw = await page.locator('script[data-belts-json]').evaluate((s) => s.textContent ?? '');
  expect(raw).not.toContain('<');
  expect(() => JSON.parse(raw)).not.toThrow();
});
