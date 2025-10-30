/**
 * Shared Infrastructure Module
 *
 * This module exports all cross-cutting concerns and shared utilities
 * that are used across multiple feature slices.
 */

// Database & Authentication
export * from './lib/supabase'

// UI Components
export * from './components/ui'

// Utilities
export * from './lib/utils'

// Constants
export * from './lib/constants'

// Validations (shared schemas)
export * from './lib/validations'

// Types (shared types)
export * from './types'