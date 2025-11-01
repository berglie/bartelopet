'use server'

import { createClient } from '@/app/_shared/lib/supabase/server'
import type { ParticipantDetail } from '@/app/deltakere/_utils/queries'

export async function getParticipantDetailAction(
  bibNumber: number,
  year: number
): Promise<ParticipantDetail | null> {
  const supabase = await createClient()

  // First get participant data
  const { data: participant, error: participantError } = await supabase
    .from('participants')
    .select('id, full_name, bib_number, has_completed, event_year, created_at')
    .eq('bib_number', bibNumber)
    .eq('event_year', year)
    .single()

  if (participantError || !participant) {
    console.error('Error fetching participant:', participantError)
    return null
  }

  // If participant has completed, fetch completion data
  if (participant.has_completed) {
    // First try to get completion from completions_with_counts view
    const { data: completionWithCounts, error: viewError } = await supabase
      .from('completions_with_counts')
      .select('*')
      .eq('participant_id', participant.id)
      .single()

    if (completionWithCounts && !viewError) {
      console.log('Found completion in view:', completionWithCounts)

      // Fetch the images from the photos table
      const { data: images, error: imagesError } = await supabase
        .from('photos')
        .select('id, image_url, is_starred, caption, display_order')
        .eq('completion_id', completionWithCounts.id)
        .order('is_starred', { ascending: false })
        .order('display_order', { ascending: true })

      if (imagesError) {
        console.error('Error fetching photos for completion_id:', completionWithCounts.id, 'Error:', imagesError)
      } else {
        console.log('Successfully fetched photos:', {
          completion_id: completionWithCounts.id,
          participant_id: participant.id,
          images_count: images?.length || 0,
          images: images
        })
      }

      // All images are in the photos table only - no fallback
      let finalImages = images || []

      return {
        ...participant,
        completion: {
          id: completionWithCounts.id,
          completion_date: completionWithCounts.completed_date || completionWithCounts.created_at,
          duration_minutes: completionWithCounts.duration_minutes,
          submission_comment: completionWithCounts.comment || null,
          comment_count: completionWithCounts.comment_count || 0,
          vote_count: completionWithCounts.vote_count || 0,
          images: finalImages
        }
      }
    } else {
      // Fallback to direct query
      const { data: completion, error: completionError } = await supabase
        .from('completions')
        .select(`
          id,
          created_at,
          duration_minutes,
          comment
        `)
        .eq('participant_id', participant.id)
        .single()

      if (completion && !completionError) {
        // Fetch images from photos table
        const { data: images } = await supabase
          .from('photos')
          .select('id, image_url, is_starred, caption, display_order')
          .eq('completion_id', completion.id)
          .order('is_starred', { ascending: false })
          .order('display_order', { ascending: true })

        console.log('Fetched images for completion (fallback):', completion.id, 'participant:', participant.id, 'images:', images)

        // Get comment and vote counts
        const [commentCount, voteCount] = await Promise.all([
          supabase
            .from('photo_comments')
            .select('*', { count: 'exact', head: true })
            .eq('completion_id', completion.id),
          supabase
            .from('photo_votes')
            .select('*', { count: 'exact', head: true })
            .eq('completion_id', completion.id)
        ])

        return {
          ...participant,
          completion: {
            id: completion.id,
            completion_date: completion.created_at,
            duration_minutes: completion.duration_minutes,
            submission_comment: completion.comment || null,
            comment_count: commentCount.count || 0,
            vote_count: voteCount.count || 0,
            images: images || []
          }
        }
      } else {
        console.error('Could not fetch completion for participant:', participant.id, completionError)
      }
    }
  }

  return participant
}