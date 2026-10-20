/**
 * Content Security Policy with a fresh nonce per request (set in proxy.ts).
 *
 * Scripts must carry the nonce: Next.js adds it to its own scripts during server rendering, and
 * 'strict-dynamic' trusts scripts those load (Mapbox workers, the Strava embed loader). Injected
 * inline scripts without the nonce are blocked, so an XSS cannot run code. The host list is only
 * a fallback for browsers without CSP level 3.
 */
export function buildContentSecurityPolicy(nonce: string): string {
  // Our own Supabase project only (https in production, http for a local stack).
  const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL
    ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).origin
    : 'https://*.supabase.co';
  const supabaseRealtime = supabase.replace(/^http/, 'ws');
  // React uses eval for debugging information in development only.
  const devEval = process.env.NODE_ENV === 'development' ? " 'unsafe-eval'" : '';

  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${devEval} https://api.mapbox.com https://strava-embeds.com`,
    "worker-src 'self' blob: https://api.mapbox.com",
    // Style attributes (React, Mapbox) cannot carry a nonce, so inline styles stay allowed.
    "style-src 'self' 'unsafe-inline' https://api.mapbox.com",
    `img-src 'self' data: blob: ${supabase} https://api.mapbox.com https://strava-embeds.com`,
    "font-src 'self' data:",
    `connect-src 'self' ${supabase} ${supabaseRealtime} https://api.mapbox.com https://events.mapbox.com https://strava-embeds.com`,
    "frame-src 'self' https://strava-embeds.com https://open.spotify.com",
    "frame-ancestors 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ].join('; ');
}
