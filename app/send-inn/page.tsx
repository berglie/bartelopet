'use client';

import { useState } from 'react';
import { RegistrationForm } from '@/app/pamelding/_components/registration-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/_shared/components/ui/card';
import { EditRestrictionGuard, ReadOnlyBanner } from './_components/edit-restriction-guard';
import { getCurrentEventYear } from '@/app/_shared/lib/utils/year';
import { Button } from '@/app/_shared/components/ui/button';
import { createClient } from '@/app/_shared/lib/supabase/client';

export default function SubmitPage() {
  const currentYear = getCurrentEventYear();
  const [error, setError] = useState('');

  async function handleOAuthLogin(provider: 'google') {
    setError('');
    const supabase = createClient();

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(`Kunne ikke logge inn med Google`);
    }
  }

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
          {/* Google Sign-up Option */}
          <Card className="bg-card/50 border-accent/20 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-accent">Rask påmelding</CardTitle>
              <CardDescription>Meld deg på med Google for raskere registrering</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {/* Google Signup Button */}
              <Button
                onClick={() => handleOAuthLogin('google')}
                variant="outline"
                className="w-full"
                type="button"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Meld deg på med Google
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">
                    Eller fyll ut skjemaet under
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

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
