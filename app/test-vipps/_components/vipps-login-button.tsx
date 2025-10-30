'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

// Extend HTMLElement to include Vipps button attributes
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'vipps-button': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          brand?: string;
          language?: string;
          variant?: string;
          rounded?: string;
          verb?: string;
          branded?: string;
        },
        HTMLElement
      >;
    }
  }
}

/**
 * Vipps login button component
 * Displays the official Vipps web component button and handles authentication flow
 *
 * Features:
 * - Loads Vipps web component button from CDN
 * - Handles click navigation to /api/vipps/authorize
 * - Displays error messages from URL query params
 * - Shows loading state during redirect
 * - Uses Norwegian language
 */
export function VippsLoginButton() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check for error in URL params
  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam) {
      setError(decodeURIComponent(errorParam));
    }
  }, [searchParams]);

  const handleVippsLogin = () => {
    setLoading(true);
    setError(null);
    // Navigate to Vipps authorization endpoint
    window.location.href = '/api/vipps/authorize';
  };

  return (
    <div className="space-y-4">
      {error && (
        <div
          className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg text-sm"
          role="alert"
          aria-live="polite"
        >
          <p className="font-medium">Innlogging feilet</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      )}

      <div className="relative">
        <vipps-button
          brand="vipps"
          language="no"
          variant="primary"
          rounded="true"
          verb="login"
          branded="true"
          onClick={handleVippsLogin}
          aria-label="Logg inn med Vipps"
          style={{
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1,
            transition: 'opacity 0.2s ease-in-out',
            width: '100%',
            display: 'block',
          }}
        />

        {loading && (
          <div
            className="absolute inset-0 flex items-center justify-center bg-background/50 rounded-lg"
            aria-live="polite"
            aria-busy="true"
          >
            <div className="flex items-center gap-2 text-sm font-medium">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <span>Omdirigerer til Vipps...</span>
            </div>
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Ved å logge inn med Vipps godtar du at vi lagrer ditt navn og telefonnummer
      </p>
    </div>
  );
}
