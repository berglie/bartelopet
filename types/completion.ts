import type { ParticipantPublic } from './participant';
import type { Vote } from './vote';

// Completion types
export interface Completion {
  id: string;
  created_at: string;
  updated_at: string;
  participant_id: string;
  distance_km: number;
  duration_minutes: number | null;
  location: string | null;
  notes: string | null;
  image_url: string;
  thumbnail_url: string;
  vote_count: number;
  is_featured: boolean;
  completed_at: string;

  // Relationships
  participant?: ParticipantPublic;
  votes?: Vote[];
}

export interface CompletionCreate {
  participant_id: string;
  distance_km: number;
  duration_minutes?: number;
  location?: string;
  notes?: string;
  image_url: string;
  thumbnail_url: string;
  completed_at: string;
}

export interface CompletionUpdate {
  distance_km?: number;
  duration_minutes?: number;
  location?: string;
  notes?: string;
  is_featured?: boolean;
}

export interface CompletionWithParticipant extends Completion {
  participant: ParticipantPublic;
}
