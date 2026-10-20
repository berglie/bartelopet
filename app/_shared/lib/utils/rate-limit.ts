import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Initialize Redis client
// Note: Requires UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in environment
let redis: Redis | null = null;
let isRedisAvailable = false;

try {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    redis = Redis.fromEnv();
    isRedisAvailable = true;
  } else {
    console.warn('[Rate Limit] Redis credentials not found. Rate limiting disabled.');
  }
} catch (error) {
  console.error('[Rate Limit] Failed to initialize Redis:', error);
  isRedisAvailable = false;
}

// Rate limit configurations
export const rateLimiters = {
  // OAuth endpoints - 5 requests per hour per IP
  oauth:
    redis && isRedisAvailable
      ? new Ratelimit({
          redis,
          limiter: Ratelimit.slidingWindow(5, '1 h'),
          analytics: true,
          prefix: 'ratelimit:oauth',
        })
      : null,

  // Photo uploads - 10 uploads per hour per user
  upload:
    redis && isRedisAvailable
      ? new Ratelimit({
          redis,
          limiter: Ratelimit.slidingWindow(10, '1 h'),
          analytics: true,
          prefix: 'ratelimit:upload',
        })
      : null,

  // Comments - 20 comments per hour per user
  comment:
    redis && isRedisAvailable
      ? new Ratelimit({
          redis,
          limiter: Ratelimit.slidingWindow(20, '1 h'),
          analytics: true,
          prefix: 'ratelimit:comment',
        })
      : null,

  // Voting - 100 votes per day per user
  vote:
    redis && isRedisAvailable
      ? new Ratelimit({
          redis,
          limiter: Ratelimit.slidingWindow(100, '24 h'),
          analytics: true,
          prefix: 'ratelimit:vote',
        })
      : null,

  // Account operations - 10 requests per hour per user
  account:
    redis && isRedisAvailable
      ? new Ratelimit({
          redis,
          limiter: Ratelimit.slidingWindow(10, '1 h'),
          analytics: true,
          prefix: 'ratelimit:account',
        })
      : null,

  // Contact form - 5 messages per hour per IP
  contact:
    redis && isRedisAvailable
      ? new Ratelimit({
          redis,
          limiter: Ratelimit.slidingWindow(5, '1 h'),
          analytics: true,
          prefix: 'ratelimit:contact',
        })
      : null,

  // General API - 60 requests per minute per IP
  api:
    redis && isRedisAvailable
      ? new Ratelimit({
          redis,
          limiter: Ratelimit.slidingWindow(60, '1 m'),
          analytics: true,
          prefix: 'ratelimit:api',
        })
      : null,
};

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
  pending?: Promise<unknown>;
}

/**
 * Check rate limit for a given identifier
 * @param limiterKey - Which rate limiter to use
 * @param identifier - Unique identifier (IP address or user ID)
 * @returns Rate limit result
 */
export async function checkRateLimit(
  limiterKey: keyof typeof rateLimiters,
  identifier: string
): Promise<RateLimitResult> {
  const limiter = rateLimiters[limiterKey];
  // In production a missing or failing limiter blocks the request (fail closed), so spam
  // protection cannot silently switch off. Locally it lets everything through.
  const fallback: RateLimitResult = {
    success: process.env.NODE_ENV !== 'production',
    limit: 0,
    remaining: 0,
    reset: Date.now() + 60_000,
  };

  if (!limiter || !isRedisAvailable) {
    if (process.env.NODE_ENV === 'production') {
      console.error('[Rate Limit] Upstash Redis is not configured; blocking request.');
    }
    return fallback;
  }

  try {
    return await limiter.limit(identifier);
  } catch (error) {
    console.error('[Rate Limit] Error checking rate limit:', error);
    return fallback;
  }
}

/**
 * Get client IP address from request.
 * Vercel sets x-real-ip and overwrites x-forwarded-for with the real client address. Headers
 * such as cf-connecting-ip are passed through from the client unchanged, so they are not
 * trusted: an attacker could rotate them to get a fresh rate limit on every request.
 */
export function getClientIp(request: Request): string {
  const headers = request.headers;
  const realIp = headers.get('x-real-ip');
  const forwardedFor = headers.get('x-forwarded-for');

  if (realIp) return realIp.trim();
  if (forwardedFor) return forwardedFor.split(',')[0].trim();

  return '127.0.0.1'; // Fallback for local development
}
