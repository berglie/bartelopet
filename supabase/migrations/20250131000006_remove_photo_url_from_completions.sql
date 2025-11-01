-- Migration: Remove photo_url column from completions table
-- Description: Removes the deprecated photo_url column and updates triggers
--              All photos are now stored exclusively in the photos table
-- Created: 2025-01-31

-- ============================================================================
-- STEP 1: Drop triggers that reference photo_url
-- ============================================================================

DROP TRIGGER IF EXISTS sync_starred_image_trigger ON photos;

-- ============================================================================
-- STEP 2: Update sync function to NOT update photo_url
-- ============================================================================

CREATE OR REPLACE FUNCTION sync_starred_image_url()
RETURNS TRIGGER AS $$
BEGIN
  -- This function is kept for future use but no longer updates photo_url
  -- since that column has been removed from completions table
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION sync_starred_image_url IS 'Legacy function - kept for compatibility but no longer syncs photo_url';

-- ============================================================================
-- STEP 3: Drop dependent views
-- ============================================================================

DROP VIEW IF EXISTS current_year_completions CASCADE;
DROP VIEW IF EXISTS completions_with_counts CASCADE;

-- ============================================================================
-- STEP 4: Remove photo_url column from completions table
-- ============================================================================

ALTER TABLE completions
DROP COLUMN IF EXISTS photo_url;

-- ============================================================================
-- STEP 5: Recreate completions_with_counts view WITHOUT photo_url
-- ============================================================================

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
-- STEP 6: Recreate current_year_completions view
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
-- STEP 7: Verify all completions have at least one photo in photos table
-- ============================================================================

DO $$
DECLARE
  completions_without_photos INTEGER;
BEGIN
  SELECT COUNT(*) INTO completions_without_photos
  FROM completions c
  LEFT JOIN photos p ON c.id = p.completion_id
  WHERE p.id IS NULL;

  IF completions_without_photos > 0 THEN
    RAISE WARNING 'Found % completions without photos in photos table', completions_without_photos;
  ELSE
    RAISE NOTICE 'All completions have at least one photo in photos table';
  END IF;
END;
$$;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Summary
DO $$
BEGIN
  RAISE NOTICE 'Migration complete: photo_url column removed from completions table';
  RAISE NOTICE 'All photos are now stored exclusively in the photos table';
  RAISE NOTICE 'Use photos.image_url with is_starred=true to get the primary image';
END;
$$;
