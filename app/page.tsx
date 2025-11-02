import Link from 'next/link';
import { Button } from '@/app/_shared/components/ui/button';
import { Card, CardContent } from '@/app/_shared/components/ui/card';
import { createClient } from '@/app/_shared/lib/supabase/server';
import { RouteMap } from '@/app/_shared/components/route-map';
import { MapPin, Users, Trophy, Upload, Award, ExternalLink, Heart, Download, BookOpen, AlertTriangle, Lightbulb, Shield } from 'lucide-react';
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
    completions: completionCount || 0
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

        <div className="container mx-auto px-4 pt-8 pb-16 md:pt-12 md:pb-20 relative">
          <div className="max-w-4xl mx-auto text-center space-y-2">
            {/* Badge */}
           {/*  <div className="inline-flex items-center gap-3 bg-accent/10 border border-accent/30 px-5 py-2 rounded-full backdrop-blur-sm">
              <MustacheSVG className="h-4 w-8 text-accent" />
              <span className="text-sm font-medium text-accent">Movember {year} • Støtt Barteprakt</span>
            </div> */}
              {/* Large Mustache */}
              <div className="flex justify-center -my-2">
                <MustacheSVG className="h-32 w-64 md:h-40 md:w-80 text-accent" />
              </div>
            {/* Title */}
            <div className="space-y-4">
              <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-foreground">
                Barteløpet
              </h1>

              <p className="text-2xl md:text-3xl text-muted-foreground font-light">
                Ta utfordringen - støtt <span className="text-accent font-normal">mental helse</span>
              </p>
            </div>

            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Delta ved å donere et valgfritt beløp for startnummeret. Løp gjennom sentrum i november. Vinn premier. Støtt Mental Helse.
            </p>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 h-12 px-8 text-base shadow-lg shadow-accent/20">
                <Link href="/pamelding" className="flex items-center justify-center">
                  <Upload className="mr-2 h-5 w-5" />
                  Send inn ditt løp
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-12 px-8 text-base border-border/50">
                <Link href="/galleri" className="flex items-center justify-center">
                  <Trophy className="mr-2 h-5 w-5" />
                  Se galleriet
                </Link>
              </Button>
            </div>

            {/* Stats */}
            <div className="flex justify-center gap-12 pt-8">
              <div className="text-center">
                <div className="text-5xl font-bold text-accent mb-1">{stats.completions}</div>
                <div className="text-sm text-muted-foreground uppercase tracking-wider">Løpere</div>
              </div>
              <div className="w-px bg-border" />
              <div className="text-center">
                <div className="text-5xl font-bold text-accent mb-1">{stats.completions * 11}</div>
                <div className="text-sm text-muted-foreground uppercase tracking-wider">Km løpt</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Map Section - CENTERPIECE */}
      <section className="py-12 md:py-20 border-b border-border/50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto space-y-12">
            {/* Header */}
            <div className="text-center space-y-4">
              <div className="inline-flex items-center gap-2 bg-primary/20 border border-primary/30 px-4 py-2 rounded-full">
                <MapPin className="h-4 w-4 text-primary-foreground" />
                <span className="text-sm font-medium text-primary-foreground">Din rute</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
                Løp gjennom{' '}
                <span className="text-accent">Stavanger</span>
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Løypen på 11 km går gjennom sentrum og forbi flere ikoniske steder.
              </p>
            </div>

            {/* Map */}
            <div className="relative">
              <RouteMap year={year} />
            </div>

            {/* Route Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
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
                <a 
                  href="/bartelopet-2025.gpx" 
                  download
                  className="flex items-center gap-2"
                >
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

            {/* Route Info */}
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="bg-card/50 border-border/50 backdrop-blur">
                <CardContent className="p-6 text-center space-y-3">
                  <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto">
                    <MapPin className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <h3 className="font-semibold">Sentrumsløype</h3>
                  <p className="text-sm text-muted-foreground">
                    Gjennom kjente, ikoniske plasser
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card/50 border-border/50 backdrop-blur">
                <CardContent className="p-6 text-center space-y-3">
                  <div className="w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center mx-auto">
                    <Upload className="h-6 w-6 text-accent" />
                  </div>
                  <h3 className="font-semibold">Fleksibel tid</h3>
                  <p className="text-sm text-muted-foreground">
                    Løp når det passer i november
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card/50 border-border/50 backdrop-blur">
                <CardContent className="p-6 text-center space-y-3">
                  <div className="w-12 h-12 bg-secondary/20 rounded-full flex items-center justify-center mx-auto">
                    <Users className="h-6 w-6 text-secondary-foreground" />
                  </div>
                  <h3 className="font-semibold">Fellesskap</h3>
                  <p className="text-sm text-muted-foreground">
                    Del din opplevelse
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Safety Warning */}
      <section className="py-12 md:py-20 border-b border-border/50 bg-amber-500/5">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <Card className="bg-card border-amber-500/30 backdrop-blur shadow-lg">
              <CardContent className="p-8 md:p-10 space-y-6">
                {/* Header */}
                <div className="flex flex-col items-center gap-4">
                  <div className="w-12 h-12 bg-amber-500/20 rounded-full flex items-center justify-center shrink-0">
                    <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-500" />
                  </div>
                  <div className="space-y-2 text-center">
                    <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                      Viktig sikkerhetsinformasjon
                    </h2>
                    <p className="text-base text-muted-foreground">
                      November betyr mørke forhold. Din sikkerhet er vår prioritet.
                    </p>
                  </div>
                </div>

                {/* Safety Items */}
                <div className="grid md:grid-cols-2 gap-6 pt-4">
                  <div className="flex items-start gap-4 p-4 bg-background/50 rounded-lg border border-border/50">
                    <div className="w-10 h-10 bg-amber-500/20 rounded-full flex items-center justify-center shrink-0">
                      <Shield className="h-5 w-5 text-amber-600 dark:text-amber-500" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-semibold text-foreground">Bruk refleks</h3>
                      <p className="text-sm text-muted-foreground">
                        Bruk refleksvest eller refleksbånd slik at bilistene ser deg i mørket.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 bg-background/50 rounded-lg border border-border/50">
                    <div className="w-10 h-10 bg-amber-500/20 rounded-full flex items-center justify-center shrink-0">
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
                <div className="pt-2 border-t border-border/50">
                  <p className="text-sm text-muted-foreground text-center">
                    Løp alltid med forsiktighet i trafikken. Vær oppmerksom på dine omgivelser.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-12 md:py-20 border-b border-border/50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto space-y-16">
            <div className="text-center space-y-4">
              <h2 className="text-4xl md:text-5xl font-bold">Slik fungerer det</h2>
              <p className="text-lg text-muted-foreground">Fire enkle steg</p>
            </div>

            <div className="grid md:grid-cols-4 gap-8">
              <Card className="bg-card/50 border-border/50 backdrop-blur group hover:border-accent/50 transition-all">
                <CardContent className="p-8 space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center shrink-0">
                      <Heart className="h-6 w-6 text-accent" />
                    </div>
                    <span className="text-6xl font-bold text-accent/20">01</span>
                  </div>
                  <h3 className="text-2xl font-bold">Doner</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Doner et valgfritt beløp for startnummeret ditt og støtt Mental Helse Ungdom
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card/50 border-border/50 backdrop-blur group hover:border-accent/50 transition-all">
                <CardContent className="p-8 space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center shrink-0">
                      <MapPin className="h-6 w-6 text-accent" />
                    </div>
                    <span className="text-6xl font-bold text-accent/20">02</span>
                  </div>
                  <h3 className="text-2xl font-bold">Løp</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Gjennomfør ruten når det passer deg i løpet av november
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card/50 border-border/50 backdrop-blur group hover:border-accent/50 transition-all">
                <CardContent className="p-8 space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center shrink-0">
                      <Upload className="h-6 w-6 text-accent" />
                    </div>
                    <span className="text-6xl font-bold text-accent/20">03</span>
                  </div>
                  <h3 className="text-2xl font-bold">Send inn</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Last opp bilde og detaljer fra løpet ditt
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card/50 border-border/50 backdrop-blur group hover:border-accent/50 transition-all">
                <CardContent className="p-8 space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center shrink-0">
                      <Trophy className="h-6 w-6 text-accent" />
                    </div>
                    <span className="text-6xl font-bold text-accent/20">04</span>
                  </div>
                  <h3 className="text-2xl font-bold">Stem & Vinn</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Se andres løp og stem på ditt favorittbilde
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Prizes */}
      <section className="py-12 md:py-20 border-b border-border/50">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto space-y-16">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center gap-3 bg-accent/10 border border-accent/30 px-5 py-2 rounded-full">
                <MustacheSVG className="h-4 w-8 text-accent" />
                <span className="text-sm font-medium text-accent">Premier & Belønninger</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold">Hva vinner du?</h2>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <Card className="bg-card/50 border-accent/20 backdrop-blur relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 rounded-full blur-2xl" />
                <CardContent className="p-8 relative space-y-4 text-center">
                  <div className="text-6xl">🏆</div>
                  <h3 className="text-2xl font-bold">Pokal</h3>
                  <p className="text-muted-foreground">
                    Alle som fullfører får en eksklusiv pokal levert hjem
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card/50 border-accent/20 backdrop-blur relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 rounded-full blur-2xl" />
                <CardContent className="p-8 relative space-y-4 text-center">
                  <div className="text-6xl">📸</div>
                  <h3 className="text-2xl font-bold">Beste bilde</h3>
                  <p className="text-muted-foreground">
                    Beste bilde langs løypen vinner en ekstra premie
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card/50 border-accent/20 backdrop-blur relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 rounded-full blur-2xl" />
                <CardContent className="p-8 relative space-y-4 text-center">
                  <div className="text-6xl">🎁</div>
                  <h3 className="text-2xl font-bold">Swag</h3>
                  <p className="text-muted-foreground">
                    Merch sponset av lokale bedrifter
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
          <Card className="max-w-4xl mx-auto bg-gradient-to-br from-primary/20 via-card to-accent/10 border-accent/20 backdrop-blur">
            <CardContent className="p-12 md:p-16 text-center space-y-8">
              <div className="inline-flex items-center gap-3 bg-background/50 px-5 py-2 rounded-full border border-accent/30">
                <MustacheSVG className="h-5 w-10 text-accent" />
                <span className="text-sm font-medium text-accent">
                  Movember {year}
                  <span className="hidden md:inline"> • Løp for Mental Helse Ungdom</span>
                </span>
              </div>

              <div className="space-y-4">
                <h2 className="text-3xl md:text-4xl font-bold">
                  Løp for <span className="text-accent">Mental Helse Ungdom</span>
                </h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  I november lar vi bartene gro for å øke bevisstheten rundt mental helse.
                  Din deltakelse i løpet støtter forskning og gjør en forskjell.
                </p>
              </div>

              {/* Donation Goal */}
              <div className="bg-background/80 backdrop-blur-sm p-8 rounded-xl border border-accent/20 max-w-2xl mx-auto space-y-4">
                <div className="text-center space-y-3">
                  <p className="text-sm text-muted-foreground uppercase tracking-wider">
                    Innsamlingsmål
                  </p>
                  <p className="text-3xl md:text-5xl font-bold text-accent mb-2">
                    {formatAmount(DONATION_GOAL)}
                  </p>
                  <p className="text-base text-muted-foreground">
                    til Mental Helse Ungdom
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 h-12 px-8 shadow-lg shadow-accent/20">
                  <a href={SPLEIS_URL} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center">
                    <Heart className="mr-2 h-5 w-5" />
                    Doner nå
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </a>
                </Button>
                <Button asChild size="lg" variant="outline" className="h-12 px-8 border-border/50">
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
