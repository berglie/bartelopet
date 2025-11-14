import { Metadata } from 'next'
import { Suspense } from 'react'
import { createClient } from '@/app/_shared/lib/supabase/server';
import { GalleryClient } from './_components/GalleryClient';
import { getCurrentEventYear, getYearDateRange } from '@/app/_shared/lib/utils/year';
import type { CompletionImage } from '@/app/_shared/lib/types/database';

export const revalidate = 60; // Revalidate every 60 seconds

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ id?: string }> }): Promise<Metadata> {
  const params = await searchParams;
  const completionId = params.id;

  // If a specific completion is being shared, fetch its data for metadata
  if (completionId) {
    const supabase = await createClient();
    const { data: completion } = await supabase
      .from('completions_with_counts')
      .select(`
        *,
        participant:participants_safe(
          full_name
        ),
        images:photos(
          image_url,
          is_starred
        )
      `)
      .eq('id', completionId)
      .single();

    if (completion) {
      const participantName = completion.participant?.full_name || 'En deltaker';
      const starredImage = completion.images?.find((img: { is_starred: boolean; image_url: string }) => img.is_starred);
      const imageUrl = starredImage?.image_url || completion.images?.[0]?.image_url;

      return {
        title: `${participantName}s løp - Barteløpet`,
        description: `Sjekk ut ${participantName}s bilde fra Barteløpet! 🏃‍♂️`,
        openGraph: {
          title: `${participantName}s løp - Barteløpet`,
          description: `Sjekk ut ${participantName}s bilde fra Barteløpet! 🏃‍♂️`,
          url: `https://barteløpet.no/galleri?id=${completionId}`,
          images: imageUrl ? [{ url: imageUrl, width: 1200, height: 630 }] : [],
          type: 'website',
        },
        twitter: {
          card: 'summary_large_image',
          title: `${participantName}s løp - Barteløpet`,
          description: `Sjekk ut ${participantName}s bilde fra Barteløpet! 🏃‍♂️`,
          images: imageUrl ? [imageUrl] : [],
        },
      };
    }
  }

  // Default metadata for gallery page
  return {
    title: 'Fotogalleri',
    description: 'Se alle som har fullført Barteløpet og stem på dine favorittbilder. Inspirer andre til å løpe for mental helse.',
    openGraph: {
      title: 'Fotogalleri - Barteløpet',
      description: 'Se alle som har fullført Barteløpet og stem på dine favorittbilder. Inspirer andre til å løpe for mental helse.',
      url: 'https://barteløpet.no/galleri',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Fotogalleri - Barteløpet',
      description: 'Se alle som har fullført Barteløpet og stem på dine favorittbilder. Inspirer andre til å løpe for mental helse.',
    },
  };
}

type DatabaseCompletion = {
  id: string | null
  participant_id: string | null
  completed_date: string | null
  duration_text: string | null
  comment: string | null
  vote_count: number | null
  comment_count: number | null
  image_count: number | null
  event_year: number | null
  created_at: string | null
  updated_at: string | null
  participant: {
    id: string
    user_id: string | null
    email: string
    full_name: string
    postal_address: string
    phone_number: string | null
    bib_number: number
    has_completed: boolean
    created_at: string
    updated_at: string
  } | null
  images: CompletionImage[]
}

type CompletionData = {
  id: string
  completed_date: string
  duration_text: string | null
  comment: string | null
  vote_count: number
  comment_count: number
  image_count: number
  event_year: number
  participant: {
    id: string
    user_id: string | null
    email: string
    full_name: string
    postal_address: string
    phone_number: string | null
    bib_number: number
    has_completed: boolean
    created_at: string
    updated_at: string
  }
  images: CompletionImage[]
}

async function getCompletions(): Promise<CompletionData[]> {
  const supabase = await createClient();
  const currentYear = getCurrentEventYear();
  const { start, end } = getYearDateRange(currentYear);

  const { data: completions, error } = await supabase
    .from('completions_with_counts')
    .select(`
      *,
      participant:participants_safe(
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

  // Filter and transform to CompletionData type
  const validCompletions: CompletionData[] = (completions as DatabaseCompletion[] | null || [])
    .filter((c): c is DatabaseCompletion & {
      id: string;
      completed_date: string;
      participant: NonNullable<DatabaseCompletion['participant']>;
      vote_count: number;
      comment_count: number;
      image_count: number;
      event_year: number;
    } =>
      c.id !== null &&
      c.completed_date !== null &&
      c.participant !== null &&
      c.vote_count !== null &&
      c.comment_count !== null &&
      c.image_count !== null &&
      c.event_year !== null
    )
    .map(c => ({
      id: c.id,
      completed_date: c.completed_date,
      duration_text: c.duration_text,
      comment: c.comment,
      vote_count: c.vote_count,
      comment_count: c.comment_count,
      image_count: c.image_count,
      event_year: c.event_year,
      participant: c.participant,
      images: c.images
    }));

  return validCompletions;
}

async function getUserVotes() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return [];

  const currentYear = getCurrentEventYear();

  // Get participant ID from user for current year (authenticated context - OK to use participants)
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

      <Suspense fallback={
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Laster bilder...</p>
        </div>
      }>
        <GalleryClient initialCompletions={completions} initialUserVoteIds={userVoteIds} />
      </Suspense>
    </div>
  );
}
