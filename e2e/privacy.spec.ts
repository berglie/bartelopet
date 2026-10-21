import { readFile } from 'node:fs/promises';
import { test, expect } from './support/fixtures';
import { addRun, db } from './support/db';
import { osloDate } from './support/env';

test('a participant can download their own data', async ({
  participantPage: page,
  participant,
}) => {
  await addRun(participant.participantId, { date: osloDate(-1), km: 9, title: 'Eksporttur' });
  await page.reload();

  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Last ned mine data' }).click();
  const file = await download;
  expect(file.suggestedFilename()).toBe('barteloepet-mine-data.json');

  const text = await readFile(await file.path(), 'utf8');
  expect(() => JSON.parse(text)).not.toThrow();
  expect(text).toContain(participant.email);
  expect(text).toContain('Eksporttur');
  expect(text).toContain('Testveien 1, 4000 Stavanger');
});

test('a participant can delete their account', async ({ participantPage: page, participant }) => {
  const remove = page.getByRole('button', { name: 'Slett kontoen min' });
  const confirmation = page.getByLabel('Skriv «SLETT MIN KONTO» for å bekrefte');

  await expect(remove).toBeDisabled();
  await confirmation.fill('slett kontoen');
  await expect(remove).toBeDisabled();

  await confirmation.fill('slett min konto');
  await remove.click();
  await expect(page).toHaveURL(/localhost:3100\/$/);

  const { count } = await db()
    .from('participants')
    .select('id', { count: 'exact', head: true })
    .eq('id', participant.participantId);
  expect(count).toBe(0);
  const { data } = await db().auth.admin.getUserById(participant.id);
  expect(data.user).toBeNull();

  await page.goto('/deltakere');
  await expect(page.getByText(participant.fullName)).toHaveCount(0);
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/login/);
});
