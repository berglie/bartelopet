# Vipps OAuth Integration

Complete TypeScript implementation of Vipps OAuth 2.0 with PKCE (Proof Key for Code Exchange) support for Next.js applications.

## Features

- **PKCE Support**: Full implementation of RFC 7636 for secure OAuth flows
- **Type Safety**: Comprehensive TypeScript types and interfaces
- **Error Handling**: Detailed error classes with Norwegian user messages
- **Environment Validation**: Server-side configuration validation
- **Retry Logic**: Automatic retry for transient failures
- **Production Ready**: Follows Vipps API best practices

## Installation

The library is already included in your project at `/lib/vipps/`. No additional installation needed.

## Environment Variables

Create a `.env.local` file with the following variables:

```env
# Vipps OAuth Configuration
VIPPS_CLIENT_ID=your-client-id-here
VIPPS_CLIENT_SECRET=your-client-secret-here
VIPPS_MERCHANT_SERIAL_NUMBER=123456
VIPPS_SUBSCRIPTION_KEY=your-subscription-key-here
VIPPS_REDIRECT_URI=http://localhost:3000/api/auth/vipps/callback
VIPPS_ENVIRONMENT=test
```

**Important**:
- Use `test` environment for development
- Use `production` environment for live applications
- Never commit `.env.local` to version control
- Redirect URI must use HTTPS in production

## Quick Start

### 1. Initialize OAuth Flow

```typescript
// app/api/auth/vipps/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { generatePKCEParams, getVippsConfig, getAuthorizationUrl } from '@/lib/vipps';
import { nanoid } from 'nanoid';

export async function GET(request: NextRequest) {
  // Generate PKCE parameters
  const { codeVerifier, codeChallenge } = generatePKCEParams();

  // Generate state for CSRF protection
  const state = nanoid();

  // Get Vipps configuration
  const config = getVippsConfig();

  // Store PKCE parameters and state in session (use your session management)
  // Example with cookies (use httpOnly, secure in production):
  const response = NextResponse.redirect(
    getAuthorizationUrl(config, {
      state,
      codeChallenge,
      scope: 'openid email name phoneNumber address',
    })
  );

  // Store session data securely
  response.cookies.set('vipps_verifier', codeVerifier, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 10, // 10 minutes
  });

  response.cookies.set('vipps_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 10,
  });

  return response;
}
```

### 2. Handle OAuth Callback

```typescript
// app/api/auth/vipps/callback/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { VippsClient, isVippsError, getErrorMessage } from '@/lib/vipps';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  // Handle errors from Vipps
  if (error) {
    return NextResponse.json(
      { error: 'OAuth error', details: error },
      { status: 400 }
    );
  }

  // Validate parameters
  if (!code || !state) {
    return NextResponse.json(
      { error: 'Missing code or state' },
      { status: 400 }
    );
  }

  // Retrieve stored PKCE parameters and state
  const storedVerifier = request.cookies.get('vipps_verifier')?.value;
  const storedState = request.cookies.get('vipps_state')?.value;

  if (!storedVerifier || !storedState) {
    return NextResponse.json(
      { error: 'Missing session data' },
      { status: 400 }
    );
  }

  // Verify state (CSRF protection)
  if (state !== storedState) {
    return NextResponse.json(
      { error: 'Invalid state parameter' },
      { status: 400 }
    );
  }

  try {
    // Exchange authorization code for tokens
    const client = new VippsClient();
    const tokens = await client.exchangeCodeForToken(
      code,
      storedVerifier,
      process.env.VIPPS_REDIRECT_URI!
    );

    // Get user information
    const userInfo = await client.getUserInfo(tokens.access_token);

    // Create user session (use your session management)
    // Example: Store in database, create JWT, etc.

    // Clear OAuth cookies
    const response = NextResponse.redirect(new URL('/dashboard', request.url));
    response.cookies.delete('vipps_verifier');
    response.cookies.delete('vipps_state');

    return response;
  } catch (error) {
    // Handle Vipps errors
    if (isVippsError(error)) {
      const message = getErrorMessage(error.code);
      return NextResponse.json(
        { error: message, code: error.code },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
```

### 3. Display Login Button (Client Component)

```tsx
// components/VippsLoginButton.tsx
'use client';

export function VippsLoginButton() {
  const handleLogin = () => {
    window.location.href = '/api/auth/vipps/login';
  };

  return (
    <button
      onClick={handleLogin}
      className="flex items-center gap-2 bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600"
    >
      <VippsLogo />
      Logg inn med Vipps
    </button>
  );
}
```

## API Reference

### PKCE Functions

#### `generatePKCEParams()`
Generate PKCE verifier and challenge.

```typescript
const { codeVerifier, codeChallenge, codeChallengeMethod } = generatePKCEParams();
```

#### `generateCodeVerifier(length?: number)`
Generate a random code verifier (43-128 characters).

```typescript
const verifier = generateCodeVerifier(); // 43 characters (default)
const longerVerifier = generateCodeVerifier(128); // 128 characters
```

#### `generateCodeChallenge(verifier: string)`
Generate SHA256 code challenge from verifier.

```typescript
const challenge = generateCodeChallenge(verifier);
```

### Configuration Functions

#### `getVippsConfig()`
Load and validate Vipps configuration from environment variables. **Server-side only**.

