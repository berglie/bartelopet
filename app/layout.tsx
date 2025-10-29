import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navigation } from "@/components/navigation";
import { YearProvider } from "@/contexts/year-context";
import { createClient } from "@/lib/supabase/server";
import { Suspense } from "react";

const inter = Inter({
  subsets: ["latin"],
  display: 'swap',
  preload: false,
});

export const metadata: Metadata = {
  title: "Barteløpet - Virtuelt 10km for mental helse",
  description: "Delta i Barteløpet for Movember - løp 10km for mental helse, del dine bilder og stem på andre deltakere",
  keywords: ["barteløpet", "løp", "movember", "mental helse", "veldedighet", "Stavanger", "Norge"],
  authors: [{ name: "Barteløpet" }],
  openGraph: {
    title: "Barteløpet - Virtuelt 10km for mental helse",
    description: "Delta i Movember-kampanjen! Løp 10km for mental helse forskning.",
    type: "website",
    locale: "nb_NO",
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
      <body className={inter.className}>
        <Suspense fallback={null}>
          <YearProvider>
            <Navigation isAuthenticated={!!user} />
          </YearProvider>
        </Suspense>
        <main>
          <Suspense fallback={null}>
            <YearProvider>
              {children}
            </YearProvider>
          </Suspense>
        </main>
        <footer className="border-t mt-16">
          <div className="container mx-auto px-4 py-8 text-center text-sm text-muted-foreground">
            <p>© 2025 OpenAid - Støtter mental helse gjennom Movember</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
