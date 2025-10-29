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
 * Returns the current year if we're in November or later, otherwise the previous year
 */
export function getCurrentEventYear(): number {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // If we're before November, we're still in the previous event year
  if (currentMonth < EVENT_CONFIG.eventMonth) {
    return currentYear - 1;
  }

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
 * Check if submissions are currently allowed (during November)
 */
export function isSubmissionWindowOpen(): boolean {
  const now = new Date();
  const currentMonth = now.getMonth();

  return currentMonth === EVENT_CONFIG.eventMonth;
}

/**
 * Check if submissions are allowed for a specific year
 */
export function canSubmitForYear(year: number): boolean {
  return isCurrentYear(year) && isSubmissionWindowOpen();
}

/**
 * Get the submission window text for a year
 */
export function getSubmissionWindowText(year: number): string {
  if (!isCurrentYear(year)) {
    return `Innsendingsvinduet for ${year} er stengt`;
  }

  if (isSubmissionWindowOpen()) {
    return `Innsendingsvinduet er åpent for ${year}`;
  }

  return `Innsendingsvinduet åpner i november ${year}`;
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
 */
export function getYearDateRange(year: number): { start: Date; end: Date } {
  return {
    start: new Date(year, EVENT_CONFIG.eventMonth, 1), // November 1st
    end: new Date(year, EVENT_CONFIG.eventMonth + 1, 0, 23, 59, 59), // Last day of November
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
 */
export function getNextEventYear(): number {
  const currentEventYear = getCurrentEventYear();
  const now = new Date();
  const currentMonth = now.getMonth();

  // If we're past November, next event year is next year
  if (currentMonth > EVENT_CONFIG.eventMonth) {
    return currentEventYear + 1;
  }

  return currentEventYear;
}
