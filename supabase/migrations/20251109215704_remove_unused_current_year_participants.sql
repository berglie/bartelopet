-- ============================================================================
-- Migration: Remove Unused current_year_participants View
-- Date: 2025-11-09
-- Description: Drop the current_year_participants view as it's not used in
--              the application code. All participant queries go directly to
--              the participants table with event_year filtering.
--
--              Analysis showed:
--              - Zero application code references
--              - Only auto-generated TypeScript type metadata
--              - Application uses: supabase.from('participants').eq('event_year', year)
--              - Alternative: Use participants_safe view for public queries
--
--              Security note: This view currently exposes PII (email,
--              postal_address, phone_number, user_id) to authenticated and
--              anonymous users. Removing it improves security posture.
-- ============================================================================

-- Drop the unused view
DROP VIEW IF EXISTS current_year_participants CASCADE;

-- No replacement needed - application code already queries participants table directly
-- For public-safe queries across all years, use: participants_safe view
