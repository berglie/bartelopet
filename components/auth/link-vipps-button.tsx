'use client';

import { useState } from 'react';
import { Smartphone, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface LinkVippsButtonProps {
  /** Whether Vipps is already linked to this account */
  isLinked?: boolean;
  /** Callback after successful linking */
  onSuccess?: () => void;
  /** Optional additional class names */
  className?: string;
}

/**
 * Button for existing users to link their Vipps account
 * Features:
 * - Check if already linked (don't show if linked)
 * - Confirmation dialog before linking
 * - Call /api/vipps/link-account endpoint
 * - Handle success/error states
 * - Norwegian text
 */
export function LinkVippsButton({
  isLinked = false,
  onSuccess,
  className = '',
}: LinkVippsButtonProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Don't render if already linked
  if (isLinked) {
    return null;
  }

  // Show success state
  if (success) {
    return (
      <Card className={`border-accent-500 bg-accent-50 ${className}`}>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 text-accent-700">
            <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
            <div>
              <p className="font-medium">Vipps er koblet til kontoen din!</p>
              <p className="text-sm text-accent-600 mt-1">
                Du kan nå logge inn med Vipps
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleLinkVipps = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/vipps/link-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Kunne ikke koble til Vipps');
      }

      // Redirect to Vipps authorization
      if (data.authorizationUrl) {
        window.location.href = data.authorizationUrl;
      } else {
        setSuccess(true);
        onSuccess?.();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Noe gikk galt. Prøv igjen.');
      setShowConfirm(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Main button */}
      {!showConfirm && (
        <Button
          onClick={() => setShowConfirm(true)}
          variant="outline"
          className={`w-full ${className}`}
          aria-label="Koble til Vipps"
        >
          <Smartphone className="h-4 w-4 mr-2" aria-hidden="true" />
          Koble til Vipps
        </Button>
      )}

      {/* Confirmation modal */}
      {showConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-dialog-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowConfirm(false);
            }
          }}
        >
          <Card className="w-full max-w-md mx-4 shadow-lg">
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-accent-100 p-2 mt-1">
                  <Smartphone className="h-5 w-5 text-accent-600" aria-hidden="true" />
                </div>
                <div className="flex-1">
                  <h2
                    id="confirm-dialog-title"
                    className="text-lg font-semibold"
                  >
                    Koble til Vipps?
                  </h2>
                  <div className="mt-2 space-y-2 text-sm text-muted-foreground">
                    <p>
                      Du vil bli omdirigert til Vipps for å bekrefte identiteten din.
                    </p>
                    <p>
                      Etter vellykket autentisering kan du logge inn med Vipps i tillegg til e-post.
                    </p>
                  </div>
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2 bg-destructive/10 text-destructive px-4 py-3 rounded-lg text-sm">
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" aria-hidden="true" />
                  <p>{error}</p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowConfirm(false);
                    setError(null);
                  }}
                  disabled={loading}
                >
                  Avbryt
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleLinkVipps}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                      Kobler til...
                    </>
                  ) : (
                    'Fortsett til Vipps'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
