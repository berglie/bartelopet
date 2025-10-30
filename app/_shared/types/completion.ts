import type { ParticipantPublic } from './participant';
import type { Vote } from './vote';

// Completion types
export interface Completion {
  id: string;
  created_at: string;
  updated_at: string;
  participant_id: string;
  completed_date: string; // Date (ISO format YYYY-MM-DD)
  duration_text: string | null;
  photo_url: string;
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
  photo_url: string;
  comment?: string;
  event_year?: number; // Optional, defaults to current event year
}

export interface CompletionUpdate {
  completed_date?: string;
  duration_text?: string;
  photo_url?: string;
  comment?: string;
}

export interface CompletionWithParticipant extends Completion {
  participant: ParticipantPublic;
}
