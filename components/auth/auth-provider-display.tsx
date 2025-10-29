import { Mail, Smartphone } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface AuthProviderDisplayProps {
  /** Which authentication provider(s) are linked to the account */
  authProvider: 'email' | 'vipps' | 'both';
  /** Email address (always present) */
  email: string;
  /** Phone number from Vipps (only if Vipps is linked) */
  vippsPhoneNumber?: string | null;
  /** Optional additional class names */
  className?: string;
}

/**
 * Displays which authentication methods are linked to the user's account
 * Shows badges for Email and/or Vipps authentication
 * Displays phone number when Vipps is linked
 */
export function AuthProviderDisplay({
  authProvider,
  email,
  vippsPhoneNumber,
  className = '',
}: AuthProviderDisplayProps) {
  const hasEmail = authProvider === 'email' || authProvider === 'both';
  const hasVipps = authProvider === 'vipps' || authProvider === 'both';

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg">Påloggingsmetoder</CardTitle>
        <CardDescription>
          Koblet til kontoen din
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Email authentication */}
        {hasEmail && (
          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
            <div className="rounded-full bg-primary-100 p-2">
              <Mail className="h-4 w-4 text-primary-600" aria-hidden="true" />
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">E-post</span>
                <Badge variant="success" className="text-xs">
                  Aktiv
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{email}</p>
            </div>
          </div>
        )}

        {/* Vipps authentication */}
        {hasVipps && (
          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
            <div className="rounded-full bg-accent-100 p-2">
              <Smartphone className="h-4 w-4 text-accent-600" aria-hidden="true" />
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">Vipps</span>
                <Badge variant="success" className="text-xs">
                  Aktiv
                </Badge>
              </div>
              {vippsPhoneNumber && (
                <p className="text-sm text-muted-foreground">
                  Telefon: {formatPhoneNumber(vippsPhoneNumber)}
                </p>
              )}
            </div>
          </div>
        )}

        {!hasEmail && !hasVipps && (
          <div className="text-center py-4 text-sm text-muted-foreground">
            Ingen påloggingsmetoder konfigurert
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Format Norwegian phone number for display
 * Converts +4712345678 to +47 123 45 678
 */
function formatPhoneNumber(phone: string): string {
  // Remove any existing spaces
  const cleaned = phone.replace(/\s/g, '');

  // Check if it starts with +47 (Norway)
  if (cleaned.startsWith('+47') && cleaned.length === 11) {
    return `+47 ${cleaned.slice(3, 6)} ${cleaned.slice(6, 8)} ${cleaned.slice(8)}`;
  }

  // If it's 8 digits without country code
  if (cleaned.length === 8 && /^\d{8}$/.test(cleaned)) {
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 5)} ${cleaned.slice(5)}`;
  }

  // Return as-is if format is unknown
  return phone;
}
