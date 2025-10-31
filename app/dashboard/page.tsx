import { redirect } from 'next/navigation';
import { createClient } from '@/app/_shared/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/_shared/components/ui/card';
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
          <h1 className="text-4xl font-bold mb-2">Mitt Dashboard</h1>
          <p className="text-lg text-muted-foreground">Velkommen, {participant.full_name}!</p>
        </div>
        <form action={signOut}>
          <Button type="submit" variant="outline">
            Logg ut
          </Button>
        </form>
      </div>

      {/* Participant Info */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
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
            <CardTitle className={participant.has_completed ? 'text-accent' : 'text-muted-foreground'}>
              {participant.has_completed ? 'Fullført ✓' : 'Ikke fullført'}
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

      {/* Main Content */}
      {completion ? (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Ditt fullførte løp</CardTitle>
              <CardDescription>
                Du har registrert løpet ditt. Gratulerer! 🎉
              </CardDescription>
            </CardHeader>
          </Card>

          <CompletionDisplayMulti completion={completion} />

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
