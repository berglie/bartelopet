import { createClient } from '@/app/_shared/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type');
  const next = searchParams.get('next') ?? '/dashboard';
  const code = searchParams.get('code');
  const email = searchParams.get('email');

  // Also handle legacy token format (for signup confirmation)
  const legacyToken = searchParams.get('token');

  // Debug logging (can be removed after testing)
  console.log('=== AUTH CALLBACK ===');
  console.log('URL:', request.url);
  console.log('code:', code ? 'present (OAuth)' : 'missing');
  console.log('token_hash:', token_hash ? 'present' : 'missing');
  console.log('legacy token:', legacyToken ? 'present' : 'missing');
  console.log('type:', type);

  // Handle OAuth callback (Google, Facebook, etc.)
  if (code) {
    console.log('🔐 Handling OAuth callback');
    const supabase = await createClient();

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error('❌ OAuth code exchange error:', error);
      return NextResponse.redirect(
        new URL(`/login?error=oauth_failed&message=${encodeURIComponent(error.message)}`, origin)
      );
    }

    console.log('✅ OAuth session created');

    // Check if user has participant record
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { data: participant } = await supabase
        .from('participants')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!participant) {
        console.log('ℹ️ No participant record, redirecting to registration');
        return NextResponse.redirect(new URL('/pamelding', origin));
      }

      console.log('✅ Participant exists, redirecting to dashboard');
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
      console.log('✅ Auth successful');

      // Link participant record to auth user if not already linked
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // Check if participant exists and needs linking
        if (user.email) {
          const { data: participant } = await supabase
            .from('participants')
            .select('*')
            .eq('email', user.email)
            .maybeSingle();

          if (participant && !participant.user_id) {
            // Link participant to auth user
            console.log('🔗 Linking participant to auth user');
            await supabase
              .from('participants')
              .update({ user_id: user.id })
              .eq('email', user.email);
          }
        }

        // Check if participant record exists at all
        const { data: linkedParticipant } = await supabase
          .from('participants')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        // If no participant record, redirect to registration
        if (!linkedParticipant) {
          console.log('ℹ️ No participant record, redirecting to registration');
          return NextResponse.redirect(new URL('/pamelding', origin));
        }
      }

      console.log('✅ Redirecting to:', next);
      return NextResponse.redirect(new URL(next, origin));
    }

    console.error('❌ Auth verification error:', error);
    return NextResponse.redirect(
      new URL(`/login?error=verification_failed&message=${encodeURIComponent(error.message)}`, origin)
    );
  }

  // Handle legacy token format (email confirmation)
  // IMPORTANT: With the legacy token format, Supabase hasn't processed it yet
  // We need to exchange the token for a session
  if (legacyToken && type === 'signup') {
    console.log('📧 Handling email confirmation with legacy token');
    
    // Email is required for token verification
    if (!email) {
      console.error('❌ Email parameter missing for legacy token verification');
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
      console.error('❌ Token verification failed:', verifyError);

      // If user was deleted after confirmation email was sent
      if (verifyError.message?.includes('does not exist') || verifyError.code === 'user_not_found') {
        console.log('ℹ️ User was deleted, redirecting to fresh registration');
        return NextResponse.redirect(
          new URL('/pamelding?error=user_deleted&message=Your account was removed. Please register again.', origin)
        );
      }

      return NextResponse.redirect(
        new URL('/login?error=confirmation_failed&message=Could not confirm email. Please try again.', origin)
      );
    }

    console.log('✅ Token verified successfully');

    // Now check if user is authenticated
    const { data: { user }, error: getUserError } = await supabase.auth.getUser();

    if (getUserError || !user) {
      console.error('❌ User not authenticated after verification:', getUserError);
      return NextResponse.redirect(
        new URL('/login?error=confirmation_failed&message=Could not confirm email. Please try again.', origin)
      );
    }

    console.log('✅ Email confirmed, user authenticated:', user.id);

    // Link participant record to auth user
    if (user.email) {
      const { data: participant } = await supabase
        .from('participants')
        .select('*')
        .eq('email', user.email)
        .maybeSingle();

      if (participant && !participant.user_id) {
        console.log('🔗 Linking participant to confirmed user');
        await supabase
          .from('participants')
          .update({ user_id: user.id })
          .eq('email', user.email);
      }
    }

    // Check if participant record exists
    const { data: linkedParticipant } = await supabase
      .from('participants')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!linkedParticipant) {
      console.log('ℹ️ No participant record, redirecting to registration');
      return NextResponse.redirect(new URL('/pamelding', origin));
    }

    console.log('✅ Redirecting to:', next);
    return NextResponse.redirect(new URL(next, origin));
  }

  // Return the user to an error page with some instructions
  console.error('❌ Missing token_hash, token, or type parameter');
  return NextResponse.redirect(
    new URL('/login?error=invalid_link&message=The login link is invalid or has expired', origin)
  );
}
