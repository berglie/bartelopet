/**
 * Data sanitization utilities for removing PII from API responses
 *
 * This module provides functions to sanitize data before exposing it
 * through public APIs or client-side code, ensuring that Personally
 * Identifiable Information (PII) is not inadvertently exposed.
 *
 * Security Note: Always use these sanitization functions when returning
 * participant data through API endpoints or server actions to prevent
 * PII exposure (email, postal_address, phone_number, user_id).
 */

import type { Participant, ParticipantPublic } from '@/app/_shared/types/participant'

/**
 * Sanitize a single participant object for public API responses
 * Removes PII fields: email, postal_address, phone_number, user_id
 *
 * @param participant - Full participant object (may contain PII)
 * @returns Public-safe participant object without PII
 *
 * @example
 * const publicParticipant = sanitizeParticipant(fullParticipant)
 * // Returns: { id, full_name, bib_number, has_completed, event_year }
 */
export function sanitizeParticipant(participant: Participant): ParticipantPublic {
  return {
    id: participant.id,
    full_name: participant.full_name,
    bib_number: participant.bib_number,
    has_completed: participant.has_completed,
    event_year: participant.event_year,
  }
}

/**
 * Sanitize an array of participant objects
 *
 * @param participants - Array of full participant objects
 * @returns Array of public-safe participant objects
 *
 * @example
 * const publicParticipants = sanitizeParticipants(allParticipants)
 */
export function sanitizeParticipants(participants: Participant[]): ParticipantPublic[] {
  return participants.map(sanitizeParticipant)
}

/**
 * Type guard to check if an object contains PII fields
 * Useful for development/debugging to ensure data is sanitized
 *
 * @param obj - Object to check
 * @returns true if object contains PII fields
 */
export function containsPII(obj: unknown): boolean {
  if (typeof obj !== 'object' || obj === null) {
    return false
  }

  const piiFields = ['email', 'postal_address', 'phone_number', 'user_id']
  return piiFields.some(field => field in obj)
}
