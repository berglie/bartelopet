'use client';

import { RegistrationForm } from '@/app/pamelding/_components/registration-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/_shared/components/ui/card';
import { EditRestrictionGuard, ReadOnlyBanner } from './_components/edit-restriction-guard';
import { getCurrentEventYear } from '@/app/_shared/lib/utils/year';

export default function SubmitPage() {
  const currentYear = getCurrentEventYear();

  return (
    <div className="container mx-auto px-4 py-16 max-w-3xl">
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold">Meld deg på Barteløpet</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Registrer deg for å delta i Barteløpet {currentYear}
          </p>
        </div>

        {/* Read-only banner */}
        <ReadOnlyBanner year={currentYear} />

        <EditRestrictionGuard year={currentYear}>
          {/* Info Card */}
          <Card className="bg-card/50 border-accent/20 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-accent">Slik fungerer det</CardTitle>
              <CardDescription>Følg disse enkle stegene:</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-accent/20 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-accent text-xs font-semibold">1</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">Registrer deg:</strong> Fyll ut skjemaet under og få ditt startnummer
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-accent/20 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-accent text-xs font-semibold">2</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">Løp:</strong> Gjennomfør løpet når som helst i november
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-accent/20 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-accent text-xs font-semibold">3</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">Registrer fullføring:</strong> Logg inn på dashboardet ditt og last opp bilde fra løpet
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Registration Form */}
          <RegistrationForm />
        </EditRestrictionGuard>
      </div>
    </div>
  );
}
