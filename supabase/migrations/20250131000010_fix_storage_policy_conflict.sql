-- ============================================================================
-- Migration: Fix Storage Policy Conflict
-- Date: 2025-11-09
-- Description:
--   Remove overly permissive storage policy that allows any authenticated
--   user to upload anywhere in the completion-photos bucket. Keep only
--   the specific folder-based policies from the multi-image migration.
-- ============================================================================

-- Drop the overly permissive policy that allows any authenticated user
-- to upload anywhere in the completion-photos bucket
DROP POLICY IF EXISTS "Authenticated users can upload completion photos" ON storage.objects;

-- Note: The correct, more restrictive policies already exist from migration
-- 20250131000009_multi_image_support.sql:
-- - "Users can upload to their multi-image folder" (INSERT)
-- - "Users can update their own multi-images" (UPDATE)
-- - "Users can delete their own multi-images" (DELETE)
-- - "Anyone can view completion photos" (SELECT)
--
-- These policies enforce folder-based access control where users can only
-- upload to their own participant folders: multi/{year}/{participant_id}/
