import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Barteløpet - Barfotløp for veldedighet",
  description: "Delta i Barteløpet - løp barfot for veldedighet, del dine bilder og stem på andre deltakere",
  keywords: ["barfotløp", "løp", "veldedighet", "barteløpet", "Norge"],
  authors: [{ name: "Barteløpet" }],
  openGraph: {
    title: "Barteløpet - Barfotløp for veldedighet",
    description: "Delta i Barteløpet - løp barfot for veldedighet",
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
        {children}
      </body>
    </html>
  );
}
