-- ============================================================================
-- Migration: Fix PII Exposure in Views and Create Public Participant View
-- Date: 2025-11-09
-- Description:
--   1. Remove email from current_year_completions view
--   2. Create participants_public view with only non-sensitive fields
--   3. Update RLS policy to be more explicit about what can be queried
-- ============================================================================

-- ============================================================================
-- STEP 1: Fix current_year_completions view - Remove email exposure
-- ============================================================================

-- Drop the existing view first (can't remove columns with CREATE OR REPLACE)
DROP VIEW IF EXISTS current_year_completions;

-- Recreate without email field
CREATE VIEW current_year_completions AS
SELECT c.*, p.full_name, p.bib_number
FROM completions_with_counts c
JOIN participants p ON c.participant_id = p.id AND c.event_year = p.event_year
WHERE c.event_year = get_current_event_year();

COMMENT ON VIEW current_year_completions IS 'All completions for the current event year with dynamic counts (PII removed)';

GRANT SELECT ON current_year_completions TO authenticated;
GRANT SELECT ON current_year_completions TO anon;

-- ============================================================================
-- STEP 2: Create public-safe participant view (no PII)
-- ============================================================================

CREATE OR REPLACE VIEW participants_public AS
SELECT
  id,
  full_name,
  bib_number,
  has_completed,
  event_year,
  created_at
FROM participants;

COMMENT ON VIEW participants_public IS 'Public-safe view of participants without PII (email, postal_address, phone_number, user_id excluded)';

GRANT SELECT ON participants_public TO authenticated;
GRANT SELECT ON participants_public TO anon;

-- ============================================================================
-- STEP 3: Add security comment to participants table
-- ============================================================================

COMMENT ON TABLE participants IS 'Participant records with PII. Use participants_public view for public-facing queries. Direct queries should only select necessary fields.';
COMMENT ON COLUMN participants.email IS 'PII - Do not expose in public APIs';
COMMENT ON COLUMN participants.postal_address IS 'PII - Do not expose in public APIs';
COMMENT ON COLUMN participants.phone_number IS 'PII - Do not expose in public APIs';
COMMENT ON COLUMN participants.user_id IS 'Sensitive - Links to auth system, do not expose';

-- ============================================================================
-- Note: RLS Policy
-- ============================================================================
-- The existing RLS policy "Public can view participants" allows SELECT on all
-- columns. While we can't easily restrict this at the RLS level without breaking
-- existing functionality, application code MUST explicitly select only safe
-- fields when querying participants table.
--
-- Best practice: Use participants_public view for public-facing queries, or
-- explicitly select only: id, full_name, bib_number, has_completed, event_year
-- ============================================================================
