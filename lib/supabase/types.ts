/**
 * Supabase database types
 * Generate with: npx supabase gen types typescript --local > lib/supabase/types.ts
 */

export type Database = {
  public: {
    Tables: {
      participants: {
        Row: {
          id: string
          user_id: string
          email: string
          full_name: string
          display_name: string | null
          avatar_url: string | null
          bio: string | null
          target_distance_km: number
          current_distance_km: number
          total_completions: number
          total_votes_received: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          email: string
          full_name: string
          display_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          target_distance_km?: number
          current_distance_km?: number
          total_completions?: number
          total_votes_received?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          email?: string
          full_name?: string
          display_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          target_distance_km?: number
          current_distance_km?: number
          total_completions?: number
          total_votes_received?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      completions: {
        Row: {
          id: string
          participant_id: string
          distance_km: number
          duration_minutes: number | null
          location: string | null
          notes: string | null
          image_url: string
          thumbnail_url: string
          vote_count: number
          is_featured: boolean
          completed_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          participant_id: string
          distance_km: number
          duration_minutes?: number | null
          location?: string | null
          notes?: string | null
          image_url: string
          thumbnail_url: string
          vote_count?: number
          is_featured?: boolean
          completed_at: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          participant_id?: string
          distance_km?: number
          duration_minutes?: number | null
          location?: string | null
          notes?: string | null
          image_url?: string
          thumbnail_url?: string
          vote_count?: number
          is_featured?: boolean
          completed_at?: string
          created_at?: string
          updated_at?: string
        }
      }
      votes: {
        Row: {
          id: string
          participant_id: string
          completion_id: string
          created_at: string
        }
        Insert: {
          id?: string
          participant_id: string
          completion_id: string
          created_at?: string
        }
        Update: {
          id?: string
          participant_id?: string
          completion_id?: string
          created_at?: string
        }
      }
    }
  }
}
