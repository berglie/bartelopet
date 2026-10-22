'use server';

import { randomUUID } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import sharp from 'sharp';
import { createClient } from '@/app/_shared/lib/supabase/server';
import { checkRateLimit } from '@/app/_shared/lib/utils/rate-limit';
import {
  interestInputSchema,
  runInputSchema,
  type RunInput,
} from '@/app/_shared/lib/validations/run';
import { donationForDistance, EVENT_YEAR_2026 } from '@/app/_shared/types/event-2026';

type ActionResult<T = void> = { success: true; data?: T } | { success: false; error: string };

async function currentParticipant() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, participant: null, userId: null };

  const { data: participant } = await supabase
    .from('participants')
    .select('id')
    .eq('user_id', user.id)
    .eq('event_year', EVENT_YEAR_2026)
    .maybeSingle();

  return { supabase, participant, userId: user.id };
}

const RUN_ERRORS: Record<string, string> = {
  'Run submissions are closed': 'Turregistreringen er stengt.',
  'Run date is outside the submission period': 'Turen må være løpt i november.',
  'Run date cannot be in the future': 'Du kan ikke registrere en tur frem i tid.',
  'Run must be registered within a day of the run':
    'Turen må registreres innen et døgn: i dag eller i går.',
  'Run distance must be at least 3 km': 'Turen må være minst 3 km.',
  'Run distance must be at most 120 km': 'Turen kan ikke være over 120 km.',
};

/** Database errors are translated; anything unexpected gets a generic text and a server log. */
function runError(error: { code?: string; message: string }): string {
  if (error.code === '23505') return 'Du har allerede registrert en tur på denne datoen';
  if (RUN_ERRORS[error.message]) return RUN_ERRORS[error.message];
  console.error('Run action failed:', error.code, error.message);
  return 'Noe gikk galt. Prøv igjen.';
}

const EVIDENCE_BUCKET = 'run-evidence';
const MAX_EVIDENCE_BYTES = 10 * 1024 * 1024;

/** Storage path of an evidence image in our bucket, or null for external links. */
function evidencePath(url: string | null | undefined, participantId: string): string | null {
  if (!url) return null;
  const marker = `/storage/v1/object/public/${EVIDENCE_BUCKET}/`;
  const index = url.indexOf(marker);
  if (index === -1) return null;
  const path = url.slice(index + marker.length);
  return path.startsWith(`${participantId}/`) ? path : null;
}

/**
 * Uploads a run photo. The image is decoded and re-encoded as JPEG on the server, which removes
 * EXIF data such as GPS coordinates, and stored under the participant id (not the auth user id).
 */
export async function uploadRunEvidence(
  formData: FormData
): Promise<ActionResult<{ url: string }>> {
  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) {
    return { success: false, error: 'Velg et bilde' };
  }
  if (file.size > MAX_EVIDENCE_BYTES) {
    return { success: false, error: 'Bildet kan være maks 10 MB' };
  }

  const { supabase, participant, userId } = await currentParticipant();
  if (!participant || !userId) return { success: false, error: 'Du må være påmeldt i 2026' };

  const limit = await checkRateLimit('upload', userId);
  if (!limit.success) {
    return { success: false, error: 'For mange opplastinger. Prøv igjen om en stund.' };
  }

  let image: Buffer;
  try {
    image = await sharp(Buffer.from(await file.arrayBuffer()), { limitInputPixels: 50_000_000 })
      .rotate()
      .resize(2048, 2048, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 85, mozjpeg: true })
      .toBuffer();
  } catch {
    return { success: false, error: 'Kunne ikke lese bildet. Bruk JPEG, PNG eller WebP.' };
  }

  const path = `${participant.id}/${randomUUID()}.jpg`;
  const { error } = await supabase.storage
    .from(EVIDENCE_BUCKET)
    .upload(path, image, { contentType: 'image/jpeg' });
  if (error) {
    console.error('Run evidence upload failed:', error.message);
    return { success: false, error: 'Opplastingen feilet. Prøv igjen.' };
  }

  const url = supabase.storage.from(EVIDENCE_BUCKET).getPublicUrl(path).data.publicUrl;
  return { success: true, data: { url } };
}

function refresh2026() {
  revalidatePath('/');
  revalidatePath('/dashboard');
  revalidatePath('/deltakere');
}

