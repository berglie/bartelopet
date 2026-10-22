import type { Page } from '@playwright/test';
import { test, expect, alertBox, setCategory, loginAs } from './support/fixtures';
import { createUser, db, uniqueEmail, uniqueName } from './support/db';
import { latestAuthLink } from './support/mail';
import { EVENT_YEAR } from './support/env';

async function fillForm(page: Page, values: { name?: string; email?: string }) {
  if (values.name !== undefined) await page.getByLabel('Fullt navn *').fill(values.name);
  if (values.email !== undefined) await page.getByLabel('E-postadresse *').fill(values.email);
}

const consent = (page: Page) => page.getByRole('checkbox', { name: /Jeg har lest og aksepterer/ });
const submit = (page: Page) => page.getByRole('button', { name: 'Meld meg på' });

async function interestsFor(email: string): Promise<string[]> {
  const { data } = await db()
    .from('participants')
    .select('participant_distance_interests(category_slug)')
    .eq('email', email)
    .eq('event_year', EVENT_YEAR)
    .single();
  return (data?.participant_distance_interests ?? []).map((row) => row.category_slug).sort();
}

test.describe('registration by e-mail', () => {
  test('signs up, confirms the e-mail and lands on Min side with a bib number', async ({
    page,
  }) => {
    const email = uniqueEmail('signup');
    const name = uniqueName('Kari Nordmann');

    await page.goto('/pamelding');
    await fillForm(page, { name, email });
    await setCategory(page, 'long', false);
    await consent(page).check();
    await submit(page).click();

    await expect(page.getByText('Sjekk e-posten din')).toBeVisible();

    // The participant row is only created once the address is confirmed.
    const { count } = await db()
      .from('participants')
      .select('id', { count: 'exact', head: true })
      .eq('email', email);
    expect(count).toBe(0);

    await page.goto(await latestAuthLink(email));
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByText(/Min side · Startnummer #\d+/)).toBeVisible();
    await expect(page.getByRole('heading', { name: `Hei, ${name}` })).toBeVisible();
    expect(await interestsFor(email)).toEqual(['medium', 'short']);

    // The pending registration is removed from the auth metadata once it is stored.
    const { data: users } = await db().auth.admin.listUsers({ perPage: 1000 });
    const user = users.users.find((item) => item.email === email);
    expect(user?.user_metadata.registration ?? null).toBeNull();

    await page.goto('/deltakere');
    await expect(page.getByText(name)).toBeVisible();
  });

  test('cannot be submitted without consent or without a category', async ({ page }) => {
    await page.goto('/pamelding');
    await fillForm(page, { name: 'Ola Nordmann', email: uniqueEmail('consent') });
    await expect(submit(page)).toBeDisabled();

    await consent(page).check();
    await expect(submit(page)).toBeEnabled();

    for (const category of ['short', 'medium', 'long'] as const) {
      await setCategory(page, category, false);
    }
    await expect(page.getByText('Velg minst én kategori for å kunne samle lodd.')).toBeVisible();
    await expect(submit(page)).toBeDisabled();
  });

  test('gives the same answer for an address that is already registered', async ({
    page,
    participant,
  }) => {
    await page.goto('/pamelding');
    await fillForm(page, { name: 'Noen Andre', email: participant.email });
    await consent(page).check();
    await submit(page).click();

    // Same screen as a new signup, so the form does not reveal who is registered.
    await expect(page.getByText('Sjekk e-posten din')).toBeVisible();
    const { data } = await db()
      .from('participants')
      .select('full_name')
      .eq('email', participant.email);
    expect(data).toEqual([{ full_name: participant.fullName }]);
  });
});

test.describe('registration when already signed in', () => {
  test('a confirmed user without a registration gets a prefilled form', async ({ page }) => {
    const user = await createUser({ label: 'prefill' });
    await loginAs(page, user.email);

    // No registration yet, so the callback sends the user to the form.
    await expect(page).toHaveURL(/\/pamelding$/);
    await expect(page.getByLabel('E-postadresse *')).toHaveValue(user.email);
    await expect(page.getByLabel('Fullt navn *')).toHaveValue(user.fullName);

    await consent(page).check();
    await submit(page).click();

    await expect(page.getByText('Du er med!')).toBeVisible();
    await expect(page.getByText('Ditt startnummer')).toBeVisible();
    await expect(page).toHaveURL(/\/dashboard$/, { timeout: 10_000 });
  });

  test('shows a Norwegian error for an invalid name', async ({ page }) => {
    const user = await createUser({ label: 'invalid', fullName: '' });
    await loginAs(page, user.email);
    await expect(page).toHaveURL(/\/pamelding$/);

    await fillForm(page, { name: 'A' });
    await consent(page).check();
    await submit(page).click();
    await expect(alertBox(page)).toHaveText('Skriv inn fullt navn (2–100 tegn).');
  });

  test('a registered participant is sent on to Min side', async ({ participantPage }) => {
    await participantPage.goto('/pamelding');
    await expect(participantPage).toHaveURL(/\/dashboard$/);
  });
});
