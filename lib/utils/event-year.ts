/**
 * Event Year Utilities
 *
 * Helper functions for managing event years in the Barteløpet application.
 * These utilities help determine the current event year, check edit permissions,
 * and validate year-related operations.
 */

/**
 * Get the current event year based on the current date.
 *
 * Logic:
 * - Returns the current calendar year
 * - Submission window is controlled by the database feature toggle,
 *   not by hardcoded month restrictions
 *
 * This supports year-round event management with the feature toggle
 * controlling when submissions are allowed.
 *
 * @returns The current event year
 */
export function getCurrentEventYear(): number {
  const now = new Date();
  const currentYear = now.getFullYear();

  // Always return the current calendar year
  return currentYear;
}

/**
 * Check if the submission window is currently open.
 *
 * This is controlled by a feature toggle in the database settings table.
 * Call this function from the frontend, but note that the authoritative
 * check happens at the database level via RLS policies.
 *
 * @param supabase Supabase client instance
 * @returns Promise<boolean> true if submission window is open
 */
export async function isSubmissionWindowOpen(supabase: any): Promise<boolean> {
  const { data, error } = await supabase
    .from('settings')
    .select('submission_window_open')
    .eq('id', 1)
    .single();

  if (error || !data) {
    console.error('Error fetching submission window status:', error);
    return false; // Fail closed - don't allow edits if we can't check
  }

  return data.submission_window_open;
}

/**
 * Check if a specific year is currently editable.
 *
 * A year is editable if:
 * 1. It's the current event year AND
 * 2. The submission window is open (controlled by feature toggle)
 *
 * @param year The event year to check
 * @param supabase Supabase client instance
 * @returns Promise<boolean> true if the year is editable
 */
export async function isYearEditable(year: number, supabase: any): Promise<boolean> {
  const currentYear = getCurrentEventYear();
  if (year !== currentYear) {
    return false;
  }

  return await isSubmissionWindowOpen(supabase);
}

/**
 * Get all available event years (from 2025 to current year).
 *
 * This is useful for year selection dropdowns and filters.
 * Years are returned in descending order (most recent first).
 *
 * @returns Array of event years from 2025 to current year
 */
export function getAvailableEventYears(): number[] {
  const currentYear = getCurrentEventYear();
  const years: number[] = [];

  for (let year = currentYear; year >= EVENT_YEAR_CONSTANTS.FIRST_YEAR; year--) {
    years.push(year);
  }

  return years;
}

/**
 * Validate that an event year is valid.
 *
 * Valid years are between 2025 and 2100 (inclusive).
 *
 * @param year The year to validate
 * @returns true if valid, false otherwise
 */
export function isValidEventYear(year: number): boolean {
  return Number.isInteger(year) && year >= 2025 && year <= 2100;
}

/**
 * Get a human-readable description of the edit window status.
 *
 * @param year Optional year to check (defaults to current event year)
 * @param windowOpen Whether the submission window is open
 * @returns A descriptive string about edit permissions
 */
export function getEditWindowStatus(year?: number, windowOpen?: boolean): string {
  const targetYear = year ?? getCurrentEventYear();
  const currentYear = getCurrentEventYear();

  if (targetYear !== currentYear) {
    return `Dataene for ${targetYear} er arkivert og kan ikke endres.`;
  }

  if (windowOpen) {
    return `Du kan redigere oppføringer for ${targetYear}.`;
  } else {
    return `Redigeringsvinduet er stengt. Kontakt arrangør for å åpne det.`;
  }
}

/**
 * Validate that a completion date matches the event year.
 *
 * Note: No longer restricted to November - submissions can be from any month
 * in the event year, controlled by the feature toggle instead.
 *
 * @param date The completion date (as ISO string or Date)
 * @param eventYear The event year
 * @returns Object with isValid flag and optional error message
 */
export function validateCompletionDate(
  date: string | Date,
  eventYear: number
): { isValid: boolean; error?: string } {
  const completionDate = typeof date === 'string' ? new Date(date) : date;

  // Check if date is valid
  if (isNaN(completionDate.getTime())) {
    return {
      isValid: false,
      error: 'Ugyldig dato format'
    };
  }

  const year = completionDate.getFullYear();

  // Check if date year matches event year
  if (year !== eventYear) {
    return {
      isValid: false,
      error: `Gjennomføringsdato må være i år ${eventYear}, ikke ${year}`
    };
  }

  // Check if date is not in the future
  if (completionDate > new Date()) {
    return {
      isValid: false,
      error: 'Gjennomføringsdato kan ikke være i fremtiden'
    };
  }

  return { isValid: true };
}

/**
 * Format an event year for display.
 *
 * @param year The event year
 * @returns Formatted string (e.g., "Barteløpet 2025")
 */
export function formatEventYear(year: number): string {
  return `Barteløpet ${year}`;
}

/**
 * Check if a user can perform an action on a resource from a specific year.
 *
 * @param resourceYear The year of the resource being accessed
 * @param action The action being attempted ('view' | 'create' | 'update' | 'delete')
 * @param windowOpen Whether the submission window is currently open
 * @returns Object with canPerform flag and optional reason
 */
export function checkYearPermission(
  resourceYear: number,
  action: 'view' | 'create' | 'update' | 'delete',
  windowOpen: boolean = false
): { canPerform: boolean; reason?: string } {
  const currentYear = getCurrentEventYear();

  // View is always allowed for any year
  if (action === 'view') {
    return { canPerform: true };
  }

  // Create is only allowed for current year
  if (action === 'create') {
    if (resourceYear !== currentYear) {
      return {
        canPerform: false,
        reason: `Kan kun opprette oppføringer for inneværende år (${currentYear})`
      };
    }
    return { canPerform: true };
  }

  // Update and delete require current year + submission window open
  if (action === 'update' || action === 'delete') {
    if (resourceYear !== currentYear) {
      return {
        canPerform: false,
        reason: `Kan ikke ${action === 'update' ? 'oppdatere' : 'slette'} arkiverte data fra ${resourceYear}`
      };
    }

    if (!windowOpen) {
      return {
        canPerform: false,
        reason: `Redigeringsvinduet er stengt. Kontakt arrangør for å ${action === 'update' ? 'oppdatere' : 'slette'} oppføringer.`
      };
    }

    return { canPerform: true };
  }

  return { canPerform: false, reason: 'Ukjent handling' };
}

/**
 * Constants related to event years
 */
export const EVENT_YEAR_CONSTANTS = {
  FIRST_YEAR: 2025,
  MAX_YEAR: 2100,
  EDIT_MONTH: 10,
} as const;
