import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Påmelding',
  description: 'Meld deg gratis på Barteløpet, løp hvor du vil i november og støtt Prosjekt SUT.',
  openGraph: {
    title: 'Påmelding - Barteløpet',
    description: 'Meld deg gratis på Barteløpet, løp hvor du vil i november og støtt Prosjekt SUT.',
    url: 'https://barteløpet.no/pamelding',
  },
  twitter: {
    title: 'Påmelding - Barteløpet',
    description: 'Meld deg gratis på Barteløpet, løp hvor du vil i november og støtt Prosjekt SUT.',
  },
};

export default function PameldingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
