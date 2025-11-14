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
    '/profil',
  ];

  // Check if path matches allowed patterns
  const isAllowed = allowedPaths.some(allowed =>
    pathOnly === allowed || pathOnly.startsWith(allowed + '/')
  );

  if (!isAllowed) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[Security] Blocked redirect to unauthorized path:', path);
    }
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

  // Legacy token format (pre-2023) requires email in URL - monitor for removal
  const email = searchParams.get('email');
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
      type: type as 'email' | 'signup' | 'recovery' | 'invite' | 'magiclink',
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

  // LEGACY: Pre-2023 Supabase token format (email in URL = PII risk)
  // Remove after 30+ days with no "[Auth] Legacy token format detected" logs
  if (legacyToken && type === 'signup') {
    if (!email) {
      console.error('[Auth] Email parameter missing for legacy token verification');
      return NextResponse.redirect(
        new URL('/login?error=confirmation_failed&message=Kunne ikke bekrefte e-postadressen. Vennligst prøv igjen.', origin)
      );
    }

    // Validate email format to prevent injection
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.error('[Auth] Invalid email format in legacy token verification');
      return NextResponse.redirect(
        new URL('/login?error=confirmation_failed&message=Ugyldig e-postadresse.', origin)
      );
    }

    const supabase = await createClient();

    const { error: verifyError } = await supabase.auth.verifyOtp({
      type: 'signup',
      token: legacyToken,
      email: email.trim(), // Sanitize whitespace
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
