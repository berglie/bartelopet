import { redirect } from 'next/navigation';
import { createClient } from '@/app/_shared/lib/supabase/server';
import { Card, CardDescription, CardHeader, CardTitle } from '@/app/_shared/components/ui/card';
import { Button } from '@/app/_shared/components/ui/button';
import { CompletionForm } from '@/app/pamelding/_components/completion-form';
import { CompletionDisplayMulti } from './_components/completion-display-multi';
import Link from 'next/link';

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

  // Get completion if exists (using view to get counts)
  const { data: completion } = await supabase
    .from('completions_with_counts')
    .select('*')
    .eq('participant_id', participant.id)
    .single();

  async function signOut() {
    'use server';
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect('/');
  }

  return (
    <div className="container mx-auto px-4 py-16 max-w-4xl">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">
            <span className="md:hidden">Dashboard</span>
            <span className="hidden md:inline">Min Side</span>
          </h1>
          <p className="text-lg text-muted-foreground">Velkommen, {participant.full_name}!</p>
        </div>
        <form action={signOut}>
          <Button type="submit" variant="outline">
            Logg ut
          </Button>
        </form>
      </div>

      {/* Participant Info - Single card on mobile, three cards on desktop */}
      <div className="mb-8">
        {/* Mobile view - single card */}
        <Card className="md:hidden">
          <CardHeader className="p-4">
            <div className="flex justify-between items-start">
              <div className="text-center flex-1">
                <CardDescription className="text-xs mb-1">Startnummer</CardDescription>
                <CardTitle className="text-2xl text-accent">
                  #{participant.bib_number}
                </CardTitle>
              </div>
              <div className="text-center flex-1">
                <CardDescription className="text-xs mb-1">Status</CardDescription>
                <CardTitle className={`text-2xl ${participant.has_completed ? 'text-accent' : 'text-muted-foreground'}`}>
                  {participant.has_completed ? '✓' : '✗'}
                </CardTitle>
              </div>
              <div className="text-center flex-1">
                <CardDescription className="text-xs mb-1">Stemmer</CardDescription>
                <CardTitle className="text-2xl text-accent">
                  {completion?.vote_count || 0}
                </CardTitle>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Desktop view - three separate cards */}
        <div className="hidden md:grid md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardDescription>Startnummer</CardDescription>
              <CardTitle className="text-4xl text-accent">
                {participant.bib_number}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardDescription>Status</CardDescription>
              <CardTitle className={`text-4xl ${participant.has_completed ? 'text-accent' : 'text-muted-foreground'}`}>
                {participant.has_completed ? '✓' : '✗'}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardDescription>Stemmer</CardDescription>
              <CardTitle className="text-4xl text-accent">
                {completion?.vote_count || 0}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>
      </div>

      {/* Main Content */}
      {completion && completion.id && completion.participant_id ? (
        <div className="space-y-6">
          <CompletionDisplayMulti completion={{
            id: completion.id,
            participant_id: completion.participant_id,
            completed_date: completion.completed_date || completion.created_at || '',
            duration_text: completion.duration_text,
            comment: completion.comment,
            vote_count: completion.vote_count || 0,
            image_count: completion.image_count || 0,
          }} />

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
      )}
    </div>
  );
}
