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
import { GoogleIcon } from '@/app/_shared/components/google-icon';
import { CategoryPicker } from '@/app/_shared/components/category-picker';

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
        <CardHeader className="border-b-2 border-foreground bg-foreground text-background">
          <CardTitle className="font-display text-3xl font-black uppercase">Du er med!</CardTitle>
          <CardDescription className="text-background/75">
            Du er nå påmeldt Barteløpet {getCurrentEventYear()}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <div
            className="relative mx-auto max-w-xs border-2 border-foreground bg-accent px-6 py-8 text-center shadow-[6px_6px_0_hsl(var(--secondary))]"
            aria-live="polite"
          >
            <span
              aria-hidden="true"
              className="absolute left-3 top-3 h-3 w-3 rounded-full border-2 border-foreground bg-background"
            />
            <span
              aria-hidden="true"
              className="absolute right-3 top-3 h-3 w-3 rounded-full border-2 border-foreground bg-background"
            />
            <p className="text-[11px] font-black uppercase tracking-[0.2em]">Ditt startnummer</p>
            <p className="font-display text-8xl font-black tabular-nums leading-none">
              {bibNumber}
            </p>
            <p className="mt-2 text-[11px] font-black uppercase tracking-[0.2em]">
              Barteløpet · For Prosjekt SUT
            </p>
          </div>

          {isOAuthUser ? (
            <div className="space-y-2 border-2 border-foreground bg-accent/30 p-4">
              <p className="font-black">✅ Logget inn med Google</p>
              <p className="text-sm text-foreground">
                Du er nå påmeldt og din e-postadresse er bekreftet. Du blir automatisk sendt til
                dashboardet.
              </p>
            </div>
          ) : (
            <div className="space-y-2 border-2 border-foreground bg-accent/30 p-4">
              <p className="font-black">📧 Bekreft e-postadressen din</p>
              <p className="text-sm text-foreground">
                Vi har sendt en bekreftelseslenke til din e-post. Klikk på lenken for å aktivere
                kontoen din og logge inn.
              </p>
            </div>
          )}

          <div className="space-y-2 border-2 border-foreground/20 bg-muted/60 p-4">
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
      <CardHeader className="border-b-2 border-foreground bg-accent">
        <CardTitle className="font-display text-3xl font-black uppercase">Påmelding</CardTitle>
        <CardDescription className="text-foreground/75">
          {needsCompletion
            ? 'E-posten din er bekreftet! Fullfør registreringen ved å fylle ut informasjonen under'
            : prefillData
              ? 'Fullfør registreringen din ved å fylle ut informasjonen under'
              : 'Alle feltene må fylles ut bortsett fra telefonnummer'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-6">
        {needsCompletion && (
          <div className="mb-4 border-2 border-foreground bg-accent/30 p-4 text-sm">
            <p className="mb-2 font-black">✅ E-post bekreftet!</p>
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
              <div
                role="alert"
                className="border-2 border-destructive bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive"
              >
                {oAuthError}
              </div>
            )}

            {/* Google Signup Button */}
            <Button
              onClick={() => handleOAuthLogin('google')}
              variant="line"
              size="lg"
              className="w-full normal-case tracking-normal"
              type="button"
            >
              <GoogleIcon className="mr-2 h-5 w-5" />
              Meld deg på med Google
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-foreground/25" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 font-bold tracking-[0.14em] text-muted-foreground">
                  Eller fyll ut skjemaet under
                </span>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div
              role="alert"
              className="border-2 border-destructive bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive"
            >
              {error}
            </div>
          )}

          {prefillData && !needsCompletion && (
            <div className="border-2 border-foreground bg-accent/30 p-4 text-sm">
              <div className="mb-2 flex items-start justify-between gap-2">
                <div className="flex-1">
                  <p className="mb-1 font-black">✅ Logget inn med Google</p>
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
                  className="underline underline-offset-2 hover:bg-foreground hover:text-background"
                >
                  Logg ut
                </Button>
              </div>
            </div>
          )}

          {error && error.includes('tilgangsfeil') && (
            <div className="border-2 border-foreground bg-accent/30 p-4 text-sm">
              <p className="mb-2 font-black">🔓 Prøv å logge ut</p>
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

          <fieldset className="space-y-3">
            <legend className="mb-3 text-sm font-semibold">
              Hvilke startnummer er du interessert i? *
            </legend>
            <CategoryPicker
              selected={interests}
              disabled={loading}
              onToggle={(slug) =>
                setInterests((current) =>
                  current.includes(slug)
                    ? current.filter((item) => item !== slug)
                    : [...current, slug]
                )
              }
            />
            <p className="text-xs text-muted-foreground">
              {interests.length === 0
                ? 'Velg minst én kategori for å kunne samle lodd.'
                : 'Du kan endre valgene på Min side frem til registreringen stenger.'}
            </p>
          </fieldset>

          <div className="space-y-3 pt-2">
            <div className="flex items-start space-x-3 border-2 border-foreground/20 bg-muted/50 p-4">
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
                    className="font-semibold underline decoration-secondary decoration-2 underline-offset-2 hover:decoration-foreground"
                  >
                    vilkårene for bruk
                  </Link>{' '}
                  og{' '}
                  <Link
                    href="/personvern"
                    target="_blank"
                    className="font-semibold underline decoration-secondary decoration-2 underline-offset-2 hover:decoration-foreground"
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
            variant="ink"
            size="xl"
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
