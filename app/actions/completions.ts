'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/app/_shared/lib/supabase/server'

type ActionResponse<T = void> = {
  success: boolean
  error?: string
  data?: T
}

interface UpdateCompletionData {
  completed_date?: string
  duration_text?: string | null
  comment?: string | null
}

export async function updateCompletion(
  completionId: string,
  data: UpdateCompletionData,
  photoChanged: boolean = false
): Promise<ActionResponse> {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        success: false,
        error: 'Dumå væreinnlogget for å redigere'
      }
    }

    const { data: participant, error: participantError } = await supabase
      .from('participants')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (participantError || !participant) {
      return {
        success: false,
        error: 'Dumå væreregistrert som deltaker'
      }
    }

    const { data: completion, error: completionError } = await supabase
      .from('completions')
      .select('id, participant_id')
      .eq('id', completionId)
      .single()

    if (completionError || !completion) {
      return {
        success: false,
        error: 'Fant ikke fullforingen'
      }
    }

    if (completion.participant_id !== participant.id) {
      return {
        success: false,
        error: 'Du kan bare redigere dine egne innlegg'
      }
    }

    if (photoChanged) {
      const { error: deleteVotesError } = await supabase
        .from('photo_votes')
        .delete()
        .eq('completion_id', completionId)

      if (deleteVotesError) {
        console.error('Error deleting votes:', deleteVotesError)
        return {
          success: false,
          error: 'Kunne ikke oppdatere stemmer'
        }
      }
    }

    const { error: updateError } = await supabase
      .from('completions')
      .update({
        ...data,
        updated_at: new Date().toISOString()
      })
      .eq('id', completionId)
      .eq('participant_id', participant.id)

    if (updateError) {
      console.error('Error updating completion:', updateError)
      return {
        success: false,
        error: 'Kunne ikke oppdatere innlegget'
      }
    }

    revalidatePath('/galleri')

    return {
      success: true
    }
  } catch (error) {
    console.error('Unexpected error in updateCompletion:', error)
    return {
      success: false,
      error: 'En uventet feil oppstod'
    }
  }
}

// DEPRECATED: Use uploadCompletionImages from @/app/actions/photos instead
// This function has been removed as photos should be stored in the photos table
// with the proper directory structure: multi/year/participantId/photo.jpg
