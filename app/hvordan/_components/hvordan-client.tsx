'use client';

import { Card, CardContent } from '@/app/_shared/components/ui/card';
import { Button } from '@/app/_shared/components/ui/button';
import { MapPin, Download, ExternalLink, Smartphone, Watch } from 'lucide-react';
import Link from 'next/link';
import { useEffect } from 'react';

const STRAVA_ROUTE_ID = '3419817784051532462';
const STRAVA_ROUTE_URL = 'https://www.strava.com/routes/3419817784051532462';
const GPX_FILE_PATH = '/bartelopet-2025.gpx';

export function HvordanClient() {
  useEffect(() => {
    // Check if script is already loaded
    if (document.querySelector('script[src="https://strava-embeds.com/embed.js"]')) {
      return;
    }

    // Load Strava embed script
    const script = document.createElement('script');
    script.src = 'https://strava-embeds.com/embed.js';
    script.async = true;
    document.body.appendChild(script);
  }, []);

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="mx-auto max-w-4xl space-y-12">
        {/* Header */}
        <div className="space-y-4 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/20 px-4 py-2">
            <MapPin className="h-4 w-4 text-primary-foreground" />
            <span className="text-sm font-medium text-primary-foreground">Komme i gang</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">Hvordan bruke ruten</h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Følg instruksjonene nedenfor for å laste ned og bruke ruten på Strava eller din
            GPS-klokke
          </p>
        </div>

        {/* Route Embed */}
        <Card className="border-border/50 bg-card/50 backdrop-blur">
          <CardContent className="p-6 md:p-8">
            <h2 className="mb-4 text-2xl font-bold">Ruten</h2>
            <div className="min-h-[400px] w-full">
              <div
                className="strava-embed-placeholder"
                data-embed-type="route"
                data-embed-id={STRAVA_ROUTE_ID}
                data-units="metric"
                data-full-width="true"
                data-style="dark"
                data-terrain="3d"
                data-map-hash="11.81/58.96725/5.73104"
                data-from-embed="true"
              />
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <Button asChild variant="outline" size="sm">
                <a
                  href={STRAVA_ROUTE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  Åpne i Strava
                </a>
              </Button>
              <Button asChild variant="outline" size="sm">
                <a href={GPX_FILE_PATH} download className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Last ned GPX-fil
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Using Strava on Phone */}
        <Card className="border-border/50 bg-card/50 backdrop-blur">
          <CardContent className="space-y-6 p-6 md:p-8">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/20">
                <Smartphone className="h-6 w-6 text-primary-foreground" />
              </div>
              <h2 className="text-2xl font-bold">Bruke ruten på Strava (Mobil)</h2>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">1. Åpne ruten i Strava-appen</h3>
                <p className="text-muted-foreground">
                  Klikk på lenken ovenfor for å åpne ruten i Strava, eller søk etter
                  &quot;Barten&quot; i Strava-appen.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-semibold">2. Lagre ruten</h3>
                <p className="text-muted-foreground">
                  I Strava-appen, trykk på &quot;Lagre&quot;-knappen for å lagre ruten til dine
                  favorittruter.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-semibold">3. Start en aktivitet med ruten</h3>
                <ul className="ml-4 list-inside list-disc space-y-1 text-muted-foreground">
                  <li>Åpne Strava-appen og trykk på &quot;+&quot; for å starte en ny aktivitet</li>
                  <li>Velg &quot;Løp&quot; eller &quot;Gå&quot; (begge er helt greit!)</li>
                  <li>I innstillingsmenyen, velg &quot;Bruk rute&quot;</li>
                  <li>Velg &quot;Barten&quot;-ruten fra listen over lagrede ruter</li>
                  <li>Start opptaket og følg ruten på kartet</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-semibold">4. Opptak og navigasjon</h3>
                <p className="text-muted-foreground">
                  Strava vil guide deg langs ruten med visuelle instruksjoner på kartet. Du får
                  varsler hvis du går utenfor ruten.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Using GPS Watch */}
        <Card className="border-border/50 bg-card/50 backdrop-blur">
          <CardContent className="space-y-6 p-6 md:p-8">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent/20">
                <Watch className="h-6 w-6 text-accent" />
              </div>
              <h2 className="text-2xl font-bold">Last opp til GPS-klokke (Garmin, Polar, etc.)</h2>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">1. Last ned GPX-filen</h3>
                <p className="text-muted-foreground">
                  Klikk på &quot;Last ned GPX-fil&quot;-knappen ovenfor for å laste ned ruten som en
                  GPX-fil.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-semibold">2. Garmin Connect</h3>
                <ul className="ml-4 list-inside list-disc space-y-1 text-muted-foreground">
                  <li>
                    Logg inn på{' '}
                    <a
                      href="https://connect.garmin.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent hover:underline"
                    >
                      Garmin Connect
                    </a>
                  </li>
                  <li>Gå til &quot;Training&quot; → &quot;Courses&quot; → &quot;Import&quot;</li>
                  <li>Last opp GPX-filen du nettopp lastet ned</li>
                  <li>Ruten vil nå være tilgjengelig på Garmin Connect</li>
                  <li>Synkroniser klokken din for å overføre ruten</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-semibold">3. Polar Flow</h3>
                <ul className="ml-4 list-inside list-disc space-y-1 text-muted-foreground">
                  <li>
                    Logg inn på{' '}
                    <a
                      href="https://flow.polar.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent hover:underline"
                    >
                      Polar Flow
                    </a>
                  </li>
                  <li>
                    Gå til &quot;Training&quot; → &quot;Routes&quot; → &quot;Import route&quot;
                  </li>
                  <li>Last opp GPX-filen</li>
                  <li>Synkroniser klokken din for å få ruten tilgjengelig</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-semibold">4. Andre GPS-klokker</h3>
                <p className="text-muted-foreground">
                  De fleste GPS-klokker støtter GPX-filer. Konsulter brukermanualen for din
                  spesifikke klokke for instruksjoner om hvordan du importerer ruter. Vanligvis kan
                  du importere via:
                </p>
                <ul className="ml-4 list-inside list-disc space-y-1 text-muted-foreground">
                  <li>
                    Produsentens webportal (Garmin Connect, Polar Flow, Suunto Movescount, etc.)
                  </li>
                  <li>Produsentens mobilapp</li>
                  <li>Direkte overføring via USB eller Bluetooth</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alternative Route */}
        <Card className="border-primary/20 bg-card/50 backdrop-blur">
          <CardContent className="space-y-6 p-6 md:p-8">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/20">
                <MapPin className="h-6 w-6 text-primary-foreground" />
              </div>
              <h2 className="text-2xl font-bold">Ikke i Stavanger?</h2>
            </div>

            <div className="space-y-4">
              <p className="text-muted-foreground">
                Hvis du ikke har mulighet til å gjennomføre løypen i Stavanger, kan du fortsatt
                delta ved å lage din egen barteløype i din egen by!
              </p>

              <div className="rounded-lg border border-accent/30 bg-accent/10 p-4">
                <p className="text-sm">
                  <span className="font-semibold">Husk:</span> Det viktigste er at du støtter saken
                  og har det gøy underveis! Din deltakelse teller like mye uansett hvor du løper/går
                  eller hvor langt du beveger deg.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tips */}
        <Card className="border-accent/20 bg-card/50 backdrop-blur">
          <CardContent className="space-y-4 p-6 md:p-8">
            <h2 className="text-2xl font-bold">Tips og triks</h2>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex gap-2">
                <span className="text-accent">•</span>
                <span>Sørg for at GPS-en din har god signaldekning før du starter</span>
              </li>
              <li className="flex gap-2">
                <span className="text-accent">•</span>
                <span>Lad batteriet på enheten din før løpet</span>
              </li>
              <li className="flex gap-2">
                <span className="text-accent">•</span>
                <span>
                  Test ruten på en kortere strekning først hvis du er usikker på navigasjonen
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-accent">•</span>
                <span>Ta gjerne bilder underveis for å dele i galleriet!</span>
              </li>
              <li className="flex gap-2">
                <span className="text-accent">•</span>
                <span>
                  Husk refleks og hodelykt hvis du løper på kvelden - noen få plasser er det ingen
                  lys
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-accent">•</span>
                <span>
                  Vær oppmerksom på at ruten krysser veier uten fotgjengerfelt på minst ett sted.
                  Stopp opp, se deg for, og kryss forsiktig når det er trygt
                </span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Back to Home */}
        <div className="flex justify-center">
          <Button asChild size="lg" variant="outline">
            <Link href="/">Tilbake til forsiden</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
