import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/app/_shared/lib/supabase/types';

/**
 * Registration details kept in the auth user's metadata between e-mail signup and confirmation.
 * The participant row is only created by register_participant() once the e-mail is confirmed,
 * then this metadata is cleared.
 */
export interface PendingRegistration {
  full_name: string;
  interests: string[];
}

export function readPendingRegistration(metadata: unknown): PendingRegistration | null {
  const pending = (metadata as { registration?: Partial<PendingRegistration> } | null)
    ?.registration;
  if (!pending || typeof pending.full_name !== 'string') return null;
  if (!Array.isArray(pending.interests)) return null;
  return {
    full_name: pending.full_name,
    interests: pending.interests.filter((value): value is string => typeof value === 'string'),
  };
}

const REGISTRATION_ERRORS: Record<string, string> = {
  'Registration is closed': 'Påmeldingen er stengt.',
  'Email address is already registered': 'Denne e-postadressen er allerede påmeldt.',
  'Email address is not confirmed': 'Bekreft e-postadressen din før du melder deg på.',
  'Invalid name': 'Skriv inn fullt navn (2–100 tegn).',
  'Invalid distance categories': 'Velg minst én gyldig kategori.',
};

/** Creates the caller's participant row and returns the bib number, or a Norwegian error. */
export async function registerParticipant(
  supabase: SupabaseClient<Database>,
  registration: PendingRegistration
): Promise<{ bibNumber: number } | { error: string }> {
  const { data, error } = await supabase.rpc('register_participant', {
    p_full_name: registration.full_name,
    p_interests: registration.interests,
  });
  if (error || !data?.[0]) {
    return { error: REGISTRATION_ERRORS[error?.message ?? ''] ?? 'Noe gikk galt. Prøv igjen.' };
  }
  return { bibNumber: data[0].new_bib_number };
}
