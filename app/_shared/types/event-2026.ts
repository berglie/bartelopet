export type DistanceCategorySlug = 'short' | 'medium' | 'long';

export interface DistanceCategory {
  slug: DistanceCategorySlug;
  label: string;
  minimum_km: number;
  maximum_km: number | null;
  color: string;
}

export interface PublicRun {
  id: string;
  participant_id: string;
  full_name: string;
  bib_number: number;
  run_date: string;
  distance_km: number;
  title: string | null;
  duration_text: string | null;
  comment: string | null;
  evidence_url: string | null;
  interest_categories: DistanceCategorySlug[];
}

export interface TicketTotals {
  short: number;
  medium: number;
  long: number;
}

export const EVENT_YEAR_2026 = 2026;

/**
 * Run distance limits, checked against the rounded distance (see roundedKm), so 2.5 km counts
 * as the official 3 km. Mirrored in validate_2026_run() in the database.
 */
export const MIN_RUN_KM = 3;
export const MAX_RUN_KM = 120;

/** Today's date (YYYY-MM-DD) in Norway. */
export function osloToday(now = new Date()): string {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Oslo' }).format(now);
}

/** Dates (YYYY-MM-DD) a run can be registered or changed for. */
export interface RunDateRange {
  min: string;
  max: string;
}

/**
 * Runs are registered within 24 hours. They have no time of day, so that means today or
 * yesterday in Norway, inside the submission period. Null when no date is open.
 * Mirrored in validate_2026_run() in the database.
 */
export function runDateRange(
  today: string,
  period: { start: string; end: string }
): RunDateRange | null {
  const yesterday = new Date(`${today}T12:00:00Z`);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const min = [yesterday.toISOString().slice(0, 10), period.start].sort()[1];
  const max = [today, period.end].sort()[0];
  return min <= max ? { min, max } : null;
}

export const CATEGORY_ORDER: DistanceCategorySlug[] = ['short', 'medium', 'long'];

/**
 * Single source of truth for how each prize category is named and coloured.
 * `solid` is for filled surfaces (cards, headers), `soft` for large tinted areas.
 */
export const CATEGORY_META: Record<
  DistanceCategorySlug,
  { name: string; range: string; examples: string; solid: string; soft: string }
> = {
  short: {
    name: 'Kort',
    range: 'Opptil 10 km',
    examples: '3 km, 5 km og 10 km',
    solid: 'bg-accent text-accent-foreground',
    soft: 'bg-accent/40',
  },
  medium: {
    name: 'Mellom',
    range: '10–30 km',
    examples: 'Halvmaraton (21,1 km) og løp opp til 30 km',
    solid: 'bg-secondary text-secondary-foreground',
    soft: 'bg-secondary/35',
  },
  long: {
    name: 'Lang',
    range: '30+ km',
    examples: 'Maraton og ultraløp',
    solid: 'bg-foreground text-background',
    soft: 'bg-foreground/10',
  },
};

export function isCategorySlug(value: string): value is DistanceCategorySlug {
  return value in CATEGORY_META;
}

export function categoryForPrize(distanceKm: number): DistanceCategorySlug {
  if (distanceKm <= 10) return 'short';
  if (distanceKm < 30) return 'medium';
  return 'long';
}

/**
 * Runs count in whole km, rounded to the nearest (2.5 → 3, 2.4 → 2). The rounded distance
 * decides both categories and tickets. Mirrors ROUND() in the eligible_entries view.
 */
export function roundedKm(distanceKm: number): number {
  return Math.round(distanceKm);
}

export function qualifyingCategories(distanceKm: number): DistanceCategorySlug[] {
  const km = roundedKm(distanceKm);
  const categories: DistanceCategorySlug[] = ['short'];
  if (km > 10) categories.push('medium');
  if (km >= 30) categories.push('long');
  return categories;
}

/** One ticket per km, in every chosen category the run qualifies for. */
export function ticketsForRun(distanceKm: number): number {
  return roundedKm(distanceKm);
}

export function donationForDistance(distanceKm: number, rate = 5): number {
  return Math.ceil(distanceKm * rate);
}
