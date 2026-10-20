/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable no-undef */
/** @type {import('next').NextConfig} */
const path = require('path');

// Images and API calls are only allowed to our own Supabase project, not every *.supabase.co.
const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).host
  : '*.supabase.co';
const isDevelopment = process.env.NODE_ENV === 'development';

const nextConfig = {
  poweredByHeader: false,
  experimental: {
    serverActions: {
      // Largest upload is a 10 MB run photo (re-encoded on the server).
      bodySizeLimit: '11mb',
    },
  },
  // Turbopack configuration (Next.js 16+)
  turbopack: {
    resolveAlias: {
      '@ui': path.resolve(__dirname, 'features/ui'),
      '@auth': path.resolve(__dirname, 'features/auth'),
      '@gallery': path.resolve(__dirname, 'features/gallery'),
      '@completions': path.resolve(__dirname, 'features/completions'),
      '@navigation': path.resolve(__dirname, 'features/navigation'),
      '@upload': path.resolve(__dirname, 'features/upload'),
      '@comments': path.resolve(__dirname, 'features/comments'),
      '@participants': path.resolve(__dirname, 'features/participants'),
      '@registration': path.resolve(__dirname, 'features/registration'),
      '@dashboard': path.resolve(__dirname, 'features/dashboard'),
      '@voting': path.resolve(__dirname, 'features/voting'),
      '@public-pages': path.resolve(__dirname, 'features/public-pages'),
      '@shared': path.resolve(__dirname, 'features/shared'),
    },
  },
  // Webpack configuration for backwards compatibility (when using --webpack flag)
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@ui': path.resolve(__dirname, 'features/ui'),
      '@auth': path.resolve(__dirname, 'features/auth'),
      '@gallery': path.resolve(__dirname, 'features/gallery'),
      '@completions': path.resolve(__dirname, 'features/completions'),
      '@navigation': path.resolve(__dirname, 'features/navigation'),
      '@upload': path.resolve(__dirname, 'features/upload'),
      '@comments': path.resolve(__dirname, 'features/comments'),
      '@participants': path.resolve(__dirname, 'features/participants'),
      '@registration': path.resolve(__dirname, 'features/registration'),
      '@dashboard': path.resolve(__dirname, 'features/dashboard'),
      '@voting': path.resolve(__dirname, 'features/voting'),
      '@public-pages': path.resolve(__dirname, 'features/public-pages'),
      '@shared': path.resolve(__dirname, 'features/shared'),
    };
    return config;
  },
  images: {
    qualities: [100, 75],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: supabaseHost,
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            // The legacy XSS auditor is removed from browsers and could itself be abused.
            key: 'X-XSS-Protection',
            value: '0',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              // 'unsafe-eval' is only needed by React in development. 'unsafe-inline' is needed
              // for Next.js' inline hydration scripts unless every page renders with a nonce.
              `script-src 'self' 'unsafe-inline'${isDevelopment ? " 'unsafe-eval'" : ''} https://api.mapbox.com https://vercel.live https://strava-embeds.com`,
              "worker-src 'self' blob: https://api.mapbox.com",
              "style-src 'self' 'unsafe-inline' https://api.mapbox.com",
              `img-src 'self' data: blob: https://${supabaseHost} https://api.mapbox.com https://strava-embeds.com`,
              "font-src 'self' data:",
              `connect-src 'self' https://${supabaseHost} https://api.mapbox.com https://events.mapbox.com wss://${supabaseHost} https://vercel.live https://strava-embeds.com`,
              "frame-src 'self' https://strava-embeds.com https://vercel.live https://open.spotify.com",
              "frame-ancestors 'self'",
              "base-uri 'self'",
              "form-action 'self'",
              "object-src 'none'",
            ].join('; '),
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(self)',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
