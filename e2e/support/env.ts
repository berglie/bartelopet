import { execSync } from 'node:child_process';

export const PORT = 3100;
export const BASE_URL = `http://localhost:${PORT}`;
export const EVENT_YEAR = 2026;

/** Every test user gets an address on this domain, so cleanup never touches anyone else. */
export const TEST_EMAIL_DOMAIN = 'example.test';

export interface LocalSupabase {
  url: string;
  anonKey: string;
  serviceRoleKey: string;
  mailpitUrl: string;
}

let cached: LocalSupabase | null = null;

/**
 * Connection details for the local Supabase stack. Read from `supabase status`, or from
 * E2E_SUPABASE_* variables when the CLI is not on PATH. Refuses anything that is not local:
 * the suite deletes data.
 */
export function localSupabase(): LocalSupabase {
  if (cached) return cached;

  let status: Record<string, string> = {};
  if (!process.env.E2E_SUPABASE_URL) {
    try {
      status = JSON.parse(
        execSync('supabase status -o json', { stdio: ['ignore', 'pipe', 'ignore'] }).toString()
      );
    } catch {
      throw new Error('Local Supabase is not running. Start it with `pnpm e2e:db`.');
    }
  }

  const config = {
    url: process.env.E2E_SUPABASE_URL ?? status.API_URL,
    anonKey: process.env.E2E_SUPABASE_ANON_KEY ?? status.ANON_KEY,
    serviceRoleKey: process.env.E2E_SUPABASE_SERVICE_ROLE_KEY ?? status.SERVICE_ROLE_KEY,
    mailpitUrl: process.env.E2E_MAILPIT_URL ?? status.MAILPIT_URL ?? status.INBUCKET_URL,
  };

  for (const [key, value] of Object.entries(config)) {
    if (!value) throw new Error(`Missing local Supabase setting: ${key}`);
  }
  const { hostname } = new URL(config.url);
  if (hostname !== '127.0.0.1' && hostname !== 'localhost') {
    throw new Error(`E2E tests only run against a local Supabase, not ${config.url}`);
  }

  cached = config;
  return cached;
}

/** Today's date in Oslo as YYYY-MM-DD, offset by whole days. Matches the database's check. */
export function osloDate(offsetDays = 0): string {
  const date = new Date(Date.now() + offsetDays * 24 * 60 * 60 * 1000);
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Oslo' }).format(date);
}
