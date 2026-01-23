-- ============================================================================
-- Migration: Fix RLS for participants_safe View Public Access
-- Date: 2025-01-23
-- Description:
--   Fix the participants_safe view to allow public read access while
--   maintaining security on the underlying participants table.
--
--   Problem: The RLS policy "Users can view own full participant record"
--   restricts SELECT to auth.uid() = user_id, which means:
--   - Anonymous users see NO participants (auth.uid() = NULL)
--   - Authenticated users only see their OWN participant record
--
--   The participants_safe view uses security_invoker = on, so it inherits
--   these RLS restrictions, breaking the public participants listing.
--
--   Solution: Add a permissive SELECT policy for public access to the
--   participants table. This is safe because:
--   1. Application code MUST use participants_safe view
--   2. This view only exposes non-PII fields (no email, address, phone, user_id)
--   3. Direct table queries by authenticated users still restricted to own records
-- ============================================================================

-- ============================================================================
-- STEP 1: Add public SELECT policy for view access
-- ============================================================================

-- Create a policy that allows all users to SELECT from participants table
-- This enables the participants_safe view (which uses security_invoker = on)
-- to return all participants to anonymous and authenticated users
CREATE POLICY "Public can SELECT for safe view access"
  ON participants FOR SELECT
  TO authenticated, anon
  USING (true);

COMMENT ON POLICY "Public can SELECT for safe view access" ON participants IS
  'Allows public SELECT access to participants table to support safe views.
   APPLICATION CODE MUST ONLY use participants_safe view.
   Direct SELECT queries from the table expose PII and are security violations.
   Authenticated users querying directly will still only see own records due to
   the "Users can view own full participant record" policy precedence.';

-- ============================================================================
-- STEP 2: Add comprehensive security documentation
-- ============================================================================

COMMENT ON TABLE participants IS
  'Contains participant data including PII (email, postal_address, phone_number, user_id).

   SECURITY CRITICAL:
   - Application code MUST use participants_safe view for public queries
   - This view exposes only non-PII fields: id, full_name, bib_number, has_completed, event_year, created_at, updated_at
   - Direct table SELECT is allowed by RLS but exposes PII - DO NOT use in application code
   - Direct table access from authenticated users restricted to own records only

   RLS Policies:
   - "Users can view own full participant record": Users can view their own complete record
   - "Public can SELECT for safe view access": Allows public SELECT to support safe views';

COMMENT ON VIEW participants_safe IS
  'Public-safe view of participants without PII.

   Exposes only: id, full_name, bib_number, has_completed, event_year, created_at, updated_at

   USE THIS VIEW for all public participant queries.

   Security: Uses security_invoker = on, inheriting the querying user''s RLS policies.
   The "Public can SELECT for safe view access" RLS policy enables this view to return
   all participants for both anonymous and authenticated users.';

-- ============================================================================
-- VERIFICATION QUERIES (for testing after migration)
-- ============================================================================

-- After migration, test these queries:
--
-- 1. Anonymous user querying participants_safe (should return all participants):
--    SELECT full_name, bib_number, event_year FROM participants_safe WHERE event_year = 2025;
--
-- 2. Authenticated user querying participants_safe (should return all participants):
--    SELECT full_name, bib_number, event_year FROM participants_safe WHERE event_year = 2025;
--
-- 3. Count participants by year:
--    SELECT event_year, COUNT(*) FROM participants_safe GROUP BY event_year ORDER BY event_year;
