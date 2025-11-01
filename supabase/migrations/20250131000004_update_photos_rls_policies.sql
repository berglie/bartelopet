-- Migration: Update RLS policies for photos table (renamed from completion_images)
-- Description: Recreates RLS policies for the photos table after it was renamed from completion_images
-- The previous migration (20250131000002) renamed the table but didn't update RLS policies

-- ============================================================================
-- STEP 1: Drop old policies on photos table (they may have old names)
-- ============================================================================

-- Drop any existing policies (they were created for completion_images)
DROP POLICY IF EXISTS "Public can view completion images" ON photos;
DROP POLICY IF EXISTS "Participants can insert their own images" ON photos;
DROP POLICY IF EXISTS "Participants can update their own images" ON photos;
DROP POLICY IF EXISTS "Participants can delete their own images" ON photos;

-- ============================================================================
-- STEP 2: Create RLS policies for photos table
-- ============================================================================

-- Enable RLS on photos if not already enabled
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Public can view all photos"
  ON photos FOR SELECT
  USING (true);

COMMENT ON POLICY "Public can view all photos" ON photos
  IS 'Allow public read access to all photos from all event years';

-- Insert: Participants can insert their own photos
CREATE POLICY "Participants can insert their own photos"
  ON photos FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM participants
      WHERE id = participant_id
      AND user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM completions
      WHERE id = completion_id
      AND participant_id = photos.participant_id
      AND event_year = photos.event_year
    )
  );

COMMENT ON POLICY "Participants can insert their own photos" ON photos
  IS 'Allow participants to upload photos for their own completions';

-- Update: Participants can update their own photos
CREATE POLICY "Participants can update their own photos"
  ON photos FOR UPDATE
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

COMMENT ON POLICY "Participants can update their own photos" ON photos
  IS 'Allow participants to update their own photos (caption, display_order, is_starred)';

-- Delete: Participants can delete their own photos
CREATE POLICY "Participants can delete their own photos"
  ON photos FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM participants
      WHERE id = participant_id
      AND user_id = auth.uid()
    )
  );

COMMENT ON POLICY "Participants can delete their own photos" ON photos
  IS 'Allow participants to delete their own photos';
