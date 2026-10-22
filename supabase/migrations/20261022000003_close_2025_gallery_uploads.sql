-- The 2025 photo gallery is closed for uploads.
-- New entries, comments and votes for 2025 were already closed: their policies require the
-- current event year (2026). Photos had no such rule, so 2025 participants could still add
-- photos to the photos table and the completion-photos bucket through the API.
-- Editing captions, reordering and deleting own photos still work, and delete_my_account()
-- removes everything as before.

REVOKE INSERT ON public.photos FROM anon, authenticated;
DROP POLICY IF EXISTS "Participants can insert their own photos" ON public.photos;

-- Restrictive, so it also covers any upload policy added by hand in the dashboard.
-- Other buckets (run-evidence) are not affected.
DROP POLICY IF EXISTS "Users can upload to their multi-image folder" ON storage.objects;
CREATE POLICY "No uploads to the closed 2025 gallery" ON storage.objects
  AS RESTRICTIVE FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id <> 'completion-photos');
CREATE POLICY "No file replacements in the closed 2025 gallery" ON storage.objects
  AS RESTRICTIVE FOR UPDATE TO anon, authenticated
  USING (bucket_id <> 'completion-photos')
  WITH CHECK (bucket_id <> 'completion-photos');
