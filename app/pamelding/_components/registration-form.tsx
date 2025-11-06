'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/app/_shared/components/ui/button';
import { Input } from '@/app/_shared/components/ui/input';
import { Label } from '@/app/_shared/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/_shared/components/ui/card';
import { Checkbox } from '@/app/_shared/components/ui/checkbox';
import { createClient } from '@/app/_shared/lib/supabase/client';
import { getCurrentEventYear } from '@/app/_shared/lib/utils/event-year';
import Link from 'next/link';

export function RegistrationForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [oAuthError, setOAuthError] = useState('');
  const [bibNumber, setBibNumber] = useState<number | null>(null);
  const [signingOut, setSigningOut] = useState(false);
  const [prefillData, setPrefillData] = useState<{
    email: string;
    full_name: string;
  } | null>(null);
  const [consentAccepted, setConsentAccepted] = useState(false);

  // Load OAuth user data if logged in
  useEffect(() => {
    async function loadUserData() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user && user.app_metadata.provider !== 'email') {
        // User logged in with OAuth (Google/Facebook)
        setPrefillData({
          email: user.email || '',
          full_name: user.user_metadata?.full_name || user.user_metadata?.name || '',
        });
      }
    }

    loadUserData();
  }, []);

  async function handleOAuthLogin(provider: 'google') {
    setOAuthError('');
    const supabase = createClient();

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setOAuthError(`Kunne ikke logge inn med Google`);
    }
  }

  async function handleSignOut() {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    // Clear any stored flags
    sessionStorage.clear();
    localStorage.clear();
    // Redirect to home or refresh
    window.location.href = '/pamelding';
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate consent
    if (!consentAccepted) {
      setError('Du må akseptere vilkårene og personvernerklæringen for å registrere deg');
      setLoading(false);
      return;
    }

    const formData = new FormData(e.currentTarget);
    const data = {
      full_name: formData.get('full_name') as string,
      email: formData.get('email') as string,
      postal_address: formData.get('postal_address') as string,
      phone_number: formData.get('phone_number') as string || null,
    };

    const supabase = createClient();

    try {
      // Check if user is already authenticated
      const { data: { user } } = await supabase.auth.getUser();

      // Get the current event year
      const currentEventYear = getCurrentEventYear();

      // Get the next bib number for the current event year
      const { data: maxBib, error: maxBibError } = await supabase
        .from('participants')
        .select('bib_number')
        .eq('event_year', currentEventYear)
        .order('bib_number', { ascending: false })
        .limit(1)
        .maybeSingle();

      // Handle 403/permission errors (likely stale/invalid session)
      if (maxBibError && (
        maxBibError.message?.includes('permission denied') ||
        maxBibError.message?.includes('JWT') ||
        maxBibError.code === 'PGRST301'  // PostgREST 403 error code
      )) {
        console.error('Max bib error:', maxBibError);
        setError('Det oppstod en tilgangsfeil. Vennligst prøv å logge ut og inn igjen.');
        return;
      }

      const nextBibNumber = maxBib ? maxBib.bib_number + 1 : 1;

      let participant;

      if (user) {
        // User is already authenticated (came from magic link or confirmation)
        // Insert participant and link to existing auth user
        const { data: newParticipant, error: insertError } = await supabase
          .from('participants')
          .insert({
            user_id: user.id, // Link to existing auth user
            full_name: data.full_name,
            email: data.email,
            postal_address: data.postal_address,
            phone_number: data.phone_number,
            bib_number: nextBibNumber,
            event_year: currentEventYear,
          })
          .select()
          .single();

        if (insertError) {
          if (insertError.code === '23505') {
            setError('Denne e-postadressen er allerede registrert');
          } else {
            console.error('Insert error:', insertError);
            setError('Noe gikk galt ved registrering. Prøv igjen.');
          }
          return;
        }

        participant = newParticipant;

        // User is already logged in, redirect to dashboard immediately
        setBibNumber(participant.bib_number);
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);

      } else {
        // User is NOT authenticated (normal registration flow)
        // Create new auth user with proper signup

        // Generate a secure random password (user won't use it, only magic links)
        const tempPassword = crypto.randomUUID() + crypto.randomUUID();

        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: data.email,
          password: tempPassword,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
            data: {
              full_name: data.full_name,
            },
          },
        });

        if (signUpError) {
          console.error('Signup error:', signUpError);
          if (signUpError.message.includes('already registered')) {
            setError('Denne e-postadressen er allerede registrert. Prøv å logge inn i stedet.');
          } else {
            setError('Kunne ikke opprette bruker. Prøv igjen.');
          }
          return;
        }

        if (!signUpData.user) {
          setError('Kunne ikke opprette bruker. Prøv igjen.');
          return;
        }

        // Insert participant record linked to the new user
        const { data: newParticipant, error: insertError } = await supabase
          .from('participants')
          .insert({
            user_id: signUpData.user.id, // Link to newly created auth user
            full_name: data.full_name,
            email: data.email,
            postal_address: data.postal_address,
            phone_number: data.phone_number,
            bib_number: nextBibNumber,
            event_year: currentEventYear,
          })
          .select()
          .single();

        if (insertError) {
          console.error('Insert error:', insertError);

          // If participant insert fails, we should clean up the auth user
          // But Supabase doesn't allow deleting users from client
          // The user will exist but have no participant record
          // They can complete registration via /pamelding when they confirm email

          if (insertError.code === '23505') {
            setError('Denne e-postadressen er allerede registrert');
          } else {
            setError('Noe gikk galt ved registrering. Prøv igjen.');
          }
          return;
        }

        participant = newParticipant;
        setBibNumber(participant.bib_number);
      }

    } catch (err) {
      console.error('Registration error:', err);
      setError('Noe gikk galt. Prøv igjen.');
    } finally {
      setLoading(false);
    }
  }

  if (bibNumber) {
    const isOAuthUser = prefillData !== null;

    return (
      <Card>
        <CardHeader>
          <CardTitle>Registrering vellykket! 🎉</CardTitle>
          <CardDescription>Du er nå påmeldt Barteløpet 2025</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground mb-2">Ditt startnummer er</p>
            <p className="text-6xl font-bold text-accent">{bibNumber}</p>
          </div>

          {isOAuthUser ? (
            <div className="bg-primary/10 border border-primary rounded-lg p-4 space-y-2">
              <p className="font-semibold text-accent">✅ Logget inn med Google</p>
              <p className="text-sm text-foreground">
                Du er nå påmeldt og din e-postadresse er bekreftet. Du blir automatisk sendt til dashboardet.
              </p>
            </div>
          ) : (
            <div className="bg-primary/10 border border-primary rounded-lg p-4 space-y-2">
              <p className="font-semibold text-accent">📧 Bekreft e-postadressen din</p>
              <p className="text-sm text-foreground">
                Vi har sendt en bekreftelseslenke til din e-post. Klikk på lenken for å aktivere kontoen din og logge inn.
              </p>
            </div>
          )}

          <div className="bg-muted p-4 rounded-lg space-y-2">
            <p className="font-semibold">Neste steg:</p>
            <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
              {!isOAuthUser && <li>Sjekk e-posten din og klikk på bekreftelseslenken</li>}
              {!isOAuthUser && <li>Du vil bli automatisk innlogget</li>}
              <li>Løp løypen i november</li>
              <li>Last opp bilde og historien din</li>
              <li>Stem på andre deltakere</li>
            </ol>
          </div>

          {!isOAuthUser && (
            <div className="text-center text-sm text-muted-foreground">
              <p>Ikke mottatt e-post? Sjekk søppelpost-mappen din.</p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Registreringsskjema</CardTitle>
        <CardDescription>
          {prefillData
            ? 'Fullfør registreringen din ved å fylle ut informasjonen under'
            : 'Alle feltene må fylles ut bortsett fra telefonnummer'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Rask påmelding section */}
        <div className="space-y-4 pb-4">
      
          
          {oAuthError && (
            <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg text-sm">
              {oAuthError}
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
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {prefillData && (
            <div className="bg-primary/10 border border-primary rounded-lg p-4 text-sm">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1">
                  <p className="font-semibold text-accent mb-1">✅ Logget inn med Google</p>
                  <p className="text-foreground">
                    Vi har hentet ditt navn og e-post fra Google. Fyll ut resten av informasjonen for å fullføre påmeldingen.
                  </p>
                </div>
                <Button
                  type="button"
                  onClick={handleSignOut}
                  disabled={signingOut}
                  variant="ghost"
                  size="sm"
                  className="text-accent hover:text-accent/90 hover:bg-primary/20"
                >
                  Logg ut
                </Button>
              </div>
            </div>
          )}

          {error && error.includes('tilgangsfeil') && (
            <div className="bg-primary/10 border border-primary rounded-lg p-4 text-sm">
              <p className="font-semibold text-accent mb-2">🔓 Prøv å logge ut</p>
              <p className="text-foreground mb-3">
                Det ser ut til at økten din er ugyldig. Klikk knappen under for å logge ut og prøve igjen.
              </p>
              <Button
                type="button"
                onClick={handleSignOut}
                disabled={signingOut}
                variant="outline"
                className="w-full"
              >
                {signingOut ? 'Logger ut...' : 'Logg ut og start på nytt'}
              </Button>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="full_name">Fullt navn *</Label>
            <Input
              id="full_name"
              name="full_name"
              required
              defaultValue={prefillData?.full_name || ''}
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
              defaultValue={prefillData?.email || ''}
              placeholder="ola@example.com"
              disabled={loading}
              readOnly={!!prefillData?.email}
              className={prefillData?.email ? 'bg-muted cursor-not-allowed' : ''}
            />
            <p className="text-sm text-muted-foreground">
              {prefillData?.email
                ? 'E-post bekreftet av Google'
                : 'Du vil motta innloggingslenke på denne adressen'}
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
              Pokalen sendes til denne adressen
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

          <div className="space-y-3 pt-2">
            <div className="flex items-start space-x-3 bg-muted/50 p-4 rounded-lg border">
              <Checkbox
                id="consent"
                checked={consentAccepted}
                onCheckedChange={(checked) => setConsentAccepted(checked as boolean)}
                disabled={loading}
                className="mt-1"
              />
              <div className="flex-1">
                <Label
                  htmlFor="consent"
                  className="text-sm font-normal cursor-pointer leading-relaxed text-foreground"
                >
                  Jeg har lest og aksepterer{' '}
                  <Link
                    href="/vilkar"
                    target="_blank"
                    className="text-accent hover:text-accent/90 hover:underline font-medium underline"
                  >
                    vilkårene for bruk
                  </Link>
                  {' '}og{' '}
                  <Link
                    href="/personvern"
                    target="_blank"
                    className="text-accent hover:text-accent/90 hover:underline font-medium underline"
                  >
                    personvernerklæringen
                  </Link>
                  . Jeg samtykker til at mine opplysninger behandles i henhold til personvernerklæringen.
                  {' '}
                  <span className="block mt-2">
                    Premier vil bli utlevert i starten av desember. Arrangøren fratar ansvar fra at utlevering kan ta lengre tid.
                  </span>
                </Label>
              </div>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={loading || !consentAccepted}>
            {loading ? 'Registrerer...' : 'Meld meg på'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
