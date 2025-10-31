-- Migration: Sync vote counts with actual votes
-- Description: Recalculates vote_count for all completions based on actual votes
-- This fixes any discrepancies where vote_count doesn't match the actual number of votes

-- First, ensure all votes have event_year set (in case of old data)
-- Set event_year on votes to match their completion's event_year
UPDATE votes v
SET event_year = (
  SELECT c.event_year 
  FROM completions c 
  WHERE c.id = v.completion_id
  LIMIT 1
)
WHERE v.event_year IS NULL OR v.event_year = 0;

-- Ensure all completions have event_year set (should already have default, but just in case)
UPDATE completions c
SET event_year = COALESCE(
  (SELECT p.event_year FROM participants p WHERE p.id = c.participant_id LIMIT 1),
  2025
)
WHERE c.event_year IS NULL OR c.event_year = 0;

-- Recalculate vote counts for all completions
UPDATE completions c
SET vote_count = COALESCE(
  (SELECT COUNT(*)::INTEGER
   FROM votes v 
   WHERE v.completion_id = c.id 
     AND v.event_year = c.event_year
  ), 
  0
);

-- Ensure the trigger exists and is using the correct function
-- Drop and recreate to ensure it uses the updated year-aware function
DROP TRIGGER IF EXISTS update_vote_counts_trigger ON votes;

CREATE TRIGGER update_vote_counts_trigger
  AFTER INSERT OR DELETE ON votes
  FOR EACH ROW
  EXECUTE FUNCTION update_vote_counts();

COMMENT ON TRIGGER update_vote_counts_trigger ON votes IS 'Updates vote_count when votes are inserted or deleted, matching both completion_id and event_year';

-- Verify: Show completions where vote_count doesn't match actual votes
-- Uncomment to check for discrepancies:
-- SELECT 
--   c.id,
--   c.vote_count as stored_count,
--   (SELECT COUNT(*) FROM votes v WHERE v.completion_id = c.id AND v.event_year = c.event_year) as actual_count,
--   c.event_year
-- FROM completions c
-- WHERE c.vote_count != (SELECT COUNT(*) FROM votes v WHERE v.completion_id = c.id AND v.event_year = c.event_year);

COMMENT ON FUNCTION update_vote_counts() IS 'Updates vote_count when votes are inserted or deleted, matching both completion_id and event_year';

