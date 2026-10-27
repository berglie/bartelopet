/**
 * Application configuration constants
 */

export const config = {
  app: {
    name: 'Barteløpet',
    description: 'Virtuelt veldedighetsløp i november for Prosjekt SUT',
    url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  },
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  },
  upload: {
    maxFileSizeMB: 10,
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    maxImageWidth: 1920,
    thumbnailSize: 400,
  },
  pagination: {
    defaultPageSize: 20,
    maxPageSize: 100,
  },
} as const;

export const PROJECT_SUT_URL = 'https://www.sandnesultratrail.com/prosjekt-sut';

/** The Spleis campaign that also sells the 2025 trophies as rewards. */
export const SPLEIS_PROJECT_URL = 'https://www.spleis.no/project/522938';

/** The photo gallery, votes and comments belong to the 2025 edition (completions schema). */
export const GALLERY_EVENT_YEAR = 2025;
