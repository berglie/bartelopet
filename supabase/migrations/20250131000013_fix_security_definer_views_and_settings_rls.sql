-- ============================================================================
-- Migration: Fix Security Definer Views and Enable RLS on Settings
-- Date: 2025-01-31
-- Description:
--   1. Recreate views without SECURITY DEFINER property
--   2. Enable RLS on settings table
-- ============================================================================

-- ============================================================================
-- STEP 1: Recreate participants_safe view without SECURITY DEFINER
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

COMMENT ON VIEW participants_safe IS 'Public-safe view of participants without PII. Use this for all public-facing queries instead of the participants table directly.';

GRANT SELECT ON participants_safe TO authenticated;
GRANT SELECT ON participants_safe TO anon;

-- ============================================================================
-- STEP 2: Recreate completions_with_counts view without SECURITY DEFINER
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

COMMENT ON VIEW completions_with_counts IS 'Completions with dynamically calculated comment_count, image_count, and vote_count';

GRANT SELECT ON completions_with_counts TO authenticated;
GRANT SELECT ON completions_with_counts TO anon;

-- ============================================================================
-- STEP 3: Recreate current_year_completions view without SECURITY DEFINER
-- ============================================================================

DROP VIEW IF EXISTS current_year_completions CASCADE;

CREATE VIEW current_year_completions AS
SELECT c.*, p.full_name, p.bib_number
FROM completions_with_counts c
JOIN participants p ON c.participant_id = p.id AND c.event_year = p.event_year
WHERE c.event_year = get_current_event_year();

COMMENT ON VIEW current_year_completions IS 'All completions for the current event year with dynamic counts (PII removed)';

GRANT SELECT ON current_year_completions TO authenticated;
GRANT SELECT ON current_year_completions TO anon;

-- ============================================================================
-- STEP 4: Recreate participants_public view without SECURITY DEFINER
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

COMMENT ON VIEW participants_public IS 'Legacy view name for backwards compatibility. Use participants_safe instead.';

GRANT SELECT ON participants_public TO authenticated;
GRANT SELECT ON participants_public TO anon;

-- ============================================================================
-- STEP 5: Recreate current_year_participants view without SECURITY DEFINER
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

COMMENT ON VIEW current_year_participants IS 'All participants for the current event year';

GRANT SELECT ON current_year_participants TO authenticated;
GRANT SELECT ON current_year_participants TO anon;

-- ============================================================================
-- STEP 6: Enable RLS on settings table
-- ============================================================================

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 7: Create RLS policies for settings table
-- ============================================================================

-- Policy: Everyone (authenticated and anonymous) can read settings
-- Settings are public information needed by the application
CREATE POLICY "Settings are publicly readable"
  ON settings FOR SELECT
  TO authenticated, anon
  USING (true);

-- Policy: Prevent direct table updates - use admin functions instead
-- The admin functions (open_submission_window, close_submission_window, set_current_event_year)
-- are the intended way to update settings. These functions need SECURITY DEFINER to work with RLS.
-- 
-- Note: We're not creating an UPDATE policy here, which means direct table updates are blocked.
-- Admin functions will be updated to use SECURITY DEFINER so they can bypass RLS when needed.

COMMENT ON POLICY "Settings are publicly readable" ON settings IS 'Allows public read access to settings (needed for feature toggles). Updates should use admin functions, not direct table updates.';

-- ============================================================================
-- STEP 8: Update admin functions to use SECURITY DEFINER
-- ============================================================================
-- These functions need SECURITY DEFINER to update settings when RLS is enabled.
-- This is acceptable for admin functions (the linter warning is for views, not functions).

CREATE OR REPLACE FUNCTION open_submission_window()
RETURNS void AS $$
BEGIN
  UPDATE settings
  SET submission_window_open = true,
      updated_at = NOW(),
      updated_by = current_user
  WHERE id = 1;

  RAISE NOTICE 'Submission window opened';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION close_submission_window()
RETURNS void AS $$
BEGIN
  UPDATE settings
  SET submission_window_open = false,
      updated_at = NOW(),
      updated_by = current_user
  WHERE id = 1;

  RAISE NOTICE 'Submission window closed';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION set_current_event_year(new_year INTEGER)
RETURNS void AS $$
BEGIN
  IF new_year < 2025 OR new_year > 2100 THEN
    RAISE EXCEPTION 'Event year must be between 2025 and 2100, got %', new_year;
  END IF;

  UPDATE settings
  SET current_event_year = new_year,
      updated_at = NOW(),
      updated_by = current_user
  WHERE id = 1;

  RAISE NOTICE 'Current event year set to %', new_year;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

