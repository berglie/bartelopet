import { createClient } from '@/app/_shared/lib/supabase/server';
import { fetchAll } from '@/app/_shared/lib/supabase/fetch-all';
import { PUBLIC_RUN_COLUMNS, toPublicRuns } from '@/app/_shared/lib/queries/event-2026';
import { Card, CardContent } from '@/app/_shared/components/ui/card';
import {
  EVENT_YEAR_2026,
  novemberDaysElapsed,
  summarizeRunners,
} from '@/app/_shared/types/event-2026';
import { TerrainLines } from '@/app/_shared/components/terrain-lines';
import { CommunityGoal } from '@/app/_components/community-goal';
import { DaysActive } from './days-active';
import { ParticipantsTable, type ParticipantRow } from './participants-table';
import { RecentRuns } from './recent-runs';

const RECENT_RUNS_SHOWN = 8;

function sumTickets(
  entries: { category_slug: string | null; tickets: number | null }[],
  slug: string
): number {
  return entries
    .filter((entry) => entry.category_slug === slug)
    .reduce((sum, entry) => sum + (entry.tickets ?? 0), 0);
}

export async function Participants2026() {
  const supabase = await createClient();
  const [participantsResult, runsResult, entriesResult] = await Promise.all([
    fetchAll((from, to) =>
      supabase
        .from('participants_safe')
        .select('id, full_name, bib_number')
        .eq('event_year', EVENT_YEAR_2026)
        .order('bib_number')
        .range(from, to)
    ),
    fetchAll((from, to) =>
      supabase
        .from('runs_public')
        .select(PUBLIC_RUN_COLUMNS)
        .eq('event_year', EVENT_YEAR_2026)
        .order('run_date', { ascending: false })
        .order('submitted_order', { ascending: false })
        .range(from, to)
    ),
    fetchAll((from, to) =>
      supabase
        .from('participant_ticket_totals')
        .select('*')
        .eq('event_year', EVENT_YEAR_2026)
        .order('participant_id')
        .order('category_slug')
        .range(from, to)
    ),
  ]);

  const allRuns = toPublicRuns(runsResult.data);
  const summaries = summarizeRunners(allRuns);
  const daysOut = new Map<string, Set<string>>();
  for (const run of allRuns) {
    daysOut.set(
      run.participant_id,
      (daysOut.get(run.participant_id) || new Set()).add(run.run_date)
    );
  }

  const participants = (participantsResult.data || []).filter(
    (participant): participant is { id: string; full_name: string; bib_number: number } =>
      Boolean(participant.id && participant.full_name) && participant.bib_number !== null
  );
  const rows: ParticipantRow[] = participants.map((participant) => {
    const entries = (entriesResult.data || []).filter(
      (entry) => entry.participant_id === participant.id
    );
    const summary = summaries.get(participant.id);
    return {
      ...participant,
      runs: summary?.runs ?? 0,
      km: summary?.kilometers ?? 0,
      short: sumTickets(entries, 'short'),
      medium: sumTickets(entries, 'medium'),
      long: sumTickets(entries, 'long'),
    };
  });
  const totalKm = allRuns.reduce((sum, run) => sum + run.distance_km, 0);
  // Runs arrive newest first: by date, then by when they were registered (runs have no time).
  // The summary always exists for a participant with runs.
  const recentRuns = allRuns.slice(0, RECENT_RUNS_SHOWN).map((run) => ({
    run,
    summary: summaries.get(run.participant_id)!,
  }));

  return (
    <div>
      <header className="relative overflow-hidden border-b-2 border-foreground bg-foreground py-16 text-background md:py-24">
        <TerrainLines className="text-accent/20" />
        <div className="relative mx-auto max-w-[1500px] px-4 md:px-8">
          <p className="inline-flex border border-accent bg-accent px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-accent-foreground">
            Feltet · 2026
          </p>
          <h1 className="font-display mt-5 text-7xl font-black uppercase leading-[0.88] md:text-9xl">
            Løpere
            <span className="block text-accent">og lodd.</span>
          </h1>
          <div className="mt-6 grid gap-10 lg:grid-cols-[1fr_minmax(320px,0.8fr)] lg:items-end">
            <p className="max-w-xl text-lg text-background/75">
              En levende oversikt over kilometer, bidrag og kvalifiseringer gjennom november.
            </p>
            <CommunityGoal kilometers={totalKm} />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1500px] space-y-16 px-4 py-12 md:space-y-24 md:px-8 md:py-20">
        <DaysActive
          runners={rows.map((row) => ({ ...row, days: daysOut.get(row.id)?.size ?? 0 }))}
          daysElapsed={novemberDaysElapsed()}
        />

        <RecentRuns items={recentRuns} />

        <section aria-labelledby="startfeltet">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Startfeltet</p>
              <h2
                id="startfeltet"
                className="font-display mt-2 text-4xl font-black uppercase md:text-5xl"
              >
                {rows.length > 0 ? `${rows.length} påmeldte` : 'Startfeltet fylles'}
              </h2>
            </div>
            <p className="hidden max-w-sm text-right text-sm text-muted-foreground sm:block">
              Tallene oppdateres når nye turer blir registrert.
            </p>
          </div>

          <Card className="overflow-hidden border-2 border-foreground shadow-[7px_7px_0_hsl(var(--foreground))]">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <ParticipantsTable rows={rows} />
              </div>
              {rows.length === 0 && (
                <p className="p-12 text-center text-muted-foreground">
                  Ingen påmeldte ennå. De første startnumrene dukker opp her.
                </p>
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
