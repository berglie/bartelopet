import { createClient } from '@/app/_shared/lib/supabase/server';
import type { PublicRun, TicketTotals } from '@/app/_shared/types/event-2026';
import { EVENT_YEAR_2026 } from '@/app/_shared/types/event-2026';

export async function get2026Overview() {
  const supabase = await createClient();
  const [runsResult, entriesResult, prizesResult, editionResult] = await Promise.all([
    supabase
      .from('runs_public')
      .select('*')
      .eq('event_year', EVENT_YEAR_2026)
      .order('run_date', { ascending: false }),
    supabase.from('eligible_entries').select('category_slug').eq('event_year', EVENT_YEAR_2026),
    supabase
      .from('race_prizes')
      .select('*')
      .eq('event_year', EVENT_YEAR_2026)
      .neq('status', 'draft')
      .order('distance_km'),
    supabase.from('event_editions').select('*').eq('event_year', EVENT_YEAR_2026).maybeSingle(),
  ]);

  const runs = (runsResult.data || []).filter(
    (run) =>
      run.id &&
      run.participant_id &&
      run.full_name &&
      run.bib_number !== null &&
      run.run_date &&
      run.distance_km !== null &&
      run.donation_amount_nok !== null &&
      Array.isArray(run.interest_categories)
  ) as PublicRun[];

  const tickets: TicketTotals = { short: 0, medium: 0, long: 0 };
  for (const entry of entriesResult.data || []) {
    if (entry.category_slug === 'short') tickets.short++;
    if (entry.category_slug === 'medium') tickets.medium++;
    if (entry.category_slug === 'long') tickets.long++;
  }

  return {
    runs,
    tickets,
    prizes: prizesResult.data || [],
    edition: editionResult.data,
    stats: {
      runs: runs.length,
      runners: new Set(runs.map((run) => run.participant_id)).size,
      kilometers: runs.reduce((sum, run) => sum + Number(run.distance_km), 0),
      donated: runs.reduce((sum, run) => sum + run.donation_amount_nok, 0),
    },
  };
}
