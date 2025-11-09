-- ============================================================================
-- Migration: Prevent Self-Voting at Database Level
-- Date: 2025-11-09
-- Description:
--   Add RLS policy to prevent participants from voting for their own
--   completions. This enforces the business rule at the database level
--   rather than relying only on application logic.
-- ============================================================================

-- Add database-level constraint to prevent self-voting
CREATE POLICY "Participants cannot vote for themselves"
  ON photo_votes FOR INSERT
  WITH CHECK (
    NOT EXISTS (
      SELECT 1 FROM completions
      WHERE completions.id = photo_votes.completion_id
      AND completions.participant_id = photo_votes.voter_id
    )
  );

COMMENT ON POLICY "Participants cannot vote for themselves" ON photo_votes
  IS 'Prevents participants from voting for their own completions at the database level';
