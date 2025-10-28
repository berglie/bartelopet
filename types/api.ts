import type { ParticipantPublic } from './participant';

// API Response types
export interface ApiResponse<T> {
  data: T | null;
  error: ApiError | null;
  meta?: ApiMeta;
}

export interface ApiError {
  message: string;
  code: string;
  details?: Record<string, unknown>;
}

export interface ApiMeta {
  total?: number;
  page?: number;
  per_page?: number;
  has_more?: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    per_page: number;
    total_pages: number;
  };
}

// Specific API responses
export interface ParticipantStatsResponse {
  total_participants: number;
  total_distance_km: number;
  total_completions: number;
  total_votes: number;
}

export interface LeaderboardResponse {
  by_distance: ParticipantPublic[];
  by_votes: ParticipantPublic[];
  by_completions: ParticipantPublic[];
}
