'use client';

import { Card, CardContent } from '@/app/_shared/components/ui/card';
import { Button } from '@/app/_shared/components/ui/button';
import { MapPin, Download, ExternalLink, Smartphone, Watch } from 'lucide-react';
import Link from 'next/link';
import { useEffect } from 'react';

const STRAVA_ROUTE_ID = '3294997454532404222';
const STRAVA_ROUTE_URL = 'https://www.strava.com/routes/3294997454532404222';
const GPX_FILE_PATH = '/bartelopet-route-2025.gpx';

export function HvordanClient() {
  useEffect(() => {
    // Load Strava embed script
    const script = document.createElement('script');
    script.src = 'https://strava-embeds.com/embed.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      // Cleanup script on unmount
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-4xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 bg-primary/20 border border-primary/30 px-4 py-2 rounded-full">
            <MapPin className="h-4 w-4 text-primary-foreground" />
            <span className="text-sm font-medium text-primary-foreground">Komme i gang</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            Hvordan bruke ruten
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Følg instruksjonene nedenfor for å laste ned og bruke ruten på Strava eller din GPS-klokke
          </p>
        </div>

        {/* Route Embed */}
        <Card className="bg-card/50 border-border/50 backdrop-blur">
          <CardContent className="p-6 md:p-8">
            <h2 className="text-2xl font-bold mb-4">Ruten</h2>
            <div className="w-full">
              <div 
                className="strava-embed-placeholder" 
                data-embed-type="route" 
                data-embed-id={STRAVA_ROUTE_ID}
                data-style="standard" 
                data-map-hash="11.86/58.96725/5.73104" 
                data-from-embed="true"
              />
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <Button asChild variant="outline" size="sm">
                <a href={STRAVA_ROUTE_URL} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
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
        <Card className="bg-card/50 border-border/50 backdrop-blur">
          <CardContent className="p-6 md:p-8 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center shrink-0">
                <Smartphone className="h-6 w-6 text-primary-foreground" />
              </div>
              <h2 className="text-2xl font-bold">Bruke ruten på Strava (Mobil)</h2>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">1. Åpne ruten i Strava-appen</h3>
                <p className="text-muted-foreground">
                  Klikk på lenken ovenfor for å åpne ruten i Strava, eller søk etter "Barten" i Strava-appen.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-lg">2. Lagre ruten</h3>
                <p className="text-muted-foreground">
                  I Strava-appen, trykk på "Lagre"-knappen for å lagre ruten til dine favorittruter.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-lg">3. Start en aktivitet med ruten</h3>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                  <li>Åpne Strava-appen og trykk på "+" for å starte en ny aktivitet</li>
                  <li>Velg "Løp" eller "Gå"</li>
                  <li>I innstillingsmenyen, velg "Bruk rute"</li>
                  <li>Velg "Barten"-ruten fra listen over lagrede ruter</li>
                  <li>Start opptaket og følg ruten på kartet</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-lg">4. Opptak og navigasjon</h3>
                <p className="text-muted-foreground">
                  Strava vil guide deg langs ruten med visuelle instruksjoner på kartet. Du får varsler hvis du går utenfor ruten.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Using GPS Watch */}
        <Card className="bg-card/50 border-border/50 backdrop-blur">
          <CardContent className="p-6 md:p-8 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center shrink-0">
                <Watch className="h-6 w-6 text-accent" />
              </div>
              <h2 className="text-2xl font-bold">Last opp til GPS-klokke (Garmin, Polar, etc.)</h2>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">1. Last ned GPX-filen</h3>
                <p className="text-muted-foreground">
                  Klikk på "Last ned GPX-fil"-knappen ovenfor for å laste ned ruten som en GPX-fil.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-lg">2. Garmin Connect</h3>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                  <li>Logg inn på <a href="https://connect.garmin.com" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">Garmin Connect</a></li>
                  <li>Gå til "Training" → "Courses" → "Import"</li>
                  <li>Last opp GPX-filen du nettopp lastet ned</li>
                  <li>Ruten vil nå være tilgjengelig på Garmin Connect</li>
                  <li>Synkroniser klokken din for å overføre ruten</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-lg">3. Polar Flow</h3>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                  <li>Logg inn på <a href="https://flow.polar.com" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">Polar Flow</a></li>
                  <li>Gå til "Training" → "Routes" → "Import route"</li>
                  <li>Last opp GPX-filen</li>
                  <li>Synkroniser klokken din for å få ruten tilgjengelig</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-lg">4. Andre GPS-klokker</h3>
                <p className="text-muted-foreground">
                  De fleste GPS-klokker støtter GPX-filer. Konsulter brukermanualen for din spesifikke klokke for instruksjoner om hvordan du importerer ruter. Vanligvis kan du importere via:
                </p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                  <li>Produsentens webportal (Garmin Connect, Polar Flow, Suunto Movescount, etc.)</li>
                  <li>Produsentens mobilapp</li>
                  <li>Direkte overføring via USB eller Bluetooth</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tips */}
        <Card className="bg-card/50 border-accent/20 backdrop-blur">
          <CardContent className="p-6 md:p-8 space-y-4">
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
                <span>Test ruten på en kortere strekning først hvis du er usikker på navigasjonen</span>
              </li>
              <li className="flex gap-2">
                <span className="text-accent">•</span>
                <span>Ta gjerne bilder underveis for å dele i galleriet!</span>
              </li>
              <li className="flex gap-2">
                <span className="text-accent">•</span>
                <span>Husk refleks og hodelykt hvis du løper på kvelden - noen få plasser er det ingen lys</span>
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

