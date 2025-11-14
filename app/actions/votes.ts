'use server';

import { createClient } from '@/app/_shared/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function togglePhotoVote(completionId: string) {
  const supabase = await createClient();

  // Check if user is logged in
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      success: false,
      error: 'Du må være logget inn for å stemme',
      requiresAuth: true,
    };
  }

  // Get the voter's participant ID
  const { data: voter, error: voterError } = await supabase
    .from('participants')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (voterError || !voter) {
    return {
      success: false,
      error: 'Du må være registrert som deltaker for å stemme',
    };
  }

  // Check if the voter owns this completion
  const { data: completion, error: completionError } = await supabase
    .from('completions')
    .select('participant_id')
    .eq('id', completionId)
    .single();

  if (completionError || !completion) {
    return {
      success: false,
      error: 'Kunne ikke finne bildet',
    };
  }

  if (completion.participant_id === voter.id) {
    return {
      success: false,
      error: 'Du kan ikke stemme på ditt eget bilde',
    };
  }

  // Check if user has already voted for this photo
  const { data: existingVote } = await supabase
    .from('photo_votes')
    .select('id')
    .eq('voter_id', voter.id)
    .eq('completion_id', completionId)
    .single();

  let hasVoted = false;
  let voteCount = 0;

  try {
    if (existingVote) {
      // Remove the vote
      const { error: deleteError } = await supabase
        .from('photo_votes')
        .delete()
        .eq('id', existingVote.id);

      if (deleteError) throw deleteError;
      hasVoted = false;
    } else {
      // Add the vote
      const { error: insertError } = await supabase.from('photo_votes').insert({
        voter_id: voter.id,
        completion_id: completionId,
        event_year: new Date().getFullYear(),
      });

      if (insertError) throw insertError;
      hasVoted = true;
    }

    // Get updated vote count
    const { count } = await supabase
      .from('photo_votes')
      .select('*', { count: 'exact', head: true })
      .eq('completion_id', completionId);

    voteCount = count || 0;

    // Revalidate relevant paths
    revalidatePath('/galleri');
    revalidatePath('/deltakere');

    return {
      success: true,
      hasVoted,
      voteCount,
    };
  } catch (error) {
    console.error('Error toggling vote:', error);
    return {
      success: false,
      error: 'Kunne ikke oppdatere stemme',
    };
  }
}
