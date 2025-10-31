-- Migration: Remove count columns, rename tables, and use views instead
-- Description: 
--   - Renames votes to photo_votes
--   - Renames completion_images to photos
--   - Removes comment_count, image_count, and vote_count from completions table
--   - Creates views that calculate these dynamically from source tables

-- ============================================================================
-- STEP 1: Drop triggers that update count columns
-- ============================================================================

DROP TRIGGER IF EXISTS update_comment_counts_trigger ON photo_comments;
DROP TRIGGER IF EXISTS update_image_count_trigger ON completion_images;
DROP TRIGGER IF EXISTS update_vote_counts_trigger ON votes;

-- Drop the functions (they're no longer needed)
DROP FUNCTION IF EXISTS update_comment_counts();
DROP FUNCTION IF EXISTS update_completion_image_count();
DROP FUNCTION IF EXISTS update_vote_counts();

-- ============================================================================
-- STEP 2: Drop views that depend on count columns
-- ============================================================================

-- Drop views that depend on count columns (we'll recreate them after renaming)
DROP VIEW IF EXISTS current_year_completions CASCADE;

-- ============================================================================
-- STEP 3: Drop indexes on count columns
-- ============================================================================

DROP INDEX IF EXISTS idx_completions_comment_count;
DROP INDEX IF EXISTS idx_completions_image_count;
DROP INDEX IF EXISTS idx_completions_vote_count;

-- ============================================================================
-- STEP 4: Remove count columns from completions table
-- ============================================================================

ALTER TABLE completions
  DROP COLUMN IF EXISTS comment_count,
  DROP COLUMN IF EXISTS image_count,
  DROP COLUMN IF EXISTS vote_count;

-- ============================================================================
-- STEP 5: Rename tables
-- ============================================================================

-- Rename votes to photo_votes
ALTER TABLE IF EXISTS votes RENAME TO photo_votes;

-- Rename completion_images to photos
ALTER TABLE IF EXISTS completion_images RENAME TO photos;

-- Rename indexes to match new table names
ALTER INDEX IF EXISTS idx_votes_voter_id RENAME TO idx_photo_votes_voter_id;
ALTER INDEX IF EXISTS idx_votes_completion_id RENAME TO idx_photo_votes_completion_id;
ALTER INDEX IF EXISTS idx_votes_event_year RENAME TO idx_photo_votes_event_year;
ALTER INDEX IF EXISTS idx_votes_year_voter RENAME TO idx_photo_votes_year_voter;
ALTER INDEX IF EXISTS idx_votes_year_completion RENAME TO idx_photo_votes_year_completion;

ALTER INDEX IF EXISTS idx_completion_images_completion_id RENAME TO idx_photos_completion_id;
ALTER INDEX IF EXISTS idx_completion_images_participant_id RENAME TO idx_photos_participant_id;
ALTER INDEX IF EXISTS idx_completion_images_event_year RENAME TO idx_photos_event_year;
ALTER INDEX IF EXISTS idx_completion_images_display_order RENAME TO idx_photos_display_order;
-- idx_one_starred_per_completion doesn't need renaming, it already has a generic name

-- ============================================================================
-- STEP 6: Create view that includes dynamic counts
-- ============================================================================

-- View for completions with calculated counts
CREATE OR REPLACE VIEW completions_with_counts AS
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

-- Grant permissions
GRANT SELECT ON completions_with_counts TO authenticated;
GRANT SELECT ON completions_with_counts TO anon;

-- ============================================================================
-- STEP 7: Recreate current_year_completions view using completions_with_counts
-- ============================================================================

CREATE OR REPLACE VIEW current_year_completions AS
SELECT c.*, p.full_name, p.email, p.bib_number
FROM completions_with_counts c
JOIN participants p ON c.participant_id = p.id AND c.event_year = p.event_year
WHERE c.event_year = get_current_event_year();

COMMENT ON VIEW current_year_completions IS 'All completions for the current event year with dynamic counts';

GRANT SELECT ON current_year_completions TO authenticated;
GRANT SELECT ON current_year_completions TO anon;

-- ============================================================================
-- STEP 8: Update comments on tables
-- ============================================================================

COMMENT ON TABLE photo_votes IS 'Votes for photos (completions)';
COMMENT ON TABLE photos IS 'Multiple photos/images for each completion';

