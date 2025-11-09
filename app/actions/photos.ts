'use server'

import { createClient } from '@/app/_shared/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { CompletionImage, CompletionImageInsert } from '@/app/_shared/lib/types/database'
import { IMAGE_CONSTRAINTS } from '@/app/_shared/lib/constants/images'
import { validateAndSanitizeImage, generateSecureFilename } from '@/app/_shared/lib/utils/file-validation'
import { sanitizeSupabaseError } from '@/app/_shared/lib/utils/error-handler'
import { checkRateLimit } from '@/app/_shared/lib/utils/rate-limit'

export type ActionResponse<T = void> = {
  success: boolean
  error?: string
  data?: T
}

/**
 * Upload multiple images for a completion
 * @param completionId - The completion ID
 * @param images - Array of image data to upload
 * @param starredIndex - Index of the starred image (default 0)
 * @returns Array of uploaded image IDs
 */
export async function uploadCompletionImages(
  completionId: string,
  images: Array<{
    fileData: string // Base64 data URL
    fileName: string
    fileType: string
    caption?: string
  }>,
  starredIndex: number = 0
): Promise<ActionResponse<string[]>> {
  const supabase = await createClient()
  let userId: string | undefined

  try {
    // Get the current user
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Ikke autentisert' }
    }
    userId = user.id

    // Get participant data
    const { data: participant, error: participantError } = await supabase
      .from('participants')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (participantError || !participant) {
      return { success: false, error: 'Finner ikke deltaker' }
    }

    // Get completion data (to get event_year)
    const { data: completion, error: completionError } = await supabase
      .from('completions')
      .select('event_year, participant_id')
      .eq('id', completionId)
      .single()

    if (completionError || !completion) {
      return { success: false, error: 'Finner ikke innsending' }
    }

    // Verify ownership
    if (completion.participant_id !== participant.id) {
      return { success: false, error: 'Ikke autorisert' }
    }

    // Validate image count
    if (images.length > IMAGE_CONSTRAINTS.MAX_IMAGES_PER_COMPLETION) {
      return {
        success: false,
        error: `Maksimalt ${IMAGE_CONSTRAINTS.MAX_IMAGES_PER_COMPLETION} bilder tillatt`,
      }
    }

    // Rate limiting check for uploads
    const rateLimitResult = await checkRateLimit('upload', user.id)
    if (!rateLimitResult.success) {
      return {
        success: false,
        error: `For mange opplastinger. Prøv igjen om ${Math.ceil(
          (rateLimitResult.reset - Date.now()) / 60000
        )} minutter.`,
      }
    }

    const uploadedImageIds: string[] = []

    // Upload each image
    for (let i = 0; i < images.length; i++) {
      const image = images[i]

      // Validate and sanitize image (server-side security check)
      const validationResult = await validateAndSanitizeImage(image.fileData)

      if (!validationResult.success || !validationResult.buffer) {
        // Cleanup previously uploaded images on failure
        for (const imageId of uploadedImageIds) {
          await supabase.from('photos').delete().eq('id', imageId)
        }
        return {
          success: false,
          error: validationResult.error || 'Ugyldig bildefil',
        }
      }

      // Use validated and sanitized buffer
      const buffer = validationResult.buffer

      // Generate secure filename (no user-controlled characters)
      const secureFileName = generateSecureFilename(buffer, participant.id, 'jpg')
      const filePath = `multi/${completion.event_year}/${participant.id}/${secureFileName}`

      // Upload to Supabase Storage with forced MIME type
      const { error: uploadError } = await supabase.storage
        .from('completion-photos')
        .upload(filePath, buffer, {
          contentType: 'image/jpeg', // Force JPEG (file was re-encoded)
          cacheControl: '31536000', // 1 year
          upsert: false,
        })

      if (uploadError) {
        // Cleanup previously uploaded images on failure
        for (const imageId of uploadedImageIds) {
          await supabase.from('photos').delete().eq('id', imageId)
        }
        return {
          success: false,
          error: sanitizeSupabaseError(uploadError, {
            location: 'uploadCompletionImages',
            userId: user.id,
          }),
        }
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from('completion-photos').getPublicUrl(filePath)

      // Insert into photos table
      const imageInsert: CompletionImageInsert = {
        completion_id: completionId,
        participant_id: participant.id,
        event_year: completion.event_year,
        image_url: publicUrl,
        is_starred: i === starredIndex,
        display_order: i,
        caption: image.caption || null,
      }

      const { data: insertedImage, error: insertError } = await supabase
        .from('photos')
        .insert(imageInsert)
        .select('id')
        .single()

      if (insertError || !insertedImage) {
        // Cleanup on failure
        await supabase.storage.from('completion-photos').remove([filePath])
        for (const imageId of uploadedImageIds) {
          await supabase.from('photos').delete().eq('id', imageId)
        }
        return {
          success: false,
          error: sanitizeSupabaseError(insertError, {
            location: 'uploadCompletionImages:insert',
            userId: user.id,
          }),
        }
      }

      uploadedImageIds.push(insertedImage.id)
    }

    // Revalidate cache
    revalidatePath('/galleri')
    revalidatePath('/dashboard')

    return { success: true, data: uploadedImageIds }
  } catch (error) {
    return {
      success: false,
      error: sanitizeSupabaseError(error, {
        location: 'uploadCompletionImages',
        userId: userId,
      }),
    }
  }
}

