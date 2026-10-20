'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/app/_shared/lib/supabase/server';
import { categoryForPrize, EVENT_YEAR_2026 } from '@/app/_shared/types/event-2026';

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

const DRAW_ERRORS: Record<string, string> = {
  'Close registration and run submissions before drawing':
    'Steng påmelding og turregistrering før du trekker.',
  'Longer prizes must be drawn first': 'Trekk de lengste løpene først.',
  'No eligible entries are available': 'Ingen lodd igjen i potten for denne premien.',
  'Prize is not available for drawing': 'Premien er ikke publisert eller er allerede trukket.',
  'Prize has already been drawn': 'Premien er allerede trukket.',
  'Draw not found or already annulled': 'Trekningen finnes ikke eller er allerede annullert.',
};

/** Shows draw errors as a banner on /admin instead of crashing the page mid-draw. */
function failDraw(message: string): never {
  redirect(`/admin?feil=${encodeURIComponent(DRAW_ERRORS[message] ?? message)}`);
}

export async function saveEventSettings(formData: FormData): Promise<void> {
  const supabase = await adminClient();
  const donationUrl = String(formData.get('donation_url') || '').trim();
  const { error } = await supabase
    .from('event_editions')
    .update({
      registration_open: formData.get('registration_open') === 'on',
      submissions_open: formData.get('submissions_open') === 'on',
      donation_url: donationUrl || null,
      winners_published: formData.get('winners_published') === 'on',
      updated_at: new Date().toISOString(),
    })
    .eq('event_year', EVENT_YEAR_2026);
  if (error) throw new Error(error.message);

  // Draws made while winners are published get published_at in draw_race_prize().
  // Here we only publish what is still unpublished, so earlier timestamps survive re-saves.
  const publishWinners = formData.get('winners_published') === 'on';
  const publishQuery = supabase
    .from('draw_results')
    .update({ published_at: publishWinners ? new Date().toISOString() : null })
    .eq('event_year', EVENT_YEAR_2026)
    .is('annulled_at', null);
  const { error: publishError } = publishWinners
    ? await publishQuery.is('published_at', null)
    : await publishQuery;
  if (publishError) throw new Error(publishError.message);
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
    website_url: String(formData.get('website_url') || '').trim() || null,
    notes: String(formData.get('notes') || '').trim() || null,
    status: formData.get('publish') === 'on' ? 'available' : 'draft',
  });
  if (error) throw new Error(error.message);
  refreshAdmin();
}

export async function setPrizeAvailability(prizeId: string, available: boolean): Promise<void> {
  const supabase = await adminClient();
  const { error } = await supabase
    .from('race_prizes')
    .update({ status: available ? 'available' : 'draft', updated_at: new Date().toISOString() })
    .eq('id', prizeId)
    .neq('status', 'drawn');
  if (error) throw new Error(error.message);
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
