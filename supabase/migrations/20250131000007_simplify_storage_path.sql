-- Migration: Simplify photo storage path structure
-- Description: Changes storage path from multi/year/participant/completion/photo
--              to multi/year/participant/photo (since only 1 completion per user)
-- Created: 2025-01-31

-- ============================================================================
-- Update storage policies to match new path structure
-- ============================================================================

-- Drop old policies
DROP POLICY IF EXISTS "Users can upload to their multi-image folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own multi-images" ON storage.objects;

-- Create new upload policy for simplified path: multi/year/participant_id/photo.jpg
-- Path array: [0]=multi, [1]=year, [2]=participant_id, [3]=filename
CREATE POLICY "Users can upload to their multi-image folder"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'completion-photos'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = 'multi'
    AND (storage.foldername(name))[2] = (
      SELECT id::text FROM participants WHERE user_id = auth.uid()
    )
  );

-- Create new delete policy for simplified path
CREATE POLICY "Users can delete their own multi-images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'completion-photos'
    AND (storage.foldername(name))[1] = 'multi'
    AND (storage.foldername(name))[2] = (
      SELECT id::text FROM participants WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Storage policies updated for simplified path: multi/year/participant_id/photo.jpg';
  RAISE NOTICE 'Old path (multi/year/participant_id/completion_id/photo.jpg) will no longer work for new uploads';
END;
$$;
