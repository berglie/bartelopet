-- Add comment_count column to completions table
ALTER TABLE completions
ADD COLUMN comment_count INTEGER NOT NULL DEFAULT 0;

-- Create photo_comments table
CREATE TABLE photo_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  completion_id UUID REFERENCES completions(id) ON DELETE CASCADE NOT NULL,
  participant_id UUID REFERENCES participants(id) ON DELETE CASCADE NOT NULL,
  comment_text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Ensure comment is not empty and within character limit
  CONSTRAINT comment_text_not_empty CHECK (LENGTH(TRIM(comment_text)) > 0),
  CONSTRAINT comment_text_max_length CHECK (LENGTH(comment_text) <= 500)
);

-- Create indexes for performance optimization
CREATE INDEX idx_photo_comments_completion_id ON photo_comments(completion_id);
CREATE INDEX idx_photo_comments_participant_id ON photo_comments(participant_id);
CREATE INDEX idx_photo_comments_created_at ON photo_comments(created_at DESC);
CREATE INDEX idx_completions_comment_count ON completions(comment_count DESC);

-- Apply updated_at trigger to photo_comments table
CREATE TRIGGER update_photo_comments_updated_at
  BEFORE UPDATE ON photo_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create function to update comment counts on completions
CREATE OR REPLACE FUNCTION update_comment_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE completions
    SET comment_count = comment_count + 1
    WHERE id = NEW.completion_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE completions
    SET comment_count = GREATEST(0, comment_count - 1)
    WHERE id = OLD.completion_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to update comment counts
CREATE TRIGGER update_comment_counts_trigger
  AFTER INSERT OR DELETE ON photo_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_comment_counts();

-- Enable RLS on photo_comments table
ALTER TABLE photo_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for photo_comments

-- Public read access
CREATE POLICY "Public can view photo comments"
  ON photo_comments FOR SELECT
  USING (true);

-- Authenticated insert (only own comments)
CREATE POLICY "Participants can insert their own comments"
  ON photo_comments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM participants
      WHERE id = participant_id
      AND user_id = auth.uid()
    )
  );

-- Update own comments only
CREATE POLICY "Participants can update their own comments"
  ON photo_comments FOR UPDATE
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

-- Delete own comments only
CREATE POLICY "Participants can delete their own comments"
  ON photo_comments FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM participants
      WHERE id = participant_id
      AND user_id = auth.uid()
    )
  );
