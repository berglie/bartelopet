-- ============================================================================
-- Migration: Fix SECURITY DEFINER Views
-- Date: 2025-12-10
-- Description: Recreate participant views with security_invoker = on
--              to ensure they use the querying user's permissions rather than
--              the view creator's permissions.
--
--              This addresses Supabase Advisor warnings:
--              - "View public.participants_public is defined with the SECURITY DEFINER property"
--              - "View public.participants_safe is defined with the SECURITY DEFINER property"
--
--              The fix uses CREATE VIEW ... WITH (security_invoker = on) which is
--              the recommended approach for PostgreSQL 15+ and Supabase.
-- ============================================================================

-- ============================================================================
-- STEP 1: Fix participants_safe view
-- ============================================================================

DROP VIEW IF EXISTS public.participants_safe CASCADE;

CREATE VIEW public.participants_safe
WITH (security_invoker = on)
AS
SELECT
  id,
  full_name,
  bib_number,
  has_completed,
  event_year,
  created_at,
  updated_at
FROM public.participants;

COMMENT ON VIEW public.participants_safe IS 'Public-safe view of participants without PII. Uses SECURITY INVOKER to enforce RLS of querying user.';

GRANT SELECT ON public.participants_safe TO authenticated;
GRANT SELECT ON public.participants_safe TO anon;

-- ============================================================================
-- STEP 2: Fix participants_public view
-- ============================================================================

DROP VIEW IF EXISTS public.participants_public CASCADE;

CREATE VIEW public.participants_public
WITH (security_invoker = on)
AS
SELECT
  id,
  full_name,
  bib_number,
  has_completed,
  event_year,
  created_at
FROM public.participants;

COMMENT ON VIEW public.participants_public IS 'Legacy view name for backwards compatibility. Use participants_safe instead. Uses SECURITY INVOKER to enforce RLS of querying user.';

GRANT SELECT ON public.participants_public TO authenticated;
GRANT SELECT ON public.participants_public TO anon;
