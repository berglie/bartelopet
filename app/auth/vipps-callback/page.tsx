'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Vipps OAuth Callback Loading Page
 *
 * This page is shown while the OAuth callback is being processed.
 * The actual OAuth logic happens in /api/vipps/callback route.
 *
 * Flow:
 * 1. User is redirected here from Vipps with code and state
 * 2. This page shows a loading spinner
 * 3. Browser redirects to /api/vipps/callback
 * 4. API route processes OAuth and redirects to dashboard
 */
export default function VippsCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    // Check for error parameters
    const errorParam = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');
    const message = searchParams.get('message');

    if (errorParam) {
      setError(errorDescription || message || 'En feil oppstod under innlogging');
      return;
    }

    // Redirect to API callback route
    const callbackUrl = new URL('/api/vipps/callback', window.location.origin);

    // Preserve all query parameters
    searchParams.forEach((value, key) => {
      callbackUrl.searchParams.set(key, value);
    });

    // Small delay to show loading state
    const timer = setTimeout(() => {
      window.location.href = callbackUrl.toString();
    }, 500);

    return () => clearTimeout(timer);
  }, [searchParams]);

  // Countdown timer for error state
  useEffect(() => {
    if (error && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (error && countdown === 0) {
      router.push('/login');
    }
  }, [error, countdown, router]);

  if (error) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-md">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Innlogging feilet</CardTitle>
            <CardDescription>
              Det oppstod en feil under innlogging med Vipps
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Sender deg tilbake til innlogging om {countdown} sekund{countdown !== 1 ? 'er' : ''}...
            </p>
            <button
              onClick={() => router.push('/login')}
              className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Gå til innlogging nå
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-16 max-w-md">
      <Card>
        <CardHeader>
          <CardTitle>Logger inn med Vipps</CardTitle>
          <CardDescription>
            Vennligst vent mens vi fullfører innloggingen...
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <div className="relative w-16 h-16 mb-4">
            <div className="absolute inset-0 border-4 border-primary/20 rounded-full" />
            <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-sm text-muted-foreground text-center">
            Behandler innlogging...
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
