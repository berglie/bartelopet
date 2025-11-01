-- Migration: Recreate essential triggers for photos table
-- Description: Recreates triggers that were lost when completion_images was renamed to photos
-- These triggers handle critical functionality like preventing last image deletion,
-- syncing starred images, and validating data consistency

-- ============================================================================
-- STEP 1: Recreate function to sync starred image URL with completions table
-- ============================================================================

CREATE OR REPLACE FUNCTION sync_starred_image_url()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_starred = true THEN
    -- Update the completion's photo_url to match the starred image
    UPDATE completions
    SET photo_url = NEW.image_url
    WHERE id = NEW.completion_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION sync_starred_image_url IS 'Automatically updates completions.photo_url to match the starred image URL';

-- ============================================================================
-- STEP 2: Recreate trigger for syncing starred images
-- ============================================================================

DROP TRIGGER IF EXISTS sync_starred_image_trigger ON photos;

CREATE TRIGGER sync_starred_image_trigger
  AFTER INSERT OR UPDATE OF is_starred, image_url ON photos
  FOR EACH ROW
  WHEN (NEW.is_starred = true)
  EXECUTE FUNCTION sync_starred_image_url();

-- ============================================================================
-- STEP 3: Recreate function to prevent deletion of last image
-- ============================================================================

CREATE OR REPLACE FUNCTION prevent_last_image_deletion()
RETURNS TRIGGER AS $$
DECLARE
  image_count INTEGER;
BEGIN
  -- Count remaining images for this completion
  SELECT COUNT(*) INTO image_count
  FROM photos
  WHERE completion_id = OLD.completion_id;

  -- If this is the last image, prevent deletion
  IF image_count = 1 THEN
    RAISE EXCEPTION 'Cannot delete the last image. A completion must have at least one image.';
  END IF;

  -- If deleting a starred image, automatically star the next image
  IF OLD.is_starred = true THEN
    UPDATE photos
    SET is_starred = true
    WHERE id = (
      SELECT id
      FROM photos
      WHERE completion_id = OLD.completion_id
        AND id != OLD.id
      ORDER BY display_order
      LIMIT 1
    );
  END IF;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION prevent_last_image_deletion IS 'Prevents deletion of the last image and auto-stars the next image if deleting starred';

-- ============================================================================
-- STEP 4: Recreate trigger for preventing last image deletion
-- ============================================================================

DROP TRIGGER IF EXISTS prevent_last_image_deletion_trigger ON photos;

CREATE TRIGGER prevent_last_image_deletion_trigger
  BEFORE DELETE ON photos
  FOR EACH ROW
  EXECUTE FUNCTION prevent_last_image_deletion();

-- ============================================================================
-- STEP 5: Recreate function to validate year consistency
-- ============================================================================

CREATE OR REPLACE FUNCTION validate_image_year_consistency()
RETURNS TRIGGER AS $$
DECLARE
  completion_year INTEGER;
  completion_participant_id UUID;
BEGIN
  -- Get completion's year and participant_id
  SELECT event_year, participant_id INTO completion_year, completion_participant_id
  FROM completions
  WHERE id = NEW.completion_id;

  -- Ensure image year matches completion year
  IF NEW.event_year != completion_year THEN
    RAISE EXCEPTION 'Image event_year (%) must match completion event_year (%)',
      NEW.event_year, completion_year;
  END IF;

  -- Ensure participant_id matches
  IF NEW.participant_id != completion_participant_id THEN
    RAISE EXCEPTION 'Image participant_id must match completion participant_id';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION validate_image_year_consistency IS 'Ensures image metadata matches parent completion';

-- ============================================================================
-- STEP 6: Recreate trigger for validating year consistency
-- ============================================================================

DROP TRIGGER IF EXISTS validate_image_year_trigger ON photos;

CREATE TRIGGER validate_image_year_trigger
  BEFORE INSERT OR UPDATE ON photos
  FOR EACH ROW
  EXECUTE FUNCTION validate_image_year_consistency();

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Verify triggers are working
DO $$
DECLARE
  trigger_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO trigger_count
  FROM pg_trigger
  WHERE tgrelid = 'photos'::regclass
  AND tgname IN (
    'sync_starred_image_trigger',
    'prevent_last_image_deletion_trigger',
    'validate_image_year_trigger'
  );

  IF trigger_count != 3 THEN
    RAISE WARNING 'Expected 3 triggers on photos table, but found %', trigger_count;
  ELSE
    RAISE NOTICE 'Successfully created % triggers on photos table', trigger_count;
  END IF;
END;
$$;