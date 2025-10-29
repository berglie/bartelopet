# Vipps OAuth Implementation Examples

Complete, production-ready examples for implementing Vipps OAuth in your Next.js application.

## Table of Contents

1. [Basic Setup](#basic-setup)
2. [Login Route](#login-route)
3. [Callback Route](#callback-route)
4. [Session Management](#session-management)
5. [UI Components](#ui-components)
6. [Error Handling](#error-handling)
7. [Advanced Usage](#advanced-usage)

## Basic Setup

### 1. Environment Configuration

Create `.env.local`:

```env
VIPPS_CLIENT_ID=your-client-id
VIPPS_CLIENT_SECRET=your-client-secret
VIPPS_MERCHANT_SERIAL_NUMBER=123456
VIPPS_SUBSCRIPTION_KEY=your-subscription-key
VIPPS_REDIRECT_URI=http://localhost:3000/api/auth/vipps/callback
VIPPS_ENVIRONMENT=test
```

### 2. Session Management Helper

Create `lib/session.ts`:

```typescript
import { cookies } from 'next/headers';
import type { VippsOAuthSession } from '@/lib/vipps';

const SESSION_COOKIE_NAME = 'vipps_session';
const SESSION_MAX_AGE = 60 * 10; // 10 minutes

export async function setOAuthSession(session: VippsOAuthSession): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, JSON.stringify(session), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE,
  });
}

export async function getOAuthSession(): Promise<VippsOAuthSession | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

  if (!sessionCookie) {
    return null;
  }

  try {
    return JSON.parse(sessionCookie.value) as VippsOAuthSession;
  } catch {
    return null;
  }
}

export async function clearOAuthSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}
```

## Login Route

Create `app/api/auth/vipps/login/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import {
  generatePKCEParams,
  getVippsConfig,
  getAuthorizationUrl,
  isVippsError,
  getErrorMessage,
} from '@/lib/vipps';
import { nanoid } from 'nanoid';
import { setOAuthSession } from '@/lib/session';
import type { VippsOAuthSession } from '@/lib/vipps';

/**
 * Initiates Vipps OAuth login flow
 * GET /api/auth/vipps/login
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Generate PKCE parameters for secure OAuth flow
    const { codeVerifier, codeChallenge } = generatePKCEParams();

    // Generate random state for CSRF protection
    const state = nanoid(32);

    // Get Vipps configuration
    const config = getVippsConfig();

    // Define requested scopes
    const scopes = [
      'openid',      // Required for OpenID Connect
      'email',       // User's email address
      'name',        // User's full name
      'phoneNumber', // User's phone number
      'address',     // User's address
    ];

    // Store OAuth session data securely
    const session: VippsOAuthSession = {
      codeVerifier,
      codeChallenge,
      state,
      redirectUri: config.redirectUri,
      createdAt: Date.now(),
      scopes,
    };

    await setOAuthSession(session);

    // Build authorization URL
    const authUrl = getAuthorizationUrl(config, {
      state,
      codeChallenge,
      scope: scopes.join(' '),
    });

    // Redirect user to Vipps login
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('Vipps login error:', error);

    // Handle Vipps-specific errors
    if (isVippsError(error)) {
      const message = getErrorMessage(error.code);
      return NextResponse.json(
        { error: message, code: error.code },
        { status: 500 }
      );
    }

    // Generic error
    return NextResponse.json(
      { error: 'Failed to initiate Vipps login' },
      { status: 500 }
    );
  }
}
```

## Callback Route

Create `app/api/auth/vipps/callback/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import {
  VippsClient,
  isVippsError,
  getErrorMessage,
  VippsErrorCode,
} from '@/lib/vipps';
import { getOAuthSession, clearOAuthSession } from '@/lib/session';
import type { VippsUserInfo } from '@/lib/vipps';

/**
 * Handles OAuth callback from Vipps
 * GET /api/auth/vipps/callback?code=...&state=...
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  // Handle OAuth errors from Vipps
  if (error) {
    console.error('Vipps OAuth error:', error, errorDescription);
    await clearOAuthSession();

    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(error)}`, request.url)
    );
  }

  // Validate required parameters
  if (!code || !state) {
    console.error('Missing code or state parameter');
    await clearOAuthSession();

    return NextResponse.redirect(
      new URL('/login?error=missing_parameters', request.url)
    );
  }

  try {
    // Retrieve stored OAuth session
    const session = await getOAuthSession();

    if (!session) {
      throw new Error('No OAuth session found. Session may have expired.');
    }

    // Verify state parameter (CSRF protection)
    if (state !== session.state) {
      throw new Error('Invalid state parameter. Possible CSRF attack.');
    }

    // Check session age (prevent replay attacks)
    const sessionAge = Date.now() - session.createdAt;
    const maxAge = 10 * 60 * 1000; // 10 minutes

    if (sessionAge > maxAge) {
      throw new Error('OAuth session expired. Please try again.');
    }

    // Exchange authorization code for access token
    const client = new VippsClient();
    const tokens = await client.exchangeCodeForToken(
      code,
      session.codeVerifier,
      session.redirectUri
    );

    // Get user information from Vipps
    const userInfo = await client.getUserInfo(tokens.access_token);

    // Clear OAuth session
    await clearOAuthSession();

    // Create user session in your database
    await createUserSession(userInfo, tokens);

    // Redirect to success page
    return NextResponse.redirect(new URL('/dashboard', request.url));
  } catch (error) {
    console.error('Vipps callback error:', error);
    await clearOAuthSession();

    // Handle Vipps-specific errors
    if (isVippsError(error)) {
      const message = getErrorMessage(error.code);
      const errorCode = error.code;

      // Handle specific error cases
      if (errorCode === VippsErrorCode.TOKEN_EXPIRED) {
        return NextResponse.redirect(
          new URL('/login?error=session_expired', request.url)
        );
      }

      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(message)}`, request.url)
      );
    }

    // Generic error
    return NextResponse.redirect(
      new URL('/login?error=authentication_failed', request.url)
    );
  }
}

/**
 * Create user session after successful authentication
 * Replace this with your actual session management logic
 */
async function createUserSession(
  userInfo: VippsUserInfo,
  tokens: { access_token: string; refresh_token?: string; expires_in: number }
): Promise<void> {
  // Example: Store in database
  // const user = await db.user.upsert({
  //   where: { vippsId: userInfo.sub },
  //   create: {
  //     vippsId: userInfo.sub,
  //     email: userInfo.email,
  //     name: userInfo.name,
  //     phoneNumber: userInfo.phone_number,
  //   },
  //   update: {
  //     email: userInfo.email,
  //     name: userInfo.name,
  //     phoneNumber: userInfo.phone_number,
  //   },
  // });

  // Example: Create JWT session
  // const sessionToken = await createSessionToken({
  //   userId: user.id,
  //   vippsAccessToken: tokens.access_token,
  // });

  // Example: Set session cookie
  // cookies().set('session', sessionToken, {
  //   httpOnly: true,
  //   secure: process.env.NODE_ENV === 'production',
  //   sameSite: 'lax',
  //   maxAge: tokens.expires_in,
  // });

  console.log('User authenticated:', userInfo.sub);
}
```

## Session Management

### With Supabase

```typescript
// lib/auth/vipps.ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { VippsUserInfo } from '@/lib/vipps';

export async function createVippsUser(userInfo: VippsUserInfo) {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  // Upsert user in database
  const { data: user, error } = await supabase
    .from('users')
    .upsert({
      vipps_id: userInfo.sub,
      email: userInfo.email,
      name: userInfo.name,
      phone_number: userInfo.phone_number,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create user: ${error.message}`);
  }

  return user;
}
```

### With NextAuth.js

```typescript
// lib/auth/nextauth.ts
import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { VippsClient } from '@/lib/vipps';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: 'vipps',
      name: 'Vipps',
      credentials: {
        code: { type: 'text' },
        verifier: { type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.code || !credentials?.verifier) {
          return null;
        }

        try {
          const client = new VippsClient();
          const tokens = await client.exchangeCodeForToken(
            credentials.code,
            credentials.verifier,
            process.env.VIPPS_REDIRECT_URI!
          );

          const userInfo = await client.getUserInfo(tokens.access_token);

          return {
            id: userInfo.sub,
            email: userInfo.email || '',
            name: userInfo.name || '',
            image: null,
          };
        } catch (error) {
          console.error('Vipps auth error:', error);
          return null;
        }
      },
    }),
  ],
  // ... other NextAuth config
};
```

## UI Components

### Login Button (Client Component)

```tsx
// components/auth/VippsLoginButton.tsx
'use client';

