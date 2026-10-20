'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/app/_shared/lib/supabase/server';
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
  if (!user) return { supabase, participant: null };

  const { data: participant } = await supabase
    .from('participants')
    .select('id')
    .eq('user_id', user.id)
    .eq('event_year', EVENT_YEAR_2026)
    .maybeSingle();

  return { supabase, participant };
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

  if (error) {
    if (error.code === '23505') {
      return { success: false, error: 'Du har allerede registrert en tur på denne datoen' };
    }
    return { success: false, error: error.message };
  }

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
  const { error } = await supabase
    .from('runs')
    .update({
      run_date: parsed.data.run_date,
      distance_km: distance,
      donation_amount_nok: donationForDistance(distance),
      title: parsed.data.title || null,
      duration_text: parsed.data.duration_text || null,
      comment: parsed.data.comment || null,
      evidence_url: parsed.data.evidence_url || null,
    })
    .eq('id', runId)
    .eq('participant_id', participant.id);

  if (error) {
    if (error.code === '23505') {
      return { success: false, error: 'Du har allerede registrert en tur på denne datoen' };
    }
    return { success: false, error: error.message };
  }

  refresh2026();
  return { success: true };
}

export async function deleteRun(runId: string): Promise<ActionResult> {
  const { supabase, participant } = await currentParticipant();
  if (!participant) return { success: false, error: 'Du må være påmeldt i 2026' };

  const { error } = await supabase
    .from('runs')
    .delete()
    .eq('id', runId)
    .eq('participant_id', participant.id);

  if (error) return { success: false, error: error.message };
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

  const { error: deleteError } = await supabase
    .from('participant_distance_interests')
    .delete()
    .eq('participant_id', participant.id)
    .eq('event_year', EVENT_YEAR_2026);
  if (deleteError) return { success: false, error: deleteError.message };

  const { error } = await supabase.from('participant_distance_interests').insert(
    parsed.data.categories.map((category) => ({
      participant_id: participant.id,
      event_year: EVENT_YEAR_2026,
      category_slug: category,
    }))
  );

  if (error) return { success: false, error: error.message };
  refresh2026();
  return { success: true };
}
