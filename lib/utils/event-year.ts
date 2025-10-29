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
 * - If current month is November (11) or December (12): return current year
 * - Otherwise: return previous year
 *
 * This is because the Barteløpet event takes place in November, so:
 * - From Nov 1 - Dec 31: We're in the current year's event cycle
 * - From Jan 1 - Oct 31: We're showing results from last year's event
 *
 * @returns The current event year
 */
export function getCurrentEventYear(): number {
  const now = new Date();
  const currentMonth = now.getMonth() + 1; // getMonth() is 0-indexed
  const currentYear = now.getFullYear();

  // If we're in November (11) or December (12), return current year
  // Otherwise return previous year
  if (currentMonth >= 11) {
    return currentYear;
  } else {
    return currentYear - 1;
  }
}

/**
 * Check if we're currently in November (the edit window).
 *
 * During November, participants can edit their registrations and completions
 * for the current event year. Outside of November, data is read-only.
 *
 * @returns true if current month is November, false otherwise
 */
export function isNovemberEditWindow(): boolean {
  const now = new Date();
  const currentMonth = now.getMonth() + 1; // getMonth() is 0-indexed
  return currentMonth === 11;
}

/**
 * Check if a specific year is currently editable.
 *
 * A year is editable if:
 * 1. It's the current event year AND
 * 2. We're currently in November (the edit window)
 *
 * @param year The event year to check
 * @returns true if the year is editable, false otherwise
 */
export function isYearEditable(year: number): boolean {
  return year === getCurrentEventYear() && isNovemberEditWindow();
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

  for (let year = currentYear; year >= 2025; year--) {
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
 * @returns A descriptive string about edit permissions
 */
export function getEditWindowStatus(year?: number): string {
  const targetYear = year ?? getCurrentEventYear();
  const currentYear = getCurrentEventYear();
  const inNovember = isNovemberEditWindow();

  if (targetYear !== currentYear) {
    return `Dataene for ${targetYear} er arkivert og kan ikke endres.`;
  }

  if (inNovember) {
    return `Du kan redigere oppføringer for ${targetYear} i løpet av november måned.`;
  } else {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;

    if (currentMonth < 11) {
      return `Redigering åpner i november ${currentYear}.`;
    } else {
      return `Redigeringsperioden for ${currentYear} er avsluttet.`;
    }
  }
}

/**
 * Validate that a completion date matches the event year and is in November.
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
  const month = completionDate.getMonth() + 1; // getMonth() is 0-indexed

  // Check if date year matches event year
  if (year !== eventYear) {
    return {
      isValid: false,
      error: `Gjennomføringsdato må være i år ${eventYear}, ikke ${year}`
    };
  }

  // Check if date is in November
  if (month !== 11) {
    return {
      isValid: false,
      error: `Gjennomføringsdato må være i november (måned 11), ikke måned ${month}`
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
 * @returns Object with canPerform flag and optional reason
 */
export function checkYearPermission(
  resourceYear: number,
  action: 'view' | 'create' | 'update' | 'delete'
): { canPerform: boolean; reason?: string } {
  const currentYear = getCurrentEventYear();
  const inNovember = isNovemberEditWindow();

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

  // Update and delete require current year + November
  if (action === 'update' || action === 'delete') {
    if (resourceYear !== currentYear) {
      return {
        canPerform: false,
        reason: `Kan ikke ${action === 'update' ? 'oppdatere' : 'slette'} arkiverte data fra ${resourceYear}`
      };
    }

    if (!inNovember) {
      return {
        canPerform: false,
        reason: `Kan kun ${action === 'update' ? 'oppdatere' : 'slette'} oppføringer i november`
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
  EDIT_MONTH: 11, // November
} as const;
