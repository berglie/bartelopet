# Vipps OAuth Implementation Documentation

## Overview

This implementation provides a complete Vipps OAuth 2.0 authentication flow for Barteløpet, supporting:

- Vipps Login (new users)
- Account linking (existing email users can link Vipps)
- PKCE (Proof Key for Code Exchange) for enhanced security
- State validation to prevent CSRF attacks
- Session management with automatic expiration
- Comprehensive error handling

## Architecture

### Flow Diagram

```
┌─────────┐      ┌──────────────┐      ┌────────┐      ┌──────────┐
│ Browser │─────►│ /api/vipps/  │─────►│ Vipps  │─────►│ Callback │
│         │      │ authorize    │      │ OAuth  │      │ Page     │
└─────────┘      └──────────────┘      └────────┘      └──────────┘
                         │                                    │
                         ▼                                    │
                 ┌──────────────┐                            │
                 │ vipps_       │                            │
                 │ sessions     │                            │
                 │ (Database)   │                            │
                 └──────────────┘                            │
                         ▲                                    │
                         │                                    │
                         └────────────────────────────────────┘
                                    │
                                    ▼
                         ┌──────────────────┐
                         │ /api/vipps/      │
                         │ callback         │
                         │                  │
                         │ 1. Validate state│
                         │ 2. Exchange code │
                         │ 3. Get user info │
                         │ 4. Create/link   │
                         │ 5. Sign in       │
                         └──────────────────┘
                                    │
                                    ▼
                         ┌──────────────────┐
                         │ Dashboard        │
                         └──────────────────┘
```

## File Structure

```
/home/stian/Repos/barteløpet/
├── app/
│   ├── api/
│   │   └── vipps/
│   │       ├── authorize/
│   │       │   └── route.ts          # OAuth initiation
│   │       ├── callback/
│   │       │   └── route.ts          # OAuth callback handler
│   │       └── link-account/
│   │           └── route.ts          # Account linking API
│   └── auth/
│       └── vipps-callback/
│           └── page.tsx              # Loading page
├── supabase/
│   └── migrations/
│       └── 20250101000003_vipps_oauth.sql  # Database schema
└── lib/
    └── supabase/
        └── types.ts                  # Updated TypeScript types
```

## Database Schema

### New Table: `vipps_sessions`

Stores temporary OAuth session data for PKCE validation:

```sql
CREATE TABLE vipps_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  state TEXT NOT NULL UNIQUE,           -- CSRF protection token
  code_verifier TEXT NOT NULL,          -- PKCE verifier
  code_challenge TEXT NOT NULL,         -- PKCE challenge (SHA256)
  redirect_uri TEXT NOT NULL,           -- OAuth redirect URI
  user_id UUID REFERENCES auth.users(id), -- For account linking
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '10 minutes')
);
```

### Updated Table: `participants`

Added Vipps authentication fields:

```sql
ALTER TABLE participants
ADD COLUMN vipps_sub TEXT UNIQUE,       -- Vipps subject identifier
ADD COLUMN auth_provider TEXT NOT NULL DEFAULT 'email'
  CHECK (auth_provider IN ('email', 'vipps', 'both'));
```

## API Endpoints

### 1. GET `/api/vipps/authorize`

**Purpose**: Initiates Vipps OAuth flow

**Process**:
1. Generates PKCE parameters (code_verifier, code_challenge)
2. Generates secure state parameter (32-char nanoid)
3. Stores session in database with 10-minute expiration
4. Redirects to Vipps authorization URL

**Query Parameters**: None required

**Environment Variables Required**:
- `VIPPS_CLIENT_ID`
- `VIPPS_REDIRECT_URI`
- `VIPPS_AUTH_URL` (optional, defaults to production)

**Response**: HTTP 302 redirect to Vipps

**Error Responses**:
- 500: Missing configuration or database error

---

### 2. GET `/api/vipps/callback`

**Purpose**: Handles OAuth callback from Vipps

**Query Parameters**:
- `code`: Authorization code (from Vipps)
- `state`: State parameter (from Vipps)
- `error`: Error code (if user denied)
- `error_description`: Error description

