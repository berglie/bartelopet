/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable no-undef */
/** @type {import('next').NextConfig} */
const path = require('path');

// Images and API calls are only allowed to our own Supabase project, not every *.supabase.co.
const supabaseUrl = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://*.supabase.co');

const nextConfig = {
  poweredByHeader: false,
  experimental: {
    serverActions: {
      // Vercel rejects request bodies over 4.5 MB whatever this says. Run photos are shrunk in
      // the browser to at most 4 MB first (RUN_PHOTO_LIMITS), then re-encoded on the server.
      bodySizeLimit: '4.5mb',
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
        protocol: supabaseUrl.protocol.replace(':', ''),
        hostname: supabaseUrl.hostname,
        port: supabaseUrl.port,
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  // Content-Security-Policy is set per request with a nonce in proxy.ts.
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
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(self)',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
