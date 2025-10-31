-- Migration: Update RLS policies for renamed tables
-- Description: Updates RLS policies to use photo_votes instead of votes

-- ============================================================================
-- STEP 1: Drop old policies on photo_votes table (they may have old names)
-- ============================================================================

-- Drop any existing policies with old names
DROP POLICY IF EXISTS "Public can view all votes (all years)" ON photo_votes;
DROP POLICY IF EXISTS "Public can view all photo votes (all years)" ON photo_votes;
DROP POLICY IF EXISTS "Participants can vote in current year only" ON photo_votes;
DROP POLICY IF EXISTS "Participants can remove own votes in current year" ON photo_votes;

-- ============================================================================
-- STEP 2: Create RLS policies for photo_votes table
-- ============================================================================

-- Enable RLS on photo_votes if not already enabled
ALTER TABLE photo_votes ENABLE ROW LEVEL SECURITY;

-- Public read access to all years
CREATE POLICY "Public can view all photo votes (all years)"
  ON photo_votes FOR SELECT
  USING (true);

COMMENT ON POLICY "Public can view all photo votes (all years)" ON photo_votes
  IS 'Allow public read access to vote data from all event years';

-- Insert votes only for current year
CREATE POLICY "Participants can vote in current year only"
  ON photo_votes FOR INSERT
  WITH CHECK (
    event_year = get_current_event_year()
    AND EXISTS (
      SELECT 1 FROM participants
      WHERE id = voter_id
      AND event_year = photo_votes.event_year
      AND user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM completions
      WHERE id = completion_id
      AND event_year = photo_votes.event_year
    )
  );

COMMENT ON POLICY "Participants can vote in current year only" ON photo_votes
  IS 'Allow participants to vote only in the current event year for completions from that year';

-- Delete votes only in current year
CREATE POLICY "Participants can remove own votes in current year"
  ON photo_votes FOR DELETE
  USING (
    event_year = get_current_event_year()
    AND EXISTS (
      SELECT 1 FROM participants
      WHERE id = voter_id
      AND event_year = photo_votes.event_year
      AND user_id = auth.uid()
    )
  );

COMMENT ON POLICY "Participants can remove own votes in current year" ON photo_votes
  IS 'Allow participants to remove their votes only for the current event year';

