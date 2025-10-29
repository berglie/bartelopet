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
          postal_address: string
          phone_number: string | null
          bib_number: number
          has_completed: boolean
          vipps_sub: string | null
          auth_provider: 'email' | 'vipps' | 'both'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          email: string
          full_name: string
          postal_address: string
          phone_number?: string | null
          bib_number: number
          has_completed?: boolean
          vipps_sub?: string | null
          auth_provider?: 'email' | 'vipps' | 'both'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          email?: string
          full_name?: string
          postal_address?: string
          phone_number?: string | null
          bib_number?: number
          has_completed?: boolean
          vipps_sub?: string | null
          auth_provider?: 'email' | 'vipps' | 'both'
          created_at?: string
          updated_at?: string
        }
      }
      completions: {
        Row: {
          id: string
          participant_id: string
          completed_date: string
          duration_text: string | null
          photo_url: string
          comment: string | null
          vote_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          participant_id: string
          completed_date: string
          duration_text?: string | null
          photo_url: string
          comment?: string | null
          vote_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          participant_id?: string
          completed_date?: string
          duration_text?: string | null
          photo_url?: string
          comment?: string | null
          vote_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      votes: {
        Row: {
          id: string
          voter_id: string
          completion_id: string
          created_at: string
        }
        Insert: {
          id?: string
          voter_id: string
          completion_id: string
          created_at?: string
        }
        Update: {
          id?: string
          voter_id?: string
          completion_id?: string
          created_at?: string
        }
      }
      vipps_sessions: {
        Row: {
          id: string
          state: string
          code_verifier: string
          code_challenge: string
          redirect_uri: string
          user_id: string | null
          created_at: string
          expires_at: string
        }
        Insert: {
          id?: string
          state: string
          code_verifier: string
          code_challenge: string
          redirect_uri: string
          user_id?: string | null
          created_at?: string
          expires_at: string
        }
        Update: {
          id?: string
          state?: string
          code_verifier?: string
          code_challenge?: string
          redirect_uri?: string
          user_id?: string | null
          created_at?: string
          expires_at?: string
        }
      }
    }
  }
}