**Process**:
1. Validates state parameter (checks database, not expired)
2. Retrieves code_verifier from database
3. Deletes session (prevents replay attacks)
4. Exchanges code for access token (with PKCE)
5. Retrieves user info from Vipps
6. Handles account creation/linking:
   - If user exists by vipps_sub → sign in
   - If email exists → prompt for account linking
   - Otherwise → create new account
7. Creates Supabase session
8. Redirects to dashboard

**Environment Variables Required**:
- `VIPPS_CLIENT_ID`
- `VIPPS_CLIENT_SECRET`
- `VIPPS_TOKEN_URL` (optional)
- `VIPPS_USERINFO_URL` (optional)

**Success Response**: HTTP 302 redirect to `/dashboard`

**Error Responses**:
- Redirects to `/login?error=<code>&message=<message>` with Norwegian error message

**Error Codes**:
- `vipps_denied`: User cancelled OAuth
- `invalid_request`: Missing code or state
- `invalid_state`: State validation failed
- `session_expired`: OAuth session expired
- `token_exchange_failed`: Failed to get access token
- `userinfo_failed`: Failed to get user info
- `no_email`: Vipps didn't provide email
- `signup_failed`: Failed to create auth user
- `participant_failed`: Failed to create participant record

---

### 3. POST `/api/vipps/link-account`

**Purpose**: Links Vipps account to existing authenticated user

**Authentication**: Required (checks `auth.getUser()`)

**Request Body**:
```json
{
  "vipps_sub": "string" // Vipps subject identifier
}
```

**Process**:
1. Validates user is authenticated
2. Checks if user already has Vipps linked
3. Checks if vipps_sub is already used by another user
4. Updates participant record with vipps_sub
5. Updates auth_provider to 'both'

**Success Response**:
```json
{
  "success": true,
  "message": "Vipps-konto koblet til",
  "auth_provider": "both"
}
```

**Error Responses**:
- 401: Unauthorized
- 400: Already linked or validation error
- 500: Database error

---

### 4. GET `/api/vipps/link-account`

**Purpose**: Returns current linking status

**Authentication**: Required

**Success Response**:
```json
{
  "has_vipps_linked": boolean,
  "auth_provider": "email" | "vipps" | "both",
  "email": "user@example.com"
}
```

---

### 5. DELETE `/api/vipps/link-account`

**Purpose**: Unlinks Vipps account from user

**Authentication**: Required

**Success Response**:
```json
{
  "success": true,
  "message": "Vipps-konto koblet fra"
}
```

## Environment Variables

Add these to your `.env.local`:

```bash
# Required
VIPPS_CLIENT_ID=your_client_id_here
VIPPS_CLIENT_SECRET=your_client_secret_here
VIPPS_REDIRECT_URI=http://localhost:3000/auth/vipps-callback

# Optional - defaults to production
VIPPS_AUTH_URL=https://api.vipps.no/access-management-1.0/access/oauth2/auth
VIPPS_TOKEN_URL=https://api.vipps.no/access-management-1.0/access/oauth2/token
VIPPS_USERINFO_URL=https://api.vipps.no/access-management-1.0/access/userinfo
```

### Getting Vipps Credentials

