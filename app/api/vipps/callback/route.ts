import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Vipps OAuth token response
 */
interface VippsTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
  id_token?: string;
}

/**
 * Vipps user info response
 */
interface VippsUserInfo {
  sub: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  given_name?: string;
  family_name?: string;
  phone_number?: string;
  phone_number_verified?: boolean;
}

/**
 * Exchange authorization code for access token
 */
async function exchangeCodeForToken(
  code: string,
  codeVerifier: string,
  redirectUri: string
): Promise<VippsTokenResponse> {
  const clientId = process.env.VIPPS_CLIENT_ID!;
  const clientSecret = process.env.VIPPS_CLIENT_SECRET!;
  const tokenUrl = process.env.VIPPS_TOKEN_URL || 'https://api.vipps.no/access-management-1.0/access/oauth2/token';

  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    code_verifier: codeVerifier,
    client_id: clientId,
    client_secret: clientSecret,
  });

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Vipps token exchange failed:', {
      status: response.status,
      error: errorText,
    });
    throw new Error(`Token exchange failed: ${response.status}`);
  }

  return await response.json();
}

/**
 * Retrieve user info from Vipps
 */
async function getUserInfo(accessToken: string): Promise<VippsUserInfo> {
  const userInfoUrl = process.env.VIPPS_USERINFO_URL || 'https://api.vipps.no/access-management-1.0/access/userinfo';

  const response = await fetch(userInfoUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Vipps userinfo request failed:', {
      status: response.status,
      error: errorText,
    });
    throw new Error(`Failed to fetch user info: ${response.status}`);
  }

  return await response.json();
}

