// Participant types
export interface Participant {
  id: string;
  created_at: string;
  updated_at: string;
  email: string;
  full_name: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  target_distance_km: number;
  current_distance_km: number;
  total_completions: number;
  total_votes_received: number;
  is_active: boolean;
  user_id: string; // Supabase auth user ID
}

export interface ParticipantCreate {
  email: string;
  full_name: string;
  display_name?: string;
  target_distance_km: number;
}

export interface ParticipantUpdate {
  display_name?: string;
  avatar_url?: string;
  bio?: string;
  target_distance_km?: number;
}

export interface ParticipantPublic {
  id: string;
  display_name: string;
  avatar_url: string | null;
  current_distance_km: number;
  total_completions: number;
  total_votes_received: number;
}
