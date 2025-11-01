// Database types matching Supabase schema

export interface Participant {
  id: string
  user_id: string | null
  email: string
  full_name: string
  postal_address: string
  phone_number: string | null
  bib_number: number
  has_completed: boolean
  created_at: string
  updated_at: string
}

export interface Completion {
  id: string
  participant_id: string
  completed_date: string
  duration_text: string | null
  comment: string | null
  vote_count: number
  comment_count: number
  image_count: number
  event_year: number
  created_at: string
  updated_at: string
}

export interface Vote {
  id: string
  voter_id: string
  completion_id: string
  created_at: string
}

// Completion Images (multi-image support)
export interface CompletionImage {
  id: string
  completion_id: string
  participant_id: string
  event_year: number
  image_url: string
  is_starred: boolean
  display_order: number
  caption: string | null
  uploaded_at: string
}

export type CompletionImageInsert = Omit<CompletionImage, 'id' | 'uploaded_at'>

export type CompletionImageUpdate = Partial<Pick<CompletionImage, 'caption' | 'display_order' | 'is_starred'>>

// Extended types with relations
export interface CompletionWithParticipant extends Completion {
  participant: Participant
}

export interface CompletionWithImages extends Completion {
  images: CompletionImage[]
  participant: Participant
}

export interface ParticipantWithCompletion extends Participant {
  completion: Completion | null
}

// Insert types (for creating new records)
export type ParticipantInsert = Omit<Participant, 'id' | 'created_at' | 'updated_at' | 'has_completed'>

export type CompletionInsert = Omit<Completion, 'id' | 'created_at' | 'updated_at' | 'vote_count' | 'comment_count' | 'image_count'>

export type VoteInsert = Omit<Vote, 'id' | 'created_at'>

// Photo Comments
export interface PhotoComment {
  id: string
  completion_id: string
  participant_id: string
  comment_text: string
  created_at: string
  updated_at: string
}

export interface PhotoCommentWithParticipant extends PhotoComment {
  participant: Participant
}

export type PhotoCommentInsert = Omit<PhotoComment, 'id' | 'created_at' | 'updated_at'>

// Update types (for updating records)
export type ParticipantUpdate = Partial<Pick<Participant, 'postal_address' | 'phone_number'>>

export type CompletionUpdate = Partial<Pick<Completion, 'completed_date' | 'duration_text' | 'comment'>>
