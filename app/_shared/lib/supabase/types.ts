export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '13.0.5';
  };
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      completions: {
        Row: {
          comment: string | null;
          completed_date: string;
          created_at: string;
          duration_text: string | null;
          event_year: number;
          id: string;
          participant_id: string;
          updated_at: string;
        };
        Insert: {
          comment?: string | null;
          completed_date: string;
          created_at?: string;
          duration_text?: string | null;
          event_year?: number;
          id?: string;
          participant_id: string;
          updated_at?: string;
        };
        Update: {
          comment?: string | null;
          completed_date?: string;
          created_at?: string;
          duration_text?: string | null;
          event_year?: number;
          id?: string;
          participant_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'completions_participant_id_fkey';
            columns: ['participant_id'];
            isOneToOne: false;
            referencedRelation: 'participants';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'completions_participant_id_fkey';
            columns: ['participant_id'];
            isOneToOne: false;
            referencedRelation: 'participants_safe';
            referencedColumns: ['id'];
          },
        ];
      };
      distance_categories: {
        Row: {
          color: string;
          display_order: number;
          event_year: number;
          label: string;
          maximum_km: number | null;
          minimum_km: number;
          slug: string;
        };
        Insert: {
          color: string;
          display_order: number;
          event_year: number;
          label: string;
          maximum_km?: number | null;
          minimum_km: number;
          slug: string;
        };
        Update: {
          color?: string;
          display_order?: number;
          event_year?: number;
          label?: string;
          maximum_km?: number | null;
          minimum_km?: number;
          slug?: string;
        };
        Relationships: [];
      };
      draw_results: {
        Row: {
          annulled_at: string | null;
          annulled_by: string | null;
          candidate_count: number;
          declined: boolean;
          drawn_at: string;
          drawn_by: string;
          event_year: number;
          id: string;
          participant_id: string;
          prize_id: string;
          published_at: string | null;
          winning_run_id: string;
        };
        Insert: {
          annulled_at?: string | null;
          annulled_by?: string | null;
          candidate_count: number;
          declined?: boolean;
          drawn_at?: string;
          drawn_by: string;
          event_year: number;
          id?: string;
          participant_id: string;
          prize_id: string;
          published_at?: string | null;
          winning_run_id: string;
        };
        Update: {
          annulled_at?: string | null;
          annulled_by?: string | null;
          candidate_count?: number;
          declined?: boolean;
          drawn_at?: string;
          drawn_by?: string;
          event_year?: number;
          id?: string;
          participant_id?: string;
          prize_id?: string;
          published_at?: string | null;
          winning_run_id?: string;
        };
        Relationships: [];
      };
      event_editions: {
        Row: {
          created_at: string;
          donation_rate_nok: number;
          donation_url: string | null;
          event_year: number;
          registration_open: boolean;
          submissions_end: string;
          submissions_open: boolean;
          submissions_start: string;
          updated_at: string;
          winners_published: boolean;
        };
        Insert: {
          created_at?: string;
          donation_rate_nok: number;
          donation_url?: string | null;
          event_year: number;
          registration_open?: boolean;
          submissions_end: string;
          submissions_open?: boolean;
          submissions_start: string;
          updated_at?: string;
          winners_published?: boolean;
        };
        Update: {
          created_at?: string;
          donation_rate_nok?: number;
          donation_url?: string | null;
          event_year?: number;
          registration_open?: boolean;
          submissions_end?: string;
          submissions_open?: boolean;
          submissions_start?: string;
          updated_at?: string;
          winners_published?: boolean;
        };
        Relationships: [];
      };
      participant_distance_interests: {
        Row: {
          category_slug: string;
          created_at: string;
          event_year: number;
          participant_id: string;
        };
        Insert: {
          category_slug: string;
          created_at?: string;
          event_year: number;
          participant_id: string;
        };
        Update: {
          category_slug?: string;
          created_at?: string;
          event_year?: number;
          participant_id?: string;
        };
        Relationships: [];
      };
      participants: {
        Row: {
          auth_provider: string;
          bib_number: number;
          created_at: string;
          email: string;
          event_year: number;
          full_name: string;
          has_completed: boolean;
          id: string;
          phone_number: string | null;
          postal_address: string;
          updated_at: string;
          user_id: string | null;
        };
        Insert: {
          auth_provider?: string;
          bib_number: number;
          created_at?: string;
          email: string;
          event_year?: number;
          full_name: string;
          has_completed?: boolean;
          id?: string;
          phone_number?: string | null;
          postal_address: string;
          updated_at?: string;
          user_id?: string | null;
        };
        Update: {
          auth_provider?: string;
          bib_number?: number;
          created_at?: string;
          email?: string;
          event_year?: number;
          full_name?: string;
          has_completed?: boolean;
          id?: string;
          phone_number?: string | null;
          postal_address?: string;
          updated_at?: string;
          user_id?: string | null;
        };
        Relationships: [];
      };
      race_prizes: {
        Row: {
          category_slug: string;
          created_at: string;
          distance_km: number;
          donor_name: string | null;
          event_year: number;
          id: string;
          notes: string | null;
          race_date: string | null;
          race_name: string;
          status: string;
          updated_at: string;
          website_url: string | null;
        };
        Insert: {
          category_slug: string;
          created_at?: string;
          distance_km: number;
          donor_name?: string | null;
          event_year: number;
          id?: string;
          notes?: string | null;
          race_date?: string | null;
          race_name: string;
          status?: string;
          updated_at?: string;
          website_url?: string | null;
        };
        Update: {
          category_slug?: string;
          created_at?: string;
          distance_km?: number;
          donor_name?: string | null;
          event_year?: number;
          id?: string;
          notes?: string | null;
          race_date?: string | null;
          race_name?: string;
          status?: string;
          updated_at?: string;
          website_url?: string | null;
        };
        Relationships: [];
      };
      runs: {
        Row: {
          comment: string | null;
          created_at: string;
          distance_km: number;
          donation_amount_nok: number;
          donation_confirmed_at: string | null;
          duration_text: string | null;
          event_year: number;
          evidence_url: string | null;
          id: string;
          participant_id: string;
          run_date: string;
          title: string | null;
          updated_at: string;
        };
        Insert: {
          comment?: string | null;
          created_at?: string;
          distance_km: number;
          donation_amount_nok: number;
          donation_confirmed_at?: string | null;
          duration_text?: string | null;
          event_year: number;
          evidence_url?: string | null;
          id?: string;
          participant_id: string;
          run_date: string;
          title?: string | null;
          updated_at?: string;
        };
        Update: {
          comment?: string | null;
          created_at?: string;
          distance_km?: number;
          donation_amount_nok?: number;
          donation_confirmed_at?: string | null;
          duration_text?: string | null;
          event_year?: number;
          evidence_url?: string | null;
          id?: string;
          participant_id?: string;
          run_date?: string;
          title?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      photo_comments: {
        Row: {
          comment_text: string;
          completion_id: string;
          created_at: string;
          event_year: number;
          id: string;
          participant_id: string;
          updated_at: string;
        };
        Insert: {
          comment_text: string;
          completion_id: string;
          created_at?: string;
          event_year?: number;
          id?: string;
          participant_id: string;
          updated_at?: string;
        };
        Update: {
          comment_text?: string;
          completion_id?: string;
          created_at?: string;
          event_year?: number;
          id?: string;
          participant_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'photo_comments_completion_id_fkey';
            columns: ['completion_id'];
            isOneToOne: false;
            referencedRelation: 'completions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'photo_comments_completion_id_fkey';
            columns: ['completion_id'];
            isOneToOne: false;
            referencedRelation: 'completions_with_counts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'photo_comments_completion_id_fkey';
            columns: ['completion_id'];
            isOneToOne: false;
            referencedRelation: 'current_year_completions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'photo_comments_participant_id_fkey';
            columns: ['participant_id'];
            isOneToOne: false;
            referencedRelation: 'participants';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'photo_comments_participant_id_fkey';
            columns: ['participant_id'];
            isOneToOne: false;
            referencedRelation: 'participants_safe';
            referencedColumns: ['id'];
          },
        ];
      };
      photo_votes: {
        Row: {
          completion_id: string;
          created_at: string;
          event_year: number;
          id: string;
          voter_id: string;
        };
        Insert: {
          completion_id: string;
          created_at?: string;
          event_year?: number;
          id?: string;
          voter_id: string;
        };
        Update: {
          completion_id?: string;
          created_at?: string;
          event_year?: number;
          id?: string;
          voter_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'votes_completion_id_fkey';
            columns: ['completion_id'];
            isOneToOne: false;
            referencedRelation: 'completions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'votes_completion_id_fkey';
            columns: ['completion_id'];
            isOneToOne: false;
            referencedRelation: 'completions_with_counts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'votes_completion_id_fkey';
            columns: ['completion_id'];
            isOneToOne: false;
            referencedRelation: 'current_year_completions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'votes_voter_id_fkey';
            columns: ['voter_id'];
            isOneToOne: false;
            referencedRelation: 'participants';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'votes_voter_id_fkey';
            columns: ['voter_id'];
            isOneToOne: false;
            referencedRelation: 'participants_safe';
            referencedColumns: ['id'];
          },
        ];
      };
      photos: {
        Row: {
          caption: string | null;
          completion_id: string;
          display_order: number;
          event_year: number;
          id: string;
          image_url: string;
          is_starred: boolean;
          participant_id: string;
          uploaded_at: string;
        };
        Insert: {
          caption?: string | null;
          completion_id: string;
          display_order?: number;
          event_year: number;
          id?: string;
          image_url: string;
          is_starred?: boolean;
          participant_id: string;
          uploaded_at?: string;
        };
        Update: {
          caption?: string | null;
          completion_id?: string;
          display_order?: number;
          event_year?: number;
          id?: string;
          image_url?: string;
          is_starred?: boolean;
          participant_id?: string;
          uploaded_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'completion_images_completion_id_fkey';
            columns: ['completion_id'];
            isOneToOne: false;
            referencedRelation: 'completions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'completion_images_completion_id_fkey';
            columns: ['completion_id'];
            isOneToOne: false;
            referencedRelation: 'completions_with_counts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'completion_images_completion_id_fkey';
            columns: ['completion_id'];
            isOneToOne: false;
            referencedRelation: 'current_year_completions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'completion_images_participant_id_fkey';
            columns: ['participant_id'];
            isOneToOne: false;
            referencedRelation: 'participants';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'completion_images_participant_id_fkey';
            columns: ['participant_id'];
            isOneToOne: false;
            referencedRelation: 'participants_safe';
            referencedColumns: ['id'];
          },
        ];
      };
      settings: {
        Row: {
          current_event_year: number;
          id: number;
          submission_window_open: boolean;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          current_event_year?: number;
          id?: number;
          submission_window_open?: boolean;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          current_event_year?: number;
          id?: number;
          submission_window_open?: boolean;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      eligible_entries: {
        Row: {
          category_slug: string | null;
          event_year: number | null;
          participant_id: string | null;
          run_id: string | null;
          tickets: number | null;
        };
        Relationships: [];
      };
      participant_ticket_totals: {
        Row: {
          category_slug: string | null;
          event_year: number | null;
          participant_id: string | null;
          tickets: number | null;
        };
        Relationships: [];
      };
      category_ticket_totals: {
        Row: {
          category_slug: string | null;
          event_year: number | null;
          tickets: number | null;
        };
        Relationships: [];
      };
      runs_public: {
        Row: {
          bib_number: number | null;
          comment: string | null;
          created_at: string | null;
          distance_km: number | null;
          donation_amount_nok: number | null;
          duration_text: string | null;
          event_year: number | null;
          evidence_url: string | null;
          full_name: string | null;
          id: string | null;
          interest_categories: string[] | null;
          participant_id: string | null;
          run_date: string | null;
          title: string | null;
        };
        Relationships: [];
      };
      completions_with_counts: {
        Row: {
          comment: string | null;
          comment_count: number | null;
          completed_date: string | null;
          created_at: string | null;
          duration_text: string | null;
          event_year: number | null;
          id: string | null;
          image_count: number | null;
          participant_id: string | null;
          updated_at: string | null;
          vote_count: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'completions_participant_id_fkey';
            columns: ['participant_id'];
            isOneToOne: false;
            referencedRelation: 'participants';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'completions_participant_id_fkey';
            columns: ['participant_id'];
            isOneToOne: false;
            referencedRelation: 'participants_safe';
            referencedColumns: ['id'];
          },
        ];
      };
      current_year_completions: {
        Row: {
          bib_number: number | null;
          comment: string | null;
          comment_count: number | null;
          completed_date: string | null;
          created_at: string | null;
          duration_text: string | null;
          event_year: number | null;
          full_name: string | null;
          id: string | null;
          image_count: number | null;
          participant_id: string | null;
          updated_at: string | null;
          vote_count: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'completions_participant_id_fkey';
            columns: ['participant_id'];
            isOneToOne: false;
            referencedRelation: 'participants';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'completions_participant_id_fkey';
            columns: ['participant_id'];
            isOneToOne: false;
            referencedRelation: 'participants_safe';
            referencedColumns: ['id'];
          },
        ];
      };
      participants_safe: {
        Row: {
          bib_number: number | null;
          created_at: string | null;
          event_year: number | null;
          full_name: string | null;
          has_completed: boolean | null;
          id: string | null;
          updated_at: string | null;
        };
        Insert: {
          bib_number?: number | null;
          created_at?: string | null;
          event_year?: number | null;
          full_name?: string | null;
          has_completed?: boolean | null;
          id?: string | null;
          updated_at?: string | null;
        };
        Update: {
          bib_number?: number | null;
          created_at?: string | null;
          event_year?: number | null;
          full_name?: string | null;
          has_completed?: boolean | null;
          id?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      annul_draw: {
        Args: { p_result_id: string; p_declined: boolean };
        Returns: Database['public']['Tables']['draw_results']['Row'];
      };
      close_submission_window: { Args: never; Returns: undefined };
      draw_race_prize: {
        Args: { p_prize_id: string };
        Returns: Database['public']['Tables']['draw_results']['Row'];
      };
      get_current_event_year: { Args: never; Returns: number };
      get_participant_history: {
        Args: { p_user_id: string };
        Returns: {
          bib_number: number;
          completion_date: string;
          email: string;
          event_year: number;
          full_name: string;
          has_completed: boolean;
          participant_id: string;
          registration_date: string;
          vote_count: number;
        }[];
      };
      is_november_edit_window: { Args: never; Returns: boolean };
      is_event_admin: { Args: never; Returns: boolean };
      is_submission_window_open: { Args: never; Returns: boolean };
      is_year_editable: { Args: { year_to_check: number }; Returns: boolean };
      open_submission_window: { Args: never; Returns: undefined };
      set_current_event_year: { Args: { new_year: number }; Returns: undefined };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const;
