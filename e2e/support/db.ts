import { randomUUID } from 'node:crypto';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/app/_shared/lib/supabase/types';
import { EVENT_YEAR, TEST_EMAIL_DOMAIN, localSupabase, osloDate } from './env';

type Edition = Database['public']['Tables']['event_editions']['Update'];
export type Category = 'short' | 'medium' | 'long';

export interface TestUser {
  id: string;
  email: string;
  password: string;
  fullName: string;
}

export interface TestParticipant extends TestUser {
  participantId: string;
  bibNumber: number;
}

/** Prefix for prizes made by tests, so cleanup only removes those. */
export const PRIZE_PREFIX = 'E2E';

let serviceClient: SupabaseClient<Database> | null = null;

/** Service-role client: bypasses RLS. Only for arranging and inspecting test data. */
export function db(): SupabaseClient<Database> {
  if (!serviceClient) {
    const { url, serviceRoleKey } = localSupabase();
    serviceClient = createClient<Database>(url, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return serviceClient;
}

function anonClient(): SupabaseClient<Database> {
  const { url, anonKey } = localSupabase();
  return createClient<Database>(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Throws on a failed write. */
function must(result: { error: { message: string } | null }, action: string): void {
  if (result.error) throw new Error(`${action}: ${result.error.message}`);
}

/** Throws on a failed read and returns its rows. */
function check<T>(
  result: { data: T | null; error: { message: string } | null },
  action: string
): NonNullable<T> {
  if (result.error || result.data === null || result.data === undefined) {
    throw new Error(`${action}: ${result.error?.message ?? 'no data'}`);
  }
  return result.data;
}

export function uniqueEmail(label: string): string {
  return `e2e+${label}-${randomUUID().slice(0, 8)}@${TEST_EMAIL_DOMAIN}`;
}

export function uniqueName(label: string): string {
  return `${label} ${randomUUID().slice(0, 6)}`;
}

/**
 * Opens registration and run submissions, with a submission period around today so runs can be
 * registered whatever the date. Without this, runs before 1 November would be rejected.
 */
export async function openEvent(overrides: Edition = {}): Promise<void> {
  await setEdition({
    registration_open: true,
    submissions_open: true,
    submissions_start: osloDate(-14),
    submissions_end: osloDate(14),
    winners_published: false,
    donation_url: null,
    ...overrides,
  });
}

export async function setEdition(patch: Edition): Promise<void> {
  must(
    await db().from('event_editions').update(patch).eq('event_year', EVENT_YEAR),
    'Update event edition'
  );
}

/** Removes everything the tests created: test users (and with them participants and runs). */
export async function cleanTestData(): Promise<void> {
  const client = db();
  const testUserIds: string[] = [];
  for (let page = 1; ; page++) {
    const { data, error } = await client.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw new Error(`List users: ${error.message}`);
    testUserIds.push(
      ...data.users
        .filter((user) => user.email?.endsWith(`@${TEST_EMAIL_DOMAIN}`))
        .map((user) => user.id)
    );
    if (data.users.length < 1000) break;
  }

  const participants = check(
    await client.from('participants').select('id').in('user_id', testUserIds),
    'List test participants'
  );
  const participantIds = participants.map((participant) => participant.id);
  const prizes = check(
    await client.from('race_prizes').select('id').like('race_name', `${PRIZE_PREFIX}%`),
    'List test prizes'
  );
  const prizeIds = prizes.map((prize) => prize.id);

  // Draws block deleting both their prize and their winner.
  must(
    await client.from('draw_results').delete().in('participant_id', participantIds),
    'Delete test draws'
  );
  must(await client.from('draw_results').delete().in('prize_id', prizeIds), 'Delete draws');
  must(await client.from('race_prizes').delete().in('id', prizeIds), 'Delete test prizes');

  for (const id of testUserIds) {
    const { error } = await client.auth.admin.deleteUser(id);
    if (error) throw new Error(`Delete user: ${error.message}`);
  }
}

/** A confirmed auth user without a registration. */
export async function createUser(
  options: { label?: string; fullName?: string; admin?: boolean } = {}
): Promise<TestUser> {
  const label = options.label ?? 'user';
  const email = uniqueEmail(label);
  const password = `pw-${randomUUID()}`;
  const fullName = options.fullName ?? uniqueName('Testløper');
  const { data, error } = await db().auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
    app_metadata: options.admin ? { role: 'admin' } : {},
  });
  if (error || !data.user) throw new Error(`Create user: ${error?.message}`);
  return { id: data.user.id, email, password, fullName };
}

/** A registered participant, signed up through register_participant() as the user. */
export async function createParticipant(
  options: { label?: string; fullName?: string; admin?: boolean; interests?: Category[] } = {}
): Promise<TestParticipant> {
  const user = await createUser(options);
  const client = anonClient();
  const signIn = await client.auth.signInWithPassword({
    email: user.email,
    password: user.password,
  });
  if (signIn.error) throw new Error(`Sign in: ${signIn.error.message}`);

  const rows = check(
    await client.rpc('register_participant', {
      p_full_name: user.fullName,
      p_postal_address: 'Testveien 1, 4000 Stavanger',
      p_phone_number: '',
      p_interests: options.interests ?? ['short', 'medium', 'long'],
    }),
    'Register participant'
  );
  await client.auth.signOut();
  return { ...user, participantId: rows[0].new_participant_id, bibNumber: rows[0].new_bib_number };
}

/** Inserts a run directly. Submissions must be open, as for users. */
export async function addRun(
  participantId: string,
  run: { date: string; km: number; title?: string }
): Promise<string> {
  const row = check<{ id: string }>(
    await db()
      .from('runs')
      .insert({
        participant_id: participantId,
        event_year: EVENT_YEAR,
        run_date: run.date,
        distance_km: run.km,
        donation_amount_nok: Math.ceil(run.km * 5),
        donation_confirmed_at: new Date().toISOString(),
        title: run.title ?? null,
      })
      .select('id')
      .single(),
    'Insert run'
  );
  return row.id;
}

export async function addPrize(prize: {
  name: string;
  km: number;
  category: Category;
}): Promise<string> {
  const row = check<{ id: string }>(
    await db()
      .from('race_prizes')
      .insert({
        event_year: EVENT_YEAR,
        race_name: `${PRIZE_PREFIX} ${prize.name}`,
        distance_km: prize.km,
        category_slug: prize.category,
        status: 'available',
      })
      .select('id')
      .single(),
    'Insert prize'
  );
  return row.id;
}
