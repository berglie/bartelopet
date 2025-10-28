import type { Completion } from './completion';

// Vote types
export interface Vote {
  id: string;
  created_at: string;
  participant_id: string;
  completion_id: string;

  // Relationships
  completion?: Completion;
}

export interface VoteCreate {
  completion_id: string;
}

export interface VoteStats {
  total_votes: number;
  user_has_voted: boolean;
}
