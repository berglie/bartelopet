/**
 * Shared Supabase client exports
 * These are used across all features for database access
 */

export { createClient as createBrowserClient } from '@/lib/supabase/client'
export { createClient as createServerClient } from '@/lib/supabase/server'
export { updateSession } from '@/lib/supabase/middleware'
export type { Database } from '@/lib/supabase/types'