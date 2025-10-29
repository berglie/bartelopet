# Vipps Authentication UI Components

This directory contains React components for Vipps authentication integration in the Barteløpet application.

## Components

### 1. VippsButtonScript

Loads the Vipps checkout button web component from CDN. Include this once in your layout or login page.

**Usage:**
```tsx
import { VippsButtonScript } from '@/components/auth';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <VippsButtonScript />
      </body>
    </html>
  );
}
```

### 2. VippsLoginButton

Client component that displays the Vipps login button with error handling and loading states.

**Features:**
- Official Vipps web component button
- Error display from URL query parameters
- Loading state during redirect
- Norwegian language
- Full accessibility support

**Usage:**
```tsx
'use client';

import { VippsLoginButton } from '@/components/auth';

export default function LoginPage() {
  return (
    <div className="space-y-4">
      <h1>Logg inn</h1>
      <VippsLoginButton />
    </div>
  );
}
```

**Props:** None required. Reads error from URL search params automatically.

### 3. AuthProviderDisplay

Shows which authentication methods (Email/Vipps) are linked to the user's account.

**Features:**
- Displays badges for active auth methods
- Shows phone number when Vipps is linked
- Automatic phone number formatting (Norwegian format)
- Clean, minimal design

**Usage:**
```tsx
import { AuthProviderDisplay } from '@/components/auth';
import { createClient } from '@/lib/supabase/server';

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch participant data
  const { data: participant } = await supabase
    .from('participants')
    .select('auth_provider, email, vipps_phone_number')
    .eq('user_id', user.id)
    .single();

  return (
    <div>
      <AuthProviderDisplay
        authProvider={participant.auth_provider}
        email={participant.email}
        vippsPhoneNumber={participant.vipps_phone_number}
      />
    </div>
  );
}
```

**Props:**
- `authProvider`: 'email' | 'vipps' | 'both'
- `email`: string
- `vippsPhoneNumber?`: string | null
- `className?`: string (optional)

### 4. LinkVippsButton

Button for existing users to link their Vipps account to their email-based account.

**Features:**
- Confirmation modal before linking
- Success/error state handling
- Automatic hiding if already linked
- Loading states
- Accessible dialog implementation

**Usage:**
```tsx
'use client';

import { LinkVippsButton } from '@/components/auth';
import { useState } from 'react';

export default function AccountSettingsPage({ isVippsLinked }) {
  const [linked, setLinked] = useState(isVippsLinked);

  return (
    <div className="space-y-4">
      <h2>Koble til Vipps</h2>
      <p>Legg til Vipps som en alternativ innloggingsmetode</p>

      <LinkVippsButton
        isLinked={linked}
        onSuccess={() => setLinked(true)}
      />
    </div>
  );
}
```

**Props:**
- `isLinked?`: boolean (default: false) - Don't show button if already linked
- `onSuccess?`: () => void - Callback after successful linking
- `className?`: string (optional)

## Complete Integration Example

Here's how to integrate all components in a login page:

```tsx
'use client';

import { VippsLoginButton } from '@/components/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (!error) {
      setSent(true);
    }
    setLoading(false);
  }

  if (sent) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sjekk e-posten din</CardTitle>
          <CardDescription>
            Vi har sendt en innloggingslenke til {email}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="container mx-auto px-4 py-16 max-w-md">
      <Card>
        <CardHeader>
          <CardTitle>Logg inn</CardTitle>
          <CardDescription>
            Velg hvordan du vil logge inn
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Vipps Login */}
          <div className="space-y-2">
            <VippsLoginButton />
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Eller
              </span>
            </div>
          </div>

          {/* Email Login */}
          <form onSubmit={handleEmailLogin} className="space-y-4">
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
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Sender...' : 'Send innloggingslenke'}
            </Button>
          </form>

          <p className="text-sm text-muted-foreground text-center">
            Ikke registrert ennå?{' '}
            <a href="/pamelding" className="text-primary hover:underline">
              Meld deg på her
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
```

## Styling

All components use:
- Tailwind CSS for styling
- Existing barteløpet design tokens (colors, spacing, etc.)
- shadcn/ui patterns for consistency
- Lucide React icons
- Responsive design
- Dark mode support (via CSS variables)

## Accessibility

All components include:
- Proper ARIA labels and roles
- Keyboard navigation support
- Screen reader friendly
- Focus management
- Error announcements with `aria-live`

## Dependencies

These components require:
- Next.js 14+
- React 18+
- Tailwind CSS
- lucide-react
- class-variance-authority
- Existing UI components (Button, Card, Badge, etc.)

## API Endpoints Required

These components expect the following API endpoints to exist:

1. **GET/POST `/api/vipps/authorize`** - Initiates Vipps OAuth flow
2. **POST `/api/vipps/link-account`** - Links Vipps to existing account
3. **GET `/api/vipps/callback`** - OAuth callback handler

## Notes

- The `VippsButtonScript` component loads the official Vipps web component from their CDN
- All user-facing text is in Norwegian (Bokmål)
- Error handling follows existing patterns in the codebase
- Components are production-ready and fully typed with TypeScript
