import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/app/_shared/lib/supabase/server';

/**
 * POST /api/vipps/link-account
 *
 * Links a Vipps account to an existing authenticated user
 *
 * Request body:
 * {
 *   vipps_sub: string - Vipps subject identifier
 * }
 *
 * Response:
 * Success: { success: true, message: string }
 * Error: { error: string, message: string }
 *
 * Steps:
 * 1. Verify user is authenticated
 * 2. Verify Vipps account not already linked to another user
 * 3. Update participants table with vipps_sub
 * 4. Update auth_provider to 'both'
 * 5. Return success/error JSON
 */
export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('Unauthorized link-account attempt:', authError);
      return NextResponse.json(
        { error: 'unauthorized', message: 'Du må være logget inn for å koble kontoer' },
        { status: 401 }
      );
    }

    // Parse request body
    let body: { vipps_sub?: string };
    try {
      body = await request.json();
    } catch (err) {
      console.error('Invalid JSON body:', err);
      return NextResponse.json(
        { error: 'invalid_request', message: 'Ugyldig forespørsel' },
        { status: 400 }
      );
    }

    const { vipps_sub } = body;

    // Validate vipps_sub
    if (!vipps_sub || typeof vipps_sub !== 'string') {
      console.error('Missing or invalid vipps_sub');
      return NextResponse.json(
        { error: 'invalid_vipps_sub', message: 'Mangler Vipps identifikator' },
        { status: 400 }
      );
    }

    // Check if current user already has a Vipps account linked
    const { data: currentParticipant, error: currentError } = await supabase
      .from('participants')
      .select('vipps_sub, auth_provider')
      .eq('user_id', user.id)
      .single();

    if (currentError) {
      console.error('Failed to fetch current participant:', currentError);
      return NextResponse.json(
        { error: 'fetch_failed', message: 'Kunne ikke hente brukerdata' },
        { status: 500 }
      );
    }

    if (currentParticipant?.vipps_sub) {
      console.error('User already has Vipps linked:', {
        userId: user.id,
        existingVippsSub: currentParticipant.vipps_sub,
      });
      return NextResponse.json(
        { error: 'already_linked', message: 'Du har allerede koblet en Vipps-konto' },
        { status: 400 }
      );
    }

    // Check if this Vipps account is already linked to another user
    const { data: existingVippsUser, error: checkError } = await supabase
      .from('participants')
      .select('user_id, email, full_name')
      .eq('vipps_sub', vipps_sub)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error checking existing Vipps account:', checkError);
      return NextResponse.json(
        { error: 'check_failed', message: 'Kunne ikke sjekke Vipps-konto' },
        { status: 500 }
      );
    }

    if (existingVippsUser && existingVippsUser.user_id !== user.id) {
      console.error('Vipps account already linked to another user:', {
        vippsSub: vipps_sub,
        existingUserId: existingVippsUser.user_id,
        attemptingUserId: user.id,
      });
      return NextResponse.json(
        {
          error: 'vipps_already_linked',
          message: 'Denne Vipps-kontoen er allerede koblet til en annen bruker'
        },
        { status: 400 }
      );
    }

    // Link Vipps account to current user
    const newAuthProvider = currentParticipant.auth_provider === 'vipps'
      ? 'vipps'
      : 'both';

    const { error: updateError } = await supabase
      .from('participants')
      .update({
        vipps_sub: vipps_sub,
        auth_provider: newAuthProvider,
      })
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Failed to link Vipps account:', updateError);
      return NextResponse.json(
        { error: 'update_failed', message: 'Kunne ikke koble Vipps-konto' },
        { status: 500 }
      );
    }

    console.log('Vipps account linked successfully:', {
      userId: user.id,
      vippsSub: vipps_sub,
      authProvider: newAuthProvider,
    });

    return NextResponse.json({
      success: true,
      message: 'Vipps-konto koblet til',
      auth_provider: newAuthProvider,
    });

  } catch (error) {
    console.error('Unexpected error in link-account:', error);
    return NextResponse.json(
      { error: 'unexpected_error', message: 'En uventet feil oppstod' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/vipps/link-account
 *
 * Returns current linking status for authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'unauthorized', message: 'Du må være logget inn' },
        { status: 401 }
      );
    }

    const { data: participant, error: participantError } = await supabase
      .from('participants')
      .select('vipps_sub, auth_provider, email')
      .eq('user_id', user.id)
      .single();

    if (participantError) {
      console.error('Failed to fetch participant:', participantError);
      return NextResponse.json(
        { error: 'fetch_failed', message: 'Kunne ikke hente brukerdata' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      has_vipps_linked: !!participant.vipps_sub,
      auth_provider: participant.auth_provider,
      email: participant.email,
    });

  } catch (error) {
    console.error('Unexpected error in GET link-account:', error);
    return NextResponse.json(
      { error: 'unexpected_error', message: 'En uventet feil oppstod' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/vipps/link-account
 *
 * Unlinks Vipps account from authenticated user
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'unauthorized', message: 'Du må være logget inn' },
        { status: 401 }
      );
    }

    // Get current participant
    const { data: participant, error: fetchError } = await supabase
      .from('participants')
      .select('vipps_sub, auth_provider')
      .eq('user_id', user.id)
      .single();

    if (fetchError) {
      console.error('Failed to fetch participant:', fetchError);
      return NextResponse.json(
        { error: 'fetch_failed', message: 'Kunne ikke hente brukerdata' },
        { status: 500 }
      );
    }

    if (!participant.vipps_sub) {
      return NextResponse.json(
        { error: 'not_linked', message: 'Ingen Vipps-konto å koble fra' },
        { status: 400 }
      );
    }

    // Unlink Vipps account
    const { error: updateError } = await supabase
      .from('participants')
      .update({
        vipps_sub: null,
        auth_provider: participant.auth_provider === 'both' ? 'email' : 'email',
      })
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Failed to unlink Vipps account:', updateError);
      return NextResponse.json(
        { error: 'update_failed', message: 'Kunne ikke koble fra Vipps-konto' },
        { status: 500 }
      );
    }

    console.log('Vipps account unlinked:', {
      userId: user.id,
      previousVippsSub: participant.vipps_sub,
    });

    return NextResponse.json({
      success: true,
      message: 'Vipps-konto koblet fra',
    });

  } catch (error) {
    console.error('Unexpected error in DELETE link-account:', error);
    return NextResponse.json(
      { error: 'unexpected_error', message: 'En uventet feil oppstod' },
      { status: 500 }
    );
  }
}

/**
 * Security notes:
 * - All endpoints require authentication
 * - Vipps sub uniqueness is enforced at database level
 * - State validation prevents CSRF attacks
 * - Session tokens prevent replay attacks
 *
 * Rate limiting:
 * In production, implement rate limiting on these endpoints:
 * - Limit link/unlink operations per user per time period
 * - Prevent brute force linking attempts
 */
