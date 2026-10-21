import { test, expect } from './support/fixtures';

async function fill(page: import('@playwright/test').Page) {
  await page.goto('/kontakt');
  await page.getByLabel('Navn *').fill('Ola Nordmann');
  await page.getByLabel('E-post *').fill('ola@example.test');
  await page.getByLabel('Melding *').fill('Hei! Kan jeg melde på hele løpeklubben?');
}

// The real route sends e-mail through Resend, so these tests answer for it.
test('a sent message shows a thank-you', async ({ page }) => {
  let body: unknown;
  await page.route('**/api/kontakt', async (route) => {
    body = route.request().postDataJSON();
    await route.fulfill({ json: { success: true, message: 'Vi svarer så snart vi kan.' } });
  });

  await fill(page);
  await page.getByRole('button', { name: 'Send melding' }).click();
  await expect(page.getByRole('heading', { name: 'Takk for din henvendelse!' })).toBeVisible();
  await expect(page.getByText('Vi svarer så snart vi kan.')).toBeVisible();
  expect(body).toEqual({
    name: 'Ola Nordmann',
    email: 'ola@example.test',
    message: 'Hei! Kan jeg melde på hele løpeklubben?',
  });
});

test('a failed message shows the error', async ({ page }) => {
  await page.route('**/api/kontakt', (route) =>
    route.fulfill({ status: 429, json: { success: false, message: 'For mange forespørsler.' } })
  );

  await fill(page);
  await page.getByRole('button', { name: 'Send melding' }).click();
  await expect(page.getByText('For mange forespørsler.')).toBeVisible();
  await expect(page.getByLabel('Melding *')).toHaveValue('Hei! Kan jeg melde på hele løpeklubben?');
});

test('the send button waits for a name and a message of at least 10 characters', async ({
  page,
}) => {
  await page.goto('/kontakt');
  const send = page.getByRole('button', { name: 'Send melding' });
  await expect(send).toBeDisabled();

  await page.getByLabel('Navn *').fill('O');
  await page.getByLabel('E-post *').fill('ola@example.test');
  await page.getByLabel('Melding *').fill('For kort');
  await expect(send).toBeDisabled();

  await page.getByLabel('Navn *').fill('Ola');
  await page.getByLabel('Melding *').fill('Lang nok melding');
  await expect(send).toBeEnabled();
});
