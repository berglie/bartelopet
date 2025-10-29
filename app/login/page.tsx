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
            Vi sender deg en innloggingslenke på e-post
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

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
        </CardContent>
      </Card>
    </div>
  );
}
