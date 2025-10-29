-- Migration: Update RLS policies to support year-based access control
-- Description: This migration updates all RLS policies to be year-aware,
--              ensuring proper data isolation between event years and
--              implementing November-only edit restrictions.

-- ===========================================================================
-- STEP 1: Drop existing RLS policies
-- ===========================================================================

-- Drop participants policies
DROP POLICY IF EXISTS "Public can view participants" ON participants;
DROP POLICY IF EXISTS "Anyone can register (insert)" ON participants;
DROP POLICY IF EXISTS "Users can update own participant record" ON participants;

-- Drop completions policies
DROP POLICY IF EXISTS "Public can view completions" ON completions;
DROP POLICY IF EXISTS "Participants can insert their own completions" ON completions;
DROP POLICY IF EXISTS "Participants can update their own completions" ON completions;
DROP POLICY IF EXISTS "Participants can delete their own completions" ON completions;

-- Drop votes policies
DROP POLICY IF EXISTS "Public can view votes" ON votes;
DROP POLICY IF EXISTS "Participants can insert votes" ON votes;
DROP POLICY IF EXISTS "Participants can delete their own votes" ON votes;

-- Drop photo_comments policies
DROP POLICY IF EXISTS "Public can view photo comments" ON photo_comments;
DROP POLICY IF EXISTS "Participants can insert their own comments" ON photo_comments;
DROP POLICY IF EXISTS "Participants can update their own comments" ON photo_comments;
DROP POLICY IF EXISTS "Participants can delete their own comments" ON photo_comments;

-- ===========================================================================
-- STEP 2: Create year-aware RLS policies for participants
-- ===========================================================================

-- Public read access to all years
CREATE POLICY "Public can view all participants (all years)"
  ON participants FOR SELECT
  USING (true);

COMMENT ON POLICY "Public can view all participants (all years)" ON participants
  IS 'Allow public read access to participant data from all event years';

-- Registration is allowed for current year only
CREATE POLICY "Anyone can register for current event year"
  ON participants FOR INSERT
  WITH CHECK (
    event_year = get_current_event_year()
  );

COMMENT ON POLICY "Anyone can register for current event year" ON participants
  IS 'Allow registration only for the current event year (based on date)';

-- Updates allowed only during November for current year
CREATE POLICY "Users can update own participant record in November only"
  ON participants FOR UPDATE
  USING (
    auth.uid() = user_id
    AND event_year = get_current_event_year()
    AND is_november_edit_window()
  )
  WITH CHECK (
    auth.uid() = user_id
    AND event_year = get_current_event_year()
    AND is_november_edit_window()
  );

COMMENT ON POLICY "Users can update own participant record in November only" ON participants
  IS 'Allow participants to update their own record only in November of the current event year';

-- ===========================================================================
-- STEP 3: Create year-aware RLS policies for completions
-- ===========================================================================

-- Public read access to all years
CREATE POLICY "Public can view all completions (all years)"
  ON completions FOR SELECT
  USING (true);

COMMENT ON POLICY "Public can view all completions (all years)" ON completions
  IS 'Allow public read access to completion data from all event years';

-- Insert completions only for current year
CREATE POLICY "Participants can insert completions for current year"
  ON completions FOR INSERT
  WITH CHECK (
    event_year = get_current_event_year()
    AND EXISTS (
      SELECT 1 FROM participants
      WHERE id = participant_id
      AND event_year = completions.event_year
      AND user_id = auth.uid()
    )
  );

COMMENT ON POLICY "Participants can insert completions for current year" ON completions
  IS 'Allow participants to submit completions only for the current event year';

-- Update completions only in November for current year
CREATE POLICY "Participants can update own completions in November only"
  ON completions FOR UPDATE
  USING (
    event_year = get_current_event_year()
    AND is_november_edit_window()
    AND EXISTS (
      SELECT 1 FROM participants
      WHERE id = participant_id
      AND event_year = completions.event_year
      AND user_id = auth.uid()
    )
  )
  WITH CHECK (
    event_year = get_current_event_year()
    AND is_november_edit_window()
    AND EXISTS (
      SELECT 1 FROM participants
      WHERE id = participant_id
      AND event_year = completions.event_year
      AND user_id = auth.uid()
    )
  );

COMMENT ON POLICY "Participants can update own completions in November only" ON completions
  IS 'Allow participants to update their completions only in November of the current event year';

-- Delete completions only in November for current year
CREATE POLICY "Participants can delete own completions in November only"
  ON completions FOR DELETE
  USING (
    event_year = get_current_event_year()
    AND is_november_edit_window()
    AND EXISTS (
      SELECT 1 FROM participants
      WHERE id = participant_id
      AND event_year = completions.event_year
      AND user_id = auth.uid()
    )
  );

