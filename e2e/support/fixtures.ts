import { test as base, expect, type Locator, type Page } from '@playwright/test';
import { createParticipant, createUser, db, type TestParticipant } from './db';

/**
 * Signs in through the app's own /auth/callback with a magic-link token from the admin API, so
 * the session cookies are set exactly as after a real login. Use the Mailpit helpers when the
 * e-mail itself is under test.
 */
export async function loginAs(page: Page, email: string, next = '/dashboard'): Promise<void> {
  const { data, error } = await db().auth.admin.generateLink({ type: 'magiclink', email });
  if (error) throw new Error(`Generate link: ${error.message}`);
  const params = new URLSearchParams({
    token_hash: data.properties.hashed_token,
    type: 'magiclink',
    next,
  });
  await page.goto(`/auth/callback?${params}`);
}

/** The app's own alerts; Next.js also renders an empty route announcer with role="alert". */
export function alertBox(page: Page): Locator {
  return page.locator('[role="alert"]:not(#__next-route-announcer__)');
}

export const CATEGORY_LABELS = {
  short: /Opptil 10 km/,
  medium: /10–30 km/,
  long: /30\+ km/,
} as const;

/**
 * Ticks or unticks a prize category tile. The real checkbox is visually hidden, so this clicks
 * its label like a user would.
 */
export async function setCategory(
  scope: Page | Locator,
  category: keyof typeof CATEGORY_LABELS,
  checked: boolean
): Promise<void> {
  const label = scope.locator('label').filter({ hasText: CATEGORY_LABELS[category] });
  const box = label.getByRole('checkbox');
  if ((await box.isChecked()) !== checked) await label.click();
  await expect(box).toBeChecked({ checked });
}

interface Fixtures {
  /** A registered participant with all three categories, not signed in. */
  participant: TestParticipant;
  /** A page signed in as `participant`, opened on /dashboard. */
  participantPage: Page;
  /** A page signed in as an organizer, opened on /admin. */
  adminPage: Page;
}

export const test = base.extend<Fixtures>({
  page: async ({ page }, use) => {
    // Map tiles and styles are external and irrelevant to the flows under test.
    await page.route(/api\.mapbox\.com|tiles\.mapbox\.com|events\.mapbox\.com/, (route) =>
      route.abort()
    );
    await use(page);
  },
  participant: async ({}, use, testInfo) => {
    await use(await createParticipant({ label: testInfo.project.name }));
  },
  participantPage: async ({ page, participant }, use) => {
    await loginAs(page, participant.email);
    await expect(page).toHaveURL(/\/dashboard$/);
    await use(page);
  },
  adminPage: async ({ page }, use) => {
    // Not registered as a participant, so this also works after registration has closed.
    const organizer = await createUser({ label: 'admin', admin: true });
    await loginAs(page, organizer.email);
    await page.goto('/admin');
    await use(page);
  },
});

export { expect };
