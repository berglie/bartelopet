-- ============================================================================
-- Migration: Remove Legacy participants_public View
-- Date: 2025-01-23
-- Description:
--   Remove the legacy participants_public view as it's no longer used.
--   All application code uses participants_safe instead, which includes
--   the updated_at column and is the preferred view.
--
--   The participants_public view was kept for backwards compatibility,
--   but since no code in the application uses it, it's safe to remove.
-- ============================================================================

-- Drop the legacy view
DROP VIEW IF EXISTS public.participants_public CASCADE;

-- Note: The participants_safe view remains and is the preferred view for
-- public queries. It exposes the same fields plus updated_at:
-- - id
-- - full_name
-- - bib_number
-- - has_completed
-- - event_year
-- - created_at
-- - updated_at (additional field not in participants_public)
