import Link from 'next/link';
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Footprints,
  Gift,
  HeartHandshake,
  Mountain,
  Route,
  TicketCheck,
  Users,
} from 'lucide-react';
import { Barteline } from '@/app/_components/barteline';
import { Button } from '@/app/_shared/components/ui/button';
import { Card, CardContent } from '@/app/_shared/components/ui/card';
import { get2026Overview } from '@/app/_shared/lib/queries/event-2026';
import { TerrainLines } from '@/app/_shared/components/terrain-lines';
import { PROJECT_SUT_URL } from '@/app/_shared/lib/constants/config';

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
    text: 'Doner minst 5 kroner for hver kilometer. En tur på 30 km gir minst 150 kroner.',
  },
  {
    number: '03',
    icon: TicketCheck,
    title: 'Samle lodd',
    text: 'Hver registrerte dagstur gir lodd i premiekategoriene du har valgt og kvalifisert deg til.',
  },
];

export async function Home2026() {
  const { runs, tickets, stats, edition, prizes } = await get2026Overview();
  const donationUrl = edition?.donation_url;

  return (
    <div className="min-h-screen overflow-hidden">
      <section className="relative isolate min-h-[calc(100svh-4.5rem)] overflow-hidden border-b-2 border-foreground bg-foreground text-background">
        <TerrainLines className="text-accent/20" />
        <div className="absolute -right-24 top-20 h-72 w-72 rotate-12 border-[32px] border-secondary/90 md:h-[30rem] md:w-[30rem]" />
        <div className="absolute bottom-0 left-0 h-3 w-full bg-accent" />

        <div className="relative mx-auto flex min-h-[calc(100svh-4.5rem)] max-w-[1500px] flex-col justify-between px-4 pb-12 pt-8 md:px-8 md:pb-20 md:pt-12">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-background/25 pb-5">
            <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-accent">
              <CalendarDays className="h-4 w-4" />
              Hele november 2026
            </span>
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-background/65">
              Løp hvor du vil · 5 kr / km
            </span>
          </div>

          <div className="grid items-end gap-10 py-14 lg:grid-cols-[minmax(0,1.2fr)_minmax(300px,0.55fr)]">
            <div className="relative z-10 max-w-5xl">
              <p className="mb-5 inline-flex border border-accent bg-accent px-3 py-1 text-xs font-black uppercase tracking-[0.2em] text-accent-foreground">
                Barteløpet 2026 · For Prosjekt SUT
              </p>
              <h1 className="font-display text-[clamp(4.7rem,12vw,10.5rem)] font-black uppercase leading-[0.76] tracking-[-0.045em]">
                Hver
                <span className="block text-accent">kilometer</span>
                teller.
              </h1>
              <p className="mt-8 max-w-2xl text-xl leading-relaxed text-background/75 md:text-2xl">
                For noen betyr den enda mer. Løp din tur, doner per kilometer og bidra til
                fellesskap, mestring og nye muligheter.
              </p>
            </div>

            <div className="relative z-10 lg:pb-3">
              <div className="border-l-4 border-secondary pl-5">
                <p className="font-display text-4xl font-black uppercase leading-none text-background md:text-5xl">
                  Sammen opp.
                  <br />
                  Sammen videre.
                </p>
                <p className="mt-4 text-sm leading-relaxed text-background/65">
                  Årets bidrag går til Prosjekt SUT – et lokalt treningsfellesskap som skaper
                  tilhørighet og opplevelser av mestring.
                </p>
              </div>
            </div>
          </div>

          <div className="relative z-10 flex flex-col justify-between gap-6 border-t border-background/25 pt-6 sm:flex-row sm:items-center">
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="h-14 border-2 border-accent bg-accent px-7 text-base font-black uppercase tracking-wide text-accent-foreground hover:bg-background"
              >
                <Link href="/pamelding">
                  Bli med <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              {donationUrl ? (
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="h-14 border-2 border-background bg-transparent px-7 text-base font-black uppercase tracking-wide text-background hover:bg-background hover:text-foreground"
                >
                  <a href={donationUrl} target="_blank" rel="noopener noreferrer">
                    Doner nå <ArrowUpRight className="ml-2 h-5 w-5" />
                  </a>
                </Button>
              ) : (
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="h-14 border-2 border-background bg-transparent px-7 text-base font-black uppercase tracking-wide text-background hover:bg-background hover:text-foreground"
                >
                  <a href={PROJECT_SUT_URL} target="_blank" rel="noopener noreferrer">
                    Om Prosjekt SUT <ArrowUpRight className="ml-2 h-5 w-5" />
                  </a>
                </Button>
              )}
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
        className="relative scroll-mt-24 border-b-2 border-foreground py-20 md:py-28"
      >
        <div className="mx-auto grid max-w-[1500px] gap-12 px-4 md:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div className="relative min-h-[430px] overflow-hidden border-2 border-foreground bg-accent p-8 shadow-[10px_10px_0_hsl(var(--foreground))] md:min-h-[560px] md:p-12">
            <TerrainLines className="text-foreground/20" />
            <div className="relative flex h-full min-h-[360px] flex-col justify-between md:min-h-[460px]">
              <div className="flex items-center justify-between">
                <span className="trail-label bg-accent">Lokalt initiativ</span>
                <Mountain className="h-12 w-12" strokeWidth={1.5} />
              </div>
              <div>
                <p className="font-display text-6xl font-black uppercase leading-[0.82] md:text-8xl">
                  Ingen
                  <br />
                  går alene.
                </p>
                <div className="mt-8 h-2 w-28 bg-secondary" />
              </div>
            </div>
          </div>

          <div className="lg:pl-10">
            <p className="trail-label">Årets mottaker</p>
            <h2 className="font-display mt-6 text-6xl font-black uppercase leading-[0.88] tracking-tight md:text-8xl">
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
              <div className="flex items-center gap-3 border-2 border-foreground p-4">
                <Users className="h-7 w-7 text-secondary" />
                <span className="font-bold">Tilhørighet gjennom trening</span>
              </div>
              <div className="flex items-center gap-3 border-2 border-foreground p-4">
                <Footprints className="h-7 w-7 text-secondary" />
                <span className="font-bold">Mestring i eget tempo</span>
              </div>
            </div>
            <a
              href={PROJECT_SUT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 inline-flex items-center gap-2 border-b-2 border-foreground pb-1 text-sm font-black uppercase tracking-[0.15em] hover:border-secondary hover:text-secondary"
            >
              Les hele historien <ArrowUpRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>

      <section className="border-b-2 border-foreground bg-secondary py-8">
        <div className="mx-auto grid max-w-[1500px] grid-cols-2 gap-px px-4 md:grid-cols-4 md:px-8">
          {[
            ['Turer', stats.runs.toLocaleString('nb-NO')],
            ['Løpere', stats.runners.toLocaleString('nb-NO')],
            ['Kilometer', stats.kilometers.toLocaleString('nb-NO', { maximumFractionDigits: 1 })],
            ['Bekreftet donert', `${stats.donated.toLocaleString('nb-NO')} kr`],
          ].map(([label, value]) => (
            <div key={label} className="border-foreground/35 p-4 text-center md:border-l md:p-6">
              <div className="font-display text-4xl font-black uppercase md:text-6xl">{value}</div>
              <div className="mt-1 text-[10px] font-black uppercase tracking-[0.18em]">{label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="border-b-2 border-foreground py-20 md:py-28">
        <div className="mx-auto max-w-[1500px] px-4 md:px-8">
          <div className="mb-12 flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <p className="trail-label">Slik fungerer det</p>
              <h2 className="font-display mt-5 text-6xl font-black uppercase leading-[0.85] md:text-8xl">
                Tre steg.
                <br />
                Én forskjell.
              </h2>
            </div>
            <p className="max-w-md text-lg text-muted-foreground">
              Du trenger ikke være ultraløper. Gå, jogg eller løp den distansen som passer deg.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {steps.map((step) => {
              const Icon = step.icon;
              return (
                <article key={step.number} className="trail-card relative min-h-80 p-7 md:p-8">
                  <div className="flex items-start justify-between">
                    <span className="font-display text-6xl font-black text-secondary">
                      {step.number}
                    </span>
                    <Icon className="h-9 w-9" strokeWidth={1.8} />
                  </div>
                  <div className="mt-16">
                    <h3 className="font-display text-3xl font-black uppercase">{step.title}</h3>
                    <p className="mt-3 leading-relaxed text-muted-foreground">{step.text}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section
        id="bartelinjen"
        className="scroll-mt-24 border-b-2 border-foreground bg-foreground py-20 text-background md:py-28"
      >
        <div className="mx-auto max-w-[1500px] px-4 md:px-8">
          <div className="mb-12 grid gap-6 md:grid-cols-[1fr_0.7fr] md:items-end">
            <div>
              <p className="inline-flex border border-accent bg-accent px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-accent-foreground">
                Live fra feltet
              </p>
              <h2 className="font-display mt-5 text-6xl font-black uppercase leading-[0.85] md:text-8xl">
                Hele feltet.
                <br />
                Én linje.
              </h2>
            </div>
            <p className="max-w-lg text-background/65 md:pb-2">
              Hver prikk er én løpetur. Fargefeltene viser hvilke premiekategorier distansen åpner
              for.
            </p>
          </div>
          <div className="border-2 border-background/40 bg-background p-4 text-foreground md:p-8">
            <Barteline runs={runs} tickets={tickets} />
          </div>
        </div>
      </section>

      <section className="relative py-20 md:py-28">
        <TerrainLines className="text-foreground/10" />
        <div className="relative mx-auto grid max-w-[1500px] gap-10 px-4 md:px-8 lg:grid-cols-[1fr_0.8fr] lg:items-center">
          <div>
            <p className="trail-label">Premielodd</p>
            <h2 className="font-display mt-5 text-6xl font-black uppercase leading-[0.86] md:text-8xl">
              Distansen
              <span className="block text-secondary">åpner døra.</span>
            </h2>
            <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
              Velg løpene du drømmer om. Hver dagstur gir ett lodd i hver valgt kategori du har løpt
              langt nok for.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="h-14 border-2 border-foreground bg-foreground font-black uppercase tracking-wide text-background shadow-[4px_4px_0_hsl(var(--secondary))]"
              >
                <Link href="/premier">
                  Se {prizes.length} startnummer <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-14 border-2 border-foreground bg-background font-black uppercase tracking-wide"
              >
                <Link href="/pamelding">Meld deg på</Link>
              </Button>
            </div>
          </div>

          <div className="grid gap-3">
            {[
              ['Kort', '0–10 km', tickets.short, 'bg-accent'],
              ['Mellom', '10–30 km', tickets.medium, 'bg-secondary'],
              ['Lang', '30+ km', tickets.long, 'bg-foreground text-background'],
            ].map(([name, distance, count, color]) => (
              <Card
                key={String(name)}
                className={`overflow-hidden border-2 border-foreground shadow-none ${color}`}
              >
                <CardContent className="flex items-center justify-between p-5">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em]">{name}</p>
                    <p className="font-display text-4xl font-black uppercase">{distance}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-5xl font-black">{count}</p>
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em]">lodd</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y-2 border-foreground bg-accent">
        <div className="mx-auto flex max-w-[1500px] flex-col items-start justify-between gap-8 px-4 py-14 md:flex-row md:items-center md:px-8">
          <div className="flex items-start gap-4">
            <Gift className="mt-1 h-10 w-10" />
            <div>
              <p className="font-display text-4xl font-black uppercase md:text-5xl">
                Klar for din første kilometer?
              </p>
              <p className="mt-2 text-foreground/70">
                Meld deg på nå. Turene registrerer du når november starter.
              </p>
            </div>
          </div>
          <Button
            asChild
            size="lg"
            className="h-14 shrink-0 border-2 border-foreground bg-foreground px-8 font-black uppercase tracking-wide text-background shadow-[5px_5px_0_hsl(var(--secondary))]"
          >
            <Link href="/pamelding">
              Bli med <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
