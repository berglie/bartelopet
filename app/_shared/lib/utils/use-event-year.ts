/**
 * useEventYear Hook
 *
 * React hook for managing event year selection in the frontend.
 * Handles year state, URL synchronization, and provides helper functions.
 */

'use client';

import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import { useMemo, useCallback } from 'react';
import {
  getCurrentEventYear,
  getAvailableEventYears,
  isYearEditableSync,
  formatEventYear,
  getEditWindowStatus,
} from './event-year';

/**
 * Hook for managing event year in components.
 *
 * Features:
 * - Syncs year with URL query params
 * - Provides year setter that updates URL
 * - Returns current year info and helpers
 *
 * Usage:
 * ```tsx
 * function MyComponent() {
 *   const { eventYear, setEventYear, isCurrentYear, canEdit } = useEventYear();
 *
 *   return (
 *     <div>
 *       <p>Viewing: {eventYear}</p>
 *       <button onClick={() => setEventYear(2025)}>View 2025</button>
 *       {canEdit && <button>Edit</button>}
 *     </div>
 *   );
 * }
 * ```
 */
export function useEventYear() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Get current year from URL or default to current event year
  const eventYear = useMemo(() => {
    const yearParam = searchParams.get('year');
    if (yearParam) {
      const year = parseInt(yearParam, 10);
      if (!isNaN(year) && year >= 2025 && year <= 2100) {
        return year;
      }
    }
    return getCurrentEventYear();
  }, [searchParams]);

  // Set event year (updates URL)
  const setEventYear = useCallback(
    (year: number) => {
      const params = new URLSearchParams(searchParams.toString());

      // If setting to current year, remove param (use default)
      if (year === getCurrentEventYear()) {
        params.delete('year');
      } else {
        params.set('year', year.toString());
      }

      // Update URL
      const queryString = params.toString();
      router.push(queryString ? `${pathname}?${queryString}` : pathname);
    },
    [searchParams, router, pathname]
  );

  // Get available years for selection
  const availableYears = useMemo(() => getAvailableEventYears(), []);

  // Check if viewing current year
  const isCurrentYear = useMemo(
    () => eventYear === getCurrentEventYear(),
    [eventYear]
  );

  // Check if year is editable (client-side check)
  const canEdit = useMemo(() => isYearEditableSync(eventYear), [eventYear]);

  // Get formatted year string
  const formattedYear = useMemo(() => formatEventYear(eventYear), [eventYear]);

  // Get edit window status message
  const editStatus = useMemo(
    () => getEditWindowStatus(eventYear),
    [eventYear]
  );

  return {
    eventYear,
    setEventYear,
    availableYears,
    isCurrentYear,
    canEdit,
    formattedYear,
    editStatus,
  };
}

/**
 * Hook for fetching data with year filtering.
 *
 * Extends useEventYear with data fetching helpers.
 *
 * Usage:
 * ```tsx
 * function ParticipantList() {
 *   const { eventYear, buildApiUrl } = useEventYearData();
 *   const { data } = useSWR(buildApiUrl('/api/participants'));
 *
 *   // data will be filtered by current eventYear
 * }
 * ```
 */
export function useEventYearData() {
  const yearInfo = useEventYear();

  // Build API URL with year parameter
  const buildApiUrl = useCallback(
    (baseUrl: string, additionalParams?: Record<string, string>) => {
      const url = new URL(baseUrl, window.location.origin);

      // Add year parameter
      url.searchParams.set('year', yearInfo.eventYear.toString());

      // Add any additional parameters
      if (additionalParams) {
        Object.entries(additionalParams).forEach(([key, value]) => {
          url.searchParams.set(key, value);
        });
      }

      return url.pathname + url.search;
    },
    [yearInfo.eventYear]
  );

  // Helper to add year to fetch options
  const withYear = useCallback(
    (data: Record<string, any>) => ({
      ...data,
      event_year: yearInfo.eventYear,
    }),
    [yearInfo.eventYear]
  );

  return {
    ...yearInfo,
    buildApiUrl,
    withYear,
  };
}

/**
 * Get query parameter string for year filtering.
 *
 * Useful for manual API calls.
 *
 * @param year Event year (defaults to current)
 * @param additionalParams Additional query parameters
 * @returns Query string (e.g., "?year=2025&page=1")
 */
export function getYearQueryParams(
  year?: number,
  additionalParams?: Record<string, string>
): string {
  const params = new URLSearchParams();

  // Add year
  params.set('year', (year || getCurrentEventYear()).toString());

  // Add additional params
  if (additionalParams) {
    Object.entries(additionalParams).forEach(([key, value]) => {
      params.set(key, value);
    });
  }

  return params.toString() ? `?${params.toString()}` : '';
}
