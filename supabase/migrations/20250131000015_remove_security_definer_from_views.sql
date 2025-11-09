-- ============================================================================
-- Migration: Remove SECURITY DEFINER from Views
-- Date: 2025-01-31
-- Description: Explicitly recreate views to ensure they run with SECURITY INVOKER
--              (querying user's permissions) rather than SECURITY DEFINER
--              (view creator's permissions). This fixes the security linter warnings.
-- ============================================================================

-- ============================================================================
-- STEP 1: Recreate participants_safe view with explicit security context
-- ============================================================================

DROP VIEW IF EXISTS participants_safe CASCADE;

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

-- Set security_invoker to ensure view uses querying user's permissions
ALTER VIEW participants_safe SET (security_invoker = true);

COMMENT ON VIEW participants_safe IS 'Public-safe view of participants without PII. Use this for all public-facing queries instead of the participants table directly.';

GRANT SELECT ON participants_safe TO authenticated;
GRANT SELECT ON participants_safe TO anon;

-- ============================================================================
-- STEP 2: Recreate completions_with_counts view with explicit security context
-- ============================================================================

DROP VIEW IF EXISTS completions_with_counts CASCADE;

CREATE VIEW completions_with_counts AS
SELECT
  c.*,
  COALESCE(comment_counts.count, 0)::INTEGER as comment_count,
  COALESCE(image_counts.count, 0)::INTEGER as image_count,
  COALESCE(vote_counts.count, 0)::INTEGER as vote_count
FROM completions c
LEFT JOIN (
  SELECT completion_id, COUNT(*)::INTEGER as count
  FROM photo_comments
  GROUP BY completion_id
) comment_counts ON c.id = comment_counts.completion_id
LEFT JOIN (
  SELECT completion_id, COUNT(*)::INTEGER as count
  FROM photos
  GROUP BY completion_id
) image_counts ON c.id = image_counts.completion_id
LEFT JOIN (
  SELECT v.completion_id, COUNT(*)::INTEGER as count
  FROM photo_votes v
  INNER JOIN completions c2 ON v.completion_id = c2.id AND v.event_year = c2.event_year
  GROUP BY v.completion_id
) vote_counts ON c.id = vote_counts.completion_id;

-- Set security_invoker to ensure view uses querying user's permissions
ALTER VIEW completions_with_counts SET (security_invoker = true);

COMMENT ON VIEW completions_with_counts IS 'Completions with dynamically calculated comment_count, image_count, and vote_count';

GRANT SELECT ON completions_with_counts TO authenticated;
GRANT SELECT ON completions_with_counts TO anon;

-- ============================================================================
-- STEP 3: Recreate current_year_completions view with explicit security context
-- ============================================================================

DROP VIEW IF EXISTS current_year_completions CASCADE;

CREATE VIEW current_year_completions AS
SELECT c.*, p.full_name, p.bib_number
FROM completions_with_counts c
JOIN participants p ON c.participant_id = p.id AND c.event_year = p.event_year
WHERE c.event_year = get_current_event_year();

-- Set security_invoker to ensure view uses querying user's permissions
ALTER VIEW current_year_completions SET (security_invoker = true);

COMMENT ON VIEW current_year_completions IS 'All completions for the current event year with dynamic counts (PII removed)';

GRANT SELECT ON current_year_completions TO authenticated;
GRANT SELECT ON current_year_completions TO anon;

-- ============================================================================
-- STEP 4: Recreate participants_public view with explicit security context
-- ============================================================================

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

-- Set security_invoker to ensure view uses querying user's permissions
ALTER VIEW participants_public SET (security_invoker = true);

COMMENT ON VIEW participants_public IS 'Legacy view name for backwards compatibility. Use participants_safe instead.';

GRANT SELECT ON participants_public TO authenticated;
GRANT SELECT ON participants_public TO anon;

-- ============================================================================
-- STEP 5: Recreate current_year_participants view with explicit security context
-- ============================================================================

DROP VIEW IF EXISTS current_year_participants CASCADE;

CREATE VIEW current_year_participants AS
SELECT 
  id,
  user_id,
  email,
  full_name,
  postal_address,
  phone_number,
  bib_number,
  has_completed,
  auth_provider,
  event_year,
  created_at,
  updated_at
FROM participants
WHERE event_year = get_current_event_year();

-- Set security_invoker to ensure view uses querying user's permissions
ALTER VIEW current_year_participants SET (security_invoker = true);

COMMENT ON VIEW current_year_participants IS 'All participants for the current event year';

GRANT SELECT ON current_year_participants TO authenticated;
GRANT SELECT ON current_year_participants TO anon;

