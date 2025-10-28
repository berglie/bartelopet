/**
 * Application configuration constants
 */

export const config = {
  app: {
    name: 'Barteløpet',
    description: 'Barfotløp for veldedighet',
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
