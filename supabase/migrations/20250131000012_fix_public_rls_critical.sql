-- ============================================================================
-- CRITICAL SECURITY FIX: Prevent Direct PII Access via RLS
-- Date: 2025-11-09
-- Severity: CRITICAL
--
-- Issue: RLS policy "Public can view participants" allows SELECT on ALL columns
--        including email, postal_address, and phone_number. Users can bypass
--        application code and query PII directly via Supabase client.
--
-- Fix: Create secure view with only safe columns, restrict direct table access
-- ============================================================================

-- ============================================================================
-- STEP 1: Create secure view with only public-safe columns
-- ============================================================================

-- Drop the view if it exists (idempotent)
DROP VIEW IF EXISTS participants_safe CASCADE;

-- Create view with only non-PII columns
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

COMMENT ON VIEW participants_safe IS 'Public-safe view of participants without PII. Use this for all public-facing queries instead of the participants table directly.';

-- Grant access to the view for both authenticated and anonymous users
GRANT SELECT ON participants_safe TO authenticated;
GRANT SELECT ON participants_safe TO anon;

-- ============================================================================
-- STEP 2: Restrict direct access to participants table
-- ============================================================================

-- Drop the overly permissive public SELECT policy
DROP POLICY IF EXISTS "Public can view participants" ON participants;

-- Create restricted policy: users can only view their OWN full record
CREATE POLICY "Users can view own full participant record"
  ON participants FOR SELECT
  USING (auth.uid() = user_id);

-- Add policy allowing service role to read everything (for admin operations)
-- Service role policies are checked first and bypass other policies
-- Note: This only affects service_role key, not anon key

-- ============================================================================
-- STEP 3: Update participants_public view to use the same safe columns
-- ============================================================================

-- The participants_public view was created in migration 20250131000009
-- Update it to ensure consistency
DROP VIEW IF EXISTS participants_public CASCADE;

CREATE VIEW participants_public AS
SELECT
  id,
  full_name,
  bib_number,
  has_completed,
  event_year,
  created_at
FROM participants;

COMMENT ON VIEW participants_public IS 'Legacy view name for backwards compatibility. Use participants_safe instead.';

GRANT SELECT ON participants_public TO authenticated;
GRANT SELECT ON participants_public TO anon;

-- ============================================================================
-- STEP 4: Add security comments to the main table
-- ============================================================================

-- Document that direct table access is restricted
COMMENT ON TABLE participants IS 'Contains PII. Direct SELECT access restricted to own records only. Use participants_safe or participants_public views for public queries.';

-- Add column-level comments (these we CAN add since we own the table)
COMMENT ON COLUMN participants.email IS 'PII - Not accessible via public queries. Users can only see their own.';
COMMENT ON COLUMN participants.postal_address IS 'PII - Not accessible via public queries. Users can only see their own.';
COMMENT ON COLUMN participants.phone_number IS 'PII - Not accessible via public queries. Users can only see their own.';
COMMENT ON COLUMN participants.user_id IS 'Internal - Not accessible via public queries. Users can only see their own.';

-- ============================================================================
-- VERIFICATION QUERIES (for testing after migration)
-- ============================================================================

-- These queries should be tested after migration:
--
-- 1. Test public access to safe view (should work):
--    SELECT * FROM participants_safe;
--
-- 2. Test public access to main table (should return empty or error):
--    SELECT email, postal_address FROM participants;
--
-- 3. Test authenticated user accessing own record (should work):
--    SELECT * FROM participants WHERE user_id = auth.uid();
--
-- 4. Test authenticated user accessing others' records (should fail):
--    SELECT * FROM participants WHERE user_id != auth.uid();
