import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Kontakt',
  description:
    'Ta kontakt med oss hvis du har spørsmål om Barteløpet eller Movember-kampanjen. Vi hører gjerne fra deg!',
  openGraph: {
    title: 'Kontakt - Barteløpet',
    description:
      'Ta kontakt med oss hvis du har spørsmål om Barteløpet eller Movember-kampanjen. Vi hører gjerne fra deg!',
    url: 'https://barteløpet.no/kontakt',
  },
  twitter: {
    title: 'Kontakt - Barteløpet',
    description:
      'Ta kontakt med oss hvis du har spørsmål om Barteløpet eller Movember-kampanjen. Vi hører gjerne fra deg!',
  },
};

export default function KontaktLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
