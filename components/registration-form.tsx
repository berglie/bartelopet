'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';

export function RegistrationForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [bibNumber, setBibNumber] = useState<number | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const data = {
      full_name: formData.get('full_name') as string,
      email: formData.get('email') as string,
      postal_address: formData.get('postal_address') as string,
      phone_number: formData.get('phone_number') as string || null,
    };

    const supabase = createClient();

    try {
      // Get the next bib number
      const { data: maxBib } = await supabase
        .from('participants')
        .select('bib_number')
        .order('bib_number', { ascending: false })
        .limit(1)
        .single();

      const nextBibNumber = maxBib ? maxBib.bib_number + 1 : 1001;

      // Insert the participant
      const { data: participant, error: insertError } = await supabase
        .from('participants')
        .insert({
          ...data,
          bib_number: nextBibNumber,
        })
        .select()
        .single();

      if (insertError) {
        if (insertError.code === '23505') {
          setError('Denne e-postadressen er allerede registrert');
        } else {
          setError('Noe gikk galt ved registrering. Prøv igjen.');
        }
        return;
      }

      setBibNumber(participant.bib_number);

      // Send magic link for future login
      await supabase.auth.signInWithOtp({
        email: data.email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
    } catch (err) {
      setError('Noe gikk galt. Prøv igjen.');
    } finally {
      setLoading(false);
    }
  }

  if (bibNumber) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Registrering vellykket! 🎉</CardTitle>
          <CardDescription>Du er nå påmeldt Barteløpet 2024</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground mb-2">Ditt startnummer er</p>
            <p className="text-6xl font-bold text-primary">{bibNumber}</p>
          </div>

          <div className="bg-muted p-4 rounded-lg space-y-2">
            <p className="font-semibold">Neste steg:</p>
            <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
              <li>Sjekk e-posten din for innloggingslenke</li>
              <li>Logg inn på dashboardet ditt</li>
              <li>Løp 10km i november</li>
              <li>Last opp bilde og historien din</li>
              <li>Stem på andre deltakere</li>
            </ol>
          </div>

          <Button onClick={() => router.push('/login')} className="w-full">
            Gå til innlogging
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Registreringsskjema</CardTitle>
        <CardDescription>
          Alle feltene må fylles ut bortsett fra telefonnummer
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="full_name">Fullt navn *</Label>
            <Input
              id="full_name"
              name="full_name"
              required
              placeholder="Ola Nordmann"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">E-postadresse *</Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              placeholder="ola@example.com"
              disabled={loading}
            />
            <p className="text-sm text-muted-foreground">
              Du vil motta innloggingslenke på denne adressen
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="postal_address">Postadresse *</Label>
            <Input
              id="postal_address"
              name="postal_address"
              required
              placeholder="Gateveien 1, 4000 Stavanger"
              disabled={loading}
            />
            <p className="text-sm text-muted-foreground">
              Medaljen sendes til denne adressen
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone_number">Telefonnummer (valgfritt)</Label>
            <Input
              id="phone_number"
              name="phone_number"
              type="tel"
              placeholder="12345678"
              disabled={loading}
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Registrerer...' : 'Meld meg på'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
