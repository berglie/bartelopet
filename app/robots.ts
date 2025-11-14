import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://barteløpet.no';

  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/pamelding',
          '/deltakere',
          '/galleri',
          '/hvordan',
          '/kontakt',
          '/vilkar',
          '/personvern',
        ],
        disallow: ['/api/', '/dashboard', '/dashboard/*', '/auth/*', '/login', '/takk'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
