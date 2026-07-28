'use server';

import { revalidatePath } from 'next/cache';
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

  const publishWinners = formData.get('winners_published') === 'on';
  const { error: publishError } = await supabase
    .from('draw_results')
    .update({ published_at: publishWinners ? new Date().toISOString() : null })
    .eq('event_year', EVENT_YEAR_2026)
    .is('annulled_at', null);
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
  if (error) throw new Error(error.message);
  refreshAdmin();
}

export async function annulDraw(resultId: string): Promise<void> {
  const supabase = await adminClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Ikke innlogget');

  const { data: result, error: findError } = await supabase
    .from('draw_results')
    .select('prize_id')
    .eq('id', resultId)
    .is('annulled_at', null)
    .single();
  if (findError) throw new Error(findError.message);

  const { error } = await supabase
    .from('draw_results')
    .update({ annulled_at: new Date().toISOString(), annulled_by: user.id })
    .eq('id', resultId);
  if (error) throw new Error(error.message);

  const { error: prizeError } = await supabase
    .from('race_prizes')
    .update({ status: 'available', updated_at: new Date().toISOString() })
    .eq('id', result.prize_id);
  if (prizeError) throw new Error(prizeError.message);
  refreshAdmin();
}
