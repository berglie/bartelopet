import { createClient } from '@/app/_shared/lib/supabase/server';
import { Card, CardContent } from '@/app/_shared/components/ui/card';
import { CATEGORY_META, CATEGORY_ORDER, EVENT_YEAR_2026 } from '@/app/_shared/types/event-2026';
import { cn } from '@/app/_shared/lib/utils/cn';
import { TerrainLines } from '@/app/_shared/components/terrain-lines';

export async function Participants2026() {
  const supabase = await createClient();
  const [participantsResult, runsResult, entriesResult] = await Promise.all([
    supabase
      .from('participants_safe')
      .select('id, full_name, bib_number')
      .eq('event_year', EVENT_YEAR_2026)
      .order('bib_number'),
    supabase.from('runs_public').select('*').eq('event_year', EVENT_YEAR_2026),
    supabase.from('eligible_entries').select('*').eq('event_year', EVENT_YEAR_2026),
  ]);

  const rows = (participantsResult.data || []).map((participant) => {
    const runs = (runsResult.data || []).filter((run) => run.participant_id === participant.id);
    const entries = (entriesResult.data || []).filter(
      (entry) => entry.participant_id === participant.id
    );
    return {
      ...participant,
      runs: runs.length,
      km: runs.reduce((sum, run) => sum + Number(run.distance_km || 0), 0),
      donated: runs.reduce((sum, run) => sum + Number(run.donation_amount_nok || 0), 0),
      short: entries.filter((entry) => entry.category_slug === 'short').length,
      medium: entries.filter((entry) => entry.category_slug === 'medium').length,
      long: entries.filter((entry) => entry.category_slug === 'long').length,
    };
  });

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
          <p className="mt-6 max-w-xl text-lg text-background/75">
            En levende oversikt over kilometer, bidrag og kvalifiseringer gjennom november.
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-[1500px] px-4 py-12 md:px-8 md:py-20">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Startfeltet</p>
            <h2 className="font-display mt-2 text-4xl font-black uppercase md:text-5xl">
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
              <table className="w-full min-w-[680px] text-left text-sm">
                <caption className="sr-only">
                  Påmeldte løpere med turer, kilometer, donasjoner og lodd per premiekategori
                </caption>
                <thead className="border-b-2 border-foreground bg-foreground text-[11px] font-black uppercase tracking-[0.14em] text-background">
                  <tr>
                    <th scope="col" className="sticky left-0 z-10 bg-foreground p-4">
                      Løper
                    </th>
                    <th scope="col" className="p-4 text-right">
                      Turer
                    </th>
                    <th scope="col" className="p-4 text-right">
                      Km
                    </th>
                    <th scope="col" className="p-4 text-right">
                      Donert
                    </th>
                    {CATEGORY_ORDER.map((slug) => (
                      <th key={slug} scope="col" className="p-4 text-center">
                        <span
                          className={cn(
                            'inline-block border border-background/40 px-2 py-0.5',
                            CATEGORY_META[slug].solid
                          )}
                        >
                          {CATEGORY_META[slug].range.replace(' km', '')}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr
                      key={row.id}
                      className="group border-b border-foreground/25 tabular-nums last:border-0"
                    >
                      <th
                        scope="row"
                        className="sticky left-0 z-10 bg-card p-4 text-left font-bold group-hover:bg-muted"
                      >
                        <span className="mr-3 inline-flex min-w-12 justify-center bg-foreground px-2 py-1 font-mono text-xs text-background">
                          #{row.bib_number}
                        </span>
                        {row.full_name}
                      </th>
                      <td className="p-4 text-right group-hover:bg-muted">{row.runs}</td>
                      <td className="p-4 text-right group-hover:bg-muted">
                        {row.km.toLocaleString('nb-NO', { maximumFractionDigits: 1 })}
                      </td>
                      <td className="whitespace-nowrap p-4 text-right group-hover:bg-muted">
                        {row.donated.toLocaleString('nb-NO')} kr
                      </td>
                      {CATEGORY_ORDER.map((slug) => (
                        <td
                          key={slug}
                          className={cn(
                            'p-4 text-center font-black group-hover:bg-muted',
                            row[slug] === 0 && 'font-normal text-muted-foreground'
                          )}
                        >
                          {row[slug]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {rows.length === 0 && (
              <p className="p-12 text-center text-muted-foreground">
                Ingen påmeldte ennå. De første startnumrene dukker opp her.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
