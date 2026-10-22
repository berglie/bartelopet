import type { Page } from '@playwright/test';
import { test, expect, alertBox, loginAs } from './support/fixtures';
import {
  addPrize,
  addRun,
  cleanTestData,
  createParticipant,
  createUser,
  openEvent,
  type TestParticipant,
} from './support/db';
import { osloDate } from './support/env';

/**
 * The end of the event, in order: the organizer closes submissions and registration, draws the
 * prizes longest first, handles a winner who declines, publishes the winners and finally deletes
 * contact details. These tests change the event for everyone, so they run alone after the rest.
 */
test.describe.configure({ mode: 'serial' });

let anna: TestParticipant;
let bjorn: TestParticipant;

test.beforeAll(async () => {
  await cleanTestData();
  await openEvent();
  anna = await createParticipant({ label: 'anna', fullName: 'Anna Ultra' });
  bjorn = await createParticipant({ label: 'bjorn', fullName: 'Bjørn Lang', interests: ['long'] });
  await addRun(anna.participantId, { date: osloDate(-3), km: 35, title: 'Annas langtur' });
  await addRun(bjorn.participantId, { date: osloDate(-2), km: 42.2 });
  await addPrize({ name: 'Ultraløpet', km: 50, category: 'long' });
  await addPrize({ name: 'Halvmaraton', km: 21.1, category: 'medium' });
});

test.afterAll(async () => {
  // Leave the event open, as the other tests expect.
  await openEvent();
});

async function saveSettings(
  page: Page,
  settings: { registration: boolean; submissions: boolean; publish?: boolean }
) {
  await page.goto('/admin');
  await page.getByLabel('Påmelding åpen').setChecked(settings.registration);
  await page.getByLabel('Turregistrering åpen').setChecked(settings.submissions);
  await page.getByLabel('Publiser vinnere').setChecked(settings.publish ?? false);
  const saved = page.waitForResponse(
    (response) => response.request().method() === 'POST' && response.url().endsWith('/admin')
  );
  await page.getByRole('button', { name: 'Lagre innstillinger' }).click();
  await saved;

  // The checkboxes change in the browser at once; reload to see what was stored.
  await page.reload();
  await expect(page.getByLabel('Påmelding åpen')).toBeChecked({ checked: settings.registration });
  await expect(page.getByLabel('Turregistrering åpen')).toBeChecked({
    checked: settings.submissions,
  });
}

const prizeCard = (page: Page, name: string) =>
  page.locator('div.rounded-xl').filter({ hasText: `E2E ${name}` });

async function draw(page: Page, name: string): Promise<string> {
  page.once('dialog', (dialog) => dialog.accept());
  await prizeCard(page, name).getByRole('button', { name: 'Trekk' }).click();
  const winner = prizeCard(page, name).getByText(/^Vinner: /);
  await expect(winner).toBeVisible();
  return (await winner.textContent())!.replace('Vinner: ', '');
}

test('closing run submissions locks the runs on Min side', async ({ adminPage, browser }) => {
  await saveSettings(adminPage, { registration: true, submissions: false });

  const page = await browser.newPage();
  await loginAs(page, anna.email);
  await expect(page.getByText('Turregistreringen er stengt.', { exact: false })).toBeVisible();
  await expect(page.getByText('Annas langtur')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Slett', exact: true })).toHaveCount(0);
  await expect(page.getByText('Rediger tur')).toHaveCount(0);
  // Categories can still change while registration is open.
  await expect(page.getByRole('button', { name: 'Lagre valg' })).toBeVisible();
  await page.close();
});

test('closing registration stops new sign-ups', async ({ adminPage, browser }) => {
  await saveSettings(adminPage, { registration: false, submissions: false });

  const page = await browser.newPage();
  const late = await createUser({ label: 'late' });
  await loginAs(page, late.email);
  await expect(page).toHaveURL(/\/pamelding$/);
  await page.getByRole('checkbox', { name: /Jeg har lest og aksepterer/ }).check();
  await page.getByRole('button', { name: 'Meld meg på' }).click();
  await expect(alertBox(page)).toHaveText('Påmeldingen er stengt.');

  await loginAs(page, anna.email);
  await expect(
    page.getByText('Kategoriene er låst fordi påmeldingen og turregistreringen er stengt.')
  ).toBeVisible();
  await page.close();
});

test('prizes are drawn longest first, and a declined prize is drawn again', async ({
  adminPage: page,
}) => {
  await expect(page.getByText('Trekning er sperret', { exact: false })).toHaveCount(0);
  await expect(
    prizeCard(page, 'Halvmaraton').getByRole('button', { name: 'Trekk' })
  ).toBeDisabled();

  const first = await draw(page, 'Ultraløpet');
  expect([anna.fullName, bjorn.fullName]).toContain(first);
  await expect(prizeCard(page, 'Ultraløpet')).toContainText('77 lodd i potten');

  page.once('dialog', (dialog) => dialog.accept());
  await prizeCard(page, 'Ultraløpet').getByRole('button', { name: 'Vinner takket nei' }).click();
  await expect(prizeCard(page, 'Ultraløpet')).toContainText(`Annullert: ${first} (takket nei)`);

  // The one who declined is out of this prize's pot, so the other runner wins.
  const second = await draw(page, 'Ultraløpet');
  expect(second).toBe(first === anna.fullName ? bjorn.fullName : anna.fullName);

  // Bjørn only chose 30+ km, so the half marathon can only go to Anna.
  const half = await draw(page, 'Halvmaraton');
  expect(half).toBe(anna.fullName);
});

test('published winners are shown on /premier', async ({ adminPage, browser }) => {
  const page = await browser.newPage();
  await page.goto('/premier');
  await expect(page.getByText(/^Vinner: /)).toHaveCount(0);

  await saveSettings(adminPage, { registration: false, submissions: false, publish: true });
  await page.reload();
  await expect(page.getByText(`Vinner: ${anna.fullName}`).first()).toBeVisible();
  await page.close();
});
