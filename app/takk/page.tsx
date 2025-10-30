import { Button } from '@/app/_shared/components/ui/button';
import { Card, CardContent } from '@/app/_shared/components/ui/card';
import Link from 'next/link';
import { Award, Mail, Trophy } from 'lucide-react';

export default function ThankYouPage({
  searchParams,
}: {
  searchParams: { bib?: string };
}) {
  const bibNumber = searchParams.bib;

  return (
    <div className="container mx-auto px-4 py-16 max-w-2xl">
      <Card className="bg-card/50 border-accent/20 backdrop-blur">
        <CardContent className="p-12 text-center space-y-8">
          {/* Success Icon */}
          <div className="w-20 h-20 bg-accent/20 rounded-full flex items-center justify-center mx-auto">
            <Award className="h-10 w-10 text-accent" />
          </div>

          {/* Title */}
          <div className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-bold">Gratulerer!</h1>
            <p className="text-lg text-muted-foreground">
              Ditt løp er registrert
            </p>
          </div>

          {/* Bib Number */}
          {bibNumber && (
            <div className="bg-background/50 p-8 rounded-xl border border-accent/20 space-y-2">
              <p className="text-sm text-muted-foreground">Ditt startnummer</p>
              <p className="text-6xl font-bold text-accent">{bibNumber}</p>
            </div>
          )}

          {/* Next Steps */}
          <div className="bg-muted/30 p-6 rounded-xl space-y-4 text-left">
            <h2 className="font-semibold text-lg text-center">Neste steg</h2>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium">Sjekk e-posten din</p>
                  <p className="text-xs text-muted-foreground">
                    Du har fått en innloggingslenke for å se ditt dashboard
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Trophy className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium">Se galleriet</p>
                  <p className="text-xs text-muted-foreground">
                    Ditt bilde vil bli synlig i galleriet om kort tid
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Award className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium">Pokal på vei</p>
                  <p className="text-xs text-muted-foreground">
                    Din pokal sendes til oppgitt adresse
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90 flex-1">
              <Link href="/galleri">Se galleriet</Link>
            </Button>
            <Button asChild variant="outline" className="flex-1">
              <Link href="/">Tilbake til forsiden</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