/**
 * Add a single image to an existing completion
 */
export async function addCompletionImage(
  completionId: string,
  fileData: string,
  fileName: string,
  fileType: string,
  caption?: string
): Promise<ActionResponse<string>> {
  const supabase = await createClient()

  try {
    // Verify completion exists
    const { data: completion, error: completionError } = await supabase
      .from('completions')
      .select('id')
      .eq('id', completionId)
      .single()

    if (completionError || !completion) {
      return { success: false, error: 'Finner ikke innsending' }
    }

    // Get current image count from photos table
    const { count: currentImageCount } = await supabase
      .from('photos')
      .select('*', { count: 'exact', head: true })
      .eq('completion_id', completionId)

    // Check if adding this image would exceed the limit
    if ((currentImageCount || 0) >= IMAGE_CONSTRAINTS.MAX_IMAGES_PER_COMPLETION) {
      return {
        success: false,
        error: `Maksimalt ${IMAGE_CONSTRAINTS.MAX_IMAGES_PER_COMPLETION} bilder tillatt`,
      }
    }

    // Use uploadCompletionImages for a single image
    const result = await uploadCompletionImages(
      completionId,
      [{ fileData, fileName, fileType, caption }],
      -1 // Don't star this image (keep existing starred)
    )

    if (!result.success || !result.data) {
      return { success: false, error: result.error }
    }

    return { success: true, data: result.data[0] }
  } catch (error) {
    console.error('Add image error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Ukjent feil oppstod',
    }
  }
}

/**
 * Change which image is starred (resets votes if requested)
 */
export async function updateStarredImage(
  completionId: string,
  imageId: string,
  resetVotes: boolean = true
): Promise<ActionResponse> {
  const supabase = await createClient()

  try {
    // Get the current user
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Ikke autentisert' }
    }

    // Verify ownership
    const { data: participant } = await supabase
      .from('participants')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!participant) {
      return { success: false, error: 'Finner ikke deltaker' }
    }

    const { data: image } = await supabase
      .from('photos')
      .select('participant_id, completion_id')
      .eq('id', imageId)
      .single()

    if (!image || image.participant_id !== participant.id || image.completion_id !== completionId) {
      return { success: false, error: 'Ikke autorisert' }
    }

    // Unstar all images for this completion
    const { error: unstarError } = await supabase
      .from('photos')
      .update({ is_starred: false })
      .eq('completion_id', completionId)

    if (unstarError) {
      return {
        success: false,
        error: sanitizeSupabaseError(unstarError, {
          location: 'updateStarredImage:unstar',
          userId: user.id
        })
      }
    }

    // Star the selected image
    const { error: starError } = await supabase
      .from('photos')
      .update({ is_starred: true })
      .eq('id', imageId)

    if (starError) {
      return {
        success: false,
        error: sanitizeSupabaseError(starError, {
          location: 'updateStarredImage:star',
          userId: user.id
        })
      }
    }

    // Reset votes if requested
    if (resetVotes) {
      const { error: deleteVotesError } = await supabase
        .from('photo_votes')
        .delete()
        .eq('completion_id', completionId)

      if (deleteVotesError) {
        console.error('Error deleting votes:', deleteVotesError)
        // Don't fail the entire operation if vote deletion fails
      }

      // Vote count is now calculated dynamically via view, no need to update
    }

    // Revalidate cache
    revalidatePath('/galleri')
    revalidatePath('/dashboard')

    return { success: true }
  } catch (error) {
    console.error('Update starred image error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Ukjent feil oppstod',
    }
  }
}

/**
 * Delete an image (cannot delete if it's the only one)
 */
