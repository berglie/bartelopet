-- ============================================================================
-- Migration: Fix participants_safe View for Public Access
-- Date: 2026-01-23
-- Description:
--   Remove legacy participants_public view and ensure participants_safe
--   uses SECURITY DEFINER to bypass RLS policies. The view contains no
--   sensitive data (no email, phone, address, user_id) so it's safe for
--   public access.
-- ============================================================================

-- ============================================================================
-- STEP 1: Remove legacy participants_public view
-- ============================================================================
DROP VIEW IF EXISTS participants_public CASCADE;

-- ============================================================================
-- STEP 2: Recreate participants_safe with SECURITY DEFINER
-- ============================================================================

-- Drop the view and any dependencies
DROP VIEW IF EXISTS participants_safe CASCADE;

-- Create view WITHOUT security_invoker option
-- By default, views use SECURITY DEFINER (run as owner, not caller)
CREATE VIEW participants_safe AS
SELECT
  id,
  full_name,
  bib_number,
  has_completed,
  event_year,
  created_at,
  updated_at
FROM participants;

-- Set owner to postgres to ensure superuser permissions
ALTER VIEW participants_safe OWNER TO postgres;

-- Grant SELECT to all roles
GRANT SELECT ON participants_safe TO anon;
GRANT SELECT ON participants_safe TO authenticated;

-- Ensure schema access
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Add documentation
COMMENT ON VIEW participants_safe IS
  'Public-safe view of participants without PII. Uses SECURITY DEFINER (owned by postgres) to bypass RLS. Safe for public access.';

-- ============================================================================
-- STEP 3: Verify and diagnose
-- ============================================================================

-- Test the view
DO $$
DECLARE
  total_count INTEGER;
  year_2025_count INTEGER;
BEGIN
  -- Count all participants
  SELECT COUNT(*) INTO total_count FROM participants_safe;
  RAISE NOTICE 'Total participants in view: %', total_count;

  -- Count 2025 participants specifically
  SELECT COUNT(*) INTO year_2025_count FROM participants_safe WHERE event_year = 2025;
  RAISE NOTICE 'Participants for year 2025: %', year_2025_count;

  IF total_count = 0 THEN
    RAISE WARNING 'No participants found in view - check underlying table';
  END IF;
END $$;
