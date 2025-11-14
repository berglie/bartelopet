import { Card, CardHeader, CardDescription, CardTitle } from '@/app/_shared/components/ui/card';
import type { ParticipantsStats } from '../_utils/queries';

interface ParticipantsStatsProps {
  stats: ParticipantsStats;
  year: number;
}

export function ParticipantsStatsCards({ stats, year }: ParticipantsStatsProps) {
  return (
    <>
      <div className="mb-12 text-center">
        <h1 className="mb-4 text-4xl font-bold">Deltakerliste</h1>
        <p className="text-lg text-muted-foreground">
          Alle som har meldt seg på Barteløpet {year} 💪
        </p>
      </div>

      <div className="mx-auto mb-12 grid max-w-md grid-cols-2 gap-3 md:gap-6">
        <Card>
          <CardHeader className="p-4 text-center md:p-6">
            <CardDescription className="text-xs md:text-sm">Totalt påmeldte</CardDescription>
            <CardTitle className="flex items-center justify-center gap-2 text-2xl text-accent md:text-4xl">
              <span className="text-lg md:text-2xl">🏃</span>
              {stats.total}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="p-4 text-center md:p-6">
            <CardDescription className="text-xs md:text-sm">Har fullført</CardDescription>
            <CardTitle className="flex items-center justify-center gap-2 text-2xl text-accent md:text-4xl">
              <span className="text-lg md:text-2xl">🏆</span>
              {stats.completed}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>
    </>
  );
}
