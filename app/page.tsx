import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/app/_shared/components/ui/button';
import { Card, CardContent } from '@/app/_shared/components/ui/card';
import { createClient } from '@/app/_shared/lib/supabase/server';
import { RouteMap } from '@/app/_shared/components/route-map';
import {
  MapPin,
  Trophy,
  Upload,
  Award,
  ExternalLink,
  Heart,
  Download,
  BookOpen,
  AlertTriangle,
  Lightbulb,
  Shield,
} from 'lucide-react';
import { MustacheSVG } from '@/app/_shared/components/mustache-icon';
import { getCurrentEventYear, getYearDateRange } from '@/app/_shared/lib/utils/year';

const DONATION_GOAL = 20000;
const SPLEIS_URL = 'https://spleis.no/barteløpet2025';

function formatAmount(amount: number): string {
  return new Intl.NumberFormat('nb-NO', {
    style: 'currency',
    currency: 'NOK',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

async function getStats(year: number) {
  const supabase = await createClient();
  const { start, end } = getYearDateRange(year);

  const { count: completionCount } = await supabase
    .from('completions')
    .select('*', { count: 'exact', head: true })
    .gte('completed_date', start.toISOString())
    .lte('completed_date', end.toISOString());

  return {
    completions: completionCount || 0,
  };
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const params = await searchParams;
  const yearParam = params.year;
  const year = yearParam ? parseInt(yearParam, 10) : getCurrentEventYear();
  const stats = await getStats(year);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-border/50">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/5" />

        <div className="container relative mx-auto px-4 pb-16 pt-8 md:pb-20 md:pt-12">
          <div className="mx-auto max-w-4xl space-y-2 text-center">
            {/* Badge */}
            {/*  <div className="inline-flex items-center gap-3 bg-accent/10 border border-accent/30 px-5 py-2 rounded-full backdrop-blur-sm">
              <MustacheSVG className="h-4 w-8 text-accent" />
              <span className="text-sm font-medium text-accent">Movember {year} • Støtt Barteprakt</span>
            </div> */}
            {/* Large Mustache */}
            <div className="-my-2 flex justify-center">
              <MustacheSVG className="h-32 w-64 text-accent md:h-40 md:w-80" />
            </div>
            {/* Title */}
            <div className="space-y-4">
              <h1 className="text-5xl font-bold tracking-tight text-foreground md:text-7xl">
                Barteløpet
              </h1>

              <p className="text-2xl font-light text-muted-foreground md:text-3xl">
                Ta utfordringen - støtt{' '}
                <span className="font-normal text-accent">Mental Helse Ungdom</span>
              </p>
            </div>

            <p className="mx-auto max-w-2xl text-lg leading-relaxed text-muted-foreground">
              Delta ved å donere et valgfritt beløp for startnummeret. Løp eller gå gjennom sentrum
              i november.{' '}
              <span className="font-semibold text-accent">
                Vinn flotte premier i premietrekningen!
              </span>
            </p>

            {/* CTA */}
            <div className="flex flex-col justify-center gap-4 pt-4 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="h-12 bg-accent px-8 text-base text-accent-foreground shadow-lg shadow-accent/20 hover:bg-accent/90"
              >
                <Link href="/pamelding" className="flex items-center justify-center">
                  <Upload className="mr-2 h-5 w-5" />
                  Send inn ditt løp
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-12 border-border/50 px-8 text-base"
              >
                <Link href="/galleri" className="flex items-center justify-center">
                  <Trophy className="mr-2 h-5 w-5" />
                  Se galleriet
                </Link>
              </Button>
            </div>

            {/* Stats */}
            <div className="flex justify-center gap-12 pt-8">
              <div className="text-center">
                <div className="mb-1 text-5xl font-bold text-accent">{stats.completions}</div>
                <div className="text-sm uppercase tracking-wider text-muted-foreground">Løpere</div>
              </div>
              <div className="w-px bg-border" />
              <div className="text-center">
                <div className="mb-1 text-5xl font-bold text-accent">{stats.completions * 11}</div>
                <div className="text-sm uppercase tracking-wider text-muted-foreground">
                  Km løpt
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trophy Prototype Showcase */}
      <section className="border-b border-border/50 py-12 md:py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl">
            <Card className="relative overflow-hidden border-accent/30 bg-card/50 backdrop-blur">
              <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-accent/10 blur-3xl" />
              <div className="absolute bottom-0 left-0 h-40 w-40 rounded-full bg-accent/10 blur-3xl" />
              <CardContent className="relative space-y-6 p-8 text-center md:p-10">
                <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-2">
                  <Trophy className="h-4 w-4 text-accent" />
                  <span className="text-sm font-medium text-accent">Pokal-prototype</span>
                </div>
                <h3 className="text-2xl font-bold md:text-3xl">Prototype av pokalen!</h3>
                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg border-2 border-accent/20">
                  <Image
                    src="/images/pokal-prototype.jpg"
                    alt="Barteløpet pokal prototype - eksklusiv pokal til alle deltakere"
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 50vw"
                    priority
                  />
                </div>
                <p className="text-muted-foreground">
                  Vi har fått laget en prototype av pokalen! 🏆 Den ferdige pokalen vil se enda
                  bedre ut. Alle som fullfører løpet får denne eksklusive pokalen levert hjem 🎉
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Map Section - CENTERPIECE */}
      <section className="border-b border-border/50 py-12 md:py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-6xl space-y-12">
            {/* Header */}
            <div className="space-y-4 text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/20 px-4 py-2">
                <MapPin className="h-4 w-4 text-primary-foreground" />
                <span className="text-sm font-medium text-primary-foreground">Din rute</span>
              </div>
              <h2 className="text-4xl font-bold tracking-tight md:text-5xl">
                Løp gjennom <span className="text-accent">Stavanger</span>
              </h2>
              <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
                En 11 km løype gjennom sentrum hvor du opplever ikoniske steder, gatekunst og
                fargerike gater. Løp når det passer deg i løpet av november.
              </p>
              <p className="mx-auto max-w-2xl text-base italic text-muted-foreground">
                Ikke i Stavanger? Ingen bekymring! Du kan lage din egen løype i din egen by og delta
                likevel. Du trenger ikke løpe - gåing er også helt greit!
              </p>
            </div>

            {/* Map */}
            <div className="relative">
              <RouteMap year={year} />
            </div>

            {/* Route Action Buttons */}
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button asChild size="lg" variant="default" className="h-12 px-6">
                <a
                  href="https://www.strava.com/routes/3419817784051532462"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                >
                  <ExternalLink className="h-5 w-5" />
                  Strava-rute
                </a>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-12 px-6">
                <a href="/bartelopet-2025.gpx" download className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Last ned GPX
                </a>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-12 px-6">
                <Link href="/hvordan" className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Hvordan bruke ruten
                </Link>
              </Button>
            </div>

            {/* Iconic Places */}
            <div className="space-y-6">
              <div className="space-y-2 text-center">
                <h3 className="text-2xl font-bold">Ikoniske steder langs løypen</h3>
                <p className="text-muted-foreground">Løp gjennom Stavangers vakre sentrum</p>
              </div>

              <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                <Card className="border-accent/20 bg-gradient-to-br from-accent/5 to-transparent backdrop-blur">
                  <CardContent className="space-y-2 p-4 text-center">
                    <div className="text-3xl">🏛️</div>
                    <h4 className="text-sm font-semibold">Valbergstårnet</h4>
                  </CardContent>
                </Card>

                <Card className="border-accent/20 bg-gradient-to-br from-accent/5 to-transparent backdrop-blur">
                  <CardContent className="space-y-2 p-4 text-center">
                    <div className="text-3xl">🎨</div>
                    <h4 className="text-sm font-semibold">Fargegadå</h4>
                    <p className="text-xs text-muted-foreground">Gatekunst</p>
                  </CardContent>
                </Card>

                <Card className="border-accent/20 bg-gradient-to-br from-accent/5 to-transparent backdrop-blur">
                  <CardContent className="space-y-2 p-4 text-center">
                    <div className="text-3xl">🏘️</div>
                    <h4 className="text-sm font-semibold">Gamle Stavanger</h4>
                  </CardContent>
                </Card>

                <Card className="border-accent/20 bg-gradient-to-br from-accent/5 to-transparent backdrop-blur">
                  <CardContent className="space-y-2 p-4 text-center">
                    <div className="text-3xl">🏡</div>
                    <h4 className="text-sm font-semibold">Eiganes</h4>
                  </CardContent>
                </Card>

                <Card className="border-accent/20 bg-gradient-to-br from-accent/5 to-transparent backdrop-blur">
                  <CardContent className="space-y-2 p-4 text-center">
                    <div className="text-3xl">🏙️</div>
                    <h4 className="text-sm font-semibold">Stavanger Øst</h4>
                  </CardContent>
                </Card>

                <Card className="border-accent/20 bg-gradient-to-br from-accent/5 to-transparent backdrop-blur">
                  <CardContent className="space-y-2 p-4 text-center">
                    <div className="text-3xl">🚶</div>
                    <h4 className="text-sm font-semibold">Pedersgadå</h4>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Safety Warning */}
      <section className="border-b border-border/50 bg-amber-500/5 py-12 md:py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl">
            <Card className="border-amber-500/30 bg-card shadow-lg backdrop-blur">
              <CardContent className="space-y-6 p-8 md:p-10">
                {/* Header */}
                <div className="flex flex-col items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber-500/20">
                    <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-500" />
                  </div>
                  <div className="space-y-2 text-center">
                    <h2 className="text-2xl font-bold text-foreground md:text-3xl">
                      Viktig sikkerhetsinformasjon
                    </h2>
                    <p className="text-base text-muted-foreground">
                      November betyr mørke forhold. Din sikkerhet er vår prioritet.
                    </p>
                  </div>
                </div>

                {/* Safety Items */}
                <div className="grid gap-6 pt-4 md:grid-cols-2">
                  <div className="flex items-start gap-4 rounded-lg border border-border/50 bg-background/50 p-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500/20">
                      <Shield className="h-5 w-5 text-amber-600 dark:text-amber-500" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-semibold text-foreground">Bruk refleks</h3>
                      <p className="text-sm text-muted-foreground">
                        Bruk refleksvest eller refleksbånd slik at bilistene ser deg i mørket.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 rounded-lg border border-border/50 bg-background/50 p-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500/20">
                      <Lightbulb className="h-5 w-5 text-amber-600 dark:text-amber-500" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-semibold text-foreground">Ta med hodelykt</h3>
                      <p className="text-sm text-muted-foreground">
                        En hodelykt hjelper deg med å se veien og gjør deg mer synlig.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Footer Note */}
                <div className="border-t border-border/50 pt-2">
                  <p className="text-center text-sm text-muted-foreground">
                    Løp alltid med forsiktighet i trafikken. Vær oppmerksom på dine omgivelser.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="border-b border-border/50 py-12 md:py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-6xl space-y-16">
            <div className="space-y-4 text-center">
              <h2 className="text-4xl font-bold md:text-5xl">Slik fungerer det</h2>
              <p className="text-lg text-muted-foreground">Fire enkle steg</p>
            </div>

            <div className="grid gap-8 md:grid-cols-4">
              <Card className="group border-border/50 bg-card/50 backdrop-blur transition-all hover:border-accent/50">
                <CardContent className="space-y-4 p-8">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent/20">
                      <Heart className="h-6 w-6 text-accent" />
                    </div>
                    <span className="text-6xl font-bold text-accent/20">01</span>
                  </div>
                  <h3 className="text-2xl font-bold">Doner</h3>
                  <p className="leading-relaxed text-muted-foreground">
                    Doner et valgfritt beløp for startnummeret ditt og støtt Mental Helse Ungdom
                  </p>
                </CardContent>
              </Card>

              <Card className="group border-border/50 bg-card/50 backdrop-blur transition-all hover:border-accent/50">
                <CardContent className="space-y-4 p-8">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent/20">
                      <MapPin className="h-6 w-6 text-accent" />
                    </div>
                    <span className="text-6xl font-bold text-accent/20">02</span>
                  </div>
                  <h3 className="text-2xl font-bold">Løp eller gå</h3>
                  <p className="leading-relaxed text-muted-foreground">
                    Gjennomfør ruten når det passer deg i løpet av november. Løp, gå eller lag din
                    egen løype i din by!
                  </p>
                </CardContent>
              </Card>

              <Card className="group border-border/50 bg-card/50 backdrop-blur transition-all hover:border-accent/50">
                <CardContent className="space-y-4 p-8">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent/20">
                      <Upload className="h-6 w-6 text-accent" />
                    </div>
                    <span className="text-6xl font-bold text-accent/20">03</span>
                  </div>
                  <h3 className="text-2xl font-bold">Send inn</h3>
                  <p className="leading-relaxed text-muted-foreground">
                    Last opp bilde og detaljer fra løpet ditt
                  </p>
                </CardContent>
              </Card>

              <Card className="group border-border/50 bg-card/50 backdrop-blur transition-all hover:border-accent/50">
                <CardContent className="space-y-4 p-8">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent/20">
                      <Trophy className="h-6 w-6 text-accent" />
                    </div>
                    <span className="text-6xl font-bold text-accent/20">04</span>
                  </div>
                  <h3 className="text-2xl font-bold">Vinn premier!</h3>
                  <p className="leading-relaxed text-muted-foreground">
                    Premier trekkes tilfeldig basert på startnummer. Jo tidligere du melder deg på,
                    jo bedre sjanse!
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Lottery Draw Highlight */}
      <section className="border-b border-border/50 bg-gradient-to-br from-accent/5 via-transparent to-primary/5 py-12 md:py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl">
            <Card className="border-accent/30 bg-gradient-to-br from-accent/10 via-card to-primary/10 shadow-2xl backdrop-blur">
              <CardContent className="space-y-8 p-12 md:p-16">
                {/* Header */}
                <div className="space-y-4 text-center">
                  <div className="mb-4 inline-flex h-20 w-20 items-center justify-center rounded-full bg-accent/20">
                    <Trophy className="h-10 w-10 text-accent" />
                  </div>
                  <h2 className="text-3xl font-bold tracking-tight md:text-5xl">
                    Premietrekning basert på startnummer
                  </h2>
                  <p className="text-xl font-light text-muted-foreground md:text-2xl">
                    En spennende lotteri-trekning der alle deltakere har mulighet til å vinne!
                  </p>
                </div>

                {/* Content */}
                <div className="space-y-6 rounded-xl border border-accent/20 bg-background/80 p-8 backdrop-blur-sm">
                  <div className="mx-auto max-w-2xl space-y-6">
                    <div className="space-y-3 text-center">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent/20">
                        <span className="text-3xl">🎲</span>
                      </div>
                      <h3 className="text-xl font-bold text-foreground">Tilfeldig og rettferdig</h3>
                      <p className="text-base leading-relaxed text-muted-foreground">
                        Alle som fullfører løpet er automatisk med i trekningen. Vinnere trekkes
                        helt tilfeldig basert på startnumrene som er delt ut ved påmelding.
                      </p>
                    </div>

                    <div className="space-y-3 text-center">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent/20">
                        <span className="text-3xl">🎁</span>
                      </div>
                      <h3 className="text-xl font-bold text-foreground">Sponsorpremiepakker</h3>
                      <p className="text-base leading-relaxed text-muted-foreground">
                        Vi trekker ut flere vinnere som får flotte premiepakker fra våre generøse
                        bidragsytere.
                      </p>
                    </div>

                    <div className="space-y-3 text-center">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent/20">
                        <span className="text-3xl">🏆</span>
                      </div>
                      <h3 className="text-xl font-bold text-foreground">Alle vinner</h3>
                      <p className="text-base leading-relaxed text-muted-foreground">
                        Selv om ikke alle vinner i trekningen, får alle som fullfører løpet en
                        eksklusiv pokal levert hjem - i tillegg til følelsen av å ha gjort en god
                        gjerning!
                      </p>
                    </div>
                  </div>
                </div>

                {/* CTA */}
                <div className="pt-4 text-center">
                  <Button
                    asChild
                    size="lg"
                    className="h-14 bg-accent px-10 text-lg text-accent-foreground shadow-lg shadow-accent/30 hover:bg-accent/90"
                  >
                    <Link href="/pamelding" className="flex items-center justify-center">
                      <Trophy className="mr-2 h-6 w-6" />
                      Meld deg på og vær med i trekningen!
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Prizes */}
      <section className="border-b border-border/50 py-12 md:py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-5xl space-y-16">
            <div className="space-y-4 text-center">
              <div className="inline-flex items-center gap-3 rounded-full border border-accent/30 bg-accent/10 px-5 py-2">
                <MustacheSVG className="h-4 w-8 text-accent" />
                <span className="text-sm font-medium text-accent">
                  Premietrekning & Belønninger
                </span>
              </div>
              <h2 className="text-4xl font-bold md:text-5xl">Flotte premier å vinne!</h2>
              <p className="mx-auto max-w-3xl text-lg text-muted-foreground">
                Alle som fullfører får pokal, men vi trekker også ut vinnere av ekstra premier
                basert på startnummer.
                <span className="font-semibold text-accent">
                  {' '}
                  Delta og vinn gode premier fra våre bidragsytere!
                </span>
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
              <Card className="relative overflow-hidden border-accent/20 bg-card/50 backdrop-blur">
                <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-accent/10 blur-2xl" />
                <CardContent className="relative space-y-4 p-8 text-center">
                  <div className="text-6xl">🏆</div>
                  <h3 className="text-2xl font-bold">Pokal til alle</h3>
                  <p className="text-muted-foreground">
                    Alle som fullfører får en eksklusiv pokal levert hjem
                  </p>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden border-accent/20 bg-card/50 backdrop-blur">
                <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-accent/10 blur-2xl" />
                <CardContent className="relative space-y-4 p-8 text-center">
                  <div className="text-6xl">🎲</div>
                  <h3 className="text-2xl font-bold">Tilfeldig trekning</h3>
                  <p className="text-muted-foreground">
                    Vinnere trekkes tilfeldig basert på startnummer - alle har sjanse til å vinne!
                  </p>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden border-accent/20 bg-card/50 backdrop-blur">
                <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-accent/10 blur-2xl" />
                <CardContent className="relative space-y-4 p-8 text-center">
                  <div className="text-6xl">🎁</div>
                  <h3 className="text-2xl font-bold">Sponsorpremiepakker</h3>
                  <p className="text-muted-foreground">
                    Flotte premiepakker fra lokale bedrifter trekkes ut blant deltakerne
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Movember CTA */}
      <section className="py-12 md:py-20">
        <div className="container mx-auto px-4">
          <Card className="mx-auto max-w-4xl border-accent/20 bg-gradient-to-br from-primary/20 via-card to-accent/10 backdrop-blur">
            <CardContent className="space-y-8 p-12 text-center md:p-16">
              <div className="inline-flex items-center gap-3 rounded-full border border-accent/30 bg-background/50 px-5 py-2">
                <MustacheSVG className="h-5 w-10 text-accent" />
                <span className="text-sm font-medium text-accent">
                  Movember {year}
                  <span className="hidden md:inline"> • Løp for Mental Helse Ungdom</span>
                </span>
              </div>

              <div className="space-y-4">
                <h2 className="text-3xl font-bold md:text-4xl">
                  Løp for <span className="text-accent">Mental Helse Ungdom</span>
                </h2>
                <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
                  I november lar vi bartene gro for å øke bevisstheten rundt mental helse. Din
                  deltakelse i løpet støtter forskning og gjør en forskjell.
                </p>
              </div>

              {/* Donation Goal */}
              <div className="mx-auto max-w-2xl space-y-4 rounded-xl border border-accent/20 bg-background/80 p-8 backdrop-blur-sm">
                <div className="space-y-3 text-center">
                  <p className="text-sm uppercase tracking-wider text-muted-foreground">
                    Innsamlingsmål
                  </p>
                  <p className="mb-2 text-3xl font-bold text-accent md:text-5xl">
                    {formatAmount(DONATION_GOAL)}
                  </p>
                  <p className="text-base text-muted-foreground">til Mental Helse Ungdom</p>
                </div>
              </div>

              <div className="flex flex-col justify-center gap-4 sm:flex-row">
                <Button
                  asChild
                  size="lg"
                  className="h-12 bg-accent px-8 text-accent-foreground shadow-lg shadow-accent/20 hover:bg-accent/90"
                >
                  <a
                    href={SPLEIS_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center"
                  >
                    <Heart className="mr-2 h-5 w-5" />
                    Doner nå
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </a>
                </Button>
                <Button asChild size="lg" variant="outline" className="h-12 border-border/50 px-8">
                  <Link href="/pamelding" className="flex items-center justify-center">
                    <Award className="mr-2 h-5 w-5" />
                    Send inn løp
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
