import { Metadata } from 'next';
import { getParticipants, getParticipantsStats } from './_utils/queries';
import { ParticipantsStatsCards } from './_components/ParticipantsStats';
import { ParticipantsList } from './_components/ParticipantsList';
import { getCurrentEventYear } from '@/app/_shared/lib/utils/year';

export const metadata: Metadata = {
  title: 'Deltakere',
  description:
    'Se alle påmeldte deltakere i Barteløpet. Bli med å løpe for mental helse i Movember-kampanjen.',
  openGraph: {
    title: 'Deltakere - Barteløpet',
    description:
      'Se alle påmeldte deltakere i Barteløpet. Bli med å løpe for mental helse i Movember-kampanjen.',
    url: 'https://barteløpet.no/deltakere',
  },
  twitter: {
    title: 'Deltakere - Barteløpet',
    description:
      'Se alle påmeldte deltakere i Barteløpet. Bli med å løpe for mental helse i Movember-kampanjen.',
  },
};

export const revalidate = 300; // Revalidate every 5 minutes

export default async function DeltakerePage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const params = await searchParams;
  const yearParam = params.year;
  const year = yearParam ? parseInt(yearParam, 10) : getCurrentEventYear();

  const [participants, stats] = await Promise.all([
    getParticipants(year),
    getParticipantsStats(year),
  ]);

  return (
    <div className="container mx-auto px-4 py-16">
      <ParticipantsStatsCards stats={stats} year={year} />

      <div className="mx-auto max-w-4xl">
        <ParticipantsList participants={participants} />
      </div>
    </div>
  );
}