```typescript
const config = getVippsConfig();
```

#### `getVippsEndpoints(environment)`
Get API endpoints for test or production.

```typescript
const endpoints = getVippsEndpoints('test');
console.log(endpoints.authorize);
console.log(endpoints.token);
console.log(endpoints.userInfo);
```

#### `hasVippsConfig()`
Check if Vipps configuration is available.

```typescript
if (hasVippsConfig()) {
  // Show Vipps login option
}
```

#### `getAuthorizationUrl(config, params)`
Build complete authorization URL.

```typescript
const url = getAuthorizationUrl(config, {
  state: 'random-state',
  codeChallenge: 'challenge-here',
  scope: 'openid email name',
  loginHint: '12345678', // Optional phone number
});
```

### VippsClient Class

#### Constructor
```typescript
const client = new VippsClient(); // Uses environment config
const client = new VippsClient(customConfig); // Custom config
```

#### `exchangeCodeForToken(code, verifier, redirectUri)`
Exchange authorization code for access token.

```typescript
const tokens = await client.exchangeCodeForToken(
  authCode,
  codeVerifier,
  redirectUri
);
```

#### `getUserInfo(accessToken)`
Get user information from Vipps.

```typescript
const userInfo = await client.getUserInfo(tokens.access_token);
console.log(userInfo.name);
console.log(userInfo.email);
console.log(userInfo.phone_number);
```

#### `refreshAccessToken(refreshToken)`
Refresh an expired access token.

```typescript
const newTokens = await client.refreshAccessToken(tokens.refresh_token);
```

### Error Handling

All errors are instances of `VippsError` with Norwegian user messages.

```typescript
import { isVippsError, getErrorMessage, VippsErrorCode } from '@/lib/vipps';

try {
  const tokens = await client.exchangeCodeForToken(...);
} catch (error) {
  if (isVippsError(error)) {
    const norwegianMessage = getErrorMessage(error.code);
    console.error(norwegianMessage);

    // Check specific error types
    if (error.code === VippsErrorCode.TOKEN_EXPIRED) {
      // Handle expired token
    }
  }
}
```

## TypeScript Types

All types are exported from the main module:

```typescript
import type {
  VippsConfig,
  VippsUserInfo,
  VippsTokenResponse,
  VippsOAuthSession,
  PKCEParams,
} from '@/lib/vipps';
```

### VippsUserInfo
```typescript
interface VippsUserInfo {
  sub: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  email?: string;
  email_verified?: boolean;
  phone_number?: string;
  birthdate?: string;
  address?: VippsAddress;
  nin?: string; // Norwegian national ID
}
```

### VippsTokenResponse
```typescript
interface VippsTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
  id_token?: string;
}
```

## Security Best Practices

1. **PKCE**: Always use PKCE for authorization (implemented by default)
2. **State Parameter**: Use cryptographically random state for CSRF protection
3. **HTTPS**: Use HTTPS in production (enforced by config validation)
4. **Secure Storage**: Store code verifier and state in httpOnly cookies
5. **Server-Side Only**: Never expose client secret or config to browser
6. **Timeout**: Session data should expire (recommended: 10 minutes)
7. **Validation**: Always validate state parameter on callback

## Vipps Scopes

Available OAuth scopes:

- `openid` - Required for OpenID Connect
- `email` - User's email address
- `name` - User's full name
- `phoneNumber` - User's phone number
- `address` - User's address
- `birthDate` - User's birth date
- `nin` - Norwegian national identity number (requires special permissions)

Example:
```typescript
const url = getAuthorizationUrl(config, {
  state,
  codeChallenge,
  scope: 'openid email name phoneNumber address',
});
```

## Testing

Test environment endpoints are used automatically when `VIPPS_ENVIRONMENT=test`.

Test users and credentials are available in Vipps Developer Portal:
https://developer.vippsmobilepay.com/docs/APIs/login-api/

## Troubleshooting

### "Missing required environment variable"
Ensure all environment variables are set in `.env.local`:
- `VIPPS_CLIENT_ID`
- `VIPPS_CLIENT_SECRET`
- `VIPPS_MERCHANT_SERIAL_NUMBER`
- `VIPPS_SUBSCRIPTION_KEY`
- `VIPPS_REDIRECT_URI`
- `VIPPS_ENVIRONMENT`

### "Vipps configuration cannot be accessed from client-side code"
Make sure you're calling Vipps functions only in:
- API routes (`app/api/**/route.ts`)
- Server components (without `'use client'` directive)
- Server actions

### "Invalid state parameter"
The state parameter doesn't match. This could mean:
- Session expired (increase cookie maxAge)
- CSRF attack attempt
- Browser cleared cookies

### "Invalid grant" error
The authorization code is invalid or expired. Codes are single-use and expire quickly (typically 60 seconds).

## Documentation

- [Vipps Login API Documentation](https://developer.vippsmobilepay.com/docs/APIs/login-api/)
- [RFC 7636 - PKCE Specification](https://tools.ietf.org/html/rfc7636)
- [OAuth 2.0 Authorization Framework](https://tools.ietf.org/html/rfc6749)

## Support

For issues with this implementation, check:
1. This README
2. TypeScript types and JSDoc comments
3. Vipps Developer Portal documentation

For Vipps API issues, contact Vipps support through the Developer Portal.
