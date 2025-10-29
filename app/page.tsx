import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/server';
import { RouteMap } from '@/components/route-map';
import { MapPin, Users, Trophy, Upload, Award, ExternalLink, Heart } from 'lucide-react';
import { MustacheSVG } from '@/components/mustache-icon';
import { getSpleisData, formatAmount, calculateProgress, SPLEIS_PROJECT_URL } from '@/lib/spleis';
import { getCurrentEventYear, getYearDateRange } from '@/lib/utils/year';

async function getStats(year: number) {
  const supabase = await createClient();
  const { start, end } = getYearDateRange(year);

  const [
    { count: completionCount },
    spleisData
  ] = await Promise.all([
    supabase
      .from('completions')
      .select('*', { count: 'exact', head: true })
      .gte('completed_date', start.toISOString())
      .lte('completed_date', end.toISOString()),
    getSpleisData()
  ]);

  return {
    completions: completionCount || 0,
    spleis: spleisData
  };
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: { year?: string };
}) {
  const yearParam = searchParams.year;
  const year = yearParam ? parseInt(yearParam, 10) : getCurrentEventYear();
  const stats = await getStats(year);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-border/50">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/5" />

        <div className="container mx-auto px-4 py-16 md:py-24 relative">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-3 bg-accent/10 border border-accent/30 px-5 py-2 rounded-full backdrop-blur-sm">
              <MustacheSVG className="h-4 w-8 text-accent" />
              <span className="text-sm font-medium text-accent">Movember {year} • Støtt Barteprakt</span>
            </div>

            {/* Title */}
            <div className="space-y-6">
              <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-foreground">
                Barteløpet
              </h1>
              <p className="text-2xl md:text-3xl text-muted-foreground font-light">
                10km for <span className="text-accent font-normal">barteprakt</span> & mental helse
              </p>
            </div>

            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Løp 10km på egen hånd i november. Last opp bevis. Støtt forskning på mental helse.
            </p>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 h-12 px-8 text-base shadow-lg shadow-accent/20">
                <Link href="/send-inn" className="flex items-center justify-center">
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
                <div className="text-5xl font-bold text-accent mb-1">10</div>
                <div className="text-sm text-muted-foreground uppercase tracking-wider">Kilometer</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Map Section - CENTERPIECE */}
      <section className="py-20 md:py-32 border-b border-border/50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto space-y-12">
            {/* Header */}
            <div className="text-center space-y-4">
              <div className="inline-flex items-center gap-2 bg-primary/20 border border-primary/30 px-4 py-2 rounded-full">
                <MapPin className="h-4 w-4 text-primary-foreground" />
                <span className="text-sm font-medium text-primary-foreground">Din rute</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
                10km gjennom{' '}
                <span className="text-accent">Stavanger</span>
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Flatt terreng. Asfaltert. Perfekt for alle nivåer.
              </p>
            </div>

            {/* Map */}
            <div className="relative">
              <RouteMap year={year} />
            </div>

            {/* Route Info */}
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="bg-card/50 border-border/50 backdrop-blur">
                <CardContent className="p-6 text-center space-y-3">
                  <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto">
                    <MapPin className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <h3 className="font-semibold">Flatt terreng</h3>
                  <p className="text-sm text-muted-foreground">
                    Minimal høydeforskjell
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

      {/* How it Works */}
      <section className="py-20 md:py-32 border-b border-border/50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto space-y-16">
            <div className="text-center space-y-4">
              <h2 className="text-4xl md:text-5xl font-bold">Slik fungerer det</h2>
              <p className="text-lg text-muted-foreground">Tre enkle steg</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <Card className="bg-card/50 border-border/50 backdrop-blur group hover:border-accent/50 transition-all">
                <CardContent className="p-8 space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center shrink-0">
                      <MapPin className="h-6 w-6 text-accent" />
                    </div>
                    <span className="text-6xl font-bold text-accent/20">01</span>
                  </div>
                  <h3 className="text-2xl font-bold">Løp 10km</h3>
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
                    <span className="text-6xl font-bold text-accent/20">02</span>
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
                    <span className="text-6xl font-bold text-accent/20">03</span>
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
      <section className="py-20 md:py-32 border-b border-border/50">
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
                  <div className="text-6xl">🏅</div>
                  <h3 className="text-2xl font-bold">Barteløpet Medalje</h3>
                  <p className="text-muted-foreground">
                    Alle som fullfører får en eksklusiv medalje med bartemotiv sendt hjem
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card/50 border-accent/20 backdrop-blur relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 rounded-full blur-2xl" />
                <CardContent className="p-8 relative space-y-4 text-center">
                  <div className="text-6xl">📸</div>
                  <h3 className="text-2xl font-bold">Beste Bartefoto</h3>
                  <p className="text-muted-foreground">
                    Beste bilde med bart vinner en ekstra premie
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card/50 border-accent/20 backdrop-blur relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 rounded-full blur-2xl" />
                <CardContent className="p-8 relative space-y-4 text-center">
                  <div className="text-6xl">🧔</div>
                  <h3 className="text-2xl font-bold">Barteprakt Merch</h3>
                  <p className="text-muted-foreground">
                    Eksklusiv Movember-merch for de mest prangende bartene
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Movember CTA */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4">
          <Card className="max-w-4xl mx-auto bg-gradient-to-br from-primary/20 via-card to-accent/10 border-accent/20 backdrop-blur">
            <CardContent className="p-12 md:p-16 text-center space-y-8">
              <div className="inline-flex items-center gap-3 bg-background/50 px-5 py-2 rounded-full border border-accent/30">
                <MustacheSVG className="h-5 w-10 text-accent" />
                <span className="text-sm font-medium text-accent">Movember {year} • Barteprakt</span>
              </div>

              <div className="space-y-4">
                <h2 className="text-3xl md:text-4xl font-bold">
                  <span className="text-accent">Støtt Barteprakt</span> for Mental Helse
                </h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  I november lar vi bartene gro for å øke bevisstheten rundt mental helse.
                  Din deltakelse i løpet støtter forskning og gjør en forskjell.
                </p>
              </div>

              {/* Donation Progress */}
              <div className="bg-background/80 backdrop-blur-sm p-8 rounded-xl border border-accent/20 max-w-2xl mx-auto space-y-4">
                {stats.spleis && (
                  <>
                    <div className="flex justify-between items-baseline mb-2">
                      <span className="text-sm text-muted-foreground">Samlet inn</span>
                      <span className="text-sm text-muted-foreground">
                        Mål: {formatAmount(stats.spleis.moneygoal)}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    {stats.spleis.collected_amount !== undefined && (
                      <>
                        <div className="relative h-3 bg-muted rounded-full overflow-hidden">
                          <div
                            className="absolute inset-y-0 left-0 bg-gradient-to-r from-accent to-accent/80 transition-all duration-500"
                            style={{ width: `${calculateProgress(stats.spleis.collected_amount, stats.spleis.moneygoal)}%` }}
                          />
                        </div>

                        <div className="text-center">
                          <p className="text-4xl font-bold text-accent mb-1">
                            {formatAmount(stats.spleis.collected_amount)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {calculateProgress(stats.spleis.collected_amount, stats.spleis.moneygoal)}% av målet nådd
                          </p>
                        </div>
                      </>
                    )}

                    {stats.spleis.collected_amount === undefined && (
                      <div className="text-center">
                        <p className="text-2xl font-bold text-accent mb-1">
                          Mål: {formatAmount(stats.spleis.moneygoal)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Støtt Mental Helse Ungdom
                        </p>
                      </div>
                    )}
                  </>
                )}

                {!stats.spleis && (
                  <div className="text-center">
                    <p className="text-2xl font-bold text-accent mb-1">
                      Støtt Barteprakt
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Doner til Mental Helse Ungdom
                    </p>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 h-12 px-8 shadow-lg shadow-accent/20">
                  <a href={SPLEIS_PROJECT_URL} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center">
                    <Heart className="mr-2 h-5 w-5" />
                    Doner nå
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </a>
                </Button>
                <Button asChild size="lg" variant="outline" className="h-12 px-8 border-border/50">
                  <Link href="/send-inn" className="flex items-center justify-center">
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
