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
          Alle som har meldt seg på Barteløpet {year} 💪
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:gap-6 max-w-md mx-auto mb-12">
        <Card>
          <CardHeader className="p-4 md:p-6 text-center">
            <CardDescription className="text-xs md:text-sm">
              Totalt påmeldte
            </CardDescription>
            <CardTitle className="text-2xl md:text-4xl text-accent flex items-center justify-center gap-2">
              <span className="text-lg md:text-2xl">🏃</span>
              {stats.total}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="p-4 md:p-6 text-center">
            <CardDescription className="text-xs md:text-sm">
              Har fullført
            </CardDescription>
            <CardTitle className="text-2xl md:text-4xl text-accent flex items-center justify-center gap-2">
              <span className="text-lg md:text-2xl">🏆</span>
              {stats.completed}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>
    </>
  )
}