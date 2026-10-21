import { test, expect } from './support/fixtures';
import { db, uniqueName } from './support/db';

test('the admin page is hidden from participants', async ({ participantPage: page }) => {
  await expect(page.getByRole('link', { name: 'Admin' })).toHaveCount(0);
  const response = await page.goto('/admin');
  expect(response?.status()).toBe(404);
});

test('the admin page is hidden from visitors', async ({ page }) => {
  const response = await page.goto('/admin');
  expect(response?.status()).toBe(404);
});

test('an organizer can add a prize and hide it again', async ({ adminPage: page }) => {
  await expect(page.getByRole('heading', { name: 'Barteløpet 2026' })).toBeVisible();
  // Registration is open, so drawing is locked.
  await expect(
    page.getByText('Trekning er sperret til både påmelding og turregistrering er stengt.')
  ).toBeVisible();

  const name = `E2E ${uniqueName('Sandnes Halvmaraton')}`;
  await page.getByLabel('Løp *').fill(name);
  await page.getByLabel('Distanse (km) *').fill('21.1');
  await page.getByLabel('Klubb/sponsor').fill('Sandnes IL');
  await page.getByLabel('Nettside').fill('https://example.org/halvmaraton');
  await page.getByRole('button', { name: 'Legg til premie' }).click();

  const prize = page.locator('div.rounded-xl').filter({ hasText: name });
  await expect(prize).toContainText('21.1 km · medium · available');
  await expect(prize.getByRole('button', { name: 'Trekk' })).toBeDisabled();

  await page.goto('/premier');
  await expect(page.getByText(name)).toBeVisible();

  await page.goto('/admin');
  await prize.getByRole('button', { name: 'Skjul' }).click();
  await expect(prize).toContainText('draft');
  await page.goto('/premier');
  await expect(page.getByText(name)).toHaveCount(0);

  const { data } = await db()
    .from('race_prizes')
    .select('donor_name')
    .eq('race_name', name)
    .single();
  expect(data?.donor_name).toBe('Sandnes IL');
});
