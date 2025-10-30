import { getParticipants, getParticipantsStats, ParticipantsStatsCards, ParticipantsList } from '@/features/participants'
import { getCurrentEventYear } from '@/lib/utils/year'

export const revalidate = 300 // Revalidate every 5 minutes

export default async function ParticipantsPage({
  searchParams,
}: {
  searchParams: { year?: string }
}) {
  const yearParam = searchParams.year
  const year = yearParam ? parseInt(yearParam, 10) : getCurrentEventYear()

  const [participants, stats] = await Promise.all([
    getParticipants(year),
    getParticipantsStats(year)
  ])

  return (
    <div className="container mx-auto px-4 py-16">
      <ParticipantsStatsCards stats={stats} year={year} />

      <div className="max-w-4xl mx-auto">
        <ParticipantsList participants={participants} />
      </div>
    </div>
  )
}