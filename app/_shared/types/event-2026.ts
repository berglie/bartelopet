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
  donation_amount_nok: number;
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

export const CATEGORY_ORDER: DistanceCategorySlug[] = ['short', 'medium', 'long'];

export function categoryForPrize(distanceKm: number): DistanceCategorySlug {
  if (distanceKm <= 10) return 'short';
  if (distanceKm < 30) return 'medium';
  return 'long';
}

export function qualifyingCategories(distanceKm: number): DistanceCategorySlug[] {
  const categories: DistanceCategorySlug[] = ['short'];
  if (distanceKm > 10) categories.push('medium');
  if (distanceKm >= 30) categories.push('long');
  return categories;
}

export function donationForDistance(distanceKm: number, rate = 5): number {
  return Math.ceil(distanceKm * rate);
}
