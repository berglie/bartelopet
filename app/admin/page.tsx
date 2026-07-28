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
import { EVENT_YEAR_2026 } from '@/app/_shared/types/event-2026';

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: isAdmin } = await supabase.rpc('is_event_admin');
  if (!isAdmin) notFound();

  const [editionResult, prizesResult, drawsResult, entriesResult] = await Promise.all([
    supabase.from('event_editions').select('*').eq('event_year', EVENT_YEAR_2026).single(),
    supabase.from('race_prizes').select('*').eq('event_year', EVENT_YEAR_2026).order('distance_km'),
    supabase
      .from('draw_results')
      .select('*')
      .eq('event_year', EVENT_YEAR_2026)
      .is('annulled_at', null),
    supabase.from('eligible_entries').select('category_slug').eq('event_year', EVENT_YEAR_2026),
  ]);

  const edition = editionResult.data;
  const prizes = prizesResult.data || [];
  const draws = drawsResult.data || [];
  const entryCount = (slug: string) =>
    (entriesResult.data || []).filter((entry) => entry.category_slug === slug).length;

  const winnerIds = draws.map((draw) => draw.participant_id);
  const { data: winners } = winnerIds.length
    ? await supabase
        .from('participants')
        .select('id, full_name, email, phone_number')
        .in('id', winnerIds)
    : { data: [] };

  return (
    <div className="container mx-auto max-w-6xl px-4 py-12">
      <div className="mb-8">
        <p className="text-sm font-semibold text-accent">Arrangør</p>
        <h1 className="text-4xl font-bold">Barteløpet 2026</h1>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        {[
          ['Lodd 0–10', entryCount('short')],
          ['Lodd 10–30', entryCount('medium')],
          ['Lodd 30+', entryCount('long')],
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
            {prizes.map((prize) => {
              const draw = draws.find((item) => item.prize_id === prize.id);
              const winner = winners?.find((item) => item.id === draw?.participant_id);
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
                              <Button size="sm">Trekk</Button>
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
                      <div>
                        {winner?.email} {winner?.phone_number && `· ${winner.phone_number}`}
                      </div>
                      <div className="text-muted-foreground">
                        {draw.candidate_count} lodd i potten ·{' '}
                        {new Date(draw.drawn_at).toLocaleString('nb-NO')}
                      </div>
                      <form action={annulDraw.bind(null, draw.id)} className="mt-2">
                        <Button size="sm" variant="outline">
                          Annuller trekning
                        </Button>
                      </form>
                    </div>
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
