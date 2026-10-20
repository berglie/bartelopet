'use client';

import React, { useState } from 'react';
import { Button } from '@/app/_shared/components/ui/button';
import { Input } from '@/app/_shared/components/ui/input';
import { Label } from '@/app/_shared/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/app/_shared/components/ui/card';
import { createClient } from '@/app/_shared/lib/supabase/client';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { GoogleIcon } from '@/app/_shared/components/google-icon';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const searchParams = useSearchParams();

  // Display error from callback if present - initialize state directly
  const [error, setError] = useState(() => {
    const errorParam = searchParams.get('error');

    if (errorParam) {
      const errorMessages: Record<string, string> = {
        auth_failed: 'Innlogging feilet. Vennligst prøv igjen.',
        verification_failed: 'Kunne ikke verifisere innloggingslenken. Be om en ny.',
        invalid_link: 'Innloggingslenken er ugyldig eller utløpt. Vennligst be om en ny.',
        confirmation_failed: 'Kunne ikke bekrefte e-postadressen. Vennligst prøv igjen.',
        oauth_failed: 'Innlogging med Google feilet. Vennligst prøv igjen.',
      };
      return errorMessages[errorParam] || 'En ukjent feil oppstod';
    }
    return '';
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const supabase = createClient();

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        // New accounts are created through /pamelding, not by requesting a login link.
        shouldCreateUser: false,
      },
    });

    // Unknown addresses get the same "sent" screen, so the form does not reveal who has an
    // account. Only rate limiting is reported.
    if (error && error.status === 429) {
      setError('For mange forsøk. Vent litt og prøv igjen.');
    } else {
      setSent(true);
    }

    setLoading(false);
  }

  async function handleOAuthLogin(provider: 'google' | 'facebook') {
    setError('');
    const supabase = createClient();

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(`Kunne ikke logge inn med ${provider === 'google' ? 'Google' : 'Facebook'}`);
    }
  }

  if (sent) {
    return (
      <div className="mx-auto min-h-[calc(100svh-4.5rem)] max-w-md px-4 py-16">
        <Card className="border-2 border-foreground shadow-[7px_7px_0_hsl(var(--foreground))]">
          <CardHeader className="border-b-2 border-foreground bg-accent text-center">
            <CardTitle className="font-display text-3xl font-black uppercase">
              Sjekk e-posten din
            </CardTitle>
            <CardDescription>Vi har sendt en innloggingslenke til {email}</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4 text-center">
              <p className="text-sm text-muted-foreground">
                Klikk på lenken i e-posten for å logge inn. Lenken er gyldig i 1 time.
              </p>
              <Button variant="line" className="w-full" onClick={() => setSent(false)}>
                Send ny lenke
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-[calc(100svh-4.5rem)] max-w-md px-4 py-16">
      <div className="mb-7 text-center">
        <p className="eyebrow">Min side</p>
        <h1 className="font-display mt-2 text-5xl font-black uppercase leading-[0.9]">
          Tilbake til feltet.
        </h1>
      </div>
      <Card className="border-2 border-foreground shadow-[7px_7px_0_hsl(var(--foreground))]">
        <CardHeader className="border-b-2 border-foreground bg-accent text-center">
          <CardTitle className="font-display text-3xl font-black uppercase">Logg inn</CardTitle>
          <CardDescription>Velg hvordan du vil logge inn</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {error && (
              <div
                role="alert"
                className="border-2 border-destructive bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive"
              >
                {error}
              </div>
            )}

            {/* Google Login Button */}
            <Button
              onClick={() => handleOAuthLogin('google')}
              variant="line"
              size="lg"
              className="w-full normal-case tracking-normal"
              type="button"
            >
              <GoogleIcon className="mr-2 h-5 w-5" />
              Fortsett med Google
            </Button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-foreground/25" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 font-bold tracking-[0.14em] text-muted-foreground">
                  Eller med e-post
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-postadresse</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="din@epost.no"
                  required
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground">
                  Bruk samme e-postadresse som du registrerte deg med
                </p>
              </div>

              <Button type="submit" variant="ink" size="lg" className="w-full" disabled={loading}>
                {loading ? 'Sender...' : 'Send innloggingslenke'}
              </Button>

              <div className="pt-2 text-center">
                <p className="text-sm text-muted-foreground">Ikke registrert ennå?</p>
                <Link
                  href="/pamelding"
                  className="text-sm font-semibold underline decoration-secondary decoration-2 underline-offset-2 hover:decoration-foreground"
                >
                  Meld deg på Barteløpet her →
                </Link>
              </div>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
