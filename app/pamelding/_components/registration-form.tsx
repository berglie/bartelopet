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
import {
  registerParticipant,
  type PendingRegistration,
} from '@/app/_shared/lib/utils/registration';

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
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);

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
    const email = String(formData.get('email') || '').trim();
    const registration: PendingRegistration = {
      full_name: String(formData.get('full_name') || '').trim(),
      postal_address: String(formData.get('postal_address') || '').trim(),
      phone_number: String(formData.get('phone_number') || '').trim() || null,
      interests,
    };

    const supabase = createClient();

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // Logged in with Google, or confirmed e-mail without a registration yet.
        const result = await registerParticipant(supabase, registration);
        if ('error' in result) {
          setError(result.error);
          return;
        }
        setBibNumber(result.bibNumber);
        setTimeout(() => router.push('/dashboard'), 2000);
        return;
      }

      // New e-mail signup. The participant row is created by /auth/callback once the e-mail
      // address is confirmed, so nobody can register someone else's address.
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        // Login is by e-mail link only; the password is random and never shown.
        password: crypto.randomUUID() + crypto.randomUUID(),
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: { full_name: registration.full_name, registration },
        },
      });

      if (signUpError) {
        setError('Kunne ikke opprette bruker. Prøv igjen.');
        return;
      }

      if (signUpData.session) {
        // Projects without e-mail confirmation sign the user in at once.
        const result = await registerParticipant(supabase, registration);
        if ('error' in result) {
          setError(result.error);
          return;
        }
        setBibNumber(result.bibNumber);
        setTimeout(() => router.push('/dashboard'), 2000);
        return;
      }

      // Same screen whether or not the address already has an account, so the form does not
      // reveal who is registered.
      setAwaitingConfirmation(true);
    } catch {
      setError('Noe gikk galt. Prøv igjen.');
    } finally {
      setLoading(false);
    }
  }

  if (awaitingConfirmation) {
    return (
      <Card className="border-2 border-foreground shadow-[7px_7px_0_hsl(var(--foreground))]">
        <CardHeader className="border-b-2 border-foreground bg-foreground text-background">
          <CardTitle className="font-display text-3xl font-black uppercase">
            Sjekk e-posten din
          </CardTitle>
          <CardDescription className="text-background/75">
            Ett steg igjen før du er påmeldt Barteløpet {getCurrentEventYear()}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <div className="space-y-2 border-2 border-foreground bg-accent/30 p-4" aria-live="polite">
            <p className="font-black">📧 Bekreft e-postadressen din</p>
            <p className="text-sm text-foreground">
              Vi har sendt en bekreftelseslenke til e-posten din. Når du klikker på lenken, blir du
              påmeldt, får startnummeret ditt og blir logget inn.
            </p>
          </div>
          <div className="text-center text-sm text-muted-foreground">
            <p>Ikke mottatt e-post? Sjekk søppelpost-mappen din.</p>
            <p className="mt-1">
              Har du allerede en konto?{' '}
              <Link href="/login" className="font-semibold underline underline-offset-2">
                Logg inn
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (bibNumber) {
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

          <div className="space-y-2 border-2 border-foreground bg-accent/30 p-4">
            <p className="font-black">✅ Du er påmeldt</p>
            <p className="text-sm text-foreground">
              Du blir automatisk sendt til Min side, der du registrerer turene dine.
            </p>
          </div>

          <div className="space-y-2 border-2 border-foreground/20 bg-muted/60 p-4">
            <p className="font-semibold">Neste steg:</p>
            <ol className="list-inside list-decimal space-y-1 text-sm text-muted-foreground">
              <li>Løp eller gå en valgfri tur i november</li>
              <li>Registrer turen og samle ett lodd per kilometer</li>
              <li>Gi gjerne 5 kroner per kilometer til Prosjekt SUT (frivillig)</li>
            </ol>
          </div>
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
