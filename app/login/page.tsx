'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';
import { useSearchParams } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const searchParams = useSearchParams();

  // Display error from callback if present
  useEffect(() => {
    const errorParam = searchParams.get('error');
    const messageParam = searchParams.get('message');

    if (errorParam) {
      const errorMessages: Record<string, string> = {
        auth_failed: 'Innlogging feilet. Vennligst prøv igjen.',
        verification_failed: messageParam || 'Kunne ikke verifisere innloggingslenken.',
        invalid_link: 'Innloggingslenken er ugyldig eller utløpt. Vennligst be om en ny.',
      };
      setError(errorMessages[errorParam] || 'En ukjent feil oppstod');
    }
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const supabase = createClient();

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
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
      <div className="container mx-auto px-4 py-16 max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>Sjekk e-posten din</CardTitle>
            <CardDescription>
              Vi har sendt en innloggingslenke til {email}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Klikk på lenken i e-posten for å logge inn. Lenken er gyldig i 1 time.
              </p>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setSent(false)}
              >
                Send ny lenke
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-16 max-w-md">
      <Card>
        <CardHeader>
          <CardTitle>Logg inn</CardTitle>
          <CardDescription>
            Velg hvordan du vil logge inn
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {error && (
              <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Google Login Button */}
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
              Fortsett med Google
            </Button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Eller med e-post
                </span>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
              <p className="font-semibold text-blue-900 mb-1">👋 Ny her?</p>
              <p className="text-blue-700">
                Du må{' '}
                <a href="/pamelding" className="underline font-semibold">
                  registrere deg først
                </a>{' '}
                før du kan logge inn. Etter registrering får du en innloggingslenke på e-post.
              </p>
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

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Sender...' : 'Send innloggingslenke'}
            </Button>

            <div className="text-center pt-2">
              <p className="text-sm text-muted-foreground">
                Ikke registrert ennå?
              </p>
              <a
                href="/pamelding"
                className="text-sm text-primary hover:underline font-semibold"
              >
                Meld deg på Barteløpet her →
              </a>
            </div>
          </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
