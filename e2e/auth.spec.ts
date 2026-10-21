import { test, expect, alertBox, loginAs } from './support/fixtures';
import { uniqueEmail } from './support/db';
import { latestAuthLink, messagesTo } from './support/mail';

test.describe('login', () => {
  test('a participant logs in with the e-mailed link', async ({ page, participant }) => {
    await page.goto('/login');
    await page.getByLabel(/E-post/).fill(participant.email);
    await page.getByRole('button', { name: /Send innloggingslenke/ }).click();
    await expect(
      page.getByText(`Vi har sendt en innloggingslenke til ${participant.email}`)
    ).toBeVisible();

    await page.goto(await latestAuthLink(participant.email));
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByText(`Min side · Startnummer #${participant.bibNumber}`)).toBeVisible();
  });

  test('an unknown address gets the same answer and no e-mail', async ({ page }) => {
    const email = uniqueEmail('unknown');
    await page.goto('/login');
    await page.getByLabel(/E-post/).fill(email);
    await page.getByRole('button', { name: /Send innloggingslenke/ }).click();
    await expect(page.getByText(`Vi har sendt en innloggingslenke til ${email}`)).toBeVisible();

    // Give a stray e-mail time to arrive before checking that none did.
    await page.waitForTimeout(1_500);
    expect(await messagesTo(email)).toHaveLength(0);
  });

  test('Min side requires login and comes back after it', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login\?next=%2Fdashboard$/);
  });

  test('a broken link is rejected', async ({ page }) => {
    await page.goto('/auth/callback?token_hash=not-a-token&type=magiclink');
    await expect(page).toHaveURL(/\/login\?error=verification_failed$/);
    await expect(alertBox(page)).toHaveText(
      'Kunne ikke verifisere innloggingslenken. Be om en ny.'
    );

    await page.goto('/auth/callback');
    await expect(alertBox(page)).toHaveText(
      'Innloggingslenken er ugyldig eller utløpt. Vennligst be om en ny.'
    );
  });

  test('the callback does not redirect to other sites', async ({ page, participant }) => {
    await loginAs(page, participant.email, '//evil.example/');
    await expect(page).toHaveURL(/localhost:3100\/dashboard$/);
  });

  test('Google login starts the OAuth flow at Supabase', async ({ page }) => {
    await page.goto('/login');
    const authorize = page.waitForRequest(/\/auth\/v1\/authorize\?provider=google/);
    await page.getByRole('button', { name: 'Fortsett med Google' }).click();
    expect((await authorize).url()).toContain(
      'redirect_to=http%3A%2F%2Flocalhost%3A3100%2Fauth%2Fcallback'
    );
  });
});

test('logging out ends the session', async ({ participantPage: page }) => {
  await page.getByRole('button', { name: 'Logg ut' }).click();
  await expect(page).toHaveURL(/localhost:3100\/$/);
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/login/);
});