import { useState } from 'react';

export function VippsLoginButton() {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = () => {
    setIsLoading(true);
    window.location.href = '/api/auth/vipps/login';
  };

  return (
    <button
      onClick={handleLogin}
      disabled={isLoading}
      className="flex items-center justify-center gap-3 w-full bg-orange-500 text-white
                 font-semibold px-6 py-3 rounded-lg hover:bg-orange-600
                 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      {isLoading ? (
        <span>Laster...</span>
      ) : (
        <>
          <VippsIcon />
          <span>Logg inn med Vipps</span>
        </>
      )}
    </button>
  );
}

function VippsIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0z" />
    </svg>
  );
}
```

### Login Page with Error Handling

```tsx
// app/login/page.tsx
'use client';

import { useSearchParams } from 'next/navigation';
import { VippsLoginButton } from '@/components/auth/VippsLoginButton';

const errorMessages: Record<string, string> = {
  missing_parameters: 'Manglende parametere. Prøv igjen.',
  session_expired: 'Økten har utløpt. Vennligst logg inn på nytt.',
  authentication_failed: 'Autentisering feilet. Prøv igjen.',
  access_denied: 'Du avviste innlogging med Vipps.',
};

export default function LoginPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const errorMessage = error ? errorMessages[error] || error : null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-xl shadow-lg">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">
            Velkommen
          </h2>
          <p className="mt-2 text-gray-600">
            Logg inn for å fortsette
          </p>
        </div>

        {errorMessage && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
            {errorMessage}
          </div>
        )}

        <div className="space-y-4">
          <VippsLoginButton />
        </div>
      </div>
    </div>
  );
}
```

## Error Handling

### Custom Error Page

```tsx
// app/error/page.tsx
'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { getErrorMessage, VippsErrorCode } from '@/lib/vipps';

