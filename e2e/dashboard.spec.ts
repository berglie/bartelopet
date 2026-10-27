import path from 'node:path';
import type { Page } from '@playwright/test';
import sharp from 'sharp';
import { test, expect, alertBox, setCategory } from './support/fixtures';
import { addRun, db, userClient } from './support/db';
import { EVENT_YEAR, osloDate } from './support/env';

const newRun = (page: Page) =>
  page.locator('form').filter({ has: page.getByRole('button', { name: 'Registrer tur' }) });

async function registerRun(
  page: Page,
  run: {
    date?: string;
    km: string;
    title?: string;
    photo?: string | { name: string; mimeType: string; buffer: Buffer };
  }
) {
  const form = newRun(page);
  if (run.date) await form.getByLabel('Dato *').fill(run.date);
  await form.getByLabel('Distanse i km *').fill(run.km);
  if (run.title) await form.getByLabel('Navn på tur/løp').fill(run.title);
  if (run.photo) await form.getByLabel('Bilde fra turen').setInputFiles(run.photo);
  await form.getByRole('checkbox', { name: /Jeg bekrefter at jeg har gått/ }).check();
  await form.getByRole('button', { name: 'Registrer tur' }).click();
}

/** The value of one of the three counters at the top of Min side. */
const stat = (page: Page, label: string) =>
  page.getByText(label, { exact: true }).locator('xpath=preceding-sibling::div[1]');

const runCard = (page: Page, title: string) =>
  page
    .locator('.border-2')
    .filter({ has: page.getByText(title, { exact: true }) })
    .last();

