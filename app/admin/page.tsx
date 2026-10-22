import { notFound } from 'next/navigation';
import { createClient } from '@/app/_shared/lib/supabase/server';
import { Button } from '@/app/_shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/_shared/components/ui/card';
import { Input } from '@/app/_shared/components/ui/input';
import { Label } from '@/app/_shared/components/ui/label';
import { Textarea } from '@/app/_shared/components/ui/textarea';
import {
  annulDraw,
  createPrize,
  drawPrize,
  saveEventSettings,
  setPrizeAvailability,
} from '@/app/actions/admin-2026';
import { CATEGORY_META, EVENT_YEAR_2026 } from '@/app/_shared/types/event-2026';
import { formatDate } from '@/app/_shared/lib/utils/format';
import { ConfirmButton } from './_components/confirm-button';
import { isKnownDrawError } from './_components/draw-errors';

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ feil?: string }>;
}) {
  const { feil } = await searchParams;
  const supabase = await createClient();
  const { data: isAdmin } = await supabase.rpc('is_event_admin');
  if (!isAdmin) notFound();

  const [editionResult, prizesResult, drawsResult, entriesResult] = await Promise.all([
    supabase.from('event_editions').select('*').eq('event_year', EVENT_YEAR_2026).single(),
    supabase
      .from('race_prizes')
      .select('*')
      .eq('event_year', EVENT_YEAR_2026)
      .order('distance_km', { ascending: false }),
    supabase.from('draw_results').select('*').eq('event_year', EVENT_YEAR_2026).order('drawn_at'),
    supabase
      .from('category_ticket_totals')
      .select('category_slug, tickets')
      .eq('event_year', EVENT_YEAR_2026),
  ]);

  const edition = editionResult.data;
  const prizes = prizesResult.data || [];
  const allDraws = drawsResult.data || [];
  const draws = allDraws.filter((draw) => !draw.annulled_at);
  const annulledDraws = allDraws.filter((draw) => draw.annulled_at);
  const drawLocked = Boolean(edition?.registration_open || edition?.submissions_open);
  // draw_race_prize() only accepts the longest prize still waiting to be drawn.
  const nextDistance = Math.max(
    0,
    ...prizes.filter((prize) => prize.status === 'available').map((prize) => prize.distance_km)
  );
  const entryCount = (slug: string) =>
    (entriesResult.data || [])
      .filter((entry) => entry.category_slug === slug)
      .reduce((sum, entry) => sum + (entry.tickets ?? 0), 0);

  const winnerIds = [...new Set(allDraws.map((draw) => draw.participant_id))];
  const runIds = draws.map((draw) => draw.winning_run_id);
  const [{ data: winners }, { data: winningRuns }] = await Promise.all([
    supabase.from('participants').select('id, full_name, email').in('id', winnerIds),
    supabase.from('runs').select('id, run_date, distance_km').in('id', runIds),
  ]);

  return (
    <div className="container mx-auto max-w-6xl px-4 py-12">
      <div className="mb-8">
        <p className="text-sm font-semibold text-accent">Arrangør</p>
        <h1 className="text-4xl font-bold">Barteløpet 2026</h1>
      </div>

      {feil && isKnownDrawError(feil) && (
        <div
          role="alert"
          className="mb-6 rounded-xl border-2 border-destructive bg-destructive/10 p-4 font-semibold text-destructive"
        >
          {feil}
        </div>
      )}

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        {[
          [`Lodd ${CATEGORY_META.short.range}`, entryCount('short')],
          [`Lodd ${CATEGORY_META.medium.range}`, entryCount('medium')],
          [`Lodd ${CATEGORY_META.long.range}`, entryCount('long')],
        ].map(([label, value]) => (
          <Card key={label}>
            <CardContent className="p-5 text-center">
              <div className="text-3xl font-bold text-accent">{value}</div>
              <div className="text-sm text-muted-foreground">{label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Arrangement</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={saveEventSettings} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="donation_url">Donasjonslenke</Label>
                  <Input
                    id="donation_url"
                    name="donation_url"
                    type="url"
                    defaultValue={edition?.donation_url || ''}
                  />
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    name="registration_open"
                    type="checkbox"
                    defaultChecked={edition?.registration_open}
                  />
                  Påmelding åpen
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    name="submissions_open"
                    type="checkbox"
                    defaultChecked={edition?.submissions_open}
                  />
                  Turregistrering åpen
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    name="winners_published"
                    type="checkbox"
                    defaultChecked={edition?.winners_published}
                  />
                  Publiser vinnere
                </label>
                <Button type="submit">Lagre innstillinger</Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Legg til startnummer</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={createPrize} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="race_name">Løp *</Label>
                    <Input id="race_name" name="race_name" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="distance_km">Distanse (km) *</Label>
                    <Input
                      id="distance_km"
                      name="distance_km"
                      type="number"
                      min="0.1"
                      step="0.01"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="donor_name">Klubb/sponsor</Label>
                    <Input id="donor_name" name="donor_name" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="race_date">Løpsdato</Label>
                    <Input id="race_date" name="race_date" type="date" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website_url">Nettside</Label>
                  <Input id="website_url" name="website_url" type="url" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notater</Label>
                  <Textarea id="notes" name="notes" />
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input name="publish" type="checkbox" defaultChecked /> Publiser med en gang
                </label>
                <Button type="submit">Legg til premie</Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Premier og trekning</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Premiene trekkes fra lengst til kortest distanse. Hver deltaker vinner én premie, med
              mindre alle som er igjen i potten allerede har vunnet.
            </p>
            {drawLocked && (
              <p className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm">
                Trekning er sperret til både påmelding og turregistrering er stengt.
              </p>
            )}
            {prizes.map((prize) => {
              const draw = draws.find((item) => item.prize_id === prize.id);
              const winner = winners?.find((item) => item.id === draw?.participant_id);
              const winningRun = winningRuns?.find((item) => item.id === draw?.winning_run_id);
              const history = annulledDraws.filter((item) => item.prize_id === prize.id);
              const isNext = prize.status === 'available' && prize.distance_km === nextDistance;
              return (
                <div key={prize.id} className="rounded-xl border p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <strong>{prize.race_name}</strong>
                      <p className="text-sm text-muted-foreground">
                        {prize.distance_km} km · {prize.category_slug} · {prize.status}
                      </p>
                    </div>
                    {!draw && (
                      <div className="flex gap-2">
                        {prize.status === 'available' ? (
                          <>
                            <form action={drawPrize.bind(null, prize.id)}>
                              <ConfirmButton
                                size="sm"
                                disabled={drawLocked || !isNext}
                                title={isNext ? undefined : 'Trekk de lengste løpene først'}
                                confirmText={`Trekke vinner av ${prize.race_name} nå?`}
                              >
                                Trekk
                              </ConfirmButton>
                            </form>
                            <form action={setPrizeAvailability.bind(null, prize.id, false)}>
                              <Button size="sm" variant="outline">
                                Skjul
                              </Button>
                            </form>
                          </>
                        ) : (
                          <form action={setPrizeAvailability.bind(null, prize.id, true)}>
                            <Button size="sm" variant="outline">
                              Publiser
                            </Button>
                          </form>
                        )}
                      </div>
                    )}
                  </div>
                  {draw && (
                    <div className="mt-3 rounded-lg bg-accent/10 p-3 text-sm">
                      <strong>Vinner: {winner?.full_name || draw.participant_id}</strong>
                      {draws.filter((item) => item.participant_id === draw.participant_id).length >
                        1 && <div>Har også vunnet en annen premie (ingen andre lodd igjen).</div>}
                      <div>{winner?.email}</div>
                      {winningRun && (
                        <div>
                          Vinnerlodd: tur {formatDate(winningRun.run_date)} ·{' '}
                          {winningRun.distance_km.toLocaleString('nb-NO')} km
                        </div>
                      )}
                      <div className="text-muted-foreground">
                        {draw.candidate_count} lodd i potten ·{' '}
                        {new Date(draw.drawn_at).toLocaleString('nb-NO')}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <form action={annulDraw.bind(null, draw.id, true)}>
                          <ConfirmButton
                            size="sm"
                            variant="outline"
                            confirmText={`Registrere at ${winner?.full_name || 'vinneren'} takker nei? Premien kan trekkes på nytt uten denne deltakeren.`}
                          >
                            Vinner takket nei
                          </ConfirmButton>
                        </form>
                        <form action={annulDraw.bind(null, draw.id, false)}>
                          <ConfirmButton
                            size="sm"
                            variant="outline"
                            confirmText="Annullere trekningen som feil? Vinneren blir med i potten igjen."
                          >
                            Annuller (feiltrekning)
                          </ConfirmButton>
                        </form>
                      </div>
                    </div>
                  )}
                  {history.length > 0 && (
                    <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
                      {history.map((item) => (
                        <li key={item.id}>
                          Annullert: {winners?.find((w) => w.id === item.participant_id)?.full_name}{' '}
                          ({item.declined ? 'takket nei' : 'feiltrekning'}) ·{' '}
                          {new Date(item.drawn_at).toLocaleString('nb-NO')}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
            {prizes.length === 0 && (
              <p className="text-muted-foreground">Ingen premier lagt inn.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
