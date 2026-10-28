import { expect, test } from '@playwright/test';
import { BASE_PATH } from '../playwright.config';
import { PAGES } from './helpers';

// Every internal link and file referenced by every page must exist under the sub-path.
test('all internal links and files resolve', async ({ page, request }, info) => {
  test.skip(info.project.name !== 'desktop', 'Same HTML on every device; checking once is enough.');
  const urls = new Set<string>();
  for (const { path } of PAGES) {
    await page.goto(path);
    const found = await page.evaluate(() => {
      const out: string[] = [];
      const add = (v: string | null) => { if (v) out.push(new URL(v, location.href).href); };
      document.querySelectorAll('a[href]').forEach((a) => add(a.getAttribute('href')));
      document.querySelectorAll('[src]').forEach((e) => add(e.getAttribute('src')));
      document.querySelectorAll('video[poster]').forEach((e) => add(e.getAttribute('poster')));
      document.querySelectorAll('link[href]').forEach((e) => add(e.getAttribute('href')));
      document.querySelectorAll('[srcset]').forEach((e) => e.getAttribute('srcset')!.split(',').forEach((s) => add(s.trim().split(/\s+/)[0])));
      return out;
    });
    found.forEach((u) => urls.add(u));
  }
  const origin = new URL(page.url()).origin;
  const internal = [...urls].filter((u) => u.startsWith(origin)).map((u) => u.split('#')[0]);
  expect(internal.length).toBeGreaterThan(20);
  const broken: string[] = [];
  for (const u of new Set(internal)) {
    if (!new URL(u).pathname.startsWith(BASE_PATH + '/')) { broken.push(`outside ${BASE_PATH}: ${u}`); continue; }
    const res = await request.get(u);
    if (res.status() !== 200) broken.push(`${res.status()} ${u}`);
  }
  expect(broken).toEqual([]);
});

test('hero frame sequence files exist', async ({ request }, info) => {
  test.skip(info.project.name !== 'desktop', 'Checking once is enough.');
  for (const [dir, count] of [['d', 120], ['m', 102]] as const) {
    for (const n of [1, Math.ceil(count / 2), count]) {
      const res = await request.get(`frames/${dir}/f${String(n).padStart(3, '0')}.webp`);
      expect(res.status(), `frames/${dir}/f${n}`).toBe(200);
    }
  }
});
