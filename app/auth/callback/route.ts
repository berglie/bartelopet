import { createClient } from '@/app/_shared/lib/supabase/server';
import { NextResponse } from 'next/server';
import { getCurrentEventYear } from '@/app/_shared/lib/utils/year';
import { readPendingRegistration, registerParticipant } from '@/app/_shared/lib/utils/registration';

/**
 * Validates redirect path to prevent open redirect attacks
 * Only allows relative paths to specific allowed routes
 */
function validateRedirectPath(path: string | null): string {
  // Default to dashboard
  if (!path) return '/dashboard';

  // Only allow relative paths
  if (!path.startsWith('/')) return '/dashboard';

  // Prevent protocol-relative URLs (//evil.com) and backslash tricks (/\evil.com)
  if (path.startsWith('//') || path.includes('\\')) return '/dashboard';

  // Extract path without query params for validation
  const pathOnly = path.split('?')[0];

  // Whitelist of allowed redirect paths
  const allowedPaths = ['/dashboard', '/galleri', '/pamelding', '/deltakere', '/profil'];

  // Check if path matches allowed patterns
  const isAllowed = allowedPaths.some(
    (allowed) => pathOnly === allowed || pathOnly.startsWith(allowed + '/')
  );

  if (!isAllowed) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[Security] Blocked redirect to unauthorized path:', path);
    }
    return '/dashboard';
  }

  return path;
}

/** Fixed error codes only; /login maps them to Norwegian text. Raw auth errors are not shown. */
function loginError(origin: string, code: 'oauth_failed' | 'verification_failed' | 'invalid_link') {
  return NextResponse.redirect(new URL(`/login?error=${code}`, origin));
}

/**
 * After a successful login: finish a pending e-mail registration, or send users without a
 * registration for this year to /pamelding.
 */
async function finishLogin(
  supabase: Awaited<ReturnType<typeof createClient>>,
  next: string,
  origin: string
) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return loginError(origin, 'verification_failed');

  const { data: participant } = await supabase
    .from('participants')
    .select('id')
    .eq('user_id', user.id)
    .eq('event_year', getCurrentEventYear())
    .maybeSingle();
  if (participant) return NextResponse.redirect(new URL(next, origin));

  const pending = readPendingRegistration(user.user_metadata);
  if (!pending) return NextResponse.redirect(new URL('/pamelding', origin));

  const result = await registerParticipant(supabase, pending);
  if ('error' in result) return NextResponse.redirect(new URL('/pamelding', origin));

  // The address and phone number now live in participants; drop the copy in auth metadata.
  await supabase.auth.updateUser({ data: { registration: null } });
  return NextResponse.redirect(new URL('/dashboard', origin));
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type');
  const next = validateRedirectPath(searchParams.get('next'));
  const code = searchParams.get('code');

  // Handle OAuth callback (Google) and PKCE e-mail links
  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error('OAuth code exchange error:', error.code ?? error.name);
      return loginError(origin, 'oauth_failed');
    }

    return finishLogin(supabase, next, origin);
  }

  const allowedTypes = ['email', 'signup', 'recovery', 'invite', 'magiclink'] as const;
  type OtpType = (typeof allowedTypes)[number];

  if (token_hash && type && (allowedTypes as readonly string[]).includes(type)) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type: type as OtpType, token_hash });

    if (error) {
      console.error('Auth verification error:', error.code ?? error.name);
      return loginError(origin, 'verification_failed');
    }

    return finishLogin(supabase, next, origin);
  }

  return loginError(origin, 'invalid_link');
}
