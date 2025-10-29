-- ============================================================================
-- DROP STORAGE POLICIES
-- Run this in Supabase SQL Editor before reapplying migrations
-- ============================================================================

-- Drop all storage policies for completion-photos bucket (exact names from migration)
DROP POLICY IF EXISTS "Public can view completion photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload completion photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own completion photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own completion photos" ON storage.objects;

-- Drop the bucket itself
DELETE FROM storage.buckets WHERE id = 'completion-photos';

-- Verify cleanup
DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'storage';

  RAISE NOTICE 'Remaining storage policies: %', policy_count;
END $$;
