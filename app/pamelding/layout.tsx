import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Påmelding',
  description:
    'Meld deg på Barteløpet og løp for mental helse i Movember-kampanjen. Få ditt startnummer og bli med oss!',
  openGraph: {
    title: 'Påmelding - Barteløpet',
    description:
      'Meld deg på Barteløpet og løp for mental helse i Movember-kampanjen. Få ditt startnummer og bli med oss!',
    url: 'https://barteløpet.no/pamelding',
  },
  twitter: {
    title: 'Påmelding - Barteløpet',
    description:
      'Meld deg på Barteløpet og løp for mental helse i Movember-kampanjen. Få ditt startnummer og bli med oss!',
  },
};

export default function PameldingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
