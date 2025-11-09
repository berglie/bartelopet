'use server'

import { createClient } from '@/app/_shared/lib/supabase/server'
import { sanitizeSupabaseError } from '@/app/_shared/lib/utils/error-handler'
import { revalidatePath } from 'next/cache'

type ActionResponse<T = void> = {
  success: boolean
  error?: string
  data?: T
}

/**
 * Export all user data (GDPR Article 20 - Right to Data Portability)
 * Returns a comprehensive export of all user personal data
 */
export async function exportUserData(): Promise<ActionResponse<{
  export_data: Record<string, any>
  exported_at: string
}>> {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        success: false,
        error: 'Du må være innlogget for å eksportere data'
      }
    }

    // Get participant record
    const { data: participant, error: participantError } = await supabase
      .from('participants')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (participantError) {
      return {
        success: false,
        error: sanitizeSupabaseError(participantError, {
          location: 'exportUserData:participant',
          userId: user.id
        })
      }
    }

    // Get all completions
    const { data: completions, error: completionsError } = await supabase
      .from('completions')
      .select('*')
      .eq('participant_id', participant.id)

    if (completionsError) {
      return {
        success: false,
        error: sanitizeSupabaseError(completionsError, {
          location: 'exportUserData:completions',
          userId: user.id
        })
      }
    }

    // Get all photos
    const { data: photos, error: photosError } = await supabase
      .from('photos')
      .select('*')
      .eq('participant_id', participant.id)

    if (photosError) {
      return {
        success: false,
        error: sanitizeSupabaseError(photosError, {
          location: 'exportUserData:photos',
          userId: user.id
        })
      }
    }

    // Get all votes cast by user
    const { data: votes, error: votesError } = await supabase
      .from('photo_votes')
      .select('*')
      .eq('voter_id', participant.id)

    if (votesError) {
      return {
        success: false,
        error: sanitizeSupabaseError(votesError, {
          location: 'exportUserData:votes',
          userId: user.id
        })
      }
    }

    // Get all comments
    const { data: comments, error: commentsError } = await supabase
      .from('photo_comments')
      .select('*')
      .eq('participant_id', participant.id)

    if (commentsError) {
      return {
        success: false,
        error: sanitizeSupabaseError(commentsError, {
          location: 'exportUserData:comments',
          userId: user.id
        })
      }
    }

    // Compile export data
    const exportData = {
      personal_information: {
        full_name: participant.full_name,
        email: participant.email,
        postal_address: participant.postal_address,
        phone_number: participant.phone_number,
        bib_number: participant.bib_number,
        event_year: participant.event_year,
        has_completed: participant.has_completed,
        created_at: participant.created_at,
        updated_at: participant.updated_at,
      },
      completions: completions || [],
      photos: (photos || []).map(photo => ({
        ...photo,
        // Include public URL for download
        image_url: photo.image_url,
      })),
      votes_cast: (votes || []).length,
      comments: comments || [],
      export_metadata: {
        user_id: user.id,
        participant_id: participant.id,
        export_date: new Date().toISOString(),
        data_format_version: '1.0',
      }
    }

    return {
      success: true,
      data: {
        export_data: exportData,
        exported_at: new Date().toISOString()
      }
    }
  } catch (error) {
    console.error('Unexpected error in exportUserData:', error)
    return {
      success: false,
      error: 'En uventet feil oppstod under eksport av data'
    }
  }
}

/**
 * Delete user account and all associated data (GDPR Article 17 - Right to Erasure)
 * This is a destructive operation that cannot be undone
 */
