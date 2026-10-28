import { expect, test, type Page } from '@playwright/test';
import { CLUB, open } from './helpers';

// window.open is replaced so the test can read the WhatsApp URL instead of opening a tab.
async function openForm(page: Page) {
  await page.addInitScript(() => {
    (window as any).__opened = [];
    window.open = ((url: string) => { (window as any).__opened.push(url); return null; }) as typeof window.open;
  });
  await open(page, '#inscripcion');
  const form = page.locator('[data-form]');
  await form.scrollIntoViewIfNeeded();
  return form;
}

const opened = (page: Page) => page.evaluate(() => (window as any).__opened as string[]);

test('empty submit shows every required error and opens nothing', async ({ page }) => {
  const form = await openForm(page);
  await form.locator('.reg__submit').click();
  for (const id of ['e-name', 'e-contact', 'e-program', 'e-consent']) await expect(page.locator(`#${id}`)).toBeVisible();
  await expect(page.locator('#f-name')).toHaveAttribute('aria-invalid', 'true');
  await expect(page.locator('#f-name')).toBeFocused();
  expect(await opened(page)).toEqual([]);
});

test('a valid adult request opens WhatsApp to the club with the message', async ({ page }) => {
  const form = await openForm(page);
  await page.fill('#f-name', 'Ana Gómez');
  await page.fill('#f-contact', '+57 300 123 4567');
  await page.selectOption('#f-program', 'Adultos');
  await page.fill('#f-msg', 'Quiero empezar en enero.');
  await page.check('#f-consent');
  await form.locator('.reg__submit').click();

  const urls = await opened(page);
  expect(urls).toHaveLength(1);
  const url = new URL(urls[0]);
  expect(url.origin + url.pathname).toBe(`https://wa.me/${CLUB.whatsapp}`);
  const text = url.searchParams.get('text')!;
  expect(text).toContain('Nombre: Ana Gómez');
  expect(text).toContain('Programa: Adultos');
  expect(text).toContain('WhatsApp: +57 300 123 4567');
  expect(text).toContain('Mensaje: Quiero empezar en enero.');
  await expect(page.locator('[data-result]')).toContainText('ABRIMOS WHATSAPP');
  await expect(page.locator('[data-result] a')).toHaveAttribute('rel', 'noopener');
});

test('youth programs require the guardian confirmation', async ({ page }) => {
  const form = await openForm(page);
  await expect(page.locator('[data-guardian]')).toBeHidden();
  await page.fill('#f-name', 'Luis Pérez');
  await page.fill('#f-contact', '3001234567');
  await page.selectOption('#f-program', 'Infantil');
  await expect(page.locator('[data-guardian]')).toBeVisible();
  await page.check('#f-consent');
  await form.locator('.reg__submit').click();
  await expect(page.locator('#e-guardian')).toBeVisible();
  expect(await opened(page)).toEqual([]);

  await page.check('#f-guardian');
  await form.locator('.reg__submit').click();
  const text = new URL((await opened(page))[0]).searchParams.get('text')!;
  expect(text).toContain('Solicitud hecha por madre, padre o tutor.');
});

test('email method validates the address', async ({ page }) => {
  const form = await openForm(page);
  await page.click('[data-method="email"]');
  await expect(page.locator('#f-contact')).toHaveAttribute('type', 'email');
  await page.fill('#f-name', 'Ana');
  await page.fill('#f-contact', 'no-es-un-email');
  await page.selectOption('#f-program', 'Adultos');
  await page.check('#f-consent');
  await form.locator('.reg__submit').click();
  await expect(page.locator('#e-contact')).toBeVisible();
});

test('typed HTML is never rendered as markup (XSS)', async ({ page }) => {
  const form = await openForm(page);
  const payload = '<img src=x onerror="window.__xss=1"><script>window.__xss=2</script>';
  await page.fill('#f-name', payload);
  await page.fill('#f-contact', '+57 300 123 4567');
  await page.selectOption('#f-program', 'Adultos');
  await page.fill('#f-msg', payload);
  await page.check('#f-consent');
  await form.locator('.reg__submit').click();
  await page.waitForTimeout(300);
  expect(await page.evaluate(() => (window as any).__xss)).toBeUndefined();
  await expect(page.locator('[data-result] img, [data-result] script')).toHaveCount(0);
  // The payload travels only as encoded text inside the WhatsApp URL.
  expect(new URL((await opened(page))[0]).searchParams.get('text')).toContain(payload);
});

test('consent links to the privacy policy', async ({ page }) => {
  await openForm(page);
  const link = page.locator('#f-consent + span a');
  await expect(link).toHaveAttribute('href', /\/privacidad\/$/);
  await expect(link).toHaveAttribute('rel', 'noopener');
});
