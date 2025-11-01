'use client';

import { GalleryGridMulti } from './gallery-grid-multi';
import { useSelectedYear } from '@/contexts/year-context';
import { getYearDateRange } from '@/app/_shared/lib/utils/year';
import { useEffect, useState } from 'react';
import { createClient } from '@/app/_shared/lib/supabase/client';

interface GalleryClientProps {
  initialCompletions: any[];
  initialUserVoteId: string | null;
}

export function GalleryClient({ initialCompletions, initialUserVoteId }: GalleryClientProps) {
  const selectedYear = useSelectedYear();
  const [completions, setCompletions] = useState(initialCompletions);
  const [userVoteId, setUserVoteId] = useState(initialUserVoteId);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchYearData() {
      setLoading(true);
      const supabase = createClient();

      // Get date range for selected year
      const { start, end } = getYearDateRange(selectedYear);

      // Fetch completions for the year
      const { data: completions } = await supabase
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
        .eq('event_year', selectedYear)
        .gte('completed_date', start.toISOString())
        .lte('completed_date', end.toISOString())
        .order('created_at', { ascending: false });

      setCompletions(completions || []);
      setLoading(false);
    }

    fetchYearData();
  }, [selectedYear]);

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto"></div>
        <p className="mt-4 text-muted-foreground">Laster bilder...</p>
      </div>
    );
  }

  if (completions.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-muted-foreground">
          Ingen bilder lastet opp for {selectedYear}. Vær den første!
        </p>
      </div>
    );
  }

  return <GalleryGridMulti completions={completions} userVoteId={userVoteId} />;
}
