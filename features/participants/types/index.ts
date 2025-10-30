/**
 * Participants feature type definitions
 */

// Base entity interface (temporary - will use shared later)
interface BaseEntity {
  id: string
  created_at: string
  updated_at?: string
}

export interface Participant extends BaseEntity {
  user_id: string
  email: string
  full_name: string
  postal_address: string
  phone_number?: string
  bib_number: number
  has_completed: boolean
  event_year: number
}

export interface YearCompletionData {
  year: number
  completed: boolean
  completionId?: string
  voteCount: number
  completedDate?: string
  photoUrl?: string
}