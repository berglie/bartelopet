/**
 * API Helper Functions
 *
 * Utilities for API routes including year filtering, validation,
 * and common response patterns.
 */

import { NextResponse } from 'next/server';
import { getCurrentEventYear, isValidEventYear, isYearEditable } from './event-year';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/app/_shared/lib/supabase/types';

/**
 * Get the event year from query parameters or use current year.
 *
 * @param searchParams URL search params
 * @param paramName Name of the year parameter (default: 'year')
 * @returns The event year to use
 */
export function getYearFromParams(
  searchParams: URLSearchParams,
  paramName: string = 'year'
): number {
  const yearParam = searchParams.get(paramName);

  if (yearParam) {
    const year = parseInt(yearParam, 10);
    if (isValidEventYear(year)) {
      return year;
    }
  }

  return getCurrentEventYear();
}

/**
 * Validate that a year parameter is valid.
 *
 * @param year The year to validate
 * @returns NextResponse with error if invalid, null if valid
 */
export function validateYear(year: number): NextResponse | null {
  if (!isValidEventYear(year)) {
    return NextResponse.json(
      {
        error: 'Ugyldig år',
        message: `År må være mellom 2024 og 2100, fikk ${year}`,
      },
      { status: 400 }
    );
  }
  return null;
}

/**
 * Check if an edit operation is allowed for a given year.
 *
 * @param year The year being edited
 * @param supabase Supabase client instance
 * @returns Promise<NextResponse | null> NextResponse with error if not allowed, null if allowed
 */
export async function checkEditPermission(
  year: number,
  supabase: SupabaseClient<Database>
): Promise<NextResponse | null> {
  const currentYear = getCurrentEventYear();

  if (year !== currentYear) {
    return NextResponse.json(
      {
        error: 'Redigering ikke tillatt',
        message: `Kan kun redigere data for inneværende år (${currentYear})`,
      },
      { status: 403 }
    );
  }

  if (!(await isYearEditable(year, supabase))) {
    return NextResponse.json(
      {
        error: 'Utenfor redigeringsperiode',
        message: 'Redigering er kun tillatt i november måned',
      },
      { status: 403 }
    );
  }

  return null;
}

/**
 * Create a standardized success response.
 *
 * @param data The data to return
 * @param meta Optional metadata
 * @param status HTTP status code (default: 200)
 * @returns NextResponse with standardized format
 */
export function successResponse<T>(
  data: T,
  meta?: Record<string, unknown>,
  status: number = 200
): NextResponse {
  return NextResponse.json(
    {
      success: true,
      data,
      ...(meta && { meta }),
    },
    { status }
  );
}

/**
 * Create a standardized error response.
 *
 * @param error Error message
 * @param details Optional error details
 * @param status HTTP status code (default: 500)
 * @returns NextResponse with standardized error format
 */
export function errorResponse(
  error: string,
  details?: Record<string, unknown>,
  status: number = 500
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error,
      ...(details && { details }),
    },
    { status }
  );
}

/**
 * Create a paginated response with metadata.
 *
 * @param data Array of data items
 * @param total Total count of items
 * @param page Current page number
 * @param perPage Items per page
 * @returns NextResponse with paginated format
 */
export function paginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  perPage: number
): NextResponse {
  return NextResponse.json({
    success: true,
    data,
    meta: {
      total,
      page,
      per_page: perPage,
      total_pages: Math.ceil(total / perPage),
      has_more: page * perPage < total,
    },
  });
}

/**
 * Parse pagination parameters from search params.
 *
 * @param searchParams URL search params
 * @returns Object with page and perPage numbers
 */
export function getPaginationParams(searchParams: URLSearchParams): {
  page: number;
  perPage: number;
  from: number;
  to: number;
} {
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const perPage = Math.min(100, Math.max(1, parseInt(searchParams.get('per_page') || '20', 10)));

  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  return { page, perPage, from, to };
}

/**
 * Build a Supabase query with year filtering.
 *
 * This helper adds the event_year filter to a Supabase query builder.
 *
 * @param query Supabase query builder
 * @param year Event year to filter by
 * @returns Query builder with year filter applied
 */
export function withYearFilter<T>(query: T, year: number): T {
  // Type assertion needed because we don't have full Supabase types here
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (query as any).eq('event_year', year) as T;
}

/**
 * Extract sort parameters from search params.
 *
 * @param searchParams URL search params
 * @param defaultSortBy Default sort column
 * @param defaultOrder Default sort order
 * @returns Object with sortBy column and ascending boolean
 */
export function getSortParams(
  searchParams: URLSearchParams,
  defaultSortBy: string = 'created_at',
  defaultOrder: 'asc' | 'desc' = 'desc'
): {
  sortBy: string;
  ascending: boolean;
} {
  const sortBy = searchParams.get('sort_by') || defaultSortBy;
  const order = searchParams.get('sort_order') || defaultOrder;

  return {
    sortBy,
    ascending: order === 'asc',
  };
}

/**
 * Validate required fields in request body.
 *
 * @param body Request body object
 * @param requiredFields Array of required field names
 * @returns NextResponse with error if validation fails, null if valid
 */
export function validateRequiredFields(
  body: Record<string, unknown>,
  requiredFields: string[]
): NextResponse | null {
  const missingFields = requiredFields.filter((field) => !body[field]);

  if (missingFields.length > 0) {
    return NextResponse.json(
      {
        error: 'Mangler påkrevde felter',
        message: `Følgende felter er påkrevd: ${missingFields.join(', ')}`,
        missing_fields: missingFields,
      },
      { status: 400 }
    );
  }

  return null;
}

/**
 * Type guard to check if error is a Supabase error with code.
 *
 * @param error Any error object
 * @returns true if error has a code property
 */
export function isSupabaseError(
  error: unknown
): error is { code: string; message: string; details?: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (error as { code: unknown }).code === 'string'
  );
}

/**
 * Convert a Supabase error to a user-friendly error response.
 *
 * @param error Supabase error object
 * @returns NextResponse with appropriate error message
 */
export function handleSupabaseError(error: unknown): NextResponse {
  if (isSupabaseError(error)) {
    // Handle specific Supabase error codes
    switch (error.code) {
      case '23505': // unique_violation
        return errorResponse('Denne oppføringen finnes allerede', undefined, 409);
      case '23503': // foreign_key_violation
        return errorResponse('Ugyldig referanse', undefined, 400);
      case '23514': // check_violation
        return errorResponse('Validering feilet', { details: error.details }, 400);
      case 'PGRST116': // No rows returned
        return errorResponse('Fant ikke ressurs', undefined, 404);
      default:
        return errorResponse('Database feil', { code: error.code, message: error.message }, 500);
    }
  }

  return errorResponse('En ukjent feil oppstod', undefined, 500);
}
