import Image from 'next/image';
import Link from 'next/link';
import { Calendar, ExternalLink, Gift } from 'lucide-react';
import { createClient } from '@/app/_shared/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/_shared/components/ui/card';
import { Button } from '@/app/_shared/components/ui/button';
import {
  CATEGORY_META,
  EVENT_YEAR_2026,
  categoryForPrize,
  isCategorySlug,
} from '@/app/_shared/types/event-2026';
import { TerrainLines } from '@/app/_shared/components/terrain-lines';
import { cn } from '@/app/_shared/lib/utils/cn';
import { formatDate } from '@/app/_shared/lib/utils/format';

/** Logos and websites for donors, keyed by race_prizes.donor_name. Logos live in public/images/sponsors. */
const DONORS: Record<string, { logo: string; url: string }> = {
  'Sandnes Ultra Trail': {
    logo: '/images/sponsors/sandnes-ultra-trail.webp',
    url: 'https://www.sandnesultratrail.com/',
  },
  'Dale Fjelløpere': {
    logo: '/images/sponsors/dale-fjellopere.webp',
    url: 'https://www.dalefjellopere.com/',
  },
  'GTI Friidrett': {
    logo: '/images/sponsors/gti-friidrett.webp',
    url: 'https://www.gti-friidrett.no/',
  },
  Robust: { logo: '/images/sponsors/robust.webp', url: 'https://robusttf.no/' },
  'Sandnes IL Orientering': {
    logo: '/images/sponsors/sandnes-il.webp',
    url: 'https://www.sandnes-idrettslag.no/orientering/',
  },
};

