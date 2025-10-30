// Photo comment types
export interface PhotoComment {
  id: string;
  created_at: string;
  updated_at: string;
  completion_id: string;
  participant_id: string;
  comment_text: string;
  event_year: number; // Event year this comment belongs to
}

export interface PhotoCommentCreate {
  completion_id: string;
  participant_id: string;
  comment_text: string;
  event_year?: number; // Optional, defaults to current event year
}

export interface PhotoCommentUpdate {
  comment_text: string;
}
