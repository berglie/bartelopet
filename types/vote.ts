import type { Completion } from './completion';

// Vote types
export interface Vote {
  id: string;
  created_at: string;
  voter_id: string;
  completion_id: string;
  event_year: number; // Event year this vote belongs to

  // Relationships
  completion?: Completion;
}

export interface VoteCreate {
  voter_id: string;
  completion_id: string;
  event_year?: number; // Optional, defaults to current event year
}

export interface VoteStats {
  total_votes: number;
  user_has_voted: boolean;
  event_year: number;
}
