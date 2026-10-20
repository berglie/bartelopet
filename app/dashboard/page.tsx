import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/app/_shared/lib/supabase/server';
import { Button } from '@/app/_shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/_shared/components/ui/card';
import { CATEGORY_META, CATEGORY_ORDER, EVENT_YEAR_2026 } from '@/app/_shared/types/event-2026';
import { cn } from '@/app/_shared/lib/utils/cn';
import { RunForm2026 } from './_components/run-form-2026';
import { Interests2026 } from './_components/interests-2026';
import { RunCard2026 } from './_components/run-card-2026';
import { TerrainLines } from '@/app/_shared/components/terrain-lines';

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: participant } = await supabase
    .from('participants')
    .select('id, full_name, bib_number')
    .eq('user_id', user.id)
    .eq('event_year', EVENT_YEAR_2026)
    .maybeSingle();
  if (!participant) redirect('/pamelding');

  const [runsResult, interestsResult, entriesResult, editionResult, potResult] = await Promise.all([
    supabase
      .from('runs')
      .select('*')
      .eq('participant_id', participant.id)
      .eq('event_year', EVENT_YEAR_2026)
      .order('run_date', { ascending: false }),
    supabase
      .from('participant_distance_interests')
      .select('category_slug')
      .eq('participant_id', participant.id)
      .eq('event_year', EVENT_YEAR_2026),
    supabase
      .from('eligible_entries')
      .select('category_slug, tickets')
      .eq('participant_id', participant.id)
      .eq('event_year', EVENT_YEAR_2026),
    supabase.from('event_editions').select('*').eq('event_year', EVENT_YEAR_2026).single(),
    supabase
      .from('category_ticket_totals')
      .select('category_slug, tickets')
      .eq('event_year', EVENT_YEAR_2026),
  ]);

  const runs = runsResult.data || [];
  const interests = (interestsResult.data || []).map((item) => item.category_slug);
  const entries = entriesResult.data || [];
  const canEdit = Boolean(editionResult.data?.submissions_open);
  const canEditInterests = Boolean(
    editionResult.data?.registration_open || editionResult.data?.submissions_open
  );
  const totalKm = runs.reduce((sum, run) => sum + run.distance_km, 0);
  const sumTickets = (
    rows: { category_slug: string | null; tickets: number | null }[],
    slug?: string
  ) =>
    rows
      .filter((entry) => !slug || entry.category_slug === slug)
      .reduce((sum, entry) => sum + (entry.tickets ?? 0), 0);
  const ticketCount = (slug: string) => sumTickets(entries, slug);
  const potCount = (slug: string) => sumTickets(potResult.data || [], slug);

  async function signOut() {
    'use server';
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect('/');
  }

  return (
    <div>
      <header className="relative overflow-hidden border-b-2 border-foreground bg-foreground py-12 text-background md:py-16">
        <TerrainLines className="text-accent/20" />
        <div className="relative mx-auto flex max-w-[1200px] flex-col justify-between gap-6 px-4 sm:flex-row sm:items-end md:px-8">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-accent">
              Min side · Startnummer #{participant.bib_number}
            </p>
            <h1 className="font-display mt-2 break-words text-5xl font-black uppercase leading-[0.9] md:text-7xl">
              Hei, {participant.full_name}
            </h1>
          </div>
          <form action={signOut}>
            <Button variant="line-dark">Logg ut</Button>
          </form>
        </div>
      </header>

      <main className="mx-auto max-w-[1200px] px-4 py-10 md:px-8 md:py-16">
        <div className="mb-10 grid grid-cols-3 gap-3">
          {[
            ['Turer', runs.length, 'bg-accent'],
            [
              'Kilometer',
              totalKm.toLocaleString('nb-NO', { maximumFractionDigits: 1 }),
              'bg-secondary',
            ],
            ['Lodd', sumTickets(entries), 'bg-foreground text-background'],
          ].map(([label, value, color]) => (
            <Card
              key={String(label)}
              className={cn('rounded-none border-2 border-foreground shadow-none', String(color))}
            >
              <CardContent className="p-4 text-center md:p-5">
                <div className="font-display text-3xl font-black tabular-nums md:text-4xl">
                  {value}
                </div>
                <div className="text-[11px] font-black uppercase tracking-[0.16em]">{label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-7 lg:grid-cols-[1fr_1.5fr]">
          <div className="space-y-6">
            <Card className="border-2 border-foreground shadow-[5px_5px_0_hsl(var(--foreground))]">
              <CardHeader className="border-b-2 border-foreground bg-accent">
                <CardTitle className="font-display text-2xl font-black uppercase">
                  Mine premiekategorier
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <Interests2026 initial={interests} disabled={!canEditInterests} />
                <p className="mt-6 border-t-2 border-foreground pt-4 text-[11px] font-black uppercase tracking-[0.16em]">
                  Mine lodd
                </p>
                <div className="mt-2 grid grid-cols-3 gap-2 text-center text-xs">
                  {CATEGORY_ORDER.map((slug) => (
                    <div
                      key={slug}
                      className={cn('border-2 border-foreground p-2', CATEGORY_META[slug].solid)}
                    >
                      <strong className="font-display block text-3xl tabular-nums">
                        {ticketCount(slug)}
                      </strong>
                      <span className="block tabular-nums opacity-80">
                        av {potCount(slug).toLocaleString('nb-NO')} i potten
                      </span>
                      {CATEGORY_META[slug].range}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Button asChild variant="line" className="w-full">
              <Link href="/premier">Se tilgjengelige startnumre</Link>
            </Button>
          </div>

          <div className="space-y-8">
            <Card className="border-2 border-foreground shadow-[5px_5px_0_hsl(var(--foreground))]">
              <CardHeader className="border-b-2 border-foreground bg-secondary">
                <CardTitle className="font-display text-2xl font-black uppercase">
                  Registrer løpetur
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                {canEdit ? (
                  <RunForm2026 donationUrl={editionResult.data?.donation_url} />
                ) : (
                  <p className="border-2 border-dashed border-foreground p-4 text-sm">
                    Turregistreringen er stengt. Den åpner for novemberløp når arrangøren åpner
                    perioden.
                  </p>
                )}
              </CardContent>
            </Card>
            <div className="space-y-3">
              <h2 className="font-display text-4xl font-black uppercase">Mine turer</h2>
              {runs.map((run) => (
                <RunCard2026
                  key={run.id}
                  run={run}
                  canEdit={canEdit}
                  donationUrl={editionResult.data?.donation_url}
                />
              ))}
              {runs.length === 0 && (
                <p className="border-2 border-dashed border-foreground p-6 text-muted-foreground">
                  Ingen turer registrert ennå. Hver tur du registrerer blir en prikk på bartelinjen.
                </p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
