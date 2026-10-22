'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/app/_shared/lib/supabase/server';
import { checkRateLimit } from '@/app/_shared/lib/utils/rate-limit';

type ActionResponse<T = void> = { success: true; data?: T } | { success: false; error: string };

const DELETE_CONFIRMATION = 'SLETT MIN KONTO';

/**
 * Export all of the user's data, every year (GDPR art. 15 and 20).
 * Built by export_my_data() in the database, which only reads the caller's own rows.
 */
export async function exportUserData(): Promise<ActionResponse<Record<string, unknown>>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Du må være innlogget for å laste ned dataene dine' };

  const limit = await checkRateLimit('account', supabase);
  if (!limit.success) return { success: false, error: 'For mange forsøk. Prøv igjen senere.' };

  const { data, error } = await supabase.rpc('export_my_data');
  if (error || !data) {
    console.error('exportUserData failed:', error?.code);
    return { success: false, error: 'Kunne ikke hente dataene dine. Prøv igjen.' };
  }
  return { success: true, data: data as Record<string, unknown> };
}

/**
 * Delete the user's account and data, every year (GDPR art. 17).
 * Photos are removed through the Storage API first (the database cannot delete storage files),
 * then delete_my_account() deletes the rows and the auth user. A registration that won a prize
 * is anonymized instead, so the draw history stays verifiable.
 */
export async function deleteUserAccount(confirmationText: string): Promise<ActionResponse> {
  if (confirmationText.trim().toUpperCase() !== DELETE_CONFIRMATION) {
    return { success: false, error: `Skriv «${DELETE_CONFIRMATION}» for å bekrefte.` };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Du må være innlogget for å slette kontoen' };

  const limit = await checkRateLimit('account', supabase);
  if (!limit.success) return { success: false, error: 'For mange forsøk. Prøv igjen senere.' };

  const { data: participants } = await supabase
    .from('participants')
    .select('id')
    .eq('user_id', user.id);
  const participantIds = (participants || []).map((participant) => participant.id);

  // 2026 run photos: run-evidence/<participant id>/...
  for (const participantId of participantIds) {
    const { data: files } = await supabase.storage
      .from('run-evidence')
      .list(participantId, { limit: 1000 });
    const paths = (files || []).map((file) => `${participantId}/${file.name}`);
    if (paths.length > 0) await supabase.storage.from('run-evidence').remove(paths);
  }

  // 2025 gallery photos: completion-photos/multi/<year>/<participant id>/...
  if (participantIds.length > 0) {
    const { data: photos } = await supabase
      .from('photos')
      .select('image_url')
      .in('participant_id', participantIds);
    const marker = '/storage/v1/object/public/completion-photos/';
    const paths = (photos || []).flatMap((photo) => {
      const index = photo.image_url.indexOf(marker);
      return index === -1 ? [] : [photo.image_url.slice(index + marker.length)];
    });
    if (paths.length > 0) await supabase.storage.from('completion-photos').remove(paths);
  }

  const { error } = await supabase.rpc('delete_my_account');
  if (error) {
    console.error('deleteUserAccount failed:', error.code);
    return {
      success: false,
      error:
        error.message === 'Organizer accounts must be deleted by an administrator'
          ? 'Arrangørkontoer må slettes av en administrator.'
          : 'Kunne ikke slette kontoen. Prøv igjen, eller kontakt oss.',
    };
  }

  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  return { success: true };
}
