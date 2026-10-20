import Link from 'next/link';
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Footprints,
  HeartHandshake,
  Mountain,
  Route,
  TicketCheck,
  Users,
} from 'lucide-react';
import { Barteline } from '@/app/_components/barteline';
import { Button } from '@/app/_shared/components/ui/button';
import { get2026Overview } from '@/app/_shared/lib/queries/event-2026';
import { TerrainLines } from '@/app/_shared/components/terrain-lines';
import { PROJECT_SUT_URL } from '@/app/_shared/lib/constants/config';
import { CATEGORY_META, CATEGORY_ORDER } from '@/app/_shared/types/event-2026';
import { cn } from '@/app/_shared/lib/utils/cn';

export async function Home2026() {
  const { runs, tickets, stats, edition, prizes, isMockData } = await get2026Overview();
  const donationUrl = edition?.donation_url;
  const rate = edition?.donation_rate_nok ?? 5;
  const submissionsOpen = Boolean(edition?.submissions_open);
  const hasRuns = stats.runs > 0;

  const steps = [
    {
      number: '01',
      icon: Route,
      title: 'Finn din tur',
      text: 'Løp der du er. En rolig runde, en klubbøkt eller et organisert løp – du velger.',
    },
    {
      number: '02',
      icon: HeartHandshake,
      title: 'Gi per kilometer',
      text: `Doner minst ${rate} kroner for hver kilometer. En tur på 30 km gir minst ${rate * 30} kroner.`,
    },
    {
      number: '03',
      icon: TicketCheck,
      title: 'Samle lodd',
      text: 'Hver registrerte dagstur gir lodd i premiekategoriene du har valgt og kvalifisert deg til.',
    },
  ];

  const statItems = [
    ['Turer', stats.runs.toLocaleString('nb-NO')],
    ['Løpere', stats.runners.toLocaleString('nb-NO')],
    ['Kilometer', stats.kilometers.toLocaleString('nb-NO', { maximumFractionDigits: 1 })],
    ['Kroner donert', stats.donated.toLocaleString('nb-NO')],
  ];

  return (
    <div className="overflow-hidden">
      <section className="relative isolate overflow-hidden border-b-2 border-foreground bg-foreground text-background">
        <TerrainLines className="text-accent/20" />
        <div
          aria-hidden="true"
          className="absolute -right-24 -top-20 hidden h-56 w-56 rotate-12 border-[24px] border-secondary/90 sm:block md:-right-28 md:-top-24 md:h-[26rem] md:w-[26rem] md:border-[32px]"
        />
        <div aria-hidden="true" className="absolute bottom-0 left-0 h-3 w-full bg-accent" />

        <div className="relative mx-auto flex min-h-[calc(100svh-4.5rem)] max-w-[1500px] flex-col justify-between px-4 pb-12 pt-8 md:px-8 md:pb-20 md:pt-12">
          <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b border-background/25 pb-5">
            <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-accent">
              <CalendarDays className="h-4 w-4" aria-hidden="true" />
              Barteløpet · Hele november 2026
            </span>
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-background/70">
              Løp hvor du vil · {rate} kr / km
            </span>
          </div>

          <div className="grid items-end gap-10 py-12 md:py-16 lg:grid-cols-[minmax(0,1.2fr)_minmax(300px,0.55fr)]">
            <div className="relative z-10 max-w-5xl">
              <h1 className="font-display text-[clamp(4.25rem,12vw,10.5rem)] font-black uppercase leading-[0.8] tracking-[-0.045em]">
                Hver
                <span className="block text-accent">kilometer</span>
                teller.
              </h1>
              <p className="mt-8 max-w-2xl text-xl leading-relaxed text-background/80 md:text-2xl">
                For noen betyr den enda mer. Løp din tur, doner per kilometer og bidra til
                fellesskap, mestring og nye muligheter.
              </p>
            </div>

            <div className="relative z-10 lg:pb-3">
              <div className="border-l-4 border-secondary pl-5">
                <p className="font-display text-3xl font-black uppercase leading-[0.95] md:text-4xl">
                  Sammen opp.
                  <br />
                  Sammen videre.
                </p>
                <p className="mt-4 text-sm leading-relaxed text-background/70">
                  Årets bidrag går til Prosjekt SUT – et lokalt treningsfellesskap som skaper
                  tilhørighet og opplevelser av mestring.
                </p>
              </div>
            </div>
          </div>

          <div className="relative z-10 flex flex-col justify-between gap-6 border-t border-background/25 pt-6 sm:flex-row sm:items-center">
            <div className="flex flex-col gap-4 sm:flex-row">
              <Button asChild variant="cta-dark" size="xl">
                <Link href="/pamelding">
                  Bli med <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild variant="line-dark" size="xl">
                <a href={donationUrl || PROJECT_SUT_URL} target="_blank" rel="noopener noreferrer">
                  {donationUrl ? 'Doner nå' : 'Om Prosjekt SUT'}{' '}
                  <ArrowUpRight className="ml-2 h-5 w-5" />
                </a>
              </Button>
            </div>
            <a
              href="#prosjekt-sut"
              className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-background/70 hover:text-accent"
            >
              Se hvem du løper for <ArrowDown className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>

      <section
        id="prosjekt-sut"
        className="relative scroll-mt-24 border-b-2 border-foreground py-16 md:py-28"
      >
        <div className="mx-auto grid max-w-[1500px] gap-12 px-4 md:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div className="relative order-last min-h-[300px] overflow-hidden border-2 border-foreground bg-accent p-7 shadow-[8px_8px_0_hsl(var(--foreground))] md:min-h-[480px] md:p-12 lg:order-none">
            <TerrainLines className="text-foreground/20" />
            <div className="relative flex h-full min-h-[240px] flex-col justify-between md:min-h-[380px]">
              <div className="flex items-center justify-between">
                <span className="trail-label bg-accent">Lokalt initiativ</span>
                <Mountain className="h-10 w-10 md:h-12 md:w-12" strokeWidth={1.5} />
              </div>
              <div>
                <p className="font-display text-5xl font-black uppercase leading-[0.9] md:text-7xl">
                  Ingen
                  <br />
                  går alene.
                </p>
                <div className="mt-6 h-2 w-28 bg-secondary md:mt-8" />
              </div>
            </div>
          </div>

          <div className="lg:pl-10">
            <p className="trail-label">Årets mottaker</p>
            <h2 className="section-title mt-6">
              Prosjekt
              <span className="block text-secondary">SUT</span>
            </h2>
            <p className="mt-8 max-w-2xl text-xl leading-relaxed md:text-2xl">
              Et treningsfellesskap for mennesker med rus- og psykiske helseutfordringer – og for
              dem som trenger hjelp til å komme i gang igjen.
            </p>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground">
              Gruppen trener sammen, deltar på løp og bygger relasjoner gjennom aktivitet. Målet er
              å vise at bakgrunn og hverdagsutfordringer ikke trenger å stå i veien for mestring og
              glede i fellesskapet.
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <div className="flex items-center gap-3 border-2 border-foreground bg-card p-4">
                <Users className="h-7 w-7 shrink-0 text-secondary" aria-hidden="true" />
                <span className="font-bold">Tilhørighet gjennom trening</span>
              </div>
              <div className="flex items-center gap-3 border-2 border-foreground bg-card p-4">
                <Footprints className="h-7 w-7 shrink-0 text-secondary" aria-hidden="true" />
                <span className="font-bold">Mestring i eget tempo</span>
              </div>
            </div>
            <a
              href={PROJECT_SUT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 inline-flex items-center gap-2 border-b-2 border-foreground pb-1 text-sm font-black uppercase tracking-[0.15em] hover:border-secondary hover:text-secondary-ink"
            >
              Les hele historien <ArrowUpRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>

      <section className="border-b-2 border-foreground bg-muted/60 py-16 md:py-28">
        <div className="mx-auto max-w-[1500px] px-4 md:px-8">
          <div className="mb-10 flex flex-col justify-between gap-5 md:mb-12 md:flex-row md:items-end">
            <div>
              <p className="trail-label">Slik fungerer det</p>
              <h2 className="section-title mt-5">
                Tre steg.
                <br />
                Én forskjell.
              </h2>
            </div>
            <p className="max-w-md text-lg text-muted-foreground">
              Du trenger ikke være ultraløper. Gå, jogg eller løp den distansen som passer deg.
            </p>
          </div>

          <ol className="grid gap-6 md:grid-cols-3">
            {steps.map((step) => {
              const Icon = step.icon;
              return (
                <li key={step.number} className="trail-card p-7 md:p-8">
                  <div className="flex items-start justify-between">
                    <span className="font-display text-6xl font-black leading-none text-secondary">
                      {step.number}
                    </span>
                    <Icon className="h-9 w-9" strokeWidth={1.8} aria-hidden="true" />
                  </div>
                  <h3 className="font-display mt-10 text-3xl font-black uppercase">{step.title}</h3>
                  <p className="mt-3 leading-relaxed text-muted-foreground">{step.text}</p>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      <section
        id="bartelinjen"
        className="scroll-mt-24 border-b-2 border-foreground bg-foreground py-16 text-background md:py-28"
      >
        <div className="mx-auto max-w-[1500px] px-4 md:px-8">
          <div className="mb-10 grid gap-6 md:grid-cols-[1fr_0.7fr] md:items-end">
            <div>
              <p className="inline-flex items-center gap-2 border border-accent bg-accent px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-accent-foreground">
                {!isMockData && hasRuns && (
                  <span className="h-2 w-2 animate-pulse rounded-full bg-secondary" />
                )}
                {isMockData
                  ? 'Forhåndsvisning · demodata'
                  : hasRuns
                    ? 'Live fra feltet'
                    : 'Snart live'}
              </p>
              <h2 className="section-title mt-5">
                Hele feltet.
                <br />
                Én linje.
              </h2>
            </div>
            <p className="max-w-lg text-background/70 md:pb-2">
              Hver prikk er én løpetur, plassert etter distanse. Fargefeltene viser hvilke
              premiekategorier turen åpner for.
            </p>
          </div>

          {hasRuns ? (
            <dl className="mb-8 grid grid-cols-2 border-y border-background/25 md:grid-cols-4">
              {statItems.map(([label, value], index) => (
                <div
                  key={label}
                  className={cn(
                    'py-5 md:px-6',
                    index % 2 === 1 && 'border-l border-background/25 pl-4',
                    index > 0 && 'md:border-l md:border-background/25',
                    index === 0 && 'md:pl-0',
                    index >= 2 && 'border-t border-background/25 md:border-t-0'
                  )}
                >
                  <dt className="text-[11px] font-black uppercase tracking-[0.18em] text-background/70">
                    {label}
                  </dt>
                  <dd className="font-display mt-1 text-4xl font-black tabular-nums text-accent md:text-6xl">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          ) : (
            <div className="mb-8 flex flex-col gap-2 border-y border-background/25 py-5 sm:flex-row sm:items-baseline sm:gap-6">
              <p className="font-display text-4xl font-black uppercase text-accent md:text-6xl">
                {stats.registered.toLocaleString('nb-NO')} påmeldt
              </p>
              <p className="text-sm text-background/70">
                Linjen fylles fra 1. november – første tur får første prikk.
              </p>
            </div>
          )}

          <Barteline runs={runs} />
        </div>
      </section>

      <section className="relative py-16 md:py-28">
        <TerrainLines className="text-foreground/10" />
        <div className="relative mx-auto grid max-w-[1500px] gap-10 px-4 md:px-8 lg:grid-cols-[1fr_0.8fr] lg:items-center">
          <div>
            <p className="trail-label">Premielodd</p>
            <h2 className="section-title mt-5">
              Distansen
              <span className="block pt-[0.1em] text-secondary">åpner døra.</span>
            </h2>
            <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
              Velg løpene du drømmer om. Hver dagstur gir ett lodd i hver valgt kategori du har løpt
              langt nok for.
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Button asChild variant="ink" size="xl">
                <Link href="/premier">
                  {prizes.length > 0 ? `Se ${prizes.length} startnummer` : 'Se premiene'}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="line" size="xl">
                <Link href="/pamelding">Meld deg på</Link>
              </Button>
            </div>
          </div>

          <div className="grid gap-3">
            {CATEGORY_ORDER.map((slug) => {
              const meta = CATEGORY_META[slug];
              return (
                <div
                  key={slug}
                  className={cn(
                    'flex items-center justify-between border-2 border-foreground p-5',
                    meta.solid
                  )}
                >
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.2em]">{meta.name}</p>
                    <p className="font-display text-4xl font-black uppercase">{meta.range}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-5xl font-black tabular-nums">
                      {tickets[slug].toLocaleString('nb-NO')}
                    </p>
                    <p className="text-[11px] font-bold uppercase tracking-[0.16em]">lodd</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-t-2 border-foreground bg-accent">
        <div className="mx-auto flex max-w-[1500px] flex-col items-start justify-between gap-8 px-4 py-14 md:flex-row md:items-center md:px-8">
          <div>
            <p className="font-display text-4xl font-black uppercase leading-[0.95] md:text-5xl">
              Klar for din første kilometer?
            </p>
            <p className="mt-2 text-foreground/75">
              {submissionsOpen
                ? 'Meld deg på og registrer turene dine på Min side.'
                : 'Meld deg på nå. Turene registrerer du når november starter.'}
            </p>
          </div>
          <Button asChild variant="ink" size="xl" className="shrink-0">
            <Link href="/pamelding">
              Bli med <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
