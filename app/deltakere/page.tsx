import { Metadata } from 'next';
import { getParticipants, getParticipantsStats } from './_utils/queries';
import { ParticipantsStatsCards } from './_components/ParticipantsStats';
import { ParticipantsList } from './_components/ParticipantsList';
import { getCurrentEventYear } from '@/app/_shared/lib/utils/year';
import { isSubmissionWindowOpen } from '@/app/_shared/lib/utils/event-year';
import { createClient } from '@/app/_shared/lib/supabase/server';
import { Participants2026 } from './_components/participants-2026';

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}): Promise<Metadata> {
  const { year } = await searchParams;
  const isArchive = year === '2025';
  const description = isArchive
    ? 'Se deltakere og resultater fra Barteløpet 2025.'
    : 'Følg løpere, kilometer og premielodd i Barteløpet 2026 for Prosjekt SUT.';

  return {
    title: isArchive ? 'Deltakere 2025' : 'Løpere og lodd',
    description,
    openGraph: {
      title: isArchive ? 'Deltakere 2025 – Barteløpet' : 'Løpere 2026 – Barteløpet',
      description,
      url: 'https://barteløpet.no/deltakere',
    },
  };
}

export const revalidate = 300; // Revalidate every 5 minutes

export default async function DeltakerePage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const params = await searchParams;
  const yearParam = params.year;
  const year = yearParam ? parseInt(yearParam, 10) : getCurrentEventYear();

  if (year !== 2025) {
    return <Participants2026 />;
  }

  const supabase = await createClient();

  const [participants, stats, submissionWindowOpen] = await Promise.all([
    getParticipants(year),
    getParticipantsStats(year),
    isSubmissionWindowOpen(supabase),
  ]);

  return (
    <div className="container mx-auto px-4 py-16">
      <ParticipantsStatsCards stats={stats} year={year} />

      <div className="mx-auto max-w-4xl">
        <ParticipantsList participants={participants} submissionWindowOpen={submissionWindowOpen} />
      </div>
    </div>
  );
}
