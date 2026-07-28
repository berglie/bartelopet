import type { Metadata } from 'next';
import { Barlow_Condensed, Inter } from 'next/font/google';
import './globals.css';
import { Navigation } from '@/app/_components/navigation';
import { StructuredData } from '@/app/_components/structured-data';
import { YearProvider } from '@/contexts/year-context';
import { createClient } from '@/app/_shared/lib/supabase/server';
import { Footer } from '@/app/_components/footer';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  preload: false,
  variable: '--font-sans',
});

const barlowCondensed = Barlow_Condensed({
  subsets: ['latin'],
  display: 'swap',
  preload: false,
  variable: '--font-display',
  weight: ['600', '700', '800', '900'],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://barteløpet.no'),
  title: {
    default: 'Barteløpet - Virtuelt løp for mental helse',
    template: '%s | Barteløpet',
  },
  description: 'Løp hvor du vil i november, doner fem kroner per kilometer og støtt Prosjekt SUT.',
  keywords: [
    'barteløpet',
    'Prosjekt SUT',
    'løp',
    'mental helse',
    'veldedighet',
    'Stavanger',
    'Sandnes',
  ],
  authors: [{ name: 'Barteløpet' }],
  creator: 'ÅpenAid',
  publisher: 'ÅpenAid',
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  manifest: '/site.webmanifest',
  openGraph: {
    type: 'website',
    locale: 'nb_NO',
    url: 'https://barteløpet.no',
    siteName: 'Barteløpet',
    title: 'Barteløpet 2026 – Hver kilometer teller',
    description: 'Løp hvor du vil i november og støtt Prosjekt SUT med fem kroner per kilometer.',
    images: ['/opengraph-image'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Barteløpet 2026 – Hver kilometer teller',
    description: 'Løp hvor du vil i november og støtt Prosjekt SUT med fem kroner per kilometer.',
    images: ['/opengraph-image'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'd3fPtuQkt7tnr4mG7ZNbbBFcqQ1cMDQzIGj2FLd_pys',
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: isAdmin } = user ? await supabase.rpc('is_event_admin') : { data: false };

  return (
    <html lang="nb-NO" data-event-year="2026" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html:
              "document.documentElement.dataset.eventYear=new URLSearchParams(location.search).get('year')==='2025'?'2025':'2026'",
          }}
        />
        <StructuredData />
      </head>
      <body className={`${inter.variable} ${barlowCondensed.variable} font-sans`}>
        <YearProvider>
          <Navigation isAuthenticated={!!user} isAdmin={Boolean(isAdmin)} />
          <main>{children}</main>
          <Footer />
        </YearProvider>
      </body>
    </html>
  );
}