export default function ErrorPage() {
  const searchParams = useSearchParams();
  const errorCode = searchParams.get('code') as VippsErrorCode | null;

  const message = errorCode
    ? getErrorMessage(errorCode)
    : 'En ukjent feil oppstod';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-8 bg-white rounded-xl shadow-lg text-center">
        <div className="mb-4 text-red-500">
          <svg
            className="w-16 h-16 mx-auto"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Noe gikk galt
        </h2>

        <p className="text-gray-600 mb-6">{message}</p>

        <Link
          href="/login"
          className="inline-block bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
        >
          Prøv igjen
        </Link>
      </div>
    </div>
  );
}
```

## Advanced Usage

### Token Refresh

```typescript
// lib/auth/refresh-token.ts
import { VippsClient, isVippsError, VippsErrorCode } from '@/lib/vipps';

export async function refreshUserToken(refreshToken: string) {
  try {
    const client = new VippsClient();
    const tokens = await client.refreshAccessToken(refreshToken);

    // Update tokens in your database/session
    // await updateUserTokens(tokens);

    return tokens;
  } catch (error) {
    if (isVippsError(error) && error.code === VippsErrorCode.INVALID_GRANT) {
      // Refresh token is invalid, user needs to re-authenticate
      throw new Error('REAUTH_REQUIRED');
    }
    throw error;
  }
}
```

### Middleware for Protected Routes

```typescript
// middleware.ts
import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const session = request.cookies.get('session');

  if (!session) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/profile/:path*'],
};
```

### User Info Server Action

```typescript
// app/actions/user.ts
'use server';

import { VippsClient } from '@/lib/vipps';
import { cookies } from 'next/headers';

export async function getCurrentUserInfo() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('vipps_access_token')?.value;

  if (!accessToken) {
    throw new Error('Not authenticated');
  }

  try {
    const client = new VippsClient();
    const userInfo = await client.getUserInfo(accessToken);
    return userInfo;
  } catch (error) {
    throw new Error('Failed to get user info');
  }
}
```

## Testing

### Mock Vipps Client for Tests

```typescript
// lib/vipps/__mocks__/client.ts
import type { VippsUserInfo, VippsTokenResponse } from '../types';

export class VippsClient {
  async exchangeCodeForToken(): Promise<VippsTokenResponse> {
    return {
      access_token: 'mock_access_token',
      token_type: 'Bearer',
      expires_in: 3600,
      scope: 'openid email name',
    };
  }

  async getUserInfo(): Promise<VippsUserInfo> {
    return {
      sub: 'mock_user_id',
      email: 'test@example.com',
      name: 'Test User',
      phone_number: '+4712345678',
    };
  }
}
```

### Test OAuth Flow

```typescript
// __tests__/auth/vipps.test.ts
import { VippsClient } from '@/lib/vipps';

jest.mock('@/lib/vipps/client');

describe('Vipps OAuth', () => {
  it('should exchange code for token', async () => {
    const client = new VippsClient();
    const tokens = await client.exchangeCodeForToken(
      'code',
      'verifier',
      'redirect_uri'
    );

    expect(tokens.access_token).toBe('mock_access_token');
  });

  it('should get user info', async () => {
    const client = new VippsClient();
    const userInfo = await client.getUserInfo('token');

    expect(userInfo.email).toBe('test@example.com');
  });
});
```

## Production Checklist

Before deploying to production:

- [ ] Set `VIPPS_ENVIRONMENT=production`
- [ ] Use HTTPS for redirect URI
- [ ] Store client secret securely (environment variable, never in code)
- [ ] Enable secure cookies (`secure: true`)
- [ ] Implement proper session management
- [ ] Add rate limiting to auth endpoints
- [ ] Set up error monitoring (Sentry, etc.)
- [ ] Test with real Vipps accounts
- [ ] Implement token refresh logic
- [ ] Add logging for security events
- [ ] Review and test error handling
- [ ] Set up CSRF protection
- [ ] Configure CORS if needed
