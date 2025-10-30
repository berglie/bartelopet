/**
 * Error sanitization utility to prevent information disclosure
 * Always log detailed errors server-side but return generic messages to clients
 */

interface ErrorLogContext {
  location: string
  userId?: string
  additionalContext?: Record<string, unknown>
}

/**
 * Sanitize error messages for client responses
 * Logs detailed error server-side, returns generic message to client
 */
export function sanitizeError(
  error: unknown,
  context: ErrorLogContext
): string {
  // Log detailed error server-side
  const timestamp = new Date().toISOString()
  const errorMessage = error instanceof Error ? error.message : String(error)
  const errorStack = error instanceof Error ? error.stack : undefined

  console.error('[Security Error]', {
    timestamp,
    location: context.location,
    userId: context.userId,
    message: errorMessage,
    stack: errorStack,
    ...context.additionalContext,
  })

  // Return generic message to client
  return 'En feil oppstod. Prøv igjen senere.'
}

/**
 * Sanitize Supabase errors
 * Supabase errors can leak database schema information
 */
export function sanitizeSupabaseError(
  error: unknown,
  context: ErrorLogContext
): string {
  if (error && typeof error === 'object' && 'message' in error) {
    const message = String(error.message)

    // Log full error server-side
    console.error('[Supabase Error]', {
      timestamp: new Date().toISOString(),
      location: context.location,
      userId: context.userId,
      error: error,
      ...context.additionalContext,
    })

    // Map common Supabase errors to user-friendly messages
    if (message.includes('duplicate key')) {
      return 'Dette elementet eksisterer allerede.'
    }
    if (message.includes('foreign key')) {
      return 'Kan ikke utføre operasjonen på grunn av relaterte data.'
    }
    if (message.includes('not found')) {
      return 'Finner ikke det du leter etter.'
    }
    if (message.includes('permission denied') || message.includes('unauthorized')) {
      return 'Du har ikke tilgang til denne ressursen.'
    }
    if (message.includes('invalid') || message.includes('validation')) {
      return 'Ugyldig data. Vennligst sjekk at alt er riktig.'
    }
  }

  // Default generic error
  return sanitizeError(error, context)
}

/**
 * Sanitize OAuth errors
 * OAuth errors can leak provider configuration details
 */
export function sanitizeOAuthError(
  error: unknown,
  provider: string,
  context: ErrorLogContext
): string {
  // Log detailed OAuth error
  console.error('[OAuth Error]', {
    timestamp: new Date().toISOString(),
    provider,
    location: context.location,
    userId: context.userId,
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    ...context.additionalContext,
  })

  // Return user-friendly message without leaking OAuth internals
  return `Innlogging med ${provider} feilet. Prøv igjen senere.`
}

/**
 * Sanitize validation errors
 * Safe to show validation errors as they're expected user input issues
 */
export function formatValidationError(message: string): string {
  // Validation errors are safe to show to users
  return message
}

/**
 * Check if error is safe to display to user
 * Returns true if error message doesn't leak sensitive information
 */
export function isSafeError(error: unknown): boolean {
  if (!(error instanceof Error)) return false

  const safeErrorPatterns = [
    /^[A-Za-zæøåÆØÅ\s]{1,100}$/,  // Norwegian text without technical details
    /^Validation error:/,
    /^Invalid input:/,
  ]

  return safeErrorPatterns.some(pattern => pattern.test(error.message))
}
