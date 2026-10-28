import type { Page } from '@playwright/test';

export const PAGES = [
  { path: '', name: 'Inicio' },
  { path: 'el-judo/', name: 'El judo' },
  { path: 'privacidad/', name: 'Privacidad' },
  { path: 'terminos/', name: 'Términos' },
] as const;

export const CLUB = {
  whatsapp: '573152036137',
  whatsappShown: '+57 315 2036137',
  address: 'Cl. 9c Bis #46-139',
  mapsUrl: 'https://maps.app.goo.gl/wwWNhT8iPRPbXvrH7',
};

/** Collects console errors, uncaught exceptions and failed same-origin responses while a test runs. */
export function watchErrors(page: Page) {
  const errors: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('response', (r) => {
    if (r.status() >= 400 && new URL(r.url()).origin === new URL(page.url() || r.url()).origin) errors.push(`${r.status()} ${r.url()}`);
  });
  return errors;
}

/** Visits a page without the intro loader (it is skipped on deep links and under reduced motion). */
export async function open(page: Page, path: string) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(path);
}
