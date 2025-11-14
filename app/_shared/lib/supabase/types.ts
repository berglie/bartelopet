export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
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
            referencedRelation: 'participants_public';
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
            referencedRelation: 'participants_public';
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
            referencedRelation: 'participants_public';
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
            referencedRelation: 'participants_public';
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
            referencedRelation: 'participants_public';
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
            referencedRelation: 'participants_public';
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
      participants_public: {
        Row: {
          bib_number: number | null;
          created_at: string | null;
          event_year: number | null;
          full_name: string | null;
          has_completed: boolean | null;
          id: string | null;
        };
        Insert: {
          bib_number?: number | null;
          created_at?: string | null;
          event_year?: number | null;
          full_name?: string | null;
          has_completed?: boolean | null;
          id?: string | null;
        };
        Update: {
          bib_number?: number | null;
          created_at?: string | null;
          event_year?: number | null;
          full_name?: string | null;
          has_completed?: boolean | null;
          id?: string | null;
        };
        Relationships: [];
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
      close_submission_window: { Args: never; Returns: undefined };
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
