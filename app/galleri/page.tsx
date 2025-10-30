import { createClient } from '@/app/_shared/lib/supabase/server';
import { GalleryClient } from './_components/GalleryClient';
import { getCurrentEventYear, getYearDateRange } from '@/app/_shared/lib/utils/year';

export const revalidate = 60; // Revalidate every 60 seconds

async function getCompletions() {
  const supabase = await createClient();
  const currentYear = getCurrentEventYear();
  const { start, end } = getYearDateRange(currentYear);

  const { data: completions, error } = await supabase
    .from('completions')
    .select(`
      *,
      participant:participants(
        id,
        full_name,
        bib_number
      )
    `)
    .gte('completed_date', start.toISOString())
    .lte('completed_date', end.toISOString())
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching completions:', error);
    return [];
  }

  return completions || [];
}

async function getUserVote() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  // Get participant ID from user
  const { data: participant } = await supabase
    .from('participants')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!participant) return null;

  // Get user's vote
  const { data: vote } = await supabase
    .from('votes')
    .select('completion_id')
    .eq('voter_id', participant.id)
    .single();

  return vote?.completion_id || null;
}

export default async function GalleryPage() {
  const [completions, userVoteId] = await Promise.all([
    getCompletions(),
    getUserVote(),
  ]);

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Fotogalleri</h1>
        <p className="text-lg text-muted-foreground">
          Se alle som har fullført løpet og stem på ditt favorittbilde
        </p>
      </div>

      <GalleryClient initialCompletions={completions} initialUserVoteId={userVoteId} />
    </div>
  );
}
