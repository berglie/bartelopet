import type { Metadata } from 'next';
import { PremierClient } from './_components/premier-client';
import { Prizes2026 } from './_components/prizes-2026';
import { getCurrentEventYear } from '@/app/_shared/lib/utils/year';

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}): Promise<Metadata> {
  const { year } = await searchParams;
  const isArchive = year === '2025';
  const description = isArchive
    ? 'Premier og bidrag fra bedrifter som støttet Barteløpet 2025 og Mental Helse Ungdom.'
    : 'Se startnumrene du kan vinne ved å løpe og støtte Prosjekt SUT i Barteløpet 2026.';

  return {
    title: isArchive ? 'Premier 2025' : 'Startnummer du kan vinne',
    description,
    openGraph: {
      title: isArchive ? 'Premier 2025 – Barteløpet' : 'Premier 2026 – Barteløpet',
      description,
      url: 'https://barteløpet.no/premier',
    },
  };
}

export default async function PremierPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const params = await searchParams;
  const year = params.year ? Number(params.year) : getCurrentEventYear();
  return year === 2025 ? <PremierClient /> : <Prizes2026 />;
}
