/**
 * Shared validation schemas
 * Base validation schemas that might be extended by features
 */

// These are truly shared schemas that multiple features use
// Feature-specific schemas should be in their respective feature modules

import { z } from 'zod'

// Email validation used across auth, registration, etc.
export const emailSchema = z.string().email('Ugyldig e-postadresse')

// Year validation used across multiple features
export const yearSchema = z.number().min(2025).max(2100)

// Common date validation
export const dateSchema = z.string().datetime()

// File validation schema (for uploads)
export const fileSchema = z.object({
  name: z.string(),
  size: z.number(),
  type: z.string(),
})

// Base user schema (minimal, extended by features)
export const baseUserSchema = z.object({
  id: z.string().uuid(),
  email: emailSchema,
  created_at: dateSchema,
})