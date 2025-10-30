'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { PhotoCommentWithParticipant } from '@/lib/types/database'
import { checkRateLimit } from '@/lib/utils/rate-limit'
import { sanitizeSupabaseError } from '@/lib/utils/error-handler'

// Response type for consistent error handling
type ActionResponse<T = void> = {
  success: boolean
  error?: string
  data?: T
}

/**
 * Get all comments for a specific completion
 * @param completionId - The ID of the completion to get comments for
 * @returns Array of comments with participant information
 */
export async function getComments(
  completionId: string
): Promise<ActionResponse<PhotoCommentWithParticipant[]>> {
  try {
    const supabase = await createClient()

    // Fetch comments with participant information
    const { data: comments, error } = await supabase
      .from('photo_comments')
      .select(`
        id,
        completion_id,
        participant_id,
        comment_text,
        created_at,
        updated_at,
        participant:participants (
          id,
          user_id,
          email,
          full_name,
          postal_address,
          phone_number,
          bib_number,
          has_completed,
          created_at,
          updated_at
        )
      `)
      .eq('completion_id', completionId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching comments:', error)
      return {
        success: false,
        error: 'Kunne ikke hente kommentarer'
      }
    }

    // Type assertion needed because Supabase doesn't know about nested types
    const typedComments = comments as unknown as PhotoCommentWithParticipant[]

    return {
      success: true,
      data: typedComments
    }
  } catch (error) {
    console.error('Unexpected error in getComments:', error)
    return {
      success: false,
      error: 'En uventet feil oppstod'
    }
  }
}

/**
 * Add a new comment to a completion
 * @param completionId - The ID of the completion to comment on
 * @param commentText - The comment text (max 500 chars)
 * @returns The newly created comment with participant info
 */
export async function addComment(
  completionId: string,
  commentText: string
): Promise<ActionResponse<PhotoCommentWithParticipant>> {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        success: false,
        error: 'Du må være innlogget for å legge til kommentarer'
      }
    }

    // Rate limiting check for comments
    const rateLimitResult = await checkRateLimit('comment', user.id)
    if (!rateLimitResult.success) {
      return {
        success: false,
        error: `For mange kommentarer. Prøv igjen om ${Math.ceil(
          (rateLimitResult.reset - Date.now()) / 60000
        )} minutter.`,
      }
    }

    // Get participant information
    const { data: participant, error: participantError } = await supabase
      .from('participants')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (participantError || !participant) {
      return {
        success: false,
        error: 'Du må være registrert som deltaker for å kommentere'
      }
    }

    // Validate comment text
    const trimmedText = commentText.trim()
    if (!trimmedText) {
      return {
        success: false,
        error: 'Kommentaren kan ikke være tom'
      }
    }

    if (trimmedText.length > 500) {
      return {
        success: false,
        error: 'Kommentaren kan ikke være lengre enn 500 tegn'
      }
    }

    // Verify completion exists
    const { data: completion, error: completionError } = await supabase
      .from('completions')
      .select('id')
      .eq('id', completionId)
      .single()

    if (completionError || !completion) {
      return {
        success: false,
        error: 'Fant ikke fullføringen'
      }
    }

    // Insert comment
    const { data: newComment, error: insertError } = await supabase
      .from('photo_comments')
      .insert({
        completion_id: completionId,
        participant_id: participant.id,
        comment_text: trimmedText
      })
      .select(`
        id,
        completion_id,
        participant_id,
        comment_text,
        created_at,
        updated_at,
        participant:participants (
          id,
          user_id,
          email,
          full_name,
          postal_address,
          phone_number,
          bib_number,
          has_completed,
          created_at,
          updated_at
        )
      `)
      .single()

    if (insertError) {
      return {
        success: false,
        error: sanitizeSupabaseError(insertError, {
          location: 'addComment',
          userId: user.id,
        }),
      }
    }

    // Type assertion for nested participant data
    const typedComment = newComment as unknown as PhotoCommentWithParticipant

    // Revalidate paths to update cache
    revalidatePath('/galleri')
    revalidatePath(`/galleri/${completionId}`)

    return {
      success: true,
      data: typedComment
    }
  } catch (error) {
    return {
      success: false,
      error: sanitizeSupabaseError(error, {
        location: 'addComment:catch',
        userId: undefined,
      }),
    }
  }
}

/**
 * Delete a comment (only the comment owner can delete)
 * @param commentId - The ID of the comment to delete
 * @returns Success or error response
 */
export async function deleteComment(
  commentId: string
): Promise<ActionResponse> {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        success: false,
        error: 'Du må være innlogget for å slette kommentarer'
      }
    }

    // Get participant information
    const { data: participant, error: participantError } = await supabase
      .from('participants')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (participantError || !participant) {
      return {
        success: false,
        error: 'Du må være registrert som deltaker'
      }
    }

    // Get the comment to verify ownership and get completion_id
    const { data: comment, error: commentError } = await supabase
      .from('photo_comments')
      .select('id, participant_id, completion_id')
      .eq('id', commentId)
      .single()

    if (commentError || !comment) {
      return {
        success: false,
        error: 'Fant ikke kommentaren'
      }
    }

    // Check ownership
    if (comment.participant_id !== participant.id) {
      return {
        success: false,
        error: 'Du kan bare slette dine egne kommentarer'
      }
    }

    // Delete the comment (RLS policy will also enforce ownership)
    const { error: deleteError } = await supabase
      .from('photo_comments')
      .delete()
      .eq('id', commentId)
      .eq('participant_id', participant.id) // Extra safety check

    if (deleteError) {
      console.error('Error deleting comment:', deleteError)
      return {
        success: false,
        error: 'Kunne ikke slette kommentaren'
      }
    }

    // Revalidate paths to update cache
    revalidatePath('/galleri')
    revalidatePath(`/galleri/${comment.completion_id}`)

    return {
      success: true
    }
  } catch (error) {
    console.error('Unexpected error in deleteComment:', error)
    return {
      success: false,
      error: 'En uventet feil oppstod'
    }
  }
}
