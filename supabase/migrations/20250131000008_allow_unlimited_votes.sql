-- Allow unlimited votes per person
-- This migration removes the constraint that limits users to one vote per year
-- and adds a constraint to prevent duplicate votes on the same completion

-- Remove the one-vote-per-year constraint
ALTER TABLE photo_votes DROP CONSTRAINT IF EXISTS votes_voter_year_unique;

-- Add constraint to prevent duplicate votes on same completion
-- This ensures users can't vote multiple times for the same photo/completion
ALTER TABLE photo_votes
ADD CONSTRAINT photo_votes_voter_completion_unique
UNIQUE(voter_id, completion_id, event_year);

COMMENT ON CONSTRAINT photo_votes_voter_completion_unique ON photo_votes
IS 'Prevents duplicate votes on the same completion by the same voter in the same year. Users can vote for multiple completions, but only once per completion.';
