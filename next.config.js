/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
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
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
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
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://api.mapbox.com https://vercel.live",
              "worker-src 'self' blob: https://api.mapbox.com",
              "style-src 'self' 'unsafe-inline' https://api.mapbox.com",
              "img-src 'self' data: blob: https://*.supabase.co https://api.mapbox.com",
              "font-src 'self' data:",
              "connect-src 'self' https://*.supabase.co https://api.vipps.no https://api.mapbox.com https://events.mapbox.com wss://*.supabase.co https://vercel.live",
              "frame-ancestors 'self'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; ')
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(self)'
          },
        ],
      },
    ];
  },
}

module.exports = nextConfig
