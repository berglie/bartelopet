import { test, expect } from './support/fixtures';
import { addPrize, addRun, createParticipant, uniqueName } from './support/db';
import { osloDate } from './support/env';

test('runners, kilometres and tickets are listed on /deltakere', async ({ page }) => {
  const runner = await createParticipant({
    fullName: uniqueName('Langløper'),
    interests: ['medium', 'long'],
  });
  await addRun(runner.participantId, { date: osloDate(-2), km: 21.1 });
  await addRun(runner.participantId, { date: osloDate(-1), km: 32 });
  const newcomer = await createParticipant({ fullName: uniqueName('Nybegynner') });

  await page.goto('/deltakere');
  const row = page.getByRole('row').filter({ hasText: runner.fullName });
  await expect(row.getByRole('rowheader')).toHaveText(`#${runner.bibNumber}${runner.fullName}`);
  // Runs, km, then tickets per category: rounded km, only in the categories the runner chose.
  // Up to 10 km: not chosen. 10–30 km: 21 + 32. 30+ km: 32.
  await expect(row.getByRole('cell')).toHaveText(['2', '53,1', '0', '53', '32']);

  // Registered without runs: listed with zero.
  await expect(
    page.getByRole('row').filter({ hasText: newcomer.fullName }).getByRole('cell')
  ).toHaveText(['0', '0', '0', '0', '0']);
});

test('runs appear on the bartelinje on the front page', async ({ page }) => {
  const runner = await createParticipant({ fullName: uniqueName('Prikk') });
  await addRun(runner.participantId, { date: osloDate(-1), km: 14, title: 'Tur til Dalsnuten' });

  await page.goto('/');
  await page.getByRole('button', { name: `Se turen til ${runner.fullName}, 14 kilometer` }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toContainText(runner.fullName);
  await expect(dialog).toContainText('Tur til Dalsnuten');
});

test('available prizes are shown on /premier', async ({ page }) => {
  const name = uniqueName('Ultraløpet');
  await addPrize({ name, km: 50, category: 'long' });

  await page.goto('/premier');
  await expect(page.getByText(`E2E ${name}`)).toBeVisible();
});
