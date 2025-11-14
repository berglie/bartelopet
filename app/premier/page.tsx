import type { Metadata } from 'next';
import { PremierClient } from './_components/premier-client';

export const metadata: Metadata = {
  title: 'Premier - Barteløpet',
  description: 'Premier og bidrag fra bedrifter som støtter Barteløpet og Mental Helse Ungdom',
  openGraph: {
    title: 'Premier - Barteløpet',
    description: 'Premier og bidrag fra bedrifter som støtter Barteløpet og Mental Helse Ungdom',
    url: 'https://barteløpet.no/premier',
  },
  twitter: {
    title: 'Premier - Barteløpet',
    description: 'Premier og bidrag fra bedrifter som støtter Barteløpet og Mental Helse Ungdom',
  },
};

export default function PremierPage() {
  return <PremierClient />;
}
