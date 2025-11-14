'use client';

import { RegistrationForm } from '@/app/pamelding/_components/registration-form';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/app/_shared/components/ui/card';
import { EditRestrictionGuard, ReadOnlyBanner } from './_components/edit-restriction-guard';
import { getCurrentEventYear } from '@/app/_shared/lib/utils/year';

export default function SubmitPage() {
  const currentYear = getCurrentEventYear();

  return (
    <div className="container mx-auto max-w-3xl px-4 py-16">
      <div className="space-y-8">
        {/* Header */}
        <div className="space-y-4 text-center">
          <h1 className="text-4xl font-bold md:text-5xl">Meld deg på Barteløpet</h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Registrer deg for å delta i Barteløpet {currentYear}
          </p>
        </div>

        {/* Read-only banner */}
        <ReadOnlyBanner year={currentYear} />

        <EditRestrictionGuard year={currentYear}>
          {/* Info Card */}
          <Card className="border-accent/20 bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-accent">Slik fungerer det</CardTitle>
              <CardDescription>Følg disse enkle stegene:</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/20">
                  <span className="text-xs font-semibold text-accent">1</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">Registrer deg:</strong> Fyll ut skjemaet under
                  og få ditt startnummer
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/20">
                  <span className="text-xs font-semibold text-accent">2</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">Løp:</strong> Gjennomfør løpet når som helst i
                  november
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/20">
                  <span className="text-xs font-semibold text-accent">3</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">Registrer fullføring:</strong> Logg inn på
                  dashboardet ditt og last opp bilde fra løpet
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
