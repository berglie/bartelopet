-- Enable RLS on all tables
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- Participants policies
CREATE POLICY "Public can view participants"
  ON participants FOR SELECT
  USING (true);

CREATE POLICY "Anyone can register (insert)"
  ON participants FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update own participant record"
  ON participants FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Completions policies
CREATE POLICY "Public can view completions"
  ON completions FOR SELECT
  USING (true);

CREATE POLICY "Participants can insert their own completions"
  ON completions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM participants
      WHERE id = participant_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Participants can update their own completions"
  ON completions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM participants
      WHERE id = participant_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Participants can delete their own completions"
  ON completions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM participants
      WHERE id = participant_id
      AND user_id = auth.uid()
    )
  );

-- Votes policies
CREATE POLICY "Public can view votes"
  ON votes FOR SELECT
  USING (true);

CREATE POLICY "Participants can insert votes"
  ON votes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM participants
      WHERE id = voter_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Participants can delete their own votes"
  ON votes FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM participants
      WHERE id = voter_id
      AND user_id = auth.uid()
    )
  );
