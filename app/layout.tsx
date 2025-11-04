import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navigation } from "@/app/_components/navigation";
import { StructuredData } from "@/app/_components/structured-data";
import { YearProvider } from "@/contexts/year-context";
import { createClient } from "@/app/_shared/lib/supabase/server";
import Link from "next/link";

const inter = Inter({
  subsets: ["latin"],
  display: 'swap',
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: new URL('https://barteløpet.no'),
  title: {
    default: "Barteløpet - Virtuelt løp for mental helse",
    template: "%s | Barteløpet"
  },
  description: "Delta i Barteløpet for Movember - løp for mental helse, del dine bilder og stem på andre deltakere",
  keywords: ["barteløpet", "løp", "movember", "mental helse", "veldedighet", "Stavanger", "Norge"],
  authors: [{ name: "Barteløpet" }],
  creator: "ÅpenAid",
  publisher: "ÅpenAid",
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/favicon.png",
  },
  openGraph: {
    type: "website",
    locale: "nb_NO",
    url: "https://barteløpet.no",
    siteName: "Barteløpet",
    title: "Barteløpet - Virtuelt løp for mental helse",
    description: "Delta i Movember-kampanjen! Løp for mental helse forskning.",
  },
  twitter: {
    card: "summary",
    title: "Barteløpet - Virtuelt løp for mental helse",
    description: "Delta i Movember-kampanjen! Løp for mental helse forskning.",
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
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <html lang="nb-NO">
      <head>
        <StructuredData />
      </head>
      <body className={inter.className}>
        <YearProvider>
          <Navigation isAuthenticated={!!user} />
          <main>
            {children}
          </main>
          <footer className="border-t mt-16">
            <div className="container mx-auto px-4 py-8">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <p className="text-sm text-muted-foreground">
                  © 2025 ÅpenAid - Støtter mental helse gjennom Movember
                </p>
                <div className="flex gap-4 text-sm">
                  <Link href="/kontakt" className="text-muted-foreground hover:text-foreground transition-colors">
                    Kontakt
                  </Link>
                  <Link href="/vilkar" className="text-muted-foreground hover:text-foreground transition-colors">
                    Vilkår for bruk
                  </Link>
                  <Link href="/personvern" className="text-muted-foreground hover:text-foreground transition-colors">
                    Personvern
                  </Link>
                </div>
              </div>
            </div>
          </footer>
        </YearProvider>
      </body>
    </html>
  );
}
