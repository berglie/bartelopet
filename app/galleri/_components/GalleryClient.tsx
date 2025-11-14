'use client';

import { GalleryGridMulti } from './gallery-grid-multi';
import { useSelectedYear } from '@/contexts/year-context';
import { getYearDateRange } from '@/app/_shared/lib/utils/year';
import { useEffect, useState } from 'react';
import { createClient } from '@/app/_shared/lib/supabase/client';
import { useSearchParams } from 'next/navigation';
import type { CompletionImage } from '@/app/_shared/lib/types/database';

type DatabaseCompletion = {
  id: string | null;
  participant_id: string | null;
  completed_date: string | null;
  duration_text: string | null;
  comment: string | null;
  vote_count: number | null;
  comment_count: number | null;
  image_count: number | null;
  event_year: number | null;
  created_at: string | null;
  updated_at: string | null;
  participant: {
    id: string;
    user_id: string | null;
    email: string;
    full_name: string;
    postal_address: string;
    phone_number: string | null;
    bib_number: number;
    has_completed: boolean;
    created_at: string;
    updated_at: string;
  } | null;
  images: CompletionImage[];
};

interface Completion {
  id: string;
  completed_date: string;
  duration_text: string | null;
  comment: string | null;
  vote_count: number;
  comment_count: number;
  image_count: number;
  event_year: number;
  participant: {
    id: string;
    user_id: string | null;
    email: string;
    full_name: string;
    postal_address: string;
    phone_number: string | null;
    bib_number: number;
    has_completed: boolean;
    created_at: string;
    updated_at: string;
  };
  images: CompletionImage[];
}

interface GalleryClientProps {
  initialCompletions: Completion[];
  initialUserVoteIds: string[];
}

export function GalleryClient({ initialCompletions, initialUserVoteIds }: GalleryClientProps) {
  const selectedYear = useSelectedYear();
  const searchParams = useSearchParams();
  const completionIdParam = searchParams.get('id');
  const [completions, setCompletions] = useState(initialCompletions);
  const [userVoteIds] = useState(initialUserVoteIds);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchYearData() {
      setLoading(true);
      const supabase = createClient();

      // Get date range for selected year
      const { start, end } = getYearDateRange(selectedYear);

      // Fetch completions for the year
      const { data: completionsData } = await supabase
        .from('completions_with_counts')
        .select(
          `
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
        `
        )
        .eq('event_year', selectedYear)
        .gte('completed_date', start.toISOString())
        .lte('completed_date', end.toISOString())
        .order('created_at', { ascending: false });

      // Filter and transform to Completion type
      const validCompletions: Completion[] = (
        (completionsData as DatabaseCompletion[] | null) || []
      )
        .filter(
          (
            c
          ): c is DatabaseCompletion & {
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
        .map((c) => ({
          id: c.id,
          completed_date: c.completed_date,
          duration_text: c.duration_text,
          comment: c.comment,
          vote_count: c.vote_count,
          comment_count: c.comment_count,
          image_count: c.image_count,
          event_year: c.event_year,
          participant: c.participant,
          images: c.images,
        }));

      setCompletions(validCompletions);
      setLoading(false);
    }

    fetchYearData();
  }, [selectedYear]);

  if (loading) {
    return (
      <div className="py-12 text-center">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-accent"></div>
        <p className="mt-4 text-muted-foreground">Laster bilder...</p>
      </div>
    );
  }

  if (completions.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-lg text-muted-foreground">
          Ingen bilder lastet opp for {selectedYear}. Vær den første!
        </p>
      </div>
    );
  }

  return (
    <GalleryGridMulti
      completions={completions}
      userVoteIds={userVoteIds}
      initialCompletionId={completionIdParam}
    />
  );
}
