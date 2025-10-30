import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { nanoid } from 'nanoid';
import crypto from 'crypto';
import { checkRateLimit, getClientIp } from '@/lib/utils/rate-limit';

/**
 * Generate PKCE code verifier (random string)
 */
function generateCodeVerifier(): string {
  return nanoid(128);
}

/**
 * Generate PKCE code challenge from verifier using SHA256
 */
function generateCodeChallenge(verifier: string): string {
  const hash = crypto.createHash('sha256').update(verifier).digest();
  return hash.toString('base64url');
}

/**
 * GET /api/vipps/authorize
 *
 * Initiates Vipps OAuth flow with PKCE
 *
 * Steps:
 * 1. Generate PKCE parameters (code_verifier, code_challenge)
 * 2. Generate secure state parameter
 * 3. Store OAuth session in database
 * 4. Construct Vipps authorization URL
 * 5. Redirect user to Vipps
 */
export async function GET(request: NextRequest) {
  try {
    // Rate limiting check for OAuth endpoint (prevent abuse)
    const clientIp = getClientIp(request);
    const rateLimitResult = await checkRateLimit('oauth', clientIp);

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'For mange forsøk. Prøv igjen senere.' },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': rateLimitResult.reset.toString(),
            'Retry-After': Math.ceil((rateLimitResult.reset - Date.now()) / 1000).toString(),
          }
        }
      );
    }

    // Validate required environment variables
    const clientId = process.env.VIPPS_CLIENT_ID;
    const redirectUri = process.env.VIPPS_REDIRECT_URI;
    const vippsAuthUrl = process.env.VIPPS_AUTH_URL || 'https://api.vipps.no/access-management-1.0/access/oauth2/auth';

    if (!clientId || !redirectUri) {
      console.error('Missing Vipps configuration:', {
        hasClientId: !!clientId,
        hasRedirectUri: !!redirectUri
      });
      return NextResponse.json(
        { error: 'Vipps OAuth er ikke konfigurert riktig. Kontakt administrator.' },
        { status: 500 }
      );
    }

    // Get current user (if logged in) to support account linking
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Generate PKCE parameters
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = generateCodeChallenge(codeVerifier);
    const state = nanoid(32); // Secure random state parameter

    // Calculate expiration (10 minutes from now)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    // Store OAuth session in database
    const { error: sessionError } = await supabase
      .from('vipps_sessions')
      .insert({
        state,
        code_verifier: codeVerifier,
        code_challenge: codeChallenge,
        redirect_uri: redirectUri,
        user_id: user?.id || null,
        expires_at: expiresAt,
      });

    if (sessionError) {
      console.error('Failed to create Vipps session:', sessionError);
      return NextResponse.json(
        { error: 'Kunne ikke starte innlogging. Prøv igjen.' },
        { status: 500 }
      );
    }

    // Construct Vipps authorization URL
    const authUrl = new URL(vippsAuthUrl);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('scope', 'openid email name phoneNumber');
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('code_challenge', codeChallenge);
    authUrl.searchParams.set('code_challenge_method', 'S256');

    console.log('Vipps OAuth initiated:', {
      state,
      userId: user?.id || 'anonymous',
      redirectUri
    });

    // Redirect to Vipps
    return NextResponse.redirect(authUrl.toString());

  } catch (error) {
    console.error('Unexpected error in Vipps authorize:', error);
    return NextResponse.json(
      { error: 'En uventet feil oppstod. Prøv igjen senere.' },
      { status: 500 }
    );
  }
}

/**
 * Rate limiting consideration:
 * In production, implement rate limiting to prevent abuse:
 * - Limit OAuth initiations per IP address
 * - Limit OAuth initiations per user session
 * - Use Redis or similar for distributed rate limiting
 *
 * Example with Vercel KV:
 * ```
 * import { ratelimit } from '@/lib/ratelimit';
 * const { success } = await ratelimit.limit(ip);
 * if (!success) return new Response('Too Many Requests', { status: 429 });
 * ```
 */