export async function Prizes2026() {
  const supabase = await createClient();
  const [{ data: prizes }, { data: draws }] = await Promise.all([
    supabase
      .from('race_prizes_public')
      .select('*')
      .eq('event_year', EVENT_YEAR_2026)
      .order('distance_km'),
    // Published draws only. Annulled draws are included without a name, so redraws are visible.
    supabase
      .from('draw_results_public')
      .select('prize_id, participant_id, candidate_count, annulled_at')
      .eq('event_year', EVENT_YEAR_2026),
  ]);
  const prizeList = (prizes || []).flatMap((prize) =>
    prize.id && prize.race_name && prize.distance_km !== null && prize.category_slug
      ? [{ ...prize, id: prize.id, distance_km: prize.distance_km }]
      : []
  );
  const activeDraws = (draws || []).filter((draw) => !draw.annulled_at);
  const winnerIds = activeDraws.flatMap((draw) =>
    draw.participant_id ? [draw.participant_id] : []
  );
  const { data: winners } = winnerIds.length
    ? await supabase.from('participants_safe').select('id, full_name').in('id', winnerIds)
    : { data: [] };

  return (
    <div>
      <header className="relative overflow-hidden border-b-2 border-foreground bg-accent py-16 md:py-24">
        <TerrainLines className="text-foreground/15" />
        <div className="relative mx-auto max-w-[1500px] px-4 md:px-8">
          <p className="trail-label bg-accent">Premielodd · 2026</p>
          <h1 className="font-display mt-5 text-7xl font-black uppercase leading-[0.88] md:text-9xl">
            Løp deg
            <span className="block text-secondary">til start.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-foreground/70">
            Løpeklubber og arrangører donerer startnummer. Hver premie trekkes blant kvalifiserte
            lodd.
          </p>
          <Link
            href="/trekning"
            className="mt-4 inline-block border-b-2 border-foreground pb-0.5 font-bold uppercase tracking-wider hover:border-secondary"
          >
            Slik foregår trekningen
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-[1500px] px-4 py-14 md:px-8 md:py-20">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Premiebordet</p>
            <h2 className="font-display mt-2 text-4xl font-black uppercase md:text-5xl">
              {prizeList.length > 0 ? `${prizeList.length} startnummer` : 'Startnumrene kommer'}
            </h2>
          </div>
          <Gift className="hidden h-12 w-12 md:block" strokeWidth={1.5} />
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {prizeList.map((prize, index) => {
            const draw = activeDraws.find((item) => item.prize_id === prize.id);
            const redraws = (draws || []).filter(
              (item) => item.prize_id === prize.id && item.annulled_at
            ).length;
            const winner = winners?.find((item) => item.id === draw?.participant_id);
            const slug =
              prize.category_slug && isCategorySlug(prize.category_slug)
                ? prize.category_slug
                : categoryForPrize(prize.distance_km);
            return (
              <Card
                key={prize.id}
                className="overflow-hidden border-2 border-foreground shadow-[6px_6px_0_hsl(var(--foreground))]"
              >
                <div
                  className={cn(
                    'flex items-center justify-between border-b-2 border-foreground p-4',
                    CATEGORY_META[slug].solid
                  )}
                >
                  <span className="text-xs font-black uppercase tracking-[0.16em]">
                    {CATEGORY_META[slug].name} · {CATEGORY_META[slug].range}
                  </span>
                  <span className="font-mono text-xs">#{String(index + 1).padStart(2, '0')}</span>
                </div>
                <CardHeader>
                  <CardTitle className="font-display text-3xl font-black uppercase leading-none">
                    {prize.race_name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div className="font-display text-5xl font-black">
                    {prize.distance_km.toLocaleString('nb-NO')}{' '}
                    <span className="text-xl uppercase">km</span>
                  </div>
                  {prize.donor_name && (
                    <div className="flex items-center gap-3 border-l-4 border-secondary pl-3 text-muted-foreground">
                      {DONORS[prize.donor_name] && (
                        <Image
                          src={DONORS[prize.donor_name].logo}
                          alt=""
                          width={48}
                          height={48}
                          className="h-12 w-12 shrink-0 object-contain"
                        />
                      )}
                      <p>
                        Donert av{' '}
                        {DONORS[prize.donor_name] ? (
                          <a
                            href={DONORS[prize.donor_name].url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-bold text-foreground underline decoration-secondary underline-offset-2 hover:text-secondary-ink"
                          >
                            {prize.donor_name}
                          </a>
                        ) : (
                          prize.donor_name
                        )}
                      </p>
                    </div>
                  )}
                  {prize.race_date && (
                    <p className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" /> {formatDate(prize.race_date)}
                    </p>
                  )}
                  {prize.website_url && (
                    <a
                      href={prize.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 border-b-2 border-foreground pb-0.5 font-bold uppercase tracking-wider hover:border-secondary hover:text-secondary-ink"
                    >
                      Les om løpet <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                  {prize.status === 'drawn' && (
                    <div className="border-2 border-foreground bg-accent p-3 text-center font-black uppercase tracking-wide">
                      {winner?.full_name ? `Vinner: ${winner.full_name}` : 'Trukket'}
                      {draw?.candidate_count && (
                        <span className="mt-1 block text-xs font-bold normal-case tracking-normal">
                          Trukket blant {draw.candidate_count.toLocaleString('nb-NO')} lodd
                        </span>
                      )}
                      {redraws > 0 && (
                        <span className="mt-1 block text-xs font-bold normal-case tracking-normal">
                          Trukket på nytt {redraws === 1 ? 'én gang' : `${redraws} ganger`} (vinner
                          takket nei eller feiltrekning)
                        </span>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {prizeList.length === 0 && (
          <div className="border-2 border-dashed border-foreground p-10 text-center md:p-14">
            <Gift className="mx-auto h-10 w-10" strokeWidth={1.5} aria-hidden="true" />
            <p className="font-display mt-4 text-3xl font-black uppercase">
              Premiebordet dekkes nå
            </p>
            <p className="mx-auto mt-2 max-w-md text-muted-foreground">
              Løpeklubber og arrangører melder inn startnummer fortløpende. Meld deg på nå, så er
              loddene dine klare når premiene publiseres.
            </p>
          </div>
        )}

        <div className="mt-14 border-2 border-foreground bg-foreground p-7 text-background md:flex md:items-center md:justify-between md:gap-6">
          <div>
            <p className="font-display text-3xl font-black uppercase">Vil du ha lodd i potten?</p>
            <p className="mt-1 text-sm text-background/65">
              Velg kategorier ved påmelding og registrer novemberturene dine.
            </p>
          </div>
          <Button asChild variant="cta-dark" size="lg" className="mt-5 shrink-0 md:mt-0">
            <Link href="/pamelding">Bli med og samle lodd</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
