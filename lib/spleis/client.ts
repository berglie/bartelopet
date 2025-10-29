/**
 * Spleis API Client
 * Fetches donation data from spleis.no campaign
 */

export interface SpleisProjectData {
  moneygoal: number;
  collected_amount?: number;
  goaltype: string;
  title: string;
  description: string;
  organizationNumber?: string;
  startDate?: string;
  endDate?: string;
}

const SPLEIS_PROJECT_ID = '463218';
const SPLEIS_API_URL = `https://spleis.no/api/public/project/${SPLEIS_PROJECT_ID}`;
const SPLEIS_PROJECT_URL = 'https://spleis.no/barteløpet2025';

/**
 * Fetches the current donation data from Spleis
 * Returns cached data if fetch fails to ensure page loads
 */
export async function getSpleisData(): Promise<SpleisProjectData | null> {
  try {
    const response = await fetch(SPLEIS_API_URL, {
      next: { revalidate: 300 }, // Cache for 5 minutes
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'barteløpet-website'
      }
    });

    if (!response.ok) {
      console.warn(`Spleis API returned status ${response.status}`);
      return null;
    }

    const data = await response.json();
    return data as SpleisProjectData;
  } catch (error) {
    console.error('Failed to fetch Spleis data:', error);
    return null;
  }
}

/**
 * Formats Norwegian currency amount
 */
export function formatAmount(amount: number): string {
  return new Intl.NumberFormat('nb-NO', {
    style: 'currency',
    currency: 'NOK',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Calculates the progress percentage
 */
export function calculateProgress(collected: number, goal: number): number {
  if (goal === 0) return 0;
  return Math.min(Math.round((collected / goal) * 100), 100);
}

export { SPLEIS_PROJECT_URL, SPLEIS_PROJECT_ID };
