-- Migration: Add multi-image support with star selection
-- Created: 2025-10-29
-- Description: Enables completions to have multiple images with one starred as primary

-- ============================================================================
-- 1. CREATE COMPLETION_IMAGES TABLE
-- ============================================================================

CREATE TABLE completion_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  completion_id UUID REFERENCES completions(id) ON DELETE CASCADE NOT NULL,
  participant_id UUID REFERENCES participants(id) ON DELETE CASCADE NOT NULL,
  event_year INTEGER NOT NULL,
  image_url TEXT NOT NULL,
  is_starred BOOLEAN NOT NULL DEFAULT false,
  display_order INTEGER NOT NULL DEFAULT 0,
  caption TEXT,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_event_year_images CHECK (event_year >= 2025 AND event_year <= 2100),
  CONSTRAINT caption_max_length CHECK (LENGTH(caption) <= 200),
  CONSTRAINT display_order_non_negative CHECK (display_order >= 0)
);

-- Indexes for performance
CREATE INDEX idx_completion_images_completion_id ON completion_images(completion_id);
CREATE INDEX idx_completion_images_participant_id ON completion_images(participant_id);
CREATE INDEX idx_completion_images_event_year ON completion_images(event_year);
CREATE INDEX idx_completion_images_display_order ON completion_images(completion_id, display_order);

-- Ensure only ONE starred image per completion (partial unique index)
CREATE UNIQUE INDEX idx_one_starred_per_completion
  ON completion_images(completion_id)
  WHERE is_starred = true;

-- Comments for documentation
COMMENT ON TABLE completion_images IS 'Multiple images for each completion, with one starred as primary';
COMMENT ON COLUMN completion_images.is_starred IS 'Primary image shown in gallery and used for contest';
COMMENT ON COLUMN completion_images.display_order IS 'Order of images in gallery (0-based, starred image typically 0)';
COMMENT ON COLUMN completion_images.caption IS 'Optional caption/description for this specific image';

-- ============================================================================
-- 2. ADD IMAGE_COUNT COLUMN TO COMPLETIONS TABLE
-- ============================================================================

ALTER TABLE completions
ADD COLUMN image_count INTEGER NOT NULL DEFAULT 1;

CREATE INDEX idx_completions_image_count ON completions(image_count);

COMMENT ON COLUMN completions.image_count IS 'Total number of images for this completion';

-- Note: We keep photo_url for backward compatibility and quick access to starred image
-- It will be automatically updated via trigger when starred image changes

-- ============================================================================
-- 3. DATABASE TRIGGERS
-- ============================================================================

-- Trigger 1: Update image_count when images are added/removed
CREATE OR REPLACE FUNCTION update_completion_image_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE completions
    SET image_count = image_count + 1
    WHERE id = NEW.completion_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE completions
    SET image_count = GREATEST(1, image_count - 1)
    WHERE id = OLD.completion_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_image_count_trigger
  AFTER INSERT OR DELETE ON completion_images
  FOR EACH ROW
  EXECUTE FUNCTION update_completion_image_count();

COMMENT ON FUNCTION update_completion_image_count IS 'Automatically updates completions.image_count when images are added or removed';

-- Trigger 2: Sync completions.photo_url with starred image
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

CREATE TRIGGER sync_starred_image_trigger
  AFTER INSERT OR UPDATE OF is_starred, image_url ON completion_images
  FOR EACH ROW
  WHEN (NEW.is_starred = true)
  EXECUTE FUNCTION sync_starred_image_url();

COMMENT ON FUNCTION sync_starred_image_url IS 'Automatically updates completions.photo_url to match the starred image URL';

-- Trigger 3: Prevent deletion of starred image if it's the only image
CREATE OR REPLACE FUNCTION prevent_last_image_deletion()
RETURNS TRIGGER AS $$
DECLARE
  image_count INTEGER;