COMMENT ON POLICY "Participants can delete own completions in November only" ON completions
  IS 'Allow participants to delete their completions only in November of the current event year';

-- ===========================================================================
-- STEP 4: Create year-aware RLS policies for votes
-- ===========================================================================

-- Public read access to all years
CREATE POLICY "Public can view all votes (all years)"
  ON votes FOR SELECT
  USING (true);

COMMENT ON POLICY "Public can view all votes (all years)" ON votes
  IS 'Allow public read access to vote data from all event years';

-- Insert votes only for current year
CREATE POLICY "Participants can vote in current year only"
  ON votes FOR INSERT
  WITH CHECK (
    event_year = get_current_event_year()
    AND EXISTS (
      SELECT 1 FROM participants
      WHERE id = voter_id
      AND event_year = votes.event_year
      AND user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM completions
      WHERE id = completion_id
      AND event_year = votes.event_year
    )
  );

COMMENT ON POLICY "Participants can vote in current year only" ON votes
  IS 'Allow participants to vote only in the current event year for completions from that year';

-- Delete votes only in current year
CREATE POLICY "Participants can remove own votes in current year"
  ON votes FOR DELETE
  USING (
    event_year = get_current_event_year()
    AND EXISTS (
      SELECT 1 FROM participants
      WHERE id = voter_id
      AND event_year = votes.event_year
      AND user_id = auth.uid()
    )
  );

COMMENT ON POLICY "Participants can remove own votes in current year" ON votes
  IS 'Allow participants to remove their votes only for the current event year';

-- ===========================================================================
-- STEP 5: Create year-aware RLS policies for photo_comments
-- ===========================================================================

-- Public read access to all years
CREATE POLICY "Public can view all photo comments (all years)"
  ON photo_comments FOR SELECT
  USING (true);

COMMENT ON POLICY "Public can view all photo comments (all years)" ON photo_comments
  IS 'Allow public read access to comment data from all event years';

-- Insert comments for current year only
CREATE POLICY "Participants can comment in current year only"
  ON photo_comments FOR INSERT
  WITH CHECK (
    event_year = get_current_event_year()
    AND EXISTS (
      SELECT 1 FROM participants
      WHERE id = participant_id
      AND event_year = photo_comments.event_year
      AND user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM completions
      WHERE id = completion_id
      AND event_year = photo_comments.event_year
    )
  );

COMMENT ON POLICY "Participants can comment in current year only" ON photo_comments
  IS 'Allow participants to comment only on completions from the current event year';

-- Update comments only in November for current year
CREATE POLICY "Participants can update own comments in November only"
  ON photo_comments FOR UPDATE
  USING (
    event_year = get_current_event_year()
    AND is_november_edit_window()
    AND EXISTS (
      SELECT 1 FROM participants
      WHERE id = participant_id
      AND event_year = photo_comments.event_year
      AND user_id = auth.uid()
    )
  )
  WITH CHECK (
    event_year = get_current_event_year()
    AND is_november_edit_window()
    AND EXISTS (
      SELECT 1 FROM participants
      WHERE id = participant_id
      AND event_year = photo_comments.event_year
      AND user_id = auth.uid()
    )
  );

COMMENT ON POLICY "Participants can update own comments in November only" ON photo_comments
  IS 'Allow participants to update their comments only in November of the current event year';

-- Delete comments only in November for current year
CREATE POLICY "Participants can delete own comments in November only"
  ON photo_comments FOR DELETE
  USING (
    event_year = get_current_event_year()
    AND is_november_edit_window()
    AND EXISTS (
      SELECT 1 FROM participants
      WHERE id = participant_id
      AND event_year = photo_comments.event_year
      AND user_id = auth.uid()
    )
  );

COMMENT ON POLICY "Participants can delete own comments in November only" ON photo_comments
  IS 'Allow participants to delete their comments only in November of the current event year';

-- ===========================================================================
-- STEP 6: Create admin override policies (optional - for future use)
-- ===========================================================================

-- Note: These policies would require a custom role or claim in JWT
-- Commenting out for now, but keeping for reference

-- CREATE POLICY "Admins can update any participant record"
--   ON participants FOR UPDATE
--   USING (
--     auth.jwt() ->> 'role' = 'admin'
--   );

-- CREATE POLICY "Admins can update any completion"
--   ON completions FOR UPDATE
--   USING (
--     auth.jwt() ->> 'role' = 'admin'
--   );

-- CREATE POLICY "Admins can delete any completion"
--   ON completions FOR DELETE
--   USING (
--     auth.jwt() ->> 'role' = 'admin'
--   );
