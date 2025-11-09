import { createClient } from '@/app/_shared/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * Validates redirect path to prevent open redirect attacks
 * Only allows relative paths to specific allowed routes
 */
function validateRedirectPath(path: string | null): string {
  // Default to dashboard
  if (!path) return '/dashboard';

  // Only allow relative paths
  if (!path.startsWith('/')) return '/dashboard';

  // Prevent protocol-relative URLs (//evil.com)
  if (path.startsWith('//')) return '/dashboard';

  // Extract path without query params for validation
  const pathOnly = path.split('?')[0];

  // Whitelist of allowed redirect paths
  const allowedPaths = [
    '/dashboard',
    '/galleri',
    '/pamelding',
    '/deltakere',
    '/admin',
    '/profil',
  ];

  // Check if path matches allowed patterns
  const isAllowed = allowedPaths.some(allowed =>
    pathOnly === allowed || pathOnly.startsWith(allowed + '/')
  );

  if (!isAllowed) {
    console.warn('[Security] Blocked redirect to unauthorized path:', path);
    return '/dashboard';
  }

  return path;
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type');
  const next = validateRedirectPath(searchParams.get('next'));
  const code = searchParams.get('code');

  // SECURITY: Email should NOT be in URL parameters (PII exposure)
  // Email will be retrieved from the authenticated session instead
  const email = searchParams.get('email');

  // Also handle legacy token format (for signup confirmation)
  const legacyToken = searchParams.get('token');

  // Handle OAuth callback (Google, Facebook, etc.)
  if (code) {
    const supabase = await createClient();

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error('OAuth code exchange error:', error);
      return NextResponse.redirect(
        new URL(`/login?error=oauth_failed&message=${encodeURIComponent(error.message)}`, origin)
      );
    }

    // Check if user has participant record
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { data: participant } = await supabase
        .from('participants')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!participant) {
        return NextResponse.redirect(new URL('/pamelding', origin));
      }
    }

    return NextResponse.redirect(new URL(next, origin));
  }

  if (token_hash && type) {
    const supabase = await createClient();

    const { error } = await supabase.auth.verifyOtp({
      type: type as any,
      token_hash,
    });

    if (!error) {
      // Link participant record to auth user if not already linked
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // Check if participant exists and needs linking
        if (user.email) {
          const { data: participant } = await supabase
            .from('participants')
            .select('id, user_id')
            .eq('email', user.email)
            .maybeSingle();

          if (participant && !participant.user_id) {
            // Link participant to auth user
            await supabase
              .from('participants')
              .update({ user_id: user.id })
              .eq('email', user.email);
          }
        }

        // Check if participant record exists at all
        const { data: linkedParticipant } = await supabase
          .from('participants')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        // If no participant record, redirect to registration
        if (!linkedParticipant) {
          return NextResponse.redirect(new URL('/pamelding', origin));
        }
      }

      return NextResponse.redirect(new URL(next, origin));
    }

    console.error('Auth verification error:', error);
    return NextResponse.redirect(
      new URL(`/login?error=verification_failed&message=${encodeURIComponent(error.message)}`, origin)
    );
  }

  // Handle legacy token format (email confirmation)
  // IMPORTANT: With the legacy token format, Supabase hasn't processed it yet
  // We need to exchange the token for a session
  if (legacyToken && type === 'signup') {
    // SECURITY NOTE: Email in URL is a temporary requirement for legacy token verification
    // This should be migrated to token_hash format which doesn't require email in URL
    if (!email) {
      console.error('Email parameter missing for legacy token verification');
      return NextResponse.redirect(
        new URL('/login?error=confirmation_failed&message=Kunne ikke bekrefte e-postadressen. Vennligst prøv igjen.', origin)
      );
    }

    const supabase = await createClient();

    // Exchange the token for a session using verifyOtp
    const { error: verifyError } = await supabase.auth.verifyOtp({
      type: 'signup',
      token: legacyToken,
      email,
    });

    if (verifyError) {
      console.error('Token verification failed:', verifyError);

      // If user was deleted after confirmation email was sent
      if (verifyError.message?.includes('does not exist') || verifyError.code === 'user_not_found') {
        return NextResponse.redirect(
          new URL('/pamelding?error=user_deleted&message=Your account was removed. Please register again.', origin)
        );
      }

      return NextResponse.redirect(
        new URL('/login?error=confirmation_failed&message=Could not confirm email. Please try again.', origin)
      );
    }

    // Now check if user is authenticated
    const { data: { user }, error: getUserError } = await supabase.auth.getUser();

    if (getUserError || !user) {
      console.error('User not authenticated after verification:', getUserError);
      return NextResponse.redirect(
        new URL('/login?error=confirmation_failed&message=Could not confirm email. Please try again.', origin)
      );
    }

    // Link participant record to auth user
    if (user.email) {
      const { data: participant } = await supabase
        .from('participants')
        .select('id, user_id')
        .eq('email', user.email)
        .maybeSingle();

      if (participant && !participant.user_id) {
        await supabase
          .from('participants')
          .update({ user_id: user.id })
          .eq('email', user.email);
      }
    }

    // Check if participant record exists
    const { data: linkedParticipant } = await supabase
      .from('participants')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!linkedParticipant) {
      return NextResponse.redirect(new URL('/pamelding', origin));
    }

    return NextResponse.redirect(new URL(next, origin));
  }

  // Return the user to an error page with some instructions
  console.error('Missing token_hash, token, or type parameter');
  return NextResponse.redirect(
    new URL('/login?error=invalid_link&message=The login link is invalid or has expired', origin)
  );
}
