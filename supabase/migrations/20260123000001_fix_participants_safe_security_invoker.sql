-- ============================================================================
-- Migration: Fix participants_safe View Security Invoker Setting
-- Date: 2026-01-23
-- Description:
--   Explicitly set security_invoker = off on participants_safe view to ensure
--   it uses SECURITY DEFINER mode and bypasses RLS policies on the participants
--   table. This allows all users (anon and authenticated) to see all
--   participants without exposing sensitive PII.
-- ============================================================================

-- ============================================================================
-- STEP 1: Recreate participants_safe with explicit security_invoker = off
-- ============================================================================

-- Drop the existing view
DROP VIEW IF EXISTS participants_safe CASCADE;

-- Create view with explicit SECURITY DEFINER (security_invoker = off)
CREATE VIEW participants_safe
WITH (security_invoker = off)
AS
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
  'Public-safe view of participants without PII. Uses SECURITY DEFINER (security_invoker = off, owned by postgres) to bypass RLS. Safe for public access.';

-- ============================================================================
-- STEP 2: Verify the security_invoker setting
-- ============================================================================

-- Query to verify security_invoker setting
DO $$
DECLARE
  invoker_setting TEXT;
  total_count INTEGER;
BEGIN
  -- Check security_invoker setting
  SELECT
    COALESCE(
      (SELECT option_value
       FROM pg_catalog.pg_options_to_table(c.reloptions)
       WHERE option_name = 'security_invoker'),
      'off'  -- default value
    )
  INTO invoker_setting
  FROM pg_catalog.pg_class c
  JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
  WHERE c.relname = 'participants_safe'
    AND n.nspname = 'public';

  RAISE NOTICE 'participants_safe security_invoker setting: %', invoker_setting;

  -- Verify view returns data
  SELECT COUNT(*) INTO total_count FROM participants_safe;
  RAISE NOTICE 'Total participants in view: %', total_count;

  IF invoker_setting != 'off' THEN
    RAISE WARNING 'security_invoker is not off! View may inherit RLS policies.';
  END IF;

  IF total_count = 0 THEN
    RAISE WARNING 'No participants found in view - check underlying table or RLS policies';
  END IF;
END $$;