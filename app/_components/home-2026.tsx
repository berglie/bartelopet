import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  DoorOpen,
  Download,
  Footprints,
  GraduationCap,
  HeartHandshake,
  Mountain,
  Route,
  Sprout,
  TicketCheck,
  Users,
} from 'lucide-react';
import { Barteline } from '@/app/_components/barteline';
import { CommunityGoal } from '@/app/_components/community-goal';
import { CountUp, Countdown, Reveal } from '@/app/_components/motion';
import { Button } from '@/app/_shared/components/ui/button';
import { get2026Overview } from '@/app/_shared/lib/queries/event-2026';
import { RouteMap } from '@/app/_shared/components/route-map';
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
      title: 'Hver tur teller',
      text: 'Løp eller gå der du er, når det passer deg i november. En rolig runde, en klubbøkt eller et organisert løp – all bevegelse fra 1 km teller.',
    },
    {
      number: '02',
      icon: TicketCheck,
      title: 'Samle lodd',
      text: 'Registrer turene dine på Min side, én per dag, samme dag eller dagen etter. Hver kilometer gir ett lodd i premiekategoriene du har valgt, og alle turene dine i november teller.',
    },
    {
      number: '03',
      icon: HeartHandshake,
      title: 'Gi om du kan',
      text: `Vi oppfordrer til ${rate} kroner per kilometer til Prosjekt SUT. Helt frivillig, og det påvirker ikke trekningen.`,
    },
  ];

  const statItems = [
    { label: 'Turer', value: stats.runs },
    { label: 'Løpere', value: stats.runners },
    { label: 'Kilometer', value: stats.kilometers, decimals: 1 },
    { label: 'Påmeldte', value: stats.registered },
  ];

  const tickerItems = [
    'Hele november',
    'Fra 1 km',
    'Løp hvor du vil',
    `Gi gjerne ${rate} kr per km`,
  ];

  const sutFeatures = [
    { icon: Users, label: 'Rusfritt miljø med plass til alle' },
    { icon: Footprints, label: 'Treningsglede i naturen' },
    { icon: Sprout, label: 'Du deler bare det du selv vil' },
    { icon: DoorOpen, label: 'Gratis og ingen bindingstid' },
  ];

  const heroLines = [
    { text: 'Hver', className: '' },
    { text: 'kilometer', className: 'text-accent' },
    { text: 'teller.', className: '' },
  ];

  return (
    <div className="overflow-hidden">
      <section className="relative isolate overflow-hidden border-b-2 border-foreground bg-foreground text-background">
        <TerrainLines animated className="text-accent/20" />
        <div
          aria-hidden="true"
          className="absolute -right-24 -top-20 hidden h-56 w-56 animate-fade-up sm:block md:-right-28 md:-top-24 md:h-[26rem] md:w-[26rem]"
          style={{ animationDelay: '600ms' }}
        >
          <div className="h-full w-full rotate-12">
            <div className="h-full w-full animate-spin-slow border-[24px] border-secondary/90 md:border-[32px]" />
          </div>
        </div>
        <div
          aria-hidden="true"
          className="absolute bottom-0 left-0 h-3 w-full origin-left animate-grow-x bg-accent"
          style={{ animationDelay: '900ms' }}
        />

        <div className="relative mx-auto flex min-h-[calc(100svh-4.5rem)] max-w-[1500px] flex-col justify-between px-4 pb-12 pt-8 md:px-8 md:pb-20 md:pt-12">
          <div className="flex animate-fade-up flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b border-background/25 pb-5">
            <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-accent">
              <CalendarDays className="h-4 w-4" aria-hidden="true" />
              Barteløpet · Hele november 2026
            </span>
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-background/70">
              Løp hvor du vil · Doner om du kan
            </span>
          </div>

          <div className="grid items-end gap-10 py-12 md:py-16 lg:grid-cols-[minmax(0,1.2fr)_minmax(300px,0.55fr)]">
            <div className="relative z-10 max-w-5xl">
              <h1 className="font-display text-[clamp(4.25rem,12vw,10.5rem)] font-black uppercase leading-[0.8] tracking-[-0.02em]">
                {heroLines.map((line, index) => (
                  <span
                    key={line.text}
                    className={cn('block animate-rise', line.className)}
                    style={{ animationDelay: `${150 + index * 130}ms` }}
                  >
                    {index === 1 ? (
                      <span className="relative inline-block">
                        {line.text}
                        <TrailMark />
                      </span>
                    ) : (
                      line.text
                    )}
                  </span>
                ))}
              </h1>
              <p
                className="mt-8 max-w-2xl animate-fade-up text-xl leading-relaxed text-background/80 md:text-2xl"
                style={{ animationDelay: '650ms' }}
              >
                For noen betyr den enda mer. Hver tur du registrerer i november gir nye lodd. Løp
                når det passer deg, gi det du kan og bidra til fellesskap, mestring og nye
                muligheter.
              </p>
            </div>

            <div
              className="relative z-10 animate-fade-up space-y-8 lg:pb-3"
              style={{ animationDelay: '800ms' }}
            >
              <Countdown className="max-w-sm" />
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

          <div
            className="relative z-10 flex animate-fade-up flex-col justify-between gap-6 border-t border-background/25 pt-6 sm:flex-row sm:items-center"
            style={{ animationDelay: '950ms' }}
          >
            <div className="flex flex-col gap-4 sm:flex-row">
              <Button asChild variant="cta-dark" size="xl" className="group">
                <Link href="/pamelding">
                  Bli med <ArrowRight className={cn('ml-2 h-5 w-5', nudgeRight)} />
                </Link>
              </Button>
              <Button asChild variant="line-dark" size="xl" className="group">
                <a href={donationUrl || PROJECT_SUT_URL} target="_blank" rel="noopener noreferrer">
                  {donationUrl ? 'Doner nå' : 'Om Prosjekt SUT'}{' '}
                  <ArrowUpRight className={cn('ml-2 h-5 w-5', nudgeUpRight)} />
                </a>
              </Button>
            </div>
            <a
              href="#prosjekt-sut"
              className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-background/70 transition-colors hover:text-accent"
            >
              Se hvem du løper for <ArrowDown className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>

      <Ticker items={tickerItems} />

      <section
        id="prosjekt-sut"
        className="relative scroll-mt-24 border-b-2 border-foreground py-16 md:py-28"
      >
        <div className="mx-auto grid max-w-[1500px] gap-12 px-4 md:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <Reveal from="left" className="order-last lg:order-none">
            <div className="group relative min-h-[360px] overflow-hidden border-2 border-foreground bg-foreground text-background shadow-[8px_8px_0_hsl(var(--foreground))] transition-shadow duration-300 hover:shadow-[14px_14px_0_hsl(var(--secondary))] md:min-h-[560px] lg:h-[min(calc(100svh-10rem),780px)]">
              <Image
                src="/images/prosjekt-sut/sut-hodelykter.jpg"
                alt="Løpere fra Prosjekt SUT med hodelykter på vei ned et berg i mørket"
                fill
                sizes="(max-width: 1024px) 100vw, 45vw"
                className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
              />
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent"
              />
              <div className="relative flex h-full min-h-[360px] flex-col justify-between p-7 md:min-h-[560px] md:p-12">
                <div className="flex items-center justify-between">
                  <span className="trail-label bg-accent text-foreground">Lokalt initiativ</span>
                  <Mountain
                    className="h-10 w-10 animate-float text-accent md:h-12 md:w-12"
                    strokeWidth={1.5}
                  />
                </div>
                <div>
                  <p className="font-display text-5xl font-black uppercase leading-[0.9] text-white md:text-7xl">
                    Ingen
                    <br />
                    går alene.
                  </p>
                  <div className="mt-6 h-2 w-28 origin-left bg-secondary transition-transform duration-500 group-hover:scale-x-[2.2] md:mt-8" />
                </div>
              </div>
            </div>
            <div className="mt-10 max-w-2xl border-l-4 border-secondary pl-5">
              <p className="text-xs font-black uppercase tracking-[0.18em]">Hvor går pengene?</p>
              <p className="mt-2 leading-relaxed text-muted-foreground">
                Alle donasjoner samles inn på Spleis og går uavkortet til Prosjekt SUT. Pengene
                brukes blant annet til:
              </p>
              <ul className="mt-3 space-y-1 font-bold">
                <li>Utstyr som løpesko, hodelykter og klær</li>
                <li>Sosiale samlinger for gruppen</li>
                <li>Deltakelse på løp</li>
              </ul>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Barteløpet er et frivillig initiativ i november og er ikke tilknyttet Movember
                Foundation – men vi lar gjerne barten gro for en god sak.
              </p>
              {donationUrl && (
                <a
                  href={donationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group mt-3 inline-flex items-center gap-2 text-sm font-bold underline decoration-secondary decoration-2 underline-offset-4 hover:decoration-foreground"
                >
                  Kan du ikke løpe? Støtt innsamlingen direkte{' '}
                  <ArrowUpRight className={cn('h-4 w-4', nudgeUpRight)} />
                </a>
              )}
            </div>
          </Reveal>

          <Reveal className="lg:pl-10" delay={120}>
            <p className="trail-label">Årets mottaker</p>
            <h2 className="section-title mt-6">
              Prosjekt
              <span className="block text-secondary">SUT</span>
            </h2>
            <p className="mt-8 max-w-2xl text-xl leading-relaxed md:text-2xl">
              Et trygt treningsfellesskap for deg som trenger litt ekstra samhold – enten
              utfordringene handler om psykisk helse, rus eller andre sosiale og helsemessige
              vansker. Et rusfritt miljø som jobber for inkludering og mot utenforskap.
            </p>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground">
              Kjenner du på ensomhet i hverdagen, eller synes du sosiale sammenkomster og vanlige
              gruppetreninger er vanskelige? Hos SUT møter du andre i lignende situasjoner. Det er
              høyt under taket, og ingen forventer at du deler noe om din egen historie.
            </p>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground">
              For noen er gruppen forebyggende, for andre et steg på veien ut av sykemelding og
              utenforskap og tilbake i arbeid. Noen blir med lenge, andre i kortere perioder – det
              er opp til deg. Takket være gode samarbeidspartnere kan gruppen hjelpe med hodelykter,
              løpesko og litt klær, og treningene avsluttes for de som vil med en prat, en boks brus
              og noe å bite i. Prosjektet drives i samarbeid med A-larm Rogaland, Dale fjelløpere og
              Sandnes Ultratrail.
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {sutFeatures.map(({ icon: Icon, label }) => (
                <div key={label} className={featureTile}>
                  <Icon
                    className="h-7 w-7 shrink-0 text-secondary transition-transform duration-300 group-hover:-rotate-12 group-hover:scale-110"
                    aria-hidden="true"
                  />
                  <span className="font-bold">{label}</span>
                </div>
              ))}
            </div>
            <div className="mt-8 flex max-w-2xl gap-4 border-2 border-foreground bg-card p-5">
              <GraduationCap className="h-7 w-7 shrink-0 text-secondary" aria-hidden="true" />
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em]">
                  Prøveprosjekt med videregående
                </p>
                <p className="mt-2 leading-relaxed text-muted-foreground">
                  Våren 2026 trente noen elever fra videregående skole sammen med gruppen.
                  Prosjektet fikk veldig positive tilbakemeldinger, og SUT håper å kunne fortsette
                  med det.
                </p>
              </div>
            </div>
            <a
              href={PROJECT_SUT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="group mt-8 inline-flex items-center gap-2 border-b-2 border-foreground pb-1 text-sm font-black uppercase tracking-[0.15em] transition-colors hover:border-secondary hover:text-secondary-ink"
            >
              Mer om Prosjekt SUT <ArrowUpRight className={cn('h-4 w-4', nudgeUpRight)} />
            </a>
          </Reveal>
        </div>
        <Reveal className="mx-auto mt-12 max-w-[1500px] px-4 md:mt-16 md:px-8">
          <figure>
            <div className="relative aspect-[2000/924] overflow-hidden border-2 border-foreground shadow-[8px_8px_0_hsl(var(--foreground))]">
              <Image
                src="/images/prosjekt-sut/sut-gruppe.jpg"
                alt="Deltakere i Prosjekt SUT med startnummer sitter sammen på en stein i sola"
                fill
                sizes="(max-width: 1500px) 100vw, 1500px"
                className="object-cover"
              />
            </div>
            <figcaption className="mt-3 text-xs text-muted-foreground">
              Gjengen fra Prosjekt SUT på løp. Foto: Jim W. Amdal
            </figcaption>
          </figure>
        </Reveal>
      </section>

      <section className="border-b-2 border-foreground bg-muted/60 py-16 md:py-28">
        <div className="mx-auto max-w-[1500px] px-4 md:px-8">
          <Reveal className="mb-10 flex flex-col justify-between gap-5 md:mb-12 md:flex-row md:items-end">
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
          </Reveal>

          <ol className="grid gap-6 md:grid-cols-3">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <Reveal as="li" key={step.number} delay={index * 140}>
                  <div className={cn('trail-card group h-full p-7 md:p-8', liftCard)}>
                    <div className="flex items-start justify-between">
                      <span className="font-display text-6xl font-black leading-none text-secondary transition-transform duration-300 group-hover:-translate-y-1 group-hover:scale-110">
                        {step.number}
                      </span>
                      <Icon
                        className="h-9 w-9 transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110"
                        strokeWidth={1.8}
                        aria-hidden="true"
                      />
                    </div>
                    <h3 className="font-display mt-10 text-3xl font-black uppercase">
                      {step.title}
                    </h3>
                    <p className="mt-3 leading-relaxed text-muted-foreground">{step.text}</p>
                    <div className="mt-6 h-1 w-10 origin-left bg-foreground transition-transform duration-500 group-hover:scale-x-[4]" />
                  </div>
                </Reveal>
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
          <Reveal className="mb-10 grid gap-6 md:grid-cols-[1fr_0.7fr] md:items-end">
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
          </Reveal>

          {hasRuns ? (
            <dl className="mb-8 grid grid-cols-2 border-y border-background/25 md:grid-cols-4">
              {statItems.map(({ label, value, decimals }, index) => (
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
                    <CountUp value={value} decimals={decimals} duration={1400 + index * 200} />
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

          {hasRuns && (
            <CommunityGoal kilometers={stats.kilometers} showTotal={false} className="mb-8" />
          )}

          <Reveal delay={150}>
            <Barteline runs={runs} />
          </Reveal>
        </div>
      </section>

      <section className="relative py-16 md:py-28">
        <TerrainLines className="text-foreground/10" />
        <div className="relative mx-auto grid max-w-[1500px] gap-10 px-4 md:px-8 lg:grid-cols-[1fr_0.8fr] lg:items-center">
          <Reveal>
            <p className="trail-label">Premielodd</p>
            <h2 className="section-title mt-5">
              Distansen
              <span className="block pt-[0.1em] text-secondary">åpner døra.</span>
            </h2>
            <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
              Velg løpene du drømmer om. Hver kilometer gir ett lodd i hver valgt kategori turen er
              lang nok til.
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Button asChild variant="ink" size="xl" className="group">
                <Link href="/premier">
                  {prizes.length > 0 ? `Se ${prizes.length} startnummer` : 'Se premiene'}
                  <ArrowRight className={cn('ml-2 h-4 w-4', nudgeRight)} />
                </Link>
              </Button>
              <Button asChild variant="line" size="xl">
                <Link href="/pamelding">Meld deg på</Link>
              </Button>
            </div>
          </Reveal>

          <div className="grid gap-3">
            {CATEGORY_ORDER.map((slug, index) => {
              const meta = CATEGORY_META[slug];
              return (
                <Reveal key={slug} from="right" delay={index * 120}>
                  <div
                    className={cn(
                      'flex items-center justify-between border-2 border-foreground p-5 transition-[transform,box-shadow] duration-300 hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[6px_6px_0_hsl(var(--secondary))]',
                      slug === 'medium' && 'hover:shadow-[6px_6px_0_hsl(var(--foreground))]',
                      meta.solid
                    )}
                  >
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-[0.2em]">
                        {meta.name}
                      </p>
                      <p className="font-display text-4xl font-black uppercase">{meta.range}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-display text-5xl font-black">
                        <CountUp value={tickets[slug]} />
                      </p>
                      <p className="text-[11px] font-bold uppercase tracking-[0.16em]">lodd</p>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      <section id="loypa" className="scroll-mt-24 border-t-2 border-foreground py-16 md:py-28">
        <div className="mx-auto grid max-w-[1500px] gap-10 px-4 md:px-8 lg:grid-cols-[0.75fr_1.25fr] lg:items-center">
          <Reveal>
            <p className="trail-label">Fjorårets løype</p>
            <h2 className="section-title mt-5">
              11 km.
              <span className="block pt-[0.1em] text-secondary">Stavanger sentrum.</span>
            </h2>
            <p className="mt-6 max-w-xl text-lg text-muted-foreground">
              Vet du ikke hvor du skal løpe? Bryn deg på 2025-løypa gjennom Fargegaten, Gamle
              Stavanger, Stavanger Øst og Eiganes. Den teller like mye som alle andre turer.
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:flex-wrap">
              <Button asChild variant="ink" size="xl" className="group">
                <a
                  href="https://www.strava.com/routes/3419817784051532462"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Strava-rute
                  <ArrowUpRight className={cn('ml-2 h-4 w-4', nudgeUpRight)} />
                </a>
              </Button>
              <Button asChild variant="line" size="xl">
                <a href="/bartelopet-2025.gpx" download>
                  <Download className="mr-2 h-4 w-4" />
                  Last ned GPX
                </a>
              </Button>
            </div>
          </Reveal>

          <Reveal from="right" delay={150}>
            <RouteMap year={2025} variant="trail" lazy />
          </Reveal>
        </div>
      </section>

      <section className="relative overflow-hidden border-t-2 border-foreground bg-accent">
        <TerrainLines className="text-foreground/10" />
        <div className="relative mx-auto flex max-w-[1500px] flex-col items-start justify-between gap-8 px-4 py-14 md:flex-row md:items-center md:px-8">
          <Reveal>
            <p className="font-display text-4xl font-black uppercase leading-[0.95] md:text-5xl">
              Klar for din første kilometer?
            </p>
            <p className="mt-2 text-foreground/75">
              {submissionsOpen
                ? 'Meld deg på og registrer turene dine på Min side.'
                : 'Meld deg på nå. Turene registrerer du når november starter.'}
            </p>
            {donationUrl && (
              <p className="mt-4 max-w-xl text-foreground/75">
                Vil eller kan du ikke løpe? Det er like kjekt om du støtter Prosjekt SUT med en
                donasjon.{' '}
                <a
                  href={donationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-1 font-bold text-foreground underline decoration-2 underline-offset-4 hover:decoration-secondary"
                >
                  Doner på Spleis <ArrowUpRight className={cn('h-4 w-4', nudgeUpRight)} />
                </a>
              </p>
            )}
          </Reveal>
          <Reveal delay={150} className="shrink-0">
            <Button asChild variant="ink" size="xl" className="group">
              <Link href="/pamelding">
                Bli med <ArrowRight className={cn('ml-2 h-5 w-5', nudgeRight)} />
              </Link>
            </Button>
          </Reveal>
        </div>
      </section>
    </div>
  );
}

const liftCard =
  'transition-[transform,box-shadow] duration-300 hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[10px_10px_0_hsl(var(--secondary))]';
const nudgeRight = 'transition-transform duration-300 group-hover:translate-x-1.5';
const nudgeUpRight =
  'transition-transform duration-300 group-hover:-translate-y-1 group-hover:translate-x-1';
const featureTile =
  'group flex items-center gap-3 border-2 border-foreground bg-card p-4 transition-[transform,box-shadow] duration-300 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[4px_4px_0_hsl(var(--foreground))]';

/** Trail under "kilometer" that draws itself, with a runner dot travelling along it. */
function TrailMark() {
  // The viewBox roughly matches the rendered aspect ratio, so the dot stays round.
  const path = 'M3 9 C 110 2, 220 15, 340 8 S 560 3, 700 9';
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 704 16"
      preserveAspectRatio="none"
      className="absolute -bottom-[0.1em] left-0 h-[0.13em] w-full overflow-visible text-secondary"
      fill="none"
    >
      <path
        d={path}
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
        pathLength={1}
        strokeDasharray={1}
        className="animate-draw"
        style={{ animationDelay: '700ms', animationDuration: '1.4s' }}
      />
      <circle r="5.5" opacity="0" className="fill-background motion-reduce:hidden">
        <animate attributeName="opacity" to="1" begin="2.1s" dur="0.3s" fill="freeze" />
        <animateMotion dur="3.4s" begin="2.1s" repeatCount="indefinite" path={path} />
      </circle>
    </svg>
  );
}

/** Scrolling ticker band between sections. */
function Ticker({ items }: { items: string[] }) {
  return (
    <div
      aria-hidden="true"
      className="border-b-2 border-foreground bg-secondary px-4 py-4 text-secondary-foreground"
    >
      <ul className="mx-auto flex max-w-[1500px] flex-wrap items-center justify-center gap-x-6 gap-y-1 md:gap-x-8">
        {items.map((item, index) => (
          <li
            key={item}
            className="font-display flex items-center gap-5 whitespace-nowrap text-xl font-black uppercase tracking-tight md:gap-8 md:text-4xl"
          >
            {item}
            {index < items.length - 1 && (
              <span className="hidden h-4 w-4 rotate-45 bg-foreground md:inline-block" />
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
