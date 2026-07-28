'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  const [needsCompletion, setNeedsCompletion] = useState(false);
  const [interests, setInterests] = useState<string[]>(['short', 'medium', 'long']);

  async function saveInterests(participantId: string, eventYear: number) {
    const supabase = createClient();
    const { error: deleteError } = await supabase
      .from('participant_distance_interests')
      .delete()
      .eq('participant_id', participantId)
      .eq('event_year', eventYear);
    if (deleteError) throw deleteError;

    const { error: interestError } = await supabase.from('participant_distance_interests').insert(
      interests.map((category) => ({
        participant_id: participantId,
        event_year: eventYear,
        category_slug: category,
      }))
    );
    if (interestError) throw interestError;
  }

  // Load OAuth user data if logged in
  useEffect(() => {
    async function loadUserData() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // Check if user has a participant record
        const { data: participant } = await supabase
          .from('participants')
          .select('id')
          .eq('user_id', user.id)
          .eq('event_year', getCurrentEventYear())
          .maybeSingle();

        if (!participant) {
          // User is authenticated but has no participant record - needs to complete registration
          setNeedsCompletion(true);
          setPrefillData({
            email: user.email || '',
            full_name: user.user_metadata?.full_name || user.user_metadata?.name || '',
          });
        } else {
          // User has a participant record, redirect to dashboard
          router.push('/dashboard');
        }
      }
    }

    loadUserData();
  }, [router]);

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
      phone_number: (formData.get('phone_number') as string) || null,
    };

    const supabase = createClient();

    try {
      // Check if user is already authenticated
      const {
        data: { user },
      } = await supabase.auth.getUser();
      console.log('Form submit - user authenticated?', !!user, user?.email);

      // Get the current event year
      const currentEventYear = getCurrentEventYear();

      // Get the next bib number for the current event year
      // Use participants_safe view since RLS blocks direct table access for non-participants
      const { data: maxBib, error: maxBibError } = await supabase
        .from('participants_safe')
        .select('bib_number')
        .eq('event_year', currentEventYear)
        .order('bib_number', { ascending: false })
        .limit(1)
        .maybeSingle();

      console.log('Max bib query result:', { maxBib, maxBibError });

      // Handle 403/permission errors (likely stale/invalid session)
      if (
        maxBibError &&
        (maxBibError.message?.includes('permission denied') ||
          maxBibError.message?.includes('JWT') ||
          maxBibError.code === 'PGRST301') // PostgREST 403 error code
      ) {
        console.error('Max bib error:', maxBibError);
        setError('Det oppstod en tilgangsfeil. Vennligst prøv å logge ut og inn igjen.');
        return;
      }

      const nextBibNumber = (maxBib?.bib_number ?? 0) + 1;
      console.log('Next bib number calculated:', nextBibNumber);

      if (user) {
        // User is already authenticated (came from magic link or confirmation)
        // Insert participant and link to existing auth user
        const { data: newParticipant, error: insertError } = await supabase
          .from('participants')
          .insert({
            user_id: user.id,
            full_name: data.full_name,
            email: data.email,
            postal_address: data.postal_address,
            phone_number: data.phone_number,
            bib_number: nextBibNumber,
            event_year: currentEventYear,
          })
          .select('id')
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
        await saveInterests(newParticipant.id, currentEventYear);

        // User is already logged in, redirect to dashboard immediately
        setBibNumber(nextBibNumber);
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
              distance_interests: interests,
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
            user_id: signUpData.user.id,
            full_name: data.full_name,
            email: data.email,
            postal_address: data.postal_address,
            phone_number: data.phone_number,
            bib_number: nextBibNumber,
            event_year: currentEventYear,
          })
          .select('id')
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
        if (signUpData.session) {
          await saveInterests(newParticipant.id, currentEventYear);
        }

        setBibNumber(nextBibNumber);
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
      <Card className="border-2 border-foreground shadow-[7px_7px_0_hsl(var(--foreground))]">
        <CardHeader>
          <CardTitle>Registrering vellykket! 🎉</CardTitle>
          <CardDescription>Du er nå påmeldt Barteløpet 2026</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="py-8 text-center">
            <p className="mb-2 text-sm text-muted-foreground">Ditt startnummer er</p>
            <p className="text-6xl font-bold text-accent">{bibNumber}</p>
          </div>

          {isOAuthUser ? (
            <div className="space-y-2 rounded-lg border border-primary bg-primary/10 p-4">
              <p className="font-semibold text-accent">✅ Logget inn med Google</p>
              <p className="text-sm text-foreground">
                Du er nå påmeldt og din e-postadresse er bekreftet. Du blir automatisk sendt til
                dashboardet.
              </p>
            </div>
          ) : (
            <div className="space-y-2 rounded-lg border border-primary bg-primary/10 p-4">
              <p className="font-semibold text-accent">📧 Bekreft e-postadressen din</p>
              <p className="text-sm text-foreground">
                Vi har sendt en bekreftelseslenke til din e-post. Klikk på lenken for å aktivere
                kontoen din og logge inn.
              </p>
            </div>
          )}

          <div className="space-y-2 rounded-lg bg-muted p-4">
            <p className="font-semibold">Neste steg:</p>
            <ol className="list-inside list-decimal space-y-1 text-sm text-muted-foreground">
              {!isOAuthUser && <li>Sjekk e-posten din og klikk på bekreftelseslenken</li>}
              {!isOAuthUser && <li>Du vil bli automatisk innlogget</li>}
              <li>Løp en valgfri tur i november</li>
              <li>Doner minst 5 kroner per kilometer</li>
              <li>Registrer turen og samle lodd til valgte startnummer</li>
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
    <Card className="border-2 border-foreground shadow-[7px_7px_0_hsl(var(--foreground))]">
      <CardHeader className="border-b-2 border-foreground bg-secondary">
        <CardTitle className="font-display text-3xl font-black uppercase">
          Registreringsskjema
        </CardTitle>
        <CardDescription>
          {needsCompletion
            ? 'E-posten din er bekreftet! Fullfør registreringen ved å fylle ut informasjonen under'
            : prefillData
              ? 'Fullfør registreringen din ved å fylle ut informasjonen under'
              : 'Alle feltene må fylles ut bortsett fra telefonnummer'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {needsCompletion && (
          <div className="mb-4 rounded-lg border border-primary bg-primary/10 p-4 text-sm">
            <p className="mb-2 font-semibold text-accent">✅ E-post bekreftet!</p>
            <p className="text-foreground">
              Din e-postadresse er bekreftet. Fyll ut resten av informasjonen under for å fullføre
              påmeldingen til Barteløpet.
            </p>
          </div>
        )}

        {/* Rask påmelding section */}
        {!needsCompletion && (
          <div className="space-y-4 pb-4">
            {oAuthError && (
              <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
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
              <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
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
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-destructive/10 px-4 py-3 text-destructive">{error}</div>
          )}

          {prefillData && !needsCompletion && (
            <div className="rounded-lg border border-primary bg-primary/10 p-4 text-sm">
              <div className="mb-2 flex items-start justify-between gap-2">
                <div className="flex-1">
                  <p className="mb-1 font-semibold text-accent">✅ Logget inn med Google</p>
                  <p className="text-foreground">
                    Vi har hentet ditt navn og e-post fra Google. Fyll ut resten av informasjonen
                    for å fullføre påmeldingen.
                  </p>
                </div>
                <Button
                  type="button"
                  onClick={handleSignOut}
                  disabled={signingOut}
                  variant="ghost"
                  size="sm"
                  className="text-accent hover:bg-primary/20 hover:text-accent/90"
                >
                  Logg ut
                </Button>
              </div>
            </div>
          )}

          {error && error.includes('tilgangsfeil') && (
            <div className="rounded-lg border border-primary bg-primary/10 p-4 text-sm">
              <p className="mb-2 font-semibold text-accent">🔓 Prøv å logge ut</p>
              <p className="mb-3 text-foreground">
                Det ser ut til at økten din er ugyldig. Klikk knappen under for å logge ut og prøve
                igjen.
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
              className={prefillData?.email ? 'cursor-not-allowed bg-muted' : ''}
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
              Brukes kun dersom en eventuell premie må sendes
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

          <fieldset className="space-y-3 rounded-lg border p-4">
            <legend className="px-1 text-sm font-semibold">
              Hvilke startnummer er du interessert i? *
            </legend>
            {[
              ['short', '0–10 km', '3 km, 5 km og 10 km'],
              ['medium', '10–30 km', '10 miles og halvmaraton'],
              ['long', '30+ km', 'Maraton og ultraløp'],
            ].map(([slug, label, help]) => (
              <label key={slug} className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={interests.includes(slug)}
                  onChange={() =>
                    setInterests((current) =>
                      current.includes(slug)
                        ? current.filter((item) => item !== slug)
                        : [...current, slug]
                    )
                  }
                  className="h-4 w-4"
                  disabled={loading}
                />
                <span className="text-sm">
                  <strong>{label}</strong>
                  <span className="ml-2 text-muted-foreground">{help}</span>
                </span>
              </label>
            ))}
            <p className="text-xs text-muted-foreground">
              Du kan endre valgene på Min side frem til registreringen stenger.
            </p>
          </fieldset>

          <div className="space-y-3 pt-2">
            <div className="flex items-start space-x-3 rounded-lg border bg-muted/50 p-4">
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
                  className="cursor-pointer text-sm font-normal leading-relaxed text-foreground"
                >
                  Jeg har lest og aksepterer{' '}
                  <Link
                    href="/vilkar"
                    target="_blank"
                    className="font-medium text-accent underline hover:text-accent/90 hover:underline"
                  >
                    vilkårene for bruk
                  </Link>{' '}
                  og{' '}
                  <Link
                    href="/personvern"
                    target="_blank"
                    className="font-medium text-accent underline hover:text-accent/90 hover:underline"
                  >
                    personvernerklæringen
                  </Link>
                  . Jeg samtykker til at mine opplysninger behandles i henhold til
                  personvernerklæringen.{' '}
                  <span className="mt-2 block">
                    Premier vil bli utlevert i starten av desember. Arrangøren fratar ansvar fra at
                    utlevering kan ta lengre tid.
                  </span>
                </Label>
              </div>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={loading || !consentAccepted || interests.length === 0}
          >
            {loading ? 'Registrerer...' : 'Meld meg på'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
