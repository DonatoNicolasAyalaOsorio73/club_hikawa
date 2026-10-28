import { expect, test } from '@playwright/test';
import { CLUB, PAGES, open } from './helpers';

test('club contact details appear and link correctly', async ({ page }) => {
  await open(page, '#informacion');
  const info = page.locator('#informacion');
  await expect(info).toContainText(CLUB.address);
  await expect(info.locator(`a[href="${CLUB.mapsUrl}"]`)).toHaveAttribute('rel', 'noopener');
  await expect(info.locator(`a[href="https://wa.me/${CLUB.whatsapp}"]`)).toContainText(CLUB.whatsappShown);
  await expect(page.locator('#f-contact')).toBeAttached();
  await expect(page.locator('.reg__wa')).toHaveAttribute('href', new RegExp(`^https://wa\\.me/${CLUB.whatsapp}\\?text=`));
  await expect(page.locator('footer')).toContainText(CLUB.address);
});

test('footer links reach both legal pages', async ({ page }) => {
  await open(page, 'el-judo/');
  await page.locator('footer a', { hasText: 'POLÍTICA DE PRIVACIDAD' }).click();
  await expect(page).toHaveURL(/\/privacidad\/$/);
  await expect(page.locator('h1')).toContainText('datos personales');
  await page.locator('footer a', { hasText: 'TÉRMINOS DE USO' }).click();
  await expect(page).toHaveURL(/\/terminos\/$/);
  await expect(page.locator('h1')).toContainText('Términos');
});

test('privacy policy covers what Ley 1581 requires', async ({ page }) => {
  await open(page, 'privacidad/');
  const body = page.locator('main');
  for (const text of ['Ley Estatutaria 1581 de 2012', 'Decreto 1074 de 2015', CLUB.whatsappShown, CLUB.address, 'diez (10) días hábiles', 'quince (15) días hábiles', 'Superintendencia de Industria y Comercio', 'representante legal', 'no usa cookies'])
    await expect(body, text).toContainText(text);
  for (const id of ['aviso', 'responsable', 'datos', 'finalidades', 'autorizacion', 'menores', 'sensibles', 'terceros', 'derechos', 'procedimiento', 'seguridad', 'cookies', 'vigencia'])
    await expect(page.locator(`#${id}`)).toBeAttached();
  // Every table-of-contents entry points at a section that exists.
  for (const href of await page.locator('.lgl__toc a').evaluateAll((as) => as.map((a) => a.getAttribute('href')!)))
    await expect(page.locator(href)).toBeAttached();
});

test('terms include the sports-risk notice and applicable law', async ({ page }) => {
  await open(page, 'terminos/');
  const body = page.locator('main');
  for (const text of ['deporte de contacto', 'supervisión de un instructor', 'leyes de la República de Colombia', 'Pexels'])
    await expect(body).toContainText(text);
});

test('site copy uses no em or en dashes', async ({ page }) => {
  for (const { path } of PAGES) {
    await page.goto(path);
    const text = await page.locator('body').innerText();
    expect(text.match(/[–—]/g), path || 'home').toBeNull();
  }
});
