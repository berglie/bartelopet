import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { Dices, Lock, ListOrdered, ScrollText, Ticket, UserCheck } from 'lucide-react';
import { Button } from '@/app/_shared/components/ui/button';
import { TerrainLines } from '@/app/_shared/components/terrain-lines';
import { cn } from '@/app/_shared/lib/utils/cn';
import { CATEGORY_META, CATEGORY_ORDER, MIN_RUN_KM } from '@/app/_shared/types/event-2026';

export const metadata: Metadata = {
  title: 'Slik trekkes premiene',
  description:
    'Hvordan lodd samles og startnummer trekkes i Barteløpet 2026. Helt tilfeldig, ett startnummer per deltaker.',
  openGraph: {
    title: 'Slik trekkes premiene – Barteløpet',
    url: 'https://barteløpet.no/trekning',
  },
};

const qualifies: Record<keyof typeof CATEGORY_META, string> = {
  short: `Alle turer på minst ${MIN_RUN_KM} km`,
  medium: 'Turer over 10 km',
  long: 'Turer på 30 km eller mer',
};

const steps = [
  {
    icon: Lock,
    title: 'Potten låses',
    text: 'Trekningen starter etter at november er over og både påmelding og turregistrering er stengt. Systemet nekter å trekke før det, så ingen lodd kan legges til eller endres underveis.',
  },
  {
    icon: ListOrdered,
    title: 'Lengste løp først',
    text: 'Premiene trekkes fra lengst til kortest distanse. Siden du bare kan vinne ett startnummer, får de som har løpt langt sjansen på maraton og ultra før de eventuelt trekkes ut på et kortere løp.',
  },
  {
    icon: Dices,
    title: 'Tilfeldig lodd',
    text: 'For hver premie samles alle lodd i premiens kategori. Databasen velger ett lodd helt tilfeldig med en kryptografisk sikker tilfeldighetsgenerator. Arrangøren trykker på knappen, men kan ikke velge eller påvirke hvem som vinner.',
  },
  {
    icon: UserCheck,
    title: 'Én premie per deltaker',
    text: 'Har du vunnet, fjernes alle loddene dine fra de neste trekningene. Slik blir startnumrene fordelt på flest mulig. Unntaket er hvis alle som er igjen i potten allerede har vunnet. Da går premien til en av dem i stedet for å bli liggende.',
  },
  {
    icon: ScrollText,
    title: 'Alt logges',
    text: 'Hver trekning lagres med tidspunkt, hvor mange lodd som var i potten og hvilken tur som vant. Trekninger kan verken endres eller slettes. Må en premie trekkes på nytt, for eksempel fordi vinneren takker nei, vises det på premiesiden at den er trukket på nytt.',
  },
];

const faq: { question: string; answer: ReactNode }[] = [
  {
    question: 'Blir loddene mine delt hvis jeg velger alle kategoriene?',
    answer: (
      <>
        <p>
          Nei. Loddene gjelder fullt ut i hver kategori du har valgt og turen er lang nok til. En
          tur på 35 km gir 35 lodd i Kort, 35 i Mellom og 35 i Lang. Hver trekning er like
          tilfeldig, og å velge flere kategorier svekker ikke sjansen din i noen av dem.
        </p>
      </>
    ),
  },
  {
    question: 'Bør jeg velge alle kategoriene?',
    answer: (
      <>
        <p>
          Bare hvis du vil ha alle typene startnummer. Du kan vinne maks én premie, og de lengste
          løpene trekkes først. Vinner du et ultraløp, er du ute av trekningen av 10 km-løpene.
        </p>
        <p>
          Vil du helst ha et 10 km-løp, velger du bort Lang. Er du ultraløper og bare er ute etter
          et ultraløp, kan du velge bare Lang, så du ikke risikerer å vinne et kortere løp i stedet.
        </p>
      </>
    ),
  },
  {
    question: 'Kan jeg endre kategoriene underveis?',
    answer: (
      <p>
        Ja, på Min side frem til påmelding og turregistrering stenger. Valget gjelder alle turene
        dine, også de du allerede har registrert.
      </p>
    ),
  },
  {
    question: 'Hvordan blir kilometer til lodd?',
    answer: (
      <p>
        Distansen rundes av til nærmeste hele kilometer, og hver kilometer er ett lodd. 7,5 km gir 8
        lodd, 7,4 km gir 7. Den avrundede distansen avgjør også kategoriene, så 29,5 km teller som
        30 km og gir lodd i Lang. Turen må være minst {MIN_RUN_KM} km.
      </p>
    ),
  },
  {
    question: 'Hvorfor ett lodd per kilometer?',
    answer: (
      <p>
        Den som er mye i bevegelse i november, får litt større sjanse. Alle lodd er likevel like mye
        verdt, og ingen er garantert en premie.
      </p>
    ),
  },
  {
    question: 'Påvirker det sjansen min om jeg gir penger?',
    answer: (
      <p>
        Nei. Det er gratis å delta, og lodd fås bare gjennom kilometer du har gått eller løpt. Vi
        oppfordrer til fem kroner per kilometer til Prosjekt SUT, men det er helt frivillig og har
        ingenting med trekningen å gjøre.
      </p>
    ),
  },
  {
    question: 'Hva er sjansen min?',
    answer: (
      <p>
        Omtrent dine lodd delt på alle loddene i potten, ganget med antall premier i kategorien. Min
        side viser hvor mange lodd du har og hvor mange som er i hver pott. Når en premie er
        trukket, ser du på{' '}
        <Link href="/premier" className="font-semibold text-foreground underline">
          premiesiden
        </Link>{' '}
        hvor mange lodd den ble trukket blant.
      </p>
    ),
  },
  {
    question: 'Hva skjer hvis jeg vinner, men ikke kan stille?',
    answer: (
      <p>
        Startnummeret trekkes på nytt uten deg. Du er fortsatt med i trekningen av premier som ikke
        er trukket ennå.
      </p>
    ),
  },
  {
    question: 'Må jeg løpe?',
    answer: (
      <p>
        Nei, all bevegelse teller: løp, gå, rull eller gå på krykker. Vil du bare støtte saken, kan
        du gi direkte til innsamlingen fra forsiden. Gaver gir ikke lodd.
      </p>
    ),
  },
];

