import { Button } from '@/app/_shared/components/ui/button';
import { Card, CardContent } from '@/app/_shared/components/ui/card';
import Link from 'next/link';
import { Award, Mail, Trophy } from 'lucide-react';

export default async function ThankYouPage({
  searchParams,
}: {
  searchParams: Promise<{ bib?: string }>;
}) {
  const params = await searchParams;
  const bibNumber = params.bib;

  return (
    <div className="container mx-auto max-w-2xl px-4 py-16">
      <Card className="border-accent/20 bg-card/50 backdrop-blur">
        <CardContent className="space-y-8 p-12 text-center">
          {/* Success Icon */}
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-accent/20">
            <Award className="h-10 w-10 text-accent" />
          </div>

          {/* Title */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold md:text-4xl">Gratulerer!</h1>
            <p className="text-lg text-muted-foreground">Ditt løp er registrert</p>
          </div>

          {/* Bib Number */}
          {bibNumber && (
            <div className="space-y-2 rounded-xl border border-accent/20 bg-background/50 p-8">
              <p className="text-sm text-muted-foreground">Ditt startnummer</p>
              <p className="text-6xl font-bold text-accent">{bibNumber}</p>
            </div>
          )}

          {/* Next Steps */}
          <div className="space-y-4 rounded-xl bg-muted/30 p-6 text-left">
            <h2 className="text-center text-lg font-semibold">Neste steg</h2>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Mail className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
                <div className="space-y-1">
                  <p className="text-sm font-medium">Sjekk e-posten din</p>
                  <p className="text-xs text-muted-foreground">
                    Du har fått en innloggingslenke for å se ditt dashboard
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Trophy className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
                <div className="space-y-1">
                  <p className="text-sm font-medium">Se galleriet</p>
                  <p className="text-xs text-muted-foreground">
                    Ditt bilde vil bli synlig i galleriet om kort tid
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Award className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
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
          <div className="flex flex-col gap-4 sm:flex-row">
            <Button asChild className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90">
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
