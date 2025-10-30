/**
 * Year utility functions for Barteløpet multi-year support
 */

// Event configuration
export const EVENT_CONFIG = {
  startYear: 2025,
  currentYear: new Date().getFullYear(),
  // Event runs during November (month 10 in 0-indexed)
  eventMonth: 10,
  // Submissions allowed during November
  submissionWindowStart: 10, // November
  submissionWindowEnd: 10, // November
} as const;

/**
 * Get the current event year based on the current date
 * Returns the current calendar year, supporting year-round submissions
 * controlled by the feature toggle in the database settings table.
 */
export function getCurrentEventYear(): number {
  const now = new Date();
  const currentYear = now.getFullYear();

  // Always return the current calendar year
  // The submission window is now controlled by the database feature toggle,
  // not by hardcoded month restrictions
  return currentYear;
}

/**
 * Get all available years for the event
 */
export function getAvailableYears(): number[] {
  const currentEventYear = getCurrentEventYear();
  const years: number[] = [];

  for (let year = EVENT_CONFIG.startYear; year <= currentEventYear; year++) {
    years.push(year);
  }

  return years;
}

/**
 * Check if a given year is the current event year
 */
export function isCurrentYear(year: number): boolean {
  return year === getCurrentEventYear();
}

/**
 * Check if submissions are currently allowed (controlled by feature toggle)
 *
 * NOTE: This is a client-side check only. The authoritative check
 * happens at the database level. Use isSubmissionWindowOpen from
 * event-year.ts with a Supabase client for the real status.
 *
 * This function is kept for backwards compatibility but always returns true.
 * You should fetch the actual status from the settings table.
 */
export function isSubmissionWindowOpen(): boolean {
  // Return true by default - actual check should be done via database
  // This prevents breaking existing code that doesn't pass supabase client
  return true;
}

/**
 * Check if submissions are allowed for a specific year
 *
 * NOTE: This only checks if the year is current. The actual submission
 * window status should be checked via the database settings table.
 */
export function canSubmitForYear(year: number): boolean {
  return isCurrentYear(year);
}

/**
 * Get the submission window text for a year
 *
 * @param year The year to check
 * @param windowOpen Optional parameter indicating if window is open (from database)
 */
export function getSubmissionWindowText(year: number, windowOpen?: boolean): string {
  if (!isCurrentYear(year)) {
    return `Innsendingsvinduet for ${year} er stengt`;
  }

  if (windowOpen === true) {
    return `Innsendingsvinduet er åpent for ${year}`;
  } else if (windowOpen === false) {
    return `Innsendingsvinduet er stengt. Kontakt arrangør.`;
  }

  return `Innsendingsvinduet kontrolleres av arrangør`;
}

/**
 * Format a year range for display
 */
export function formatYearRange(startYear: number, endYear?: number): string {
  if (!endYear || startYear === endYear) {
    return `${startYear}`;
  }
  return `${startYear}-${endYear}`;
}

/**
 * Get date range for a specific event year
 * Returns the full calendar year to support year-round submissions
 */
export function getYearDateRange(year: number): { start: Date; end: Date } {
  return {
    start: new Date(year, 0, 1), // January 1st
    end: new Date(year, 11, 31, 23, 59, 59), // December 31st
  };
}

/**
 * Validate if a year is a valid event year
 */
export function isValidEventYear(year: number): boolean {
  const availableYears = getAvailableYears();
  return availableYears.includes(year);
}

/**
 * Get the next event year
 * Returns the next calendar year
 */
export function getNextEventYear(): number {
  const currentEventYear = getCurrentEventYear();
  return currentEventYear + 1;
}
