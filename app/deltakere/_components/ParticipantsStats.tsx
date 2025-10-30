import { Card, CardHeader, CardDescription, CardTitle } from '@/app/_shared/components/ui/card'
import type { ParticipantsStats } from '../_utils/queries'

interface ParticipantsStatsProps {
  stats: ParticipantsStats
  year: number
}

export function ParticipantsStatsCards({ stats, year }: ParticipantsStatsProps) {
  return (
    <>
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Deltakerliste</h1>
        <p className="text-lg text-muted-foreground">
          Alle som har meldt seg på Barteløpet {year}
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto mb-12">
        <Card>
          <CardHeader>
            <CardDescription>Totalt påmeldte</CardDescription>
            <CardTitle className="text-4xl text-accent">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Har fullført</CardDescription>
            <CardTitle className="text-4xl text-accent">{stats.completed}</CardTitle>
          </CardHeader>
        </Card>
      </div>
    </>
  )
}