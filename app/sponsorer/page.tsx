import type { Metadata } from 'next';
import { SponsorsClient } from './_components/sponsorer-client';

export const metadata: Metadata = {
  title: 'Sponsorer - Barteløpet',
  description: 'Takk til våre sponsorer som støtter Barteløpet og Mental Helse Ungdom',
  openGraph: {
    title: 'Sponsorer - Barteløpet',
    description: 'Våre sponsorer som støtter Barteløpet og Mental Helse Ungdom',
    url: 'https://barteløpet.no/sponsorer',
  },
  twitter: {
    title: 'Sponsorer - Barteløpet',
    description: 'Våre sponsorer som støtter Barteløpet og Mental Helse Ungdom',
  },
};

export default function SponsorerPage() {
  return <SponsorsClient />;
}
