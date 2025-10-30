import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CompletionForm } from '@/components/completion-form';
import { CompletionDisplay } from '@/components/completion-display';
import { ContestantHistory, YearComparison } from '@/components/contestant-history';
import { EditRestrictionGuard, ReadOnlyBanner } from '@/components/edit-restriction-guard';
import Link from 'next/link';
import { getAvailableYears, getYearDateRange, getCurrentEventYear } from '@/lib/utils/year';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default async function DashboardPage() {
  const supabase = await createClient();

  // Check if user is authenticated
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login');
  }

  // Get participant data
  const { data: participant } = await supabase
    .from('participants')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (!participant) {
    redirect('/pamelding');
  }

  // Get current year completion
  const currentYear = getCurrentEventYear();
  const currentYearRange = getYearDateRange(currentYear);

  const { data: currentCompletion } = await supabase
    .from('completions')
    .select('*')
    .eq('participant_id', participant.id)
    .gte('completed_date', currentYearRange.start.toISOString())
    .lte('completed_date', currentYearRange.end.toISOString())
    .single();

  // Get all completions for history
  const availableYears = getAvailableYears();
  const historyPromises = availableYears.map(async (year) => {
    const range = getYearDateRange(year);
    const { data: completion } = await supabase
      .from('completions')
      .select('*')
      .eq('participant_id', participant.id)
      .gte('completed_date', range.start.toISOString())
      .lte('completed_date', range.end.toISOString())
      .single();

    return {
      year,
      completed: !!completion,
      completionId: completion?.id,
      voteCount: completion?.vote_count || 0,
      completedDate: completion?.completed_date,
      photoUrl: completion?.photo_url,
    };
  });

  const history = await Promise.all(historyPromises);

  async function signOut() {
    'use server';
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect('/');
  }

  return (
    <div className="container mx-auto px-4 py-16 max-w-6xl">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Mitt Dashboard</h1>
          <p className="text-lg text-muted-foreground">Velkommen, {participant.full_name}!</p>
        </div>
        <form action={signOut}>
          <Button type="submit" variant="outline">
            Logg ut
          </Button>
        </form>
      </div>

      {/* Tabs for Current Year vs History */}
      <Tabs defaultValue="current" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="current">Inneværende år</TabsTrigger>
          <TabsTrigger value="history">Historikk</TabsTrigger>
        </TabsList>

        {/* Current Year Tab */}
        <TabsContent value="current" className="space-y-6">
          {/* Participant Info */}
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardDescription>Startnummer</CardDescription>
                <CardTitle className="text-4xl text-primary">
                  {participant.bib_number}
                </CardTitle>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <CardDescription>Status {currentYear}</CardDescription>
                <CardTitle className={currentCompletion ? 'text-green-600' : 'text-muted-foreground'}>
                  {currentCompletion ? 'Fullført ✓' : 'Ikke fullført'}
                </CardTitle>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <CardDescription>Stemmer {currentYear}</CardDescription>
                <CardTitle className="text-4xl text-accent">
                  {currentCompletion?.vote_count || 0}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          {/* Read-only banner */}
          <ReadOnlyBanner year={currentYear} />

          {/* Main Content */}
          {currentCompletion ? (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Ditt fullførte løp {currentYear}</CardTitle>
                  <CardDescription>
                    Du har registrert løpet ditt. Gratulerer! 🎉
                  </CardDescription>
                </CardHeader>
              </Card>

              <CompletionDisplay completion={currentCompletion} />

              <div className="flex gap-4">
                <Button asChild className="flex-1">
                  <Link href="/galleri">Se galleri og stem</Link>
                </Button>
                <Button asChild variant="outline" className="flex-1">
                  <Link href="/deltakere">Se alle deltakere</Link>
                </Button>
              </div>
            </div>
          ) : (
            <EditRestrictionGuard year={currentYear}>
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Registrer fullført løp</CardTitle>
                    <CardDescription>
                      Har du fullført løypen? Fyll ut skjemaet under for å registrere løpet ditt
                    </CardDescription>
                  </CardHeader>
                </Card>

                <CompletionForm participantId={participant.id} />
              </div>
            </EditRestrictionGuard>
          )}
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-6">
          <ContestantHistory
            history={history}
            participantName={participant.full_name}
          />

          {history.filter(h => h.completed).length > 1 && (
            <YearComparison years={history} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
