import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navigation } from "@/components/navigation";
import { YearProvider } from "@/contexts/year-context";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

const inter = Inter({
  subsets: ["latin"],
  display: 'swap',
  preload: false,
});

export const metadata: Metadata = {
  title: "Barteløpet - Virtuelt løp for mental helse",
  description: "Delta i Barteløpet for Movember - løp for mental helse, del dine bilder og stem på andre deltakere",
  keywords: ["barteløpet", "løp", "movember", "mental helse", "veldedighet", "Stavanger", "Norge"],
  authors: [{ name: "Barteløpet" }],
  openGraph: {
    title: "Barteløpet - Virtuelt løp for mental helse",
    description: "Delta i Movember-kampanjen! Løp for mental helse forskning.",
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
