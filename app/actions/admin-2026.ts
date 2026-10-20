'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/app/_shared/lib/supabase/server';
import { categoryForPrize, EVENT_YEAR_2026 } from '@/app/_shared/types/event-2026';
import { DRAW_ERRORS, DRAW_FAILED } from '@/app/admin/_components/draw-errors';

async function adminClient() {
  const supabase = await createClient();
  const { data: allowed } = await supabase.rpc('is_event_admin');
  if (!allowed) throw new Error('Administrator access required');
  return supabase;
}

function refreshAdmin() {
  revalidatePath('/admin');
  revalidatePath('/premier');
  revalidatePath('/');
}

/** Shows draw errors as a banner on /admin instead of crashing the page mid-draw. */
function failDraw(message: string): never {
  if (!DRAW_ERRORS[message]) console.error('Draw failed:', message);
  redirect(`/admin?feil=${encodeURIComponent(DRAW_ERRORS[message] ?? DRAW_FAILED)}`);
}

/** Empty, or an http(s) URL. Anything else (javascript:, data:) is rejected. */
function optionalWebUrl(value: FormDataEntryValue | null, field: string): string | null {
  const text = String(value || '').trim();
  if (!text) return null;
  try {
    const url = new URL(text);
    if (url.protocol === 'https:' || url.protocol === 'http:') return url.toString();
  } catch {
    // Falls through to the error below.
  }
  throw new Error(`${field} må være en http(s)-lenke`);
}

export async function saveEventSettings(formData: FormData): Promise<void> {
  const supabase = await adminClient();
  const { error } = await supabase
    .from('event_editions')
    .update({
      registration_open: formData.get('registration_open') === 'on',
      submissions_open: formData.get('submissions_open') === 'on',
      donation_url: optionalWebUrl(formData.get('donation_url'), 'Gavelenken'),
      updated_at: new Date().toISOString(),
    })
    .eq('event_year', EVENT_YEAR_2026);
  if (error) throw new Error('Kunne ikke lagre innstillingene');

  // Sets winners_published and publishes (or hides) every draw. Draws made while winners are
  // published get published_at in draw_race_prize(); earlier timestamps survive re-saves.
  const { error: publishError } = await supabase.rpc('publish_draws', {
    p_event_year: EVENT_YEAR_2026,
    p_publish: formData.get('winners_published') === 'on',
  });
  if (publishError) throw new Error('Kunne ikke publisere vinnerne');
  refreshAdmin();
}

export async function createPrize(formData: FormData): Promise<void> {
  const supabase = await adminClient();
  const distance = Number(formData.get('distance_km'));
  if (!Number.isFinite(distance) || distance <= 0) throw new Error('Ugyldig distanse');
  const raceName = String(formData.get('race_name') || '').trim();
  if (!raceName) throw new Error('Løpsnavn mangler');

  const { error } = await supabase.from('race_prizes').insert({
    event_year: EVENT_YEAR_2026,
    category_slug: categoryForPrize(distance),
    race_name: raceName,
    distance_km: distance,
    donor_name: String(formData.get('donor_name') || '').trim() || null,
    race_date: String(formData.get('race_date') || '') || null,
    website_url: optionalWebUrl(formData.get('website_url'), 'Nettsiden'),
    notes: String(formData.get('notes') || '').trim() || null,
    status: formData.get('publish') === 'on' ? 'available' : 'draft',
  });
  if (error) throw new Error('Kunne ikke opprette premien');
  refreshAdmin();
}

export async function setPrizeAvailability(prizeId: string, available: boolean): Promise<void> {
  const supabase = await adminClient();
  const { error } = await supabase
    .from('race_prizes')
    .update({ status: available ? 'available' : 'draft', updated_at: new Date().toISOString() })
    .eq('id', prizeId)
    .neq('status', 'drawn');
  if (error) throw new Error('Kunne ikke endre premien');
  refreshAdmin();
}

export async function drawPrize(prizeId: string): Promise<void> {
  const supabase = await adminClient();
  const { error } = await supabase.rpc('draw_race_prize', { p_prize_id: prizeId });
  refreshAdmin();
  if (error) failDraw(error.message);
  redirect('/admin');
}

/** `declined` keeps the winner out of the redraw for this prize; use false for mistaken draws. */
export async function annulDraw(resultId: string, declined: boolean): Promise<void> {
  const supabase = await adminClient();
  const { error } = await supabase.rpc('annul_draw', {
    p_result_id: resultId,
    p_declined: declined,
  });
  refreshAdmin();
  if (error) failDraw(error.message);
  redirect('/admin');
}

/**
 * Deletes postal addresses and phone numbers for the year once prizes are delivered, as the
 * privacy policy promises. Names, e-mail addresses and runs are kept.
 */
export async function purgeContactDetails(): Promise<void> {
  const supabase = await adminClient();
  const { data, error } = await supabase.rpc('purge_contact_details', {
    p_event_year: EVENT_YEAR_2026,
  });
  if (error) failDraw(error.message);
  refreshAdmin();
  redirect(`/admin?slettet=${data ?? 0}`);
}