export default function TrekningPage() {
  return (
    <div>
      <header className="relative overflow-hidden border-b-2 border-foreground bg-foreground py-16 text-background md:py-24">
        <TerrainLines className="text-accent/20" />
        <div className="relative mx-auto max-w-[1500px] px-4 md:px-8">
          <p className="inline-flex border border-accent bg-accent px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-accent-foreground">
            Trekningen · 2026
          </p>
          <h1 className="font-display mt-5 text-6xl font-black uppercase leading-[0.88] md:text-9xl">
            Helt tilfeldig.
            <span className="block text-accent">Helt åpent.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-background/75">
            Slik samler du lodd, og slik blir de donerte startnumrene trukket.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-[1100px] space-y-16 px-4 py-14 md:px-8 md:py-20">
        <section>
          <p className="eyebrow">Steg 1</p>
          <h2 className="font-display mt-2 text-4xl font-black uppercase md:text-5xl">
            Slik får du lodd
          </h2>
          <div className="mt-6 space-y-4 text-lg text-muted-foreground">
            <p>
              <strong className="text-foreground">Hver kilometer gir ett lodd</strong> i hver
              kategori du har valgt og turen er lang nok til. Du kan registrere én tur per dag i
              november, og turen må være minst {MIN_RUN_KM} km. Det er gratis å delta, og lodd fås
              bare gjennom aktivitet, ikke ved å gi penger.
            </p>
            <p>
              Distansen rundes av til nærmeste hele kilometer, så 7,5 km gir 8 lodd og 7,4 km gir 7.
              Det er også den avrundede distansen som avgjør kategoriene. Løp, gå, rull eller gå på
              krykker: all bevegelse teller.
            </p>
          </div>

          <div className="mt-8 grid gap-3">
            {CATEGORY_ORDER.map((slug) => (
              <div
                key={slug}
                className={cn(
                  'flex flex-col gap-1 border-2 border-foreground p-5 sm:flex-row sm:items-center sm:justify-between',
                  CATEGORY_META[slug].solid
                )}
              >
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.2em]">
                    {CATEGORY_META[slug].name}
                  </p>
                  <p className="font-display text-3xl font-black uppercase">
                    {CATEGORY_META[slug].range}
                  </p>
                </div>
                <p className="font-semibold sm:text-right">{qualifies[slug]}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 flex gap-4 border-2 border-foreground bg-accent/30 p-5">
            <Ticket className="mt-1 h-6 w-6 shrink-0" strokeWidth={1.75} aria-hidden="true" />
            <div className="space-y-2">
              <p className="font-bold">Eksempel</p>
              <p>
                Du har valgt alle tre kategoriene og løper 5 km, 12 km og 32 km. Da får du 49 lodd i
                Kort (5 + 12 + 32), 44 i Mellom (12 + 32) og 32 i Lang.
              </p>
              <p className="text-sm text-muted-foreground">
                Loddene deles ikke mellom kategoriene: de gjelder fullt ut i hver kategori du har
                valgt. Kategoriene gjelder alle turene dine, også de du allerede har registrert.
                Velg bare kategorier med løp du faktisk vil og kan stille på, siden du kan vinne
                maks én premie og de lengste løpene trekkes først.
              </p>
            </div>
          </div>
        </section>

        <section>
          <p className="eyebrow">Steg 2</p>
          <h2 className="font-display mt-2 text-4xl font-black uppercase md:text-5xl">
            Slik trekkes vinnerne
          </h2>
          <ol className="mt-8 grid gap-4 md:grid-cols-2">
            {steps.map(({ icon: Icon, title, text }, index) => (
              <li
                key={title}
                className="border-2 border-foreground p-6 shadow-[5px_5px_0_hsl(var(--foreground))]"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs">{String(index + 1).padStart(2, '0')}</span>
                  <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
                  <h3 className="font-display text-2xl font-black uppercase">{title}</h3>
                </div>
                <p className="mt-3 text-muted-foreground">{text}</p>
              </li>
            ))}
          </ol>
        </section>

        <section>
          <p className="eyebrow">Spørsmål og svar</p>
          <h2 className="font-display mt-2 text-4xl font-black uppercase md:text-5xl">
            Lurer du på noe?
          </h2>
          <div className="mt-8 divide-y-2 divide-foreground border-y-2 border-foreground">
            {faq.map(({ question, answer }) => (
              <details key={question} className="group py-5">
                <summary className="flex cursor-pointer list-none items-start justify-between gap-4 text-lg font-bold">
                  {question}
                  <span
                    aria-hidden="true"
                    className="font-display text-2xl leading-none transition-transform group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <div className="mt-3 max-w-3xl space-y-3 text-muted-foreground">{answer}</div>
              </details>
            ))}
          </div>
        </section>

        <div className="border-2 border-foreground bg-foreground p-7 text-background md:flex md:items-center md:justify-between md:gap-6">
          <p className="font-display text-3xl font-black uppercase">Klar for å samle lodd?</p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row md:mt-0">
            <Button asChild variant="cta-dark" size="lg">
              <Link href="/pamelding">Meld deg på</Link>
            </Button>
            <Button asChild variant="line-dark" size="lg">
              <Link href="/premier">Se premiene</Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