BEGIN
  -- Count remaining images for this completion
  SELECT COUNT(*) INTO image_count
  FROM completion_images
  WHERE completion_id = OLD.completion_id;

  -- If this is the last image, prevent deletion
  IF image_count = 1 THEN
    RAISE EXCEPTION 'Cannot delete the last image. A completion must have at least one image.';
  END IF;

  -- If deleting a starred image, automatically star the next image
  IF OLD.is_starred = true THEN
    UPDATE completion_images
    SET is_starred = true
    WHERE id = (
      SELECT id
      FROM completion_images
      WHERE completion_id = OLD.completion_id
        AND id != OLD.id
      ORDER BY display_order
      LIMIT 1
    );
  END IF;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_last_image_deletion_trigger
  BEFORE DELETE ON completion_images
  FOR EACH ROW
  EXECUTE FUNCTION prevent_last_image_deletion();

COMMENT ON FUNCTION prevent_last_image_deletion IS 'Prevents deletion of the last image and auto-stars the next image if deleting starred';

-- Trigger 4: Validate year consistency
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

CREATE TRIGGER validate_image_year_trigger
  BEFORE INSERT OR UPDATE ON completion_images
  FOR EACH ROW
  EXECUTE FUNCTION validate_image_year_consistency();

COMMENT ON FUNCTION validate_image_year_consistency IS 'Ensures image metadata matches parent completion';

-- ============================================================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on completion_images
ALTER TABLE completion_images ENABLE ROW LEVEL SECURITY;

-- Public read access (anyone can view images)
CREATE POLICY "Public can view completion images"
  ON completion_images FOR SELECT
  USING (true);

-- Participants can insert their own images
CREATE POLICY "Participants can insert their own images"
  ON completion_images FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM participants
      WHERE id = participant_id
      AND user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM completions
      WHERE id = completion_id
      AND participant_id = completion_images.participant_id
      AND event_year = completion_images.event_year
    )
  );

-- Participants can update their own images (caption, display_order, is_starred)
CREATE POLICY "Participants can update their own images"
  ON completion_images FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM participants
      WHERE id = participant_id
      AND user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM participants
      WHERE id = participant_id
      AND user_id = auth.uid()
    )
  );

-- Participants can delete their own images
CREATE POLICY "Participants can delete their own images"
  ON completion_images FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM participants
      WHERE id = participant_id
      AND user_id = auth.uid()
    )
  );

-- ============================================================================
-- 5. DATA MIGRATION: Convert existing single images to multi-image structure
-- ============================================================================

-- Insert existing single images as starred images in completion_images
INSERT INTO completion_images (
  completion_id,
  participant_id,
  event_year,
  image_url,
  is_starred,
  display_order,
  uploaded_at
)
SELECT
  c.id as completion_id,
  c.participant_id,
  c.event_year,
  c.photo_url as image_url,
  true as is_starred,  -- Existing image becomes the starred image
  0 as display_order,
  c.created_at as uploaded_at
FROM completions c
WHERE c.photo_url IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM completion_images ci
    WHERE ci.completion_id = c.id
  );

-- Note: image_count will be updated to 1 automatically by the trigger

-- ============================================================================
-- 6. STORAGE BUCKET POLICIES (for Supabase Storage)
-- ============================================================================

-- Allow uploads to multi/ directory structure
CREATE POLICY "Users can upload to their multi-image folder"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'completion-photos'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = 'multi'
    AND (storage.foldername(name))[3] = (
      SELECT id::text FROM participants WHERE user_id = auth.uid()
    )
  );

-- Allow deletion from their own folders
CREATE POLICY "Users can delete their own multi-images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'completion-photos'
    AND (storage.foldername(name))[1] = 'multi'
    AND (storage.foldername(name))[3] = (
      SELECT id::text FROM participants WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Verify migration success
DO $$
DECLARE
  total_completions INTEGER;
  total_images INTEGER;
  starred_images INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_completions FROM completions;
  SELECT COUNT(*) INTO total_images FROM completion_images;
  SELECT COUNT(*) INTO starred_images FROM completion_images WHERE is_starred = true;

  RAISE NOTICE 'Migration complete:';
  RAISE NOTICE '  Total completions: %', total_completions;
  RAISE NOTICE '  Total images: %', total_images;
  RAISE NOTICE '  Starred images: %', starred_images;

  IF total_completions != total_images THEN
    RAISE WARNING 'Image count mismatch! Expected % images but found %', total_completions, total_images;
  END IF;

  IF total_completions != starred_images THEN
    RAISE WARNING 'Starred image count mismatch! Expected % starred but found %', total_completions, starred_images;
  END IF;
END;
$$;
