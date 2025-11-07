import { Metadata } from 'next'
import { createClient } from '@/app/_shared/lib/supabase/server';
import { GalleryClient } from './_components/GalleryClient';
import { getCurrentEventYear, getYearDateRange } from '@/app/_shared/lib/utils/year';

export const metadata: Metadata = {
  title: 'Fotogalleri',
  description: 'Se alle som har fullført Barteløpet og stem på ditt favorittbilde. Inspirer andre til å løpe for mental helse.',
  openGraph: {
    title: 'Fotogalleri - Barteløpet',
    description: 'Se alle som har fullført Barteløpet og stem på ditt favorittbilde. Inspirer andre til å løpe for mental helse.',
    url: 'https://barteløpet.no/galleri',
  },
  twitter: {
    title: 'Fotogalleri - Barteløpet',
    description: 'Se alle som har fullført Barteløpet og stem på ditt favorittbilde. Inspirer andre til å løpe for mental helse.',
  },
}

export const revalidate = 60; // Revalidate every 60 seconds

async function getCompletions() {
  const supabase = await createClient();
  const currentYear = getCurrentEventYear();
  const { start, end } = getYearDateRange(currentYear);

  const { data: completions, error } = await supabase
    .from('completions_with_counts')
    .select(`
      *,
      participant:participants(
        id,
        full_name,
        bib_number
      ),
      images:photos(
        id,
        image_url,
        is_starred,
        caption,
        display_order
      )
    `)
    .eq('event_year', currentYear)
    .gte('completed_date', start.toISOString())
    .lte('completed_date', end.toISOString())
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching completions:', error);
    return [];
  }

  return completions || [];
}

async function getUserVotes() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return [];

  const currentYear = getCurrentEventYear();

  // Get participant ID from user for current year
  const { data: participant } = await supabase
    .from('participants')
    .select('id')
    .eq('user_id', user.id)
    .eq('event_year', currentYear)
    .single();

  if (!participant) return [];

  // Get all user's votes for current year
  const { data: votes } = await supabase
    .from('photo_votes')
    .select('completion_id')
    .eq('voter_id', participant.id)
    .eq('event_year', currentYear);

  return votes?.map(vote => vote.completion_id) || [];
}

export default async function GalleryPage() {
  const [completions, userVoteIds] = await Promise.all([
    getCompletions(),
    getUserVotes(),
  ]);

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Fotogalleri</h1>
        <p className="text-lg text-muted-foreground">
          Se alle som har fullført løpet og stem på dine favorittbilder
        </p>
      </div>

      <GalleryClient initialCompletions={completions} initialUserVoteIds={userVoteIds} />
    </div>
  );
}
