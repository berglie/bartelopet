import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/app/_shared/lib/supabase/types';

// Limits per signed-in user, counted in the database by check_rate_limit().
// The contact form has no user and is limited per IP by a Vercel Firewall rule instead.
const limits = {
  // Photo uploads - 10 uploads per hour per user
  upload: { max: 10, windowSeconds: 60 * 60 },
  // Comments - 20 comments per hour per user
  comment: { max: 20, windowSeconds: 60 * 60 },
  // Account operations - 10 requests per hour per user
  account: { max: 10, windowSeconds: 60 * 60 },
};

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

/**
 * Count a request against the signed-in user's limit for a bucket.
 * If the check itself fails the request is let through (fail open): every caller is signed in
 * and protected by RLS, so a database hiccup should not block people.
 * @param bucket - Which limit to use
 * @param supabase - Server client for the signed-in user
 */
export async function checkRateLimit(
  bucket: keyof typeof limits,
  supabase: SupabaseClient<Database>
): Promise<RateLimitResult> {
  const { max, windowSeconds } = limits[bucket];
  const { data, error } = await supabase
    .rpc('check_rate_limit', { p_bucket: bucket, p_max: max, p_window_seconds: windowSeconds })
    .single();

  if (error || !data) {
    console.error('[Rate Limit] Error checking rate limit:', error?.code);
    return { success: true, limit: max, remaining: max, reset: Date.now() };
  }

  return {
    success: data.allowed,
    limit: max,
    remaining: data.remaining,
    reset: new Date(data.reset_at).getTime(),
  };
}
