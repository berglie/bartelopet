/**
 * Server-side queries for participants feature
 */

import { createClient } from '@/app/_shared/lib/supabase/server';

export interface ParticipantListItem {
  full_name: string;
  bib_number: number;
  has_completed: boolean;
  event_year: number;
}

export interface ParticipantsStats {
  total: number;
  completed: number;
}

export interface ParticipantDetail {
  id: string;
  full_name: string;
  bib_number: number;
  has_completed: boolean;
  event_year: number;
  created_at: string;
  completion?: {
    id: string;
    completion_date: string;
    duration_minutes: number | null;
    submission_comment?: string | null;
    comment_count: number;
    vote_count: number;
    images: Array<{
      id: string;
      image_url: string;
      is_starred: boolean;
      caption: string | null;
    }>;
  };
}

export async function getParticipants(year: number): Promise<ParticipantListItem[]> {
  const supabase = await createClient();

  const { data: participants, error } = await supabase
    .from('participants_safe')
    .select('full_name, bib_number, has_completed, event_year')
    .eq('event_year', year)
    .order('bib_number', { ascending: true });

  if (error) {
    console.error('Error fetching participants:', error);
    return [];
  }

  return (participants || []) as ParticipantListItem[];
}

export async function getParticipantsStats(year: number): Promise<ParticipantsStats> {
  const supabase = await createClient();

  const [{ count: totalCount }, { count: completedCount }] = await Promise.all([
    supabase
      .from('participants_safe')
      .select('*', { count: 'exact', head: true })
      .eq('event_year', year),
    supabase
      .from('participants_safe')
      .select('*', { count: 'exact', head: true })
      .eq('event_year', year)
      .eq('has_completed', true),
  ]);

  return {
    total: totalCount || 0,
    completed: completedCount || 0,
  };
}

export async function getParticipantDetail(
  bibNumber: number,
  year: number
): Promise<ParticipantDetail | null> {
  const supabase = await createClient();

  // First get participant data
  const { data: participant, error: participantError } = await supabase
    .from('participants_safe')
    .select('id, full_name, bib_number, has_completed, event_year, created_at')
    .eq('bib_number', bibNumber)
    .eq('event_year', year)
    .single();

  if (participantError || !participant || !participant.id) {
    console.error('Error fetching participant:', participantError);
    return null;
  }

  // Type assertion - we know these fields are not null for valid participants
  const participantData = participant as ParticipantDetail;

  // If participant has completed, fetch completion data
  if (participant.has_completed) {
    // First try to get completion from completions_with_counts view
    const { data: completionWithCounts, error: viewError } = await supabase
      .from('completions_with_counts')
      .select('*')
      .eq('participant_id', participant.id!)
      .single();

    if (completionWithCounts && !viewError && completionWithCounts.id) {
      // Fetch the images from the photos table
      const { data: images, error: imagesError } = await supabase
        .from('photos')
        .select('id, image_url, is_starred, caption, display_order')
        .eq('completion_id', completionWithCounts.id)
        .order('is_starred', { ascending: false })
        .order('display_order', { ascending: true });

      if (imagesError) {
        console.error('Error fetching completion images:', imagesError);
      }

      return {
        ...participantData,
        completion: {
          id: completionWithCounts.id,
          completion_date:
            completionWithCounts.completed_date || completionWithCounts.created_at || '',
          duration_minutes: null, // duration_text exists but we need duration_minutes - set to null for now
          submission_comment: completionWithCounts.comment || null,
          comment_count: completionWithCounts.comment_count || 0,
          vote_count: completionWithCounts.vote_count || 0,
          images: images || [],
        },
      };
    } else {
      // Fallback to direct query
      const { data: completion, error: completionError } = await supabase
        .from('completions')
        .select(
          `
          id,
          created_at,
          duration_text,
          comment
        `
        )
        .eq('participant_id', participant.id)
        .single();

      if (completion && !completionError && completion.id) {
        // Fetch images from photos table
        const { data: images } = await supabase
          .from('photos')
          .select('id, image_url, is_starred, caption, display_order')
          .eq('completion_id', completion.id)
          .order('is_starred', { ascending: false })
          .order('display_order', { ascending: true });

        // Get comment and vote counts
        const [commentCount, voteCount] = await Promise.all([
          supabase
            .from('photo_comments')
            .select('*', { count: 'exact', head: true })
            .eq('completion_id', completion.id),
          supabase
            .from('photo_votes')
            .select('*', { count: 'exact', head: true })
            .eq('completion_id', completion.id),
        ]);

        return {
          ...participantData,
          completion: {
            id: completion.id,
            completion_date: completion.created_at || '',
            duration_minutes: null, // duration_text exists but we need duration_minutes - set to null for now
            submission_comment: completion.comment || null,
            comment_count: commentCount.count || 0,
            vote_count: voteCount.count || 0,
            images: images || [],
          },
        };
      } else {
        console.error(
          'Could not fetch completion for participant:',
          participant.id,
          completionError
        );
      }
    }
  }

  return participantData;
}
