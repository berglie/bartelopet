'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/app/_shared/lib/supabase/server'
import { completionUpdateSchema } from '@/app/_shared/lib/validations/completion'
import { sanitizeSupabaseError } from '@/app/_shared/lib/utils/error-handler'

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

/**
 * Validate UUID format
 */
function isValidUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(id)
}

export async function updateCompletion(
  completionId: string,
  data: UpdateCompletionData,
  photoChanged: boolean = false
): Promise<ActionResponse> {
  try {
    // Validate UUID format
    if (!isValidUUID(completionId)) {
      return {
        success: false,
        error: 'Ugyldig fullførings-ID'
      }
    }

    // Validate input data with Zod
    const validationResult = completionUpdateSchema.safeParse(data)
    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0]
      return {
        success: false,
        error: firstError?.message || 'Ugyldig data'
      }
    }

    const validatedData = validationResult.data
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

    // Build update object with only validated fields (prevent mass assignment)
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString()
    }

    if (validatedData.completed_date !== undefined) {
      updateData.completed_date = validatedData.completed_date
    }
    if (validatedData.duration_text !== undefined) {
      updateData.duration_text = validatedData.duration_text
    }
    if (validatedData.comment !== undefined) {
      updateData.comment = validatedData.comment
    }

    const { error: updateError } = await supabase
      .from('completions')
      .update(updateData)
      .eq('id', completionId)
      .eq('participant_id', participant.id)

    if (updateError) {
      console.error('Error updating completion:', updateError)
      return {
        success: false,
        error: sanitizeSupabaseError(updateError, {
          location: 'updateCompletion',
          userId: user.id
        })
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

/**
 * Create a new completion
 * Server action to replace client-side database operations
 */
export async function createCompletion(
  data: {
    participant_id: string
    completed_date: string
    duration_text?: string | null
    comment?: string | null
  }
): Promise<ActionResponse<{ id: string }>> {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        success: false,
        error: 'Du må være innlogget for å registrere fullføring'
      }
    }

    // Validate input data with Zod
    const validationResult = completionUpdateSchema.safeParse({
      completed_date: data.completed_date,
      duration_text: data.duration_text,
      comment: data.comment
    })

    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0]
      return {
        success: false,
        error: firstError?.message || 'Ugyldig data'
      }
    }

    // Verify user owns the participant record
    const { data: participant, error: participantError } = await supabase
      .from('participants')
      .select('id, has_completed')
      .eq('user_id', user.id)
      .eq('id', data.participant_id)
      .single()

    if (participantError || !participant) {
      return {
        success: false,
        error: 'Du må være registrert som deltaker'
      }
    }

    // Check if user already has a completion
    if (participant.has_completed) {
      const { data: existingCompletion } = await supabase
        .from('completions')
        .select('id')
        .eq('participant_id', participant.id)
        .maybeSingle()

      if (existingCompletion) {
        return {
          success: false,
          error: 'Du har allerede registrert et fullført løp'
        }
      }
    }

    // Get current event year
    const currentYear = new Date().getFullYear()

    // Insert completion
    const { data: newCompletion, error: insertError } = await supabase
      .from('completions')
      .insert({
        participant_id: participant.id,
        completed_date: data.completed_date,
        duration_text: data.duration_text || null,
        comment: data.comment || null,
        event_year: currentYear
      })
      .select('id')
      .single()

    if (insertError) {
      console.error('Error creating completion:', insertError)
      return {
        success: false,
        error: sanitizeSupabaseError(insertError, {
          location: 'createCompletion',
          userId: user.id
        })
      }
    }

    // Revalidate paths
    revalidatePath('/dashboard')
    revalidatePath('/galleri')
    revalidatePath('/deltakere')

    return {
      success: true,
      data: { id: newCompletion.id }
    }
  } catch (error) {
    console.error('Unexpected error in createCompletion:', error)
    return {
      success: false,
      error: 'En uventet feil oppstod'
    }
  }
}

// DEPRECATED: Use uploadCompletionImages from @/app/actions/photos instead
// This function has been removed as photos should be stored in the photos table
// with the proper directory structure: multi/year/participantId/photo.jpg
