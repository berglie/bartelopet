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

test('the table on /deltakere sorts by km, highest first', async ({ page }) => {
  const runner = await createParticipant({ fullName: uniqueName('Sortert') });
  await addRun(runner.participantId, { date: osloDate(-1), km: 12 });

  await page.goto('/deltakere');
  const table = page.getByRole('table');
  await table.getByRole('button', { name: 'Km' }).click();
  await expect(table.getByRole('columnheader', { name: 'Km' })).toHaveAttribute(
    'aria-sort',
    'descending'
  );

  const km = (await table.locator('tbody tr td:nth-of-type(2)').allTextContents()).map((text) =>
    Number(text.replace(/\s/g, '').replace(',', '.'))
  );
  expect(km.length).toBeGreaterThan(1);
  expect(km).toEqual([...km].sort((a, b) => b - a));
});

test('/deltakere groups runners by days out and lists the latest runs', async ({ page }) => {
  const runner = await createParticipant({ fullName: uniqueName('Hverdagsløper') });
  for (let day = 1; day <= 7; day++) {
    await addRun(runner.participantId, {
      date: osloDate(-day),
      km: 3,
      title: day === 1 ? 'Kveldstur i regnet' : undefined,
    });
  }

  await page.goto('/deltakere');
  const daysOut = page.getByRole('region', { name: 'Ofte slår langt.' });
  await expect(
    daysOut
      .getByRole('listitem')
      .filter({ hasText: /^7\s*dager/ })
      .filter({ hasText: runner.fullName })
  ).toBeVisible();

  await expect(page.getByRole('progressbar')).toBeVisible();

  await page
    .getByRole('region', { name: 'Siste turer' })
    .getByRole('button', { name: /Kveldstur i regnet/ })
    .click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toContainText(runner.fullName);
  await expect(dialog).toContainText('7 registrerte turer');
});

test('Siste turer lists runs from the same day in the order they were registered', async ({
  page,
}) => {
  const first = await createParticipant({ fullName: uniqueName('Tidlig') });
  const second = await createParticipant({ fullName: uniqueName('Sein') });
  await addRun(first.participantId, {
    date: osloDate(0),
    km: 5,
    title: `Morgen ${first.fullName}`,
  });
  await addRun(second.participantId, {
    date: osloDate(0),
    km: 5,
    title: `Kveld ${second.fullName}`,
  });

  await page.goto('/deltakere');
  const titles = await page
    .getByRole('region', { name: 'Siste turer' })
    .getByRole('button')
    .allTextContents();
  const later = titles.findIndex((text) => text.includes(`Kveld ${second.fullName}`));
  const earlier = titles.findIndex((text) => text.includes(`Morgen ${first.fullName}`));
  expect(later).toBeGreaterThanOrEqual(0);
  expect(earlier).toBeGreaterThan(later);
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