test.describe('runs', () => {
  test('a registered run shows up with kilometres and tickets', async ({
    participantPage: page,
  }) => {
    await expect(page.getByText('Ingen turer registrert ennå.', { exact: false })).toBeVisible();
    await expect(stat(page, 'Turer')).toHaveText('0');

    await registerRun(page, {
      date: osloDate(-1),
      km: '12',
      title: 'Morgentur rundt Mosvatnet',
    });

    await expect(page.getByText('Takk for turen!')).toBeVisible();
    await expect(page.getByText(/tilsvarer det\s+60 kr/)).toBeVisible();
    await expect(page.getByText('Morgentur rundt Mosvatnet')).toBeVisible();
    await expect(stat(page, 'Turer')).toHaveText('1');
    await expect(stat(page, 'Kilometer')).toHaveText('12');
    // 12 km gives 12 tickets in "Opptil 10 km" and 12 in "10–30 km".
    await expect(stat(page, 'Lodd')).toHaveText('24');
  });

  test('a run can be edited and deleted', async ({ participantPage: page, participant }) => {
    await addRun(participant.participantId, { date: osloDate(), km: 5, title: 'Kort tur' });
    await page.reload();
    await expect(stat(page, 'Kilometer')).toHaveText('5');

    const card = runCard(page, 'Kort tur');
    await card.getByText('Rediger tur').click();
    await card.getByLabel('Distanse i km *').fill('7.5');
    await card.getByLabel('Navn på tur/løp').fill('Litt lengre tur');
    await card.getByRole('checkbox', { name: /Jeg bekrefter/ }).check();
    await card.getByRole('button', { name: 'Lagre endringer' }).click();

    await expect(page.getByText('Litt lengre tur', { exact: true })).toBeVisible();
    await expect(stat(page, 'Kilometer')).toHaveText('7,5');

    page.once('dialog', (dialog) => dialog.accept());
    await runCard(page, 'Litt lengre tur')
      .getByRole('button', { name: 'Slett', exact: true })
      .click();
    await expect(page.getByText('Litt lengre tur', { exact: true })).toBeHidden();
    await expect(stat(page, 'Turer')).toHaveText('0');
  });

  test('a photo can be uploaded as evidence', async ({ participantPage: page, participant }) => {
    await registerRun(page, {
      km: '8',
      title: 'Bildetur',
      photo: path.join(__dirname, 'fixtures', 'run.jpg'),
    });
    await expect(page.getByText('Takk for turen!')).toBeVisible();

    const { data } = await db()
      .from('runs')
      .select('evidence_url')
      .eq('participant_id', participant.participantId)
      .single();
    expect(data?.evidence_url).toContain(`/run-evidence/${participant.participantId}/`);
    const image = await page.request.get(data!.evidence_url!);
    expect(image.headers()['content-type']).toBe('image/jpeg');
  });

  test('a large phone photo is shrunk before upload', async ({
    participantPage: page,
    participant,
  }) => {
    // Noise does not compress, so this is far above Vercel's 4.5 MB request limit.
    const buffer = await sharp({
      create: {
        width: 6000,
        height: 4000,
        channels: 3,
        background: '#000',
        noise: { type: 'gaussian', mean: 128, sigma: 60 },
      },
    })
      .jpeg({ quality: 95 })
      .toBuffer();
    expect(buffer.length).toBeGreaterThan(4.5 * 1024 * 1024);

    const uploads: number[] = [];
    page.on('request', (request) => {
      if (request.method() === 'POST' && request.headers()['next-action']) {
        uploads.push(request.postDataBuffer()?.length ?? 0);
      }
    });

    await registerRun(page, {
      km: '9',
      title: 'Stort bilde',
      photo: { name: 'stort.jpg', mimeType: 'image/jpeg', buffer },
    });
    await expect(page.getByText('Takk for turen!')).toBeVisible();
    expect(Math.max(...uploads)).toBeLessThan(4 * 1024 * 1024);

    const { data } = await db()
      .from('runs')
      .select('evidence_url')
      .eq('participant_id', participant.participantId)
      .single();
    expect(data?.evidence_url).toContain(`/run-evidence/${participant.participantId}/`);
    const image = await sharp(
      await (await page.request.get(data!.evidence_url!)).body()
    ).metadata();
    expect(Math.max(image.width!, image.height!)).toBeLessThanOrEqual(2048);
  });

  test('a photo over the size limit is rejected with the limit in the message', async ({
    participantPage: page,
  }) => {
    await registerRun(page, {
      km: '9',
      photo: { name: 'enormt.jpg', mimeType: 'image/jpeg', buffer: Buffer.alloc(26 * 1024 * 1024) },
    });
    await expect(alertBox(page)).toHaveText('Bildet er 26 MB. Velg et bilde på maks 25 MB.');
    await expect(page.getByText('Takk for turen!')).toBeHidden();
    await expect(newRun(page).getByRole('button', { name: 'Registrer tur' })).toBeEnabled();
  });

  test('invalid runs are rejected with a clear message', async ({
    participantPage: page,
    participant,
  }) => {
    // Below the minimum the browser refuses to submit and the form explains why.
    await registerRun(page, { km: '0.4' });
    await expect(newRun(page).getByText('Turen må være minst 1 km')).toBeVisible();
    const distance = newRun(page).getByLabel('Distanse i km *');
    expect(await distance.evaluate((input: HTMLInputElement) => input.validity.valid)).toBe(false);
    await expect(page.getByText('Takk for turen!')).toBeHidden();

    await addRun(participant.participantId, { date: osloDate(), km: 10 });
    await registerRun(page, { km: '6' });
    await expect(alertBox(page)).toHaveText('Du har allerede registrert en tur på denne datoen');
  });

  test('runs are registered within a day', async ({ participantPage: page, participant }) => {
    // The date picker offers yesterday and today, with today as the default.
    const date = newRun(page).getByLabel('Dato *');
    await expect(date).toHaveAttribute('min', osloDate(-1));
    await expect(date).toHaveAttribute('max', osloDate());
    await expect(date).toHaveValue(osloDate());

    // The browser blocks older dates, so the server rule is checked straight against the database.
    const client = await userClient(participant);
    const { error } = await client.from('runs').insert({
      participant_id: participant.participantId,
      event_year: EVENT_YEAR,
      run_date: osloDate(-2),
      distance_km: 5,
      donation_amount_nok: 25,
    });
    expect(error?.message).toBe('Run must be registered within a day of the run');

    // An older run keeps its date and distance; the text can still change.
    await addRun(participant.participantId, { date: osloDate(-2), km: 9, title: 'Gammel tur' });
    await page.reload();
    const card = runCard(page, 'Gammel tur');
    await card.getByText('Rediger tur').click();
    await expect(card.getByLabel('Dato *')).toBeDisabled();
    await expect(card.getByLabel('Distanse i km *')).toBeDisabled();
    await card.getByLabel('Navn på tur/løp').fill('Gammel tur, ny tittel');
    await card.getByRole('checkbox', { name: /Jeg bekrefter/ }).check();
    await card.getByRole('button', { name: 'Lagre endringer' }).click();
    await expect(page.getByText('Gammel tur, ny tittel', { exact: true })).toBeVisible();
  });
});

test.describe('prize categories', () => {
  test('changes are saved and kept after reload', async ({ participantPage: page }) => {
    const save = page.getByRole('button', { name: 'Lagre valg' });
    await expect(save).toBeDisabled();

    await setCategory(page, 'long', false);
    await expect(page.getByText('Ulagrede endringer')).toBeVisible();
    await save.click();
    await expect(page.getByText('Lagret', { exact: true })).toBeVisible();

    await page.reload();
    await expect(page.getByRole('checkbox', { name: /30\+ km/ })).not.toBeChecked();
    await expect(page.getByRole('checkbox', { name: /Opptil 10 km/ })).toBeChecked();
  });

  test('at least one category must be chosen', async ({ participantPage: page }) => {
    for (const category of ['short', 'medium', 'long'] as const) {
      await setCategory(page, category, false);
    }
    await expect(page.getByText('Velg minst én kategori', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Lagre valg' })).toBeDisabled();
  });

  test('tickets only count in the chosen categories', async ({
    participantPage: page,
    participant,
  }) => {
    await addRun(participant.participantId, { date: osloDate(-1), km: 35 });
    await page.reload();
    await expect(stat(page, 'Lodd')).toHaveText('105');

    await setCategory(page, 'short', false);
    await page.getByRole('button', { name: 'Lagre valg' }).click();
    await expect(page.getByText('Lagret', { exact: true })).toBeVisible();
    await page.reload();
    await expect(stat(page, 'Lodd')).toHaveText('70');
  });
});
