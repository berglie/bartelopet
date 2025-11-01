import type { ParticipantPublic } from './participant';
import type { Vote } from './vote';

// Completion types
// NOTE: Photos are stored ONLY in the photos table, NOT in completions
export interface Completion {
  id: string;
  created_at: string;
  updated_at: string;
  participant_id: string;
  completed_date: string; // Date (ISO format YYYY-MM-DD)
  duration_text: string | null;
  comment: string | null;
  vote_count: number;
  comment_count: number;
  event_year: number; // Event year this completion belongs to

  // Relationships
  participant?: ParticipantPublic;
  votes?: Vote[];
}

export interface CompletionCreate {
  participant_id: string;
  completed_date: string; // Date in YYYY-MM-DD format
  duration_text?: string;
  comment?: string;
  event_year?: number; // Optional, defaults to current event year
  // NOTE: Photos are uploaded separately to the photos table
}

export interface CompletionUpdate {
  completed_date?: string;
  duration_text?: string;
  comment?: string;
  // NOTE: Photos are managed separately in the photos table
}

export interface CompletionWithParticipant extends Completion {
  participant: ParticipantPublic;
}