export async function createRun(input: RunInput): Promise<ActionResult<{ id: string }>> {
  const parsed = runInputSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || 'Ugyldig tur' };
  }

  const { supabase, participant } = await currentParticipant();
  if (!participant) return { success: false, error: 'Du må være påmeldt i 2026' };

  const distance = Math.round(parsed.data.distance_km * 100) / 100;
  const { data, error } = await supabase
    .from('runs')
    .insert({
      participant_id: participant.id,
      event_year: EVENT_YEAR_2026,
      run_date: parsed.data.run_date,
      distance_km: distance,
      donation_amount_nok: donationForDistance(distance),
      title: parsed.data.title || null,
      duration_text: parsed.data.duration_text || null,
      comment: parsed.data.comment || null,
      evidence_url: parsed.data.evidence_url || null,
    })
    .select('id')
    .single();

  if (error) return { success: false, error: runError(error) };

  refresh2026();
  return { success: true, data: { id: data.id } };
}

export async function updateRun(runId: string, input: RunInput): Promise<ActionResult> {
  const parsed = runInputSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || 'Ugyldig tur' };
  }

  const { supabase, participant } = await currentParticipant();
  if (!participant) return { success: false, error: 'Du må være påmeldt i 2026' };

  const distance = Math.round(parsed.data.distance_km * 100) / 100;
  const { data: previous } = await supabase
    .from('runs')
    .select('evidence_url')
    .eq('id', runId)
    .eq('participant_id', participant.id)
    .maybeSingle();
  const { data: updated, error } = await supabase
    .from('runs')
    .update({
      run_date: parsed.data.run_date,
      distance_km: distance,
      title: parsed.data.title || null,
      duration_text: parsed.data.duration_text || null,
      comment: parsed.data.comment || null,
      evidence_url: parsed.data.evidence_url || null,
    })
    .eq('id', runId)
    .eq('participant_id', participant.id)
    .select('id');

  if (error) return { success: false, error: runError(error) };
  // RLS filters out closed runs without an error, so nothing was updated.
  if (!updated?.length) return { success: false, error: RUN_ERRORS['Run submissions are closed'] };

  // A replaced photo is removed from storage, so old photos do not stay public.
  const oldPath = evidencePath(previous?.evidence_url, participant.id);
  if (oldPath && previous?.evidence_url !== (parsed.data.evidence_url || null)) {
    await supabase.storage.from(EVIDENCE_BUCKET).remove([oldPath]);
  }

  refresh2026();
  return { success: true };
}

export async function deleteRun(runId: string): Promise<ActionResult> {
  const { supabase, participant } = await currentParticipant();
  if (!participant) return { success: false, error: 'Du må være påmeldt i 2026' };

  const { data: deleted, error } = await supabase
    .from('runs')
    .delete()
    .eq('id', runId)
    .eq('participant_id', participant.id)
    .select('evidence_url');

  if (error) return { success: false, error: runError(error) };
  const path = evidencePath(deleted?.[0]?.evidence_url, participant.id);
  if (path) await supabase.storage.from(EVIDENCE_BUCKET).remove([path]);
  refresh2026();
  return { success: true };
}

export async function updateDistanceInterests(categories: string[]): Promise<ActionResult> {
  const parsed = interestInputSchema.safeParse({ categories });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || 'Ugyldig valg' };
  }

  const { supabase, participant } = await currentParticipant();
  if (!participant) return { success: false, error: 'Du må være påmeldt i 2026' };

  // Add the chosen categories first and remove the others after, so a failed write never
  // leaves the participant without any categories.
  const { error } = await supabase.from('participant_distance_interests').upsert(
    parsed.data.categories.map((category) => ({
      participant_id: participant.id,
      event_year: EVENT_YEAR_2026,
      category_slug: category,
    })),
    { onConflict: 'participant_id,event_year,category_slug', ignoreDuplicates: true }
  );
  if (error) return { success: false, error: runError(error) };

  const { error: deleteError } = await supabase
    .from('participant_distance_interests')
    .delete()
    .eq('participant_id', participant.id)
    .eq('event_year', EVENT_YEAR_2026)
    .not('category_slug', 'in', `(${parsed.data.categories.join(',')})`);
  if (deleteError) return { success: false, error: runError(deleteError) };
  refresh2026();
  return { success: true };
}
