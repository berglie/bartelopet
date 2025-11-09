/**
 * Authorization Utilities
 * Centralized authorization logic for consistent security across the application
 */

import { createClient } from '@/app/_shared/lib/supabase/server'
import type { SupabaseClient } from '@supabase/supabase-js'

export type AuthorizationResult = {
  authorized: boolean
  userId?: string
  participantId?: string
  error?: string
}

/**
 * Get the authenticated user and their participant record
 * This is the foundation for all authorization checks
 */
export async function getAuthenticatedParticipant(): Promise<AuthorizationResult> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return {
      authorized: false,
      error: 'Ikke autentisert'
    }
  }

  const { data: participant, error: participantError } = await supabase
    .from('participants')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (participantError || !participant) {
    return {
      authorized: false,
      userId: user.id,
      error: 'Deltakerprofil ikke funnet'
    }
  }

  return {
    authorized: true,
    userId: user.id,
    participantId: participant.id
  }
}

/**
 * Check if user owns a specific participant record
 */
export async function requireParticipantOwnership(
  participantId: string
): Promise<AuthorizationResult> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return {
      authorized: false,
      error: 'Ikke autentisert'
    }
  }

  const { data: participant, error: participantError } = await supabase
    .from('participants')
    .select('user_id')
    .eq('id', participantId)
    .single()

  if (participantError || !participant) {
    return {
      authorized: false,
      userId: user.id,
      error: 'Deltaker ikke funnet'
    }
  }

  if (participant.user_id !== user.id) {
    return {
      authorized: false,
      userId: user.id,
      error: 'Ikke autorisert'
    }
  }

  return {
    authorized: true,
    userId: user.id,
    participantId
  }
}

/**
 * Check if user owns a completion
 */
export async function requireCompletionOwnership(
  completionId: string
): Promise<AuthorizationResult> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return {
      authorized: false,
      error: 'Ikke autentisert'
    }
  }

  const { data: participant, error: participantError } = await supabase
    .from('participants')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (participantError || !participant) {
    return {
      authorized: false,
      userId: user.id,
      error: 'Deltakerprofil ikke funnet'
    }
  }

  const { data: completion, error: completionError } = await supabase
    .from('completions')
    .select('participant_id')
    .eq('id', completionId)
    .single()

  if (completionError || !completion) {
    return {
      authorized: false,
      userId: user.id,
      participantId: participant.id,
      error: 'Fullføring ikke funnet'
    }
  }

  if (completion.participant_id !== participant.id) {
    return {
      authorized: false,
      userId: user.id,
      participantId: participant.id,
      error: 'Ikke autorisert'
    }
  }

  return {
    authorized: true,
    userId: user.id,
    participantId: participant.id
  }
}

/**
 * Check if user owns a photo
 */
export async function requirePhotoOwnership(
  imageId: string
): Promise<AuthorizationResult> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return {
      authorized: false,
      error: 'Ikke autentisert'
    }
  }

  const { data: participant, error: participantError } = await supabase
    .from('participants')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (participantError || !participant) {
    return {
      authorized: false,
      userId: user.id,
      error: 'Deltakerprofil ikke funnet'
    }
  }

  const { data: image, error: imageError } = await supabase
    .from('photos')
    .select('participant_id')
    .eq('id', imageId)
    .single()

  if (imageError || !image) {
    return {
      authorized: false,
      userId: user.id,
      participantId: participant.id,
      error: 'Bilde ikke funnet'
    }
  }

  if (image.participant_id !== participant.id) {
    return {
      authorized: false,
      userId: user.id,
      participantId: participant.id,
      error: 'Ikke autorisert'
    }
  }

  return {
    authorized: true,
    userId: user.id,
    participantId: participant.id
  }
}

/**
 * Check if user owns a comment
 */
export async function requireCommentOwnership(
  commentId: string
): Promise<AuthorizationResult> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return {
      authorized: false,
      error: 'Ikke autentisert'
    }
  }

  const { data: participant, error: participantError } = await supabase
    .from('participants')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (participantError || !participant) {
    return {
      authorized: false,
      userId: user.id,
      error: 'Deltakerprofil ikke funnet'
    }
  }

  const { data: comment, error: commentError } = await supabase
    .from('photo_comments')
    .select('participant_id')
    .eq('id', commentId)
    .single()

  if (commentError || !comment) {
    return {
      authorized: false,
      userId: user.id,
      participantId: participant.id,
      error: 'Kommentar ikke funnet'
    }
  }

  if (comment.participant_id !== participant.id) {
    return {
      authorized: false,
      userId: user.id,
      participantId: participant.id,
      error: 'Ikke autorisert'
    }
  }

  return {
    authorized: true,
    userId: user.id,
    participantId: participant.id
  }
}

/**
 * Validate UUID format
 */
export function isValidUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(id)
}

/**
 * Check if user is admin (for future RBAC implementation)
 * Currently returns false - implement when admin role is added
 */
export async function isAdmin(): Promise<boolean> {
  // TODO: Implement admin role check when RBAC is added
  // const supabase = await createClient()
  // const { data: { user } } = await supabase.auth.getUser()
  //
  // if (!user) return false
  //
  // const { data: participant } = await supabase
  //   .from('participants')
  //   .select('role')
  //   .eq('user_id', user.id)
  //   .single()
  //
  // return participant?.role === 'admin'

  return false
}

/**
 * Require admin privileges
 */
export async function requireAdmin(): Promise<AuthorizationResult> {
  const isAdminUser = await isAdmin()

  if (!isAdminUser) {
    return {
      authorized: false,
      error: 'Krever administrator-rettigheter'
    }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return {
    authorized: true,
    userId: user?.id
  }
}
