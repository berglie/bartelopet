import { defineConfig, devices } from '@playwright/test';
import { BASE_URL, PORT, localSupabase } from './e2e/support/env';

const supabase = localSupabase();
const isCI = Boolean(process.env.CI);

/**
 * End-to-end tests against `next dev` and a local Supabase stack (`pnpm e2e:db`).
 *
 * Dev mode, not `next start`: without Redis the rate limiter blocks uploads in production
 * builds, and the tests should not need a bypass in the app.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 2 : undefined,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: isCI
    ? [['github'], ['html', { open: 'never' }]]
    : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: BASE_URL,
    locale: 'nb-NO',
    timezoneId: 'Europe/Oslo',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'setup', testMatch: /global\.setup\.ts/ },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      testIgnore: /\.serial\.spec\.ts/,
      dependencies: ['setup'],
    },
    {
      name: 'mobile',
      use: { ...devices['Pixel 7'] },
      testMatch: /public-pages\.spec\.ts/,
      dependencies: ['setup'],
    },
    {
      // Closes registration and draws prizes, which changes the event for every other test.
      name: 'event-lifecycle',
      use: { ...devices['Desktop Chrome'] },
      testMatch: /\.serial\.spec\.ts/,
      dependencies: ['chromium', 'mobile'],
    },
  ],
  webServer: {
    command: `pnpm exec next dev -p ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: !isCI,
    timeout: 180_000,
    // Set explicitly so nothing from .env.local (production Supabase, Redis, Resend) is used.
    // Next.js keeps variables that are already set, also empty ones.
    env: {
      NEXT_PUBLIC_SUPABASE_URL: supabase.url,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: supabase.anonKey,
      NEXT_PUBLIC_APP_URL: BASE_URL,
      NEXT_PUBLIC_MAPBOX_TOKEN: '',
      BARTELOPET_USE_MOCK_DATA: 'false',
      UPSTASH_REDIS_REST_URL: '',
      UPSTASH_REDIS_REST_TOKEN: '',
      RESEND_API_KEY: '',
      CONTACT_FORM_ADMIN_EMAIL: 'admin@example.test',
    },
  },
});
