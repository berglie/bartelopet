// Participant types
export interface Participant {
  id: string;
  created_at: string;
  updated_at: string;
  email: string;
  full_name: string;
  postal_address: string;
  phone_number: string | null;
  bib_number: number;
  has_completed: boolean;
  event_year: number; // Event year this participant registered for
  user_id: string | null; // Supabase auth user ID (nullable for pre-auth participants)
}

export interface ParticipantCreate {
  email: string;
  full_name: string;
  postal_address: string;
  phone_number?: string;
  bib_number: number;
  event_year?: number; // Optional, defaults to current event year
  user_id?: string | null;
}

export interface ParticipantUpdate {
  full_name?: string;
  postal_address?: string;
  phone_number?: string;
  email?: string;
}

export interface ParticipantPublic {
  id: string;
  full_name: string;
  bib_number: number;
  has_completed: boolean;
  event_year: number;
}

// Participant history across years
export interface ParticipantHistory {
  event_year: number;
  participant_id: string;
  email: string;
  full_name: string;
  bib_number: number;
  has_completed: boolean;
  registration_date: string;
  completion_date: string | null;
  vote_count: number;
}
