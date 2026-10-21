import { test, expect } from './support/fixtures';

const pages = [
  '/',
  '/pamelding',
  '/login',
  '/deltakere',
  '/deltakere?year=2025',
  '/galleri',
  '/premier',
  '/premier?year=2025',
  '/trekning',
  '/hvordan',
  '/kontakt',
  '/personvern',
  '/vilkar',
  '/takk',
];

/** Blocked map requests and dev-only React notices are not app errors. */
const ignoredConsole = [/mapbox/i, /Failed to load resource/, /Download the React DevTools/];

for (const path of pages) {
  test(`${path} loads without errors`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => {
      if (message.type() !== 'error') return;
      if (ignoredConsole.some((pattern) => pattern.test(message.text()))) return;
      errors.push(message.text());
    });

    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
    await expect(page.locator('h1').first()).toBeVisible();
    await page.waitForLoadState('networkidle');
    expect(errors).toEqual([]);
  });
}

test('the front page links to registration for visitors', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('navigation').getByRole('link', { name: 'Bli med' }).first().click();
  await expect(page).toHaveURL(/\/pamelding$/);
  await expect(page.getByRole('heading', { name: 'Påmelding' })).toBeVisible();
});

test('the navigation reaches the main pages', async ({ page, isMobile }) => {
  await page.goto('/');
  const nav = page.getByRole('navigation').first();

  for (const [label, path] of [
    ['Løpere', /\/deltakere/],
    ['Premier', /\/premier/],
  ] as const) {
    if (isMobile) await nav.getByRole('button', { name: 'Åpne meny' }).click();
    await nav.getByRole('link', { name: label, exact: true }).click();
    await expect(page).toHaveURL(path);
    if (isMobile) await expect(page.locator('#mobile-menu')).toBeHidden();
  }
});

test('the mobile menu opens and closes', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'The menu button only exists on small screens');
  await page.goto('/');
  const toggle = page.getByRole('button', { name: 'Åpne meny' });
  await toggle.click();
  await expect(page.locator('#mobile-menu')).toBeVisible();
  await page.getByRole('button', { name: 'Lukk meny' }).click();
  await expect(page.locator('#mobile-menu')).toBeHidden();
});

test('signed-in participants see "Min side" instead of "Bli med"', async ({ participantPage }) => {
  await participantPage.goto('/');
  const nav = participantPage.getByRole('navigation').first();
  await expect(nav.getByRole('link', { name: 'Min side' }).first()).toBeVisible();
  await expect(nav.getByRole('link', { name: 'Bli med' })).toHaveCount(0);
});