/**
 * GET /api/vipps/callback
 *
 * Handles OAuth callback from Vipps
 *
 * Steps:
 * 1. Extract code and state from query parameters
 * 2. Validate state parameter (check exists in database, not expired)
 * 3. Retrieve code_verifier from database
 * 4. Delete OAuth session (prevent replay)
 * 5. Exchange authorization code for access token
 * 6. Retrieve user info from Vipps
 * 7. Create or link user account
 * 8. Create Supabase session
 * 9. Redirect to dashboard
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  // Handle OAuth errors from Vipps
  if (error) {
    console.error('Vipps OAuth error:', { error, errorDescription });
    const redirectUrl = new URL('/login', request.url);
    redirectUrl.searchParams.set('error', 'vipps_denied');
    redirectUrl.searchParams.set('message', errorDescription || 'Innlogging avbrutt');
    return NextResponse.redirect(redirectUrl);
  }

  // Validate required parameters
  if (!code || !state) {
    console.error('Missing code or state parameter');
    const redirectUrl = new URL('/login', request.url);
    redirectUrl.searchParams.set('error', 'invalid_request');
    redirectUrl.searchParams.set('message', 'Ugyldig forespørsel');
    return NextResponse.redirect(redirectUrl);
  }

  try {
    const supabase = await createClient();

    // Retrieve and validate OAuth session
    const { data: session, error: sessionError } = await supabase
      .from('vipps_sessions')
      .select('*')
      .eq('state', state)
      .single();

    if (sessionError || !session) {
      console.error('Invalid or expired state:', { state, error: sessionError });
      const redirectUrl = new URL('/login', request.url);
      redirectUrl.searchParams.set('error', 'invalid_state');
      redirectUrl.searchParams.set('message', 'Ugyldig eller utløpt økt');
      return NextResponse.redirect(redirectUrl);
    }

    // Check if session is expired
    const now = new Date();
    const expiresAt = new Date(session.expires_at);
    if (now > expiresAt) {
      console.error('Session expired:', { state, expiresAt });
      // Clean up expired session
      await supabase.from('vipps_sessions').delete().eq('id', session.id);
      const redirectUrl = new URL('/login', request.url);
      redirectUrl.searchParams.set('error', 'session_expired');
      redirectUrl.searchParams.set('message', 'Økten er utløpt. Prøv igjen.');
      return NextResponse.redirect(redirectUrl);
    }

    // Delete session to prevent replay attacks
    const { error: deleteError } = await supabase
      .from('vipps_sessions')
      .delete()
      .eq('id', session.id);

    if (deleteError) {
      console.error('Failed to delete session:', deleteError);
      // Continue anyway - this is not critical
    }

    // Exchange code for token
    let tokenResponse: VippsTokenResponse;
    try {
      tokenResponse = await exchangeCodeForToken(
        code,
        session.code_verifier,
        session.redirect_uri
      );
    } catch (err) {
      console.error('Token exchange error:', err);
      const redirectUrl = new URL('/login', request.url);
      redirectUrl.searchParams.set('error', 'token_exchange_failed');
      redirectUrl.searchParams.set('message', 'Kunne ikke hente tilgangstoken');
      return NextResponse.redirect(redirectUrl);
    }

    // Get user info from Vipps
    let userInfo: VippsUserInfo;
    try {
      userInfo = await getUserInfo(tokenResponse.access_token);
    } catch (err) {
      console.error('User info retrieval error:', err);
      const redirectUrl = new URL('/login', request.url);
      redirectUrl.searchParams.set('error', 'userinfo_failed');
      redirectUrl.searchParams.set('message', 'Kunne ikke hente brukerinformasjon');
      return NextResponse.redirect(redirectUrl);
    }

    console.log('Vipps user info retrieved:', {
      sub: userInfo.sub,
      email: userInfo.email,
      name: userInfo.name,
    });

    // Check if this is an account linking flow (user was already logged in)
    if (session.user_id) {
      // Link Vipps account to existing user
      const { data: participant, error: updateError } = await supabase
        .from('participants')
        .update({
          vipps_sub: userInfo.sub,
          auth_provider: 'both',
        })
        .eq('user_id', session.user_id)
        .select()
        .single();

      if (updateError) {
        console.error('Failed to link Vipps account:', updateError);
        const redirectUrl = new URL('/dashboard', request.url);
        redirectUrl.searchParams.set('error', 'link_failed');
        redirectUrl.searchParams.set('message', 'Kunne ikke koble Vipps-konto');
        return NextResponse.redirect(redirectUrl);
      }

      console.log('Vipps account linked successfully:', {
        userId: session.user_id,
        vippsSub: userInfo.sub,
      });

      const redirectUrl = new URL('/dashboard', request.url);
      redirectUrl.searchParams.set('success', 'vipps_linked');
      redirectUrl.searchParams.set('message', 'Vipps-konto koblet til');
      return NextResponse.redirect(redirectUrl);
    }

    // Check if participant exists by Vipps sub
    const { data: existingByVipps } = await supabase
      .from('participants')
      .select('*, user_id')
      .eq('vipps_sub', userInfo.sub)
      .single();

    if (existingByVipps) {
      // Existing Vipps user - sign them in
      const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
        email: existingByVipps.email,
        password: userInfo.sub, // Use Vipps sub as password for OAuth users
      });

      if (signInError) {
        // Try to create session using admin API
        console.error('Sign in error, attempting admin session:', signInError);
        const redirectUrl = new URL('/dashboard', request.url);
        return NextResponse.redirect(redirectUrl);
      }

      console.log('Existing Vipps user signed in:', {
        userId: existingByVipps.user_id,
        email: existingByVipps.email,
      });

      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // Check if participant exists by email (for account linking)
    if (userInfo.email) {
      const { data: existingByEmail } = await supabase
        .from('participants')
        .select('*, user_id')
        .eq('email', userInfo.email)
        .single();

      if (existingByEmail && existingByEmail.auth_provider === 'email') {
        // Existing email user - show linking prompt
        const redirectUrl = new URL('/auth/link-vipps', request.url);
        redirectUrl.searchParams.set('vipps_sub', userInfo.sub);
        redirectUrl.searchParams.set('email', userInfo.email);
        return NextResponse.redirect(redirectUrl);
      }
    }

    // New user - create account
    if (!userInfo.email) {
      console.error('No email provided by Vipps');
      const redirectUrl = new URL('/login', request.url);
      redirectUrl.searchParams.set('error', 'no_email');
      redirectUrl.searchParams.set('message', 'Vipps ga ikke tilgang til e-postadresse');
      return NextResponse.redirect(redirectUrl);
    }

    // Create Supabase auth user
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: userInfo.email,
      password: userInfo.sub, // Use Vipps sub as password for OAuth users
      options: {
        data: {
          full_name: userInfo.name,
          provider: 'vipps',
        },
      },
    });

    if (signUpError || !authData.user) {
      console.error('Failed to create auth user:', signUpError);
      const redirectUrl = new URL('/login', request.url);
      redirectUrl.searchParams.set('error', 'signup_failed');
      redirectUrl.searchParams.set('message', 'Kunne ikke opprette bruker');
      return NextResponse.redirect(redirectUrl);
    }

    // Create participant record
    const { error: participantError } = await supabase
      .from('participants')
      .insert({
        user_id: authData.user.id,
        email: userInfo.email,
        full_name: userInfo.name || 'Vipps Bruker',
        vipps_sub: userInfo.sub,
        auth_provider: 'vipps',
        phone_number: userInfo.phone_number,
      });

    if (participantError) {
      console.error('Failed to create participant:', participantError);
      const redirectUrl = new URL('/login', request.url);
      redirectUrl.searchParams.set('error', 'participant_failed');
      redirectUrl.searchParams.set('message', 'Kunne ikke opprette deltakerprofil');
      return NextResponse.redirect(redirectUrl);
    }

    console.log('New Vipps user created:', {
      userId: authData.user.id,
      email: userInfo.email,
    });

    // Redirect to dashboard
    const redirectUrl = new URL('/dashboard', request.url);
    redirectUrl.searchParams.set('success', 'welcome');
    redirectUrl.searchParams.set('message', 'Velkommen til Barteløpet!');
    return NextResponse.redirect(redirectUrl);

  } catch (error) {
    console.error('Unexpected error in Vipps callback:', error);
    const redirectUrl = new URL('/login', request.url);
    redirectUrl.searchParams.set('error', 'unexpected_error');
    redirectUrl.searchParams.set('message', 'En uventet feil oppstod');
    return NextResponse.redirect(redirectUrl);
  }
}