export async function deleteCompletionImage(
  completionId: string,
  imageId: string
): Promise<ActionResponse> {
  const supabase = await createClient()

  try {
    // Get the current user
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Ikke autentisert' }
    }

    // Verify ownership
    const { data: participant } = await supabase
      .from('participants')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!participant) {
      return { success: false, error: 'Finner ikke deltaker' }
    }

    const { data: image } = await supabase
      .from('photos')
      .select('participant_id, completion_id, image_url')
      .eq('id', imageId)
      .single()

    if (!image || image.participant_id !== participant.id || image.completion_id !== completionId) {
      return { success: false, error: 'Ikke autorisert' }
    }

    // Check if this is the last image
    const { count: imageCount } = await supabase
      .from('photos')
      .select('*', { count: 'exact', head: true })
      .eq('completion_id', completionId)

    if (!imageCount || imageCount <= 1) {
      return { success: false, error: 'Kan ikke slette det siste bildet' }
    }

    // Extract file path from URL
    const url = new URL(image.image_url)
    const filePath = url.pathname.split('/public/')[1]

    // Delete from database (trigger will handle auto-starring next image if needed)
    const { error: deleteError } = await supabase
      .from('photos')
      .delete()
      .eq('id', imageId)

    if (deleteError) {
      return {
        success: false,
        error: sanitizeSupabaseError(deleteError, {
          location: 'deleteCompletionImage:delete',
          userId: user.id
        })
      }
    }

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('completion-photos')
      .remove([filePath])

    if (storageError) {
      console.error('Error deleting from storage:', storageError)
      // Don't fail the entire operation if storage deletion fails
    }

    // Revalidate cache
    revalidatePath('/galleri')
    revalidatePath('/dashboard')

    return { success: true }
  } catch (error) {
    console.error('Delete image error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Ukjent feil oppstod',
    }
  }
}

/**
 * Reorder images
 */
export async function reorderImages(
  completionId: string,
  imageIds: string[]
): Promise<ActionResponse> {
  const supabase = await createClient()

  try {
    // Get the current user
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Ikke autentisert' }
    }

    // Verify ownership
    const { data: participant } = await supabase
      .from('participants')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!participant) {
      return { success: false, error: 'Finner ikke deltaker' }
    }

    // Update display_order for each image
    for (let i = 0; i < imageIds.length; i++) {
      const { error } = await supabase
        .from('photos')
        .update({ display_order: i })
        .eq('id', imageIds[i])
        .eq('completion_id', completionId)
        .eq('participant_id', participant.id)

      if (error) {
        return {
          success: false,
          error: sanitizeSupabaseError(error, {
            location: 'reorderImages',
            userId: user.id
          })
        }
      }
    }

    // Revalidate cache
    revalidatePath('/galleri')
    revalidatePath('/dashboard')

    return { success: true }
  } catch (error) {
    console.error('Reorder images error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Ukjent feil oppstod',
    }
  }
}

/**
 * Update image caption
 */
export async function updateImageCaption(
  imageId: string,
  caption: string
): Promise<ActionResponse> {
  const supabase = await createClient()

  try {
    // Get the current user
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Ikke autentisert' }
    }

    // Verify ownership
    const { data: participant } = await supabase
      .from('participants')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!participant) {
      return { success: false, error: 'Finner ikke deltaker' }
    }

    // Validate caption length
    if (caption.length > IMAGE_CONSTRAINTS.MAX_CAPTION_LENGTH) {
      return {
        success: false,
        error: `Bildetekst kan ikke være lengre enn ${IMAGE_CONSTRAINTS.MAX_CAPTION_LENGTH} tegn`,
      }
    }

    // Update caption
    const { error } = await supabase
      .from('photos')
      .update({ caption })
      .eq('id', imageId)
      .eq('participant_id', participant.id)

    if (error) {
      return {
        success: false,
        error: sanitizeSupabaseError(error, {
          location: 'updateImageCaption',
          userId: user.id
        })
      }
    }

    // Revalidate cache
    revalidatePath('/galleri')
    revalidatePath('/dashboard')

    return { success: true }
  } catch (error) {
    console.error('Update caption error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Ukjent feil oppstod',
    }
  }
}

/**
 * Get all images for a completion
 */
export async function getPhotos(
  completionId: string
): Promise<ActionResponse<CompletionImage[]>> {
  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .from('photos')
      .select('*')
      .eq('completion_id', completionId)
      .order('display_order', { ascending: true })

    if (error) {
      return {
        success: false,
        error: sanitizeSupabaseError(error, {
          location: 'getPhotos',
          userId: undefined
        })
      }
    }

    return { success: true, data: data || [] }
  } catch (error) {
    console.error('Get images error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Ukjent feil oppstod',
    }
  }
}
