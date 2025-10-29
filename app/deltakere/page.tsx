import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Check } from 'lucide-react';
import { getCurrentEventYear } from '@/lib/utils/year';

export const revalidate = 300; // Revalidate every 5 minutes

async function getParticipants(year: number) {
  const supabase = await createClient();

  const { data: participants, error } = await supabase
    .from('participants')
    .select('full_name, bib_number, has_completed, event_year')
    .eq('event_year', year)
    .order('bib_number', { ascending: true });

  if (error) {
    console.error('Error fetching participants:', error);
    return [];
  }

  return participants || [];
}

async function getStats(year: number) {
  const supabase = await createClient();

  const [
    { count: totalCount },
    { count: completedCount }
  ] = await Promise.all([
    supabase.from('participants').select('*', { count: 'exact', head: true }).eq('event_year', year),
    supabase.from('participants').select('*', { count: 'exact', head: true }).eq('event_year', year).eq('has_completed', true)
  ]);

  return {
    total: totalCount || 0,
    completed: completedCount || 0
  };
}

export default async function ParticipantsPage({
  searchParams,
}: {
  searchParams: { year?: string };
}) {
  const yearParam = searchParams.year;
  const year = yearParam ? parseInt(yearParam, 10) : getCurrentEventYear();

  const [participants, stats] = await Promise.all([
    getParticipants(year),
    getStats(year)
  ]);

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Deltakerliste</h1>
        <p className="text-lg text-muted-foreground">
          Alle som har meldt seg på Barteløpet {year}
        </p>
      </div>

      {/* Stats */}
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

      {/* Participants List */}
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Alle deltakere</CardTitle>
            <CardDescription>Sortert etter startnummer</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              {participants.map((participant) => (
                <div
                  key={participant.bib_number}
                  className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <span className="font-mono font-semibold text-accent min-w-[60px]">
                      #{participant.bib_number}
                    </span>
                    <span className="font-medium">{participant.full_name}</span>
                  </div>
                  {participant.has_completed && (
                    <div className="flex items-center gap-2 text-green-600">
                      <span className="text-xl">🏆</span>
                      <Check className="h-5 w-5" />
                      <span className="text-sm font-medium">Fullført</span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {participants.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                Ingen deltakere ennå
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
