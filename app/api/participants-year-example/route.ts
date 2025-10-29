/**
 * Example API Route: Participants with Year Support
 *
 * This is an example implementation showing how to update API routes
 * to support year filtering and November-only edits.
 *
 * NOTE: This is an EXAMPLE file. Use this as a reference to update
 * the actual /api/participants/route.ts file.
 */

import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import {
  getYearFromParams,
  validateYear,
  checkEditPermission,
  successResponse,
  errorResponse,
  paginatedResponse,
  getPaginationParams,
  getSortParams,
  validateRequiredFields,
  handleSupabaseError,
} from '@/lib/utils/api-helpers';
import { getCurrentEventYear } from '@/lib/utils/event-year';

/**
 * GET /api/participants
 *
 * Fetch participants with optional year filtering.
 *
 * Query Parameters:
 * - year: Event year to filter (defaults to current year)
 * - page: Page number (default: 1)
 * - per_page: Items per page (default: 20, max: 100)
 * - sort_by: Sort column (default: created_at)
 * - sort_order: Sort order asc/desc (default: desc)
 *
 * Returns:
 * - 200: Array of participants with pagination metadata
 * - 400: Invalid year parameter
 * - 500: Server error
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const supabase = createRouteHandlerClient({ cookies });

  try {
    // Get year from query params or use current year
    const year = getYearFromParams(searchParams);

    // Validate year
    const yearError = validateYear(year);
    if (yearError) return yearError;

    // Get pagination parameters
    const { page, perPage, from, to } = getPaginationParams(searchParams);

    // Get sort parameters
    const { sortBy, ascending } = getSortParams(searchParams, 'created_at', 'desc');

    // Fetch participants for the specified year
    const { data, error, count } = await supabase
      .from('participants')
      .select('*', { count: 'exact' })
      .eq('event_year', year)
      .order(sortBy, { ascending })
      .range(from, to);

    if (error) throw error;

    return paginatedResponse(data || [], count || 0, page, perPage);
  } catch (error) {
    console.error('Error fetching participants:', error);
    return handleSupabaseError(error);
  }
}

/**
 * POST /api/participants
 *
 * Create a new participant registration.
 * Registration is only allowed for the current event year.
 *
 * Body:
 * - email: string (required)
 * - full_name: string (required)
 * - postal_address: string (required)
 * - phone_number: string (optional)
 * - bib_number: number (required)
 * - user_id: string (optional, from auth)
 *
 * Returns:
 * - 201: Created participant
 * - 400: Validation error
 * - 401: Unauthorized
 * - 409: Duplicate registration (user already registered for this year)
 * - 500: Server error
 */
export async function POST(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });

  try {
    // Get authenticated user (optional, depends on auth strategy)
    const { data: { user } } = await supabase.auth.getUser();

    // Parse request body
    const body = await request.json();

    // Validate required fields
    const validationError = validateRequiredFields(body, [
      'email',
      'full_name',
      'postal_address',
      'bib_number',
    ]);
    if (validationError) return validationError;

    // Get current event year (new registrations always go to current year)
    const currentYear = getCurrentEventYear();

    // Check if user already registered for this year
    if (user) {
      const { data: existing } = await supabase
        .from('participants')
        .select('id')
        .eq('user_id', user.id)
        .eq('event_year', currentYear)
        .single();

      if (existing) {
        return errorResponse(
          'Allerede registrert',
          { message: `Du er allerede registrert for ${currentYear}` },
          409
        );
      }
    }

    // Create participant
    const { data, error } = await supabase
      .from('participants')
      .insert({
        email: body.email,
        full_name: body.full_name,
        postal_address: body.postal_address,
        phone_number: body.phone_number || null,
        bib_number: body.bib_number,
        user_id: user?.id || null,
        event_year: currentYear, // Always current year
      })
      .select()
      .single();

    if (error) throw error;

    return successResponse(data, { event_year: currentYear }, 201);
  } catch (error) {
    console.error('Error creating participant:', error);
    return handleSupabaseError(error);
  }
}

/**
 * Example: GET /api/participants/[id]
 *
 * This would be in a separate file: /api/participants/[id]/route.ts
 */
export async function GET_BY_ID(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createRouteHandlerClient({ cookies });

  try {
    const { data, error } = await supabase
      .from('participants')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error) throw error;

    if (!data) {
      return errorResponse('Deltaker ikke funnet', undefined, 404);
    }

    return successResponse(data);
  } catch (error) {
    console.error('Error fetching participant:', error);
    return handleSupabaseError(error);
  }
}

/**
 * Example: PATCH /api/participants/[id]
 *
 * Update participant - only allowed for current year during November.
 * This would be in a separate file: /api/participants/[id]/route.ts
 */
export async function PATCH_BY_ID(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createRouteHandlerClient({ cookies });

  try {
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return errorResponse('Ikke autorisert', undefined, 401);
    }

    // Get existing participant to check year and ownership
    const { data: participant, error: fetchError } = await supabase
      .from('participants')
      .select('event_year, user_id')
      .eq('id', params.id)
      .single();

    if (fetchError) throw fetchError;

    if (!participant) {
      return errorResponse('Deltaker ikke funnet', undefined, 404);
    }

    // Check ownership
    if (participant.user_id !== user.id) {
      return errorResponse('Ikke tilgang', undefined, 403);
    }

    // Check edit permission for the year
    // This checks: 1) year is current year, 2) we're in November
    const editError = checkEditPermission(participant.event_year);
    if (editError) return editError;

    // Parse request body
    const body = await request.json();

    // Only allow updating specific fields
    const allowedUpdates: Record<string, any> = {};
    if (body.full_name) allowedUpdates.full_name = body.full_name;
    if (body.postal_address) allowedUpdates.postal_address = body.postal_address;
    if (body.phone_number !== undefined) allowedUpdates.phone_number = body.phone_number;
    if (body.email) allowedUpdates.email = body.email;

    if (Object.keys(allowedUpdates).length === 0) {
      return errorResponse('Ingen gyldige felter å oppdatere', undefined, 400);
    }

    // Update participant
    const { data, error } = await supabase
      .from('participants')
      .update(allowedUpdates)
      .eq('id', params.id)
      .eq('event_year', participant.event_year) // Extra safety check
      .select()
      .single();

    if (error) throw error;

    return successResponse(data);
  } catch (error) {
    console.error('Error updating participant:', error);
    return handleSupabaseError(error);
  }
}

/**
 * Example: GET /api/participants/[id]/history
 *
 * Get participation history across all years for a user.
 * This would be in a separate file: /api/participants/[id]/history/route.ts
 */
export async function GET_HISTORY(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createRouteHandlerClient({ cookies });

  try {
    // Get participant to find user_id
    const { data: participant, error: fetchError } = await supabase
      .from('participants')
      .select('user_id')
      .eq('id', params.id)
      .single();

    if (fetchError) throw fetchError;

    if (!participant || !participant.user_id) {
      return errorResponse('Deltaker ikke funnet', undefined, 404);
    }

    // Use the database function to get history
    const { data, error } = await supabase.rpc('get_participant_history', {
      p_user_id: participant.user_id,
    });

    if (error) throw error;

    return successResponse(data || []);
  } catch (error) {
    console.error('Error fetching participant history:', error);
    return handleSupabaseError(error);
  }
}
