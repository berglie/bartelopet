import { createClient } from '@/app/_shared/lib/supabase/server';
import { fetchAll } from '@/app/_shared/lib/supabase/fetch-all';
import { getMock2026Overview } from '@/app/_shared/lib/mock/event-2026';
import { isCategorySlug, type PublicRun, type TicketTotals } from '@/app/_shared/types/event-2026';
import { EVENT_YEAR_2026 } from '@/app/_shared/types/event-2026';

/** Columns the public pages need. Keep in sync with PublicRun; never select('*') here. */
export const PUBLIC_RUN_COLUMNS =
  'id, participant_id, full_name, bib_number, run_date, distance_km, title, duration_text, comment, evidence_url, interest_categories, on_barteloypa';

type RunsPublicRow = Partial<Record<keyof PublicRun, unknown>>;

/** Drops view rows with missing columns (the view types every column as nullable). */
export function toPublicRuns(rows: RunsPublicRow[] | null): PublicRun[] {
  return (rows || []).filter(
    (run) =>
      run.id &&
      run.participant_id &&
      run.full_name &&
      run.bib_number !== null &&
      run.run_date &&
      run.distance_km !== null &&
      Array.isArray(run.interest_categories)
  ) as PublicRun[];
}

export async function get2026Overview() {
  // Mock data is for local development only, so a stray env var cannot show fake data in prod.
  const isDevelopment = process.env.NODE_ENV === 'development';
  const mockSetting = isDevelopment ? process.env.BARTELOPET_USE_MOCK_DATA : undefined;
  const useMockDataAutomatically = isDevelopment && mockSetting !== 'false';

  if (mockSetting === 'true') {
    return {
      ...getMock2026Overview(),
      prizes: [],
      edition: null,
      isMockData: true,
    };
  }

  try {
    const supabase = await createClient();
    const [runsResult, entriesResult, prizesResult, editionResult, registeredResult] =
      await Promise.all([
        fetchAll((from, to) =>
          supabase
            .from('runs_public')
            .select(PUBLIC_RUN_COLUMNS)
            .eq('event_year', EVENT_YEAR_2026)
            .order('run_date', { ascending: false })
            .order('submitted_order', { ascending: false })
            .range(from, to)
        ),
        supabase
          .from('category_ticket_totals')
          .select('category_slug, tickets')
          .eq('event_year', EVENT_YEAR_2026),
        supabase
          .from('race_prizes_public')
          .select('*')
          .eq('event_year', EVENT_YEAR_2026)
          .order('distance_km'),
        supabase.from('event_editions').select('*').eq('event_year', EVENT_YEAR_2026).maybeSingle(),
        supabase
          .from('participants_safe')
          .select('id', { count: 'exact', head: true })
          .eq('event_year', EVENT_YEAR_2026),
      ]);

    const runs = toPublicRuns(runsResult.data);

    const tickets: TicketTotals = { short: 0, medium: 0, long: 0 };
    for (const entry of entriesResult.data || []) {
      if (entry.category_slug && isCategorySlug(entry.category_slug)) {
        tickets[entry.category_slug] += entry.tickets ?? 0;
      }
    }

    const hasQueryError = [runsResult, entriesResult, prizesResult, editionResult].some(
      (result) => result.error
    );

    if (useMockDataAutomatically && (hasQueryError || runs.length === 0)) {
      return {
        ...getMock2026Overview(),
        prizes: prizesResult.data || [],
        edition: editionResult.data,
        isMockData: true,
      };
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
        registered: registeredResult.count ?? 0,
      },
      isMockData: false,
    };
  } catch (error) {
    if (!useMockDataAutomatically) throw error;

    console.warn('Supabase er ikke tilgjengelig. Viser lokal demodata.', error);
    return {
      ...getMock2026Overview(),
      prizes: [],
      edition: null,
      isMockData: true,
    };
  }
}