1. Go to [Vipps Portal](https://portal.vipps.no)
2. Navigate to "Utvikler" → "Dine applikasjoner"
3. Create a new application or select existing
4. Get Client ID and Client Secret
5. Configure redirect URI: `http://localhost:3000/auth/vipps-callback` (dev) or `https://yourdomain.com/auth/vipps-callback` (prod)

### Test vs Production

**Test Environment**:
```bash
VIPPS_AUTH_URL=https://apitest.vipps.no/access-management-1.0/access/oauth2/auth
VIPPS_TOKEN_URL=https://apitest.vipps.no/access-management-1.0/access/oauth2/token
VIPPS_USERINFO_URL=https://apitest.vipps.no/access-management-1.0/access/userinfo
```

**Production** (default):
```bash
# No need to set these - they're the defaults
VIPPS_AUTH_URL=https://api.vipps.no/access-management-1.0/access/oauth2/auth
VIPPS_TOKEN_URL=https://api.vipps.no/access-management-1.0/access/oauth2/token
VIPPS_USERINFO_URL=https://api.vipps.no/access-management-1.0/access/userinfo
```

## Security Features

### 1. PKCE (Proof Key for Code Exchange)

Prevents authorization code interception attacks:

- Generates random `code_verifier` (128 chars)
- Creates SHA256 hash `code_challenge`
- Sends challenge to Vipps
- Sends verifier when exchanging code
- Vipps validates they match

### 2. State Parameter

Prevents CSRF attacks:

- Generates unique state (32-char nanoid)
- Stores in database with session
- Validates on callback
- Single-use (deleted after validation)

### 3. Session Expiration

Prevents stale sessions:

- Sessions expire after 10 minutes
- Automatic cleanup function provided
- Expired sessions rejected on callback

### 4. Replay Attack Prevention

- Sessions deleted immediately after use
- Code can only be exchanged once
- State is single-use

### 5. Database Constraints

- `vipps_sub` is UNIQUE (one Vipps account per user)
- `state` is UNIQUE (prevents duplicate sessions)
- `auth_provider` is constrained to valid values

## Integration with Frontend

### Add Vipps Login Button

```tsx
// In your login page
import Link from 'next/link';

export default function LoginPage() {
  return (
    <div>
      {/* Existing email login */}

      <div className="mt-4">
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

        <Link
          href="/api/vipps/authorize"
          className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 bg-[#FF5B24] text-white rounded-lg hover:bg-[#E54E1F] transition-colors"
        >
          <VippsLogo className="w-6 h-6" />
          Logg inn med Vipps
        </Link>
      </div>
    </div>
  );
}
```

### Account Linking in Settings

```tsx
// In your settings/profile page
'use client';

import { useState, useEffect } from 'react';

export default function VippsLinkingSection() {
  const [linkStatus, setLinkStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/vipps/link-account')
      .then(res => res.json())
      .then(setLinkStatus)
      .finally(() => setLoading(false));
  }, []);

  const handleUnlink = async () => {
    if (!confirm('Er du sikker på at du vil koble fra Vipps?')) return;

    await fetch('/api/vipps/link-account', { method: 'DELETE' });
    window.location.reload();
  };

  if (loading) return <div>Laster...</div>;

  return (
    <div className="border rounded-lg p-4">
      <h3 className="font-semibold mb-2">Vipps-innlogging</h3>

      {linkStatus?.has_vipps_linked ? (
        <div>
          <p className="text-sm text-muted-foreground mb-2">
            Vipps-kontoen din er koblet til. Du kan logge inn med Vipps.
          </p>
          <button
            onClick={handleUnlink}
            className="text-sm text-destructive hover:underline"
          >
            Koble fra Vipps
          </button>
        </div>
      ) : (
        <div>
          <p className="text-sm text-muted-foreground mb-2">
            Koble til Vipps for raskere innlogging.
          </p>
          <a
            href="/api/vipps/authorize"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#FF5B24] text-white text-sm rounded hover:bg-[#E54E1F]"
          >
            Koble til Vipps
          </a>
        </div>
      )}
    </div>
  );
}
```

## Error Handling

All errors redirect to `/login` with query parameters:

```typescript
// Example error handling on login page
'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function LoginPage() {
  const searchParams = useSearchParams();
  const [error, setError] = useState('');

  useEffect(() => {
    const errorCode = searchParams.get('error');
    const message = searchParams.get('message');

    if (errorCode) {
      setError(message || 'En feil oppstod');
    }
  }, [searchParams]);

  return (
    <div>
      {error && (
        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}
      {/* Login form */}
    </div>
  );
}
```

## Testing

### Manual Testing Steps

1. **New User Registration via Vipps**:
   - Click "Logg inn med Vipps"
   - Complete Vipps authentication
   - Verify redirect to dashboard
   - Check database: participant created with vipps_sub and auth_provider='vipps'

2. **Existing Vipps User Login**:
   - Click "Logg inn med Vipps"
   - Authenticate with same Vipps account
   - Verify immediate login
   - Check session is created

3. **Account Linking**:
   - Login with email
   - Go to settings
   - Click "Koble til Vipps"
   - Complete Vipps authentication
   - Verify auth_provider updated to 'both'
   - Verify can now login with either method

4. **Error Cases**:
   - Test expired session (wait 10+ minutes)
   - Test invalid state parameter
   - Test Vipps denial (cancel on Vipps page)
   - Test duplicate vipps_sub linking

### Automated Testing

```typescript
// Example test with Jest
describe('Vipps OAuth', () => {
  describe('/api/vipps/authorize', () => {
    it('should generate PKCE parameters', async () => {
      const response = await fetch('/api/vipps/authorize');
      expect(response.status).toBe(302);
      expect(response.headers.get('location')).toContain('code_challenge');
    });
  });

  describe('/api/vipps/callback', () => {
    it('should reject invalid state', async () => {
      const response = await fetch('/api/vipps/callback?code=test&state=invalid');
      expect(response.status).toBe(302);
      expect(response.headers.get('location')).toContain('error=invalid_state');
    });
  });
});
```

## Production Considerations

### 1. Rate Limiting

Implement rate limiting on OAuth endpoints:

```typescript
// Example with Vercel KV
import { Ratelimit } from '@upstash/ratelimit';
import { kv } from '@vercel/kv';

const ratelimit = new Ratelimit({
  redis: kv,
  limiter: Ratelimit.slidingWindow(5, '1 m'), // 5 requests per minute
});

// In your route handler
const identifier = request.ip ?? 'anonymous';
const { success } = await ratelimit.limit(identifier);

if (!success) {
  return new Response('Too Many Requests', { status: 429 });
}
```

### 2. Session Cleanup

Set up a cron job to clean expired sessions:

```typescript
// /api/cron/cleanup-vipps-sessions
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from('vipps_sessions')
    .delete()
    .lt('expires_at', new Date().toISOString());

  if (error) {
    console.error('Failed to cleanup sessions:', error);
    return Response.json({ error: 'Cleanup failed' }, { status: 500 });
  }

  return Response.json({ success: true });
}
```

Configure in `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/cron/cleanup-vipps-sessions",
    "schedule": "0 * * * *"
  }]
}
```

### 3. Logging and Monitoring

Add proper logging:

```typescript
// Use a logging service like Sentry or DataDog
import * as Sentry from '@sentry/nextjs';

try {
  // OAuth logic
} catch (error) {
  Sentry.captureException(error, {
    tags: {
      component: 'vipps_oauth',
      step: 'token_exchange'
    }
  });
  throw error;
}
```

### 4. Security Headers

Add to `next.config.js`:

```javascript
module.exports = {
  async headers() {
    return [
      {
        source: '/api/vipps/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          }
        ]
      }
    ];
  }
};
```

## Troubleshooting

### Common Issues

1. **"Missing Vipps configuration"**
   - Check environment variables are set
   - Verify variable names match exactly
   - Restart dev server after adding .env.local

2. **"Invalid or expired state"**
   - Session may have expired (>10 minutes)
   - Check database connection
   - Verify session was created in authorize step

3. **"Token exchange failed"**
   - Verify CLIENT_SECRET is correct
   - Check Vipps API endpoint URLs
   - Ensure redirect_uri matches exactly

4. **"No email provided by Vipps"**
   - User denied email scope
   - Email scope not requested in authorize
   - Check scope parameter includes 'email'

5. **Account linking not working**
   - User must be logged in first
   - Check auth session is valid
   - Verify vipps_sub not already used

### Debug Mode

Enable detailed logging:

```typescript
// Set in environment
DEBUG_VIPPS_OAUTH=true

// In your code
if (process.env.DEBUG_VIPPS_OAUTH) {
  console.log('Vipps OAuth Debug:', { /* details */ });
}
```

## Migration Guide

To apply the database migration:

```bash
# If using Supabase CLI
supabase migration up

# Or apply manually in Supabase dashboard
# SQL Editor → Run the contents of:
# supabase/migrations/20250101000003_vipps_oauth.sql
```

## Support and Resources

- [Vipps Login Documentation](https://developer.vippsmobilepay.com/docs/APIs/login-api/)
- [OAuth 2.0 PKCE](https://oauth.net/2/pkce/)
- [Supabase Auth Guide](https://supabase.com/docs/guides/auth)

## License

Same as Barteløpet project license.
