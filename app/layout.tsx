import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { NavigationWrapper } from "@/components/navigation-wrapper";
import { YearProvider } from "@/contexts/year-context";
import { Suspense } from "react";

const inter = Inter({ subsets: ["latin"] });

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nb-NO">
      <body className={inter.className}>
        <Suspense fallback={null}>
          <YearProvider>
            <NavigationWrapper />
            <main>{children}</main>
            <footer className="border-t mt-16">
              <div className="container mx-auto px-4 py-8 text-center text-sm text-muted-foreground">
                <p>© 2025 OpenAid - Støtter mental helse gjennom Movember</p>
              </div>
            </footer>
          </YearProvider>
        </Suspense>
      </body>
    </html>
  );
}
