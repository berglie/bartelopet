-- Create storage bucket for completion photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('completion-photos', 'completion-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Completion photos policies
CREATE POLICY "Public can view completion photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'completion-photos');

CREATE POLICY "Authenticated users can upload completion photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'completion-photos'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Users can update their own completion photos"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'completion-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own completion photos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'completion-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
