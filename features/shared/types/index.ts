/**
 * Shared type definitions
 * Types that are used across multiple features
 */

// API response types
export interface ApiResponse<T = any> {
  data?: T
  error?: string
  message?: string
}

// Common error type
export interface AppError {
  message: string
  code?: string
  details?: any
}

// Pagination types
export interface PaginationParams {
  page?: number
  limit?: number
  sort?: string
  order?: 'asc' | 'desc'
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// Base entity type (most entities have these fields)
export interface BaseEntity {
  id: string
  created_at: string
  updated_at?: string
}

// User context type (minimal, for auth context)
export interface UserContext {
  id: string
  email: string
  isAuthenticated: boolean
}

// Event year type (used across features)
export interface EventYear {
  year: number
  isActive: boolean
  isCurrent: boolean
}