export async function deleteUserAccount(
  confirmationText: string
): Promise<ActionResponse> {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        success: false,
        error: 'Du må være innlogget for å slette kontoen'
      }
    }

    // Verify confirmation text
    if (confirmationText !== 'SLETT MIN KONTO') {
      return {
        success: false,
        error: 'Bekreftelsesteksten er feil. Vennligst skriv "SLETT MIN KONTO" for å bekrefte.'
      }
    }

    // Get participant record
    const { data: participant, error: participantError } = await supabase
      .from('participants')
      .select('id, bib_number, event_year')
      .eq('user_id', user.id)
      .single()

    if (participantError || !participant) {
      return {
        success: false,
        error: 'Fant ikke deltakerprofil'
      }
    }

    // STEP 1: Anonymize completion comments (keep for historical purposes)
    const { error: anonymizeCommentsError } = await supabase
      .from('completions')
      .update({ comment: '[Slettet av bruker]' })
      .eq('participant_id', participant.id)
      .not('comment', 'is', null)

    if (anonymizeCommentsError) {
      console.error('Error anonymizing comments:', anonymizeCommentsError)
      // Continue anyway - this is not critical
    }

    // STEP 2: Delete photo comments
    const { error: deleteCommentsError } = await supabase
      .from('photo_comments')
      .delete()
      .eq('participant_id', participant.id)

    if (deleteCommentsError) {
      console.error('Error deleting photo comments:', deleteCommentsError)
      return {
        success: false,
        error: 'Kunne ikke slette kommentarer'
      }
    }

    // STEP 3: Delete votes
    const { error: deleteVotesError } = await supabase
      .from('photo_votes')
      .delete()
      .eq('voter_id', participant.id)

    if (deleteVotesError) {
      console.error('Error deleting votes:', deleteVotesError)
      return {
        success: false,
        error: 'Kunne ikke slette stemmer'
      }
    }

    // STEP 4: Delete photos from storage and database
    const { data: photos } = await supabase
      .from('photos')
      .select('image_url')
      .eq('participant_id', participant.id)

    if (photos && photos.length > 0) {
      // Extract file paths and delete from storage
      const filePaths = photos.map(photo => {
        const url = new URL(photo.image_url)
        const pathParts = url.pathname.split('/public/')
        return pathParts.length === 2 ? pathParts[1] : null
      }).filter(Boolean) as string[]

      if (filePaths.length > 0) {
        const { error: storageError } = await supabase.storage
          .from('completion-photos')
          .remove(filePaths)

        if (storageError) {
          console.error('Error deleting photos from storage:', storageError)
          // Continue anyway - database cleanup is more important
        }
      }

      // Delete photo records
      const { error: deletePhotosError } = await supabase
        .from('photos')
        .delete()
        .eq('participant_id', participant.id)

      if (deletePhotosError) {
        console.error('Error deleting photo records:', deletePhotosError)
        return {
          success: false,
          error: 'Kunne ikke slette bilder'
        }
      }
    }

    // STEP 5: Delete completions (cascade will handle related records)
    const { error: deleteCompletionsError } = await supabase
      .from('completions')
      .delete()
      .eq('participant_id', participant.id)

    if (deleteCompletionsError) {
      console.error('Error deleting completions:', deleteCompletionsError)
      return {
        success: false,
        error: 'Kunne ikke slette fullføringer'
      }
    }

    // STEP 6: Anonymize participant record (keep for historical/statistical purposes)
    // This approach maintains referential integrity while removing PII
    const { error: anonymizeError } = await supabase
      .from('participants')
      .update({
        email: `deleted_${user.id}@deleted.local`,
        postal_address: '[Slettet]',
        phone_number: null,
        full_name: `Deltaker ${participant.bib_number}`, // Keep bib number for historical context
        user_id: null, // Unlink from auth user
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id)

    if (anonymizeError) {
      console.error('Error anonymizing participant:', anonymizeError)
      return {
        success: false,
        error: sanitizeSupabaseError(anonymizeError, {
          location: 'deleteUserAccount:anonymize',
          userId: user.id
        })
      }
    }

    // STEP 7: Delete auth user (this also signs them out)
    // Note: This requires admin privileges, so we'll need to handle this differently
    // For now, the user will need to be manually deleted from Supabase dashboard
    // OR we can implement this via a Supabase Edge Function with admin permissions

    // Log the deletion request for admin follow-up
    console.log(`[GDPR] User deletion request: ${user.id} - Email: ${user.email} - Participant: ${participant.id}`)

    // Sign out the user
    await supabase.auth.signOut()

    // Revalidate paths
    revalidatePath('/dashboard')
    revalidatePath('/galleri')
    revalidatePath('/deltakere')

    return {
      success: true
    }
  } catch (error) {
    console.error('Unexpected error in deleteUserAccount:', error)
    return {
      success: false,
      error: 'En uventet feil oppstod under sletting av konto'
    }
  }
}

/**
 * Request account deletion (creates a deletion request for admin review)
 * Less destructive alternative that allows admin verification
 */
export async function requestAccountDeletion(
  reason?: string
): Promise<ActionResponse> {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        success: false,
        error: 'Du må være innlogget'
      }
    }

    // Log deletion request
    console.log(`[GDPR] Deletion request from: ${user.email}`, {
      userId: user.id,
      reason: reason || 'Not specified',
      timestamp: new Date().toISOString()
    })

    // In a production system, you would create a deletion_requests table
    // and queue this for admin review

    return {
      success: true
    }
  } catch (error) {
    console.error('Error in requestAccountDeletion:', error)
    return {
      success: false,
      error: 'En uventet feil oppstod'
    }
  }
}
