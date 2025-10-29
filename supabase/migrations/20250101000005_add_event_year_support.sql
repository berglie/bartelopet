-- Migration: Add event_year support for multi-year event iterations
-- Description: This migration adds event_year columns to relevant tables,
--              allowing the system to support multiple event years while
--              maintaining historical data and year-specific operations.

-- ===========================================================================
-- STEP 1: Add event_year columns to tables
-- ===========================================================================

-- Add event_year to participants table
-- Each participant registration is tied to a specific event year
ALTER TABLE participants
ADD COLUMN event_year INTEGER NOT NULL DEFAULT 2025,
ADD CONSTRAINT valid_event_year_participants CHECK (event_year >= 2025 AND event_year <= 2100);

-- Add event_year to completions table
-- Each completion is tied to a specific event year
ALTER TABLE completions
ADD COLUMN event_year INTEGER NOT NULL DEFAULT 2025,
ADD CONSTRAINT valid_event_year_completions CHECK (event_year >= 2025 AND event_year <= 2100);

-- Add event_year to votes table
-- Each vote is tied to a specific event year
ALTER TABLE votes
ADD COLUMN event_year INTEGER NOT NULL DEFAULT 2025,
ADD CONSTRAINT valid_event_year_votes CHECK (event_year >= 2025 AND event_year <= 2100);

-- Add event_year to photo_comments table
-- Each comment is tied to a specific event year
ALTER TABLE photo_comments
ADD COLUMN event_year INTEGER NOT NULL DEFAULT 2025,
ADD CONSTRAINT valid_event_year_comments CHECK (event_year >= 2025 AND event_year <= 2100);

COMMENT ON COLUMN participants.event_year IS 'The event year this participant registered for';
COMMENT ON COLUMN completions.event_year IS 'The event year this completion belongs to';
COMMENT ON COLUMN votes.event_year IS 'The event year this vote was cast in';
COMMENT ON COLUMN photo_comments.event_year IS 'The event year this comment was made in';

-- ===========================================================================
-- STEP 2: Create year-specific indexes for performance
-- ===========================================================================

-- Participants indexes
CREATE INDEX idx_participants_event_year ON participants(event_year);
CREATE INDEX idx_participants_year_bib ON participants(event_year, bib_number);
CREATE INDEX idx_participants_year_user ON participants(event_year, user_id);
CREATE INDEX idx_participants_year_email ON participants(event_year, email);

-- Completions indexes
CREATE INDEX idx_completions_event_year ON completions(event_year);
CREATE INDEX idx_completions_year_participant ON completions(event_year, participant_id);
CREATE INDEX idx_completions_year_votes ON completions(event_year, vote_count DESC);

-- Votes indexes
CREATE INDEX idx_votes_event_year ON votes(event_year);
CREATE INDEX idx_votes_year_voter ON votes(event_year, voter_id);
CREATE INDEX idx_votes_year_completion ON votes(event_year, completion_id);

-- Photo comments indexes
CREATE INDEX idx_photo_comments_event_year ON photo_comments(event_year);
CREATE INDEX idx_photo_comments_year_completion ON photo_comments(event_year, completion_id);

-- ===========================================================================
-- STEP 3: Update constraints to be year-aware
-- ===========================================================================

-- Drop old unique constraints that don't account for year
ALTER TABLE participants DROP CONSTRAINT IF EXISTS participants_user_id_key;
ALTER TABLE participants DROP CONSTRAINT IF EXISTS participants_email_key;
ALTER TABLE participants DROP CONSTRAINT IF EXISTS participants_bib_number_key;
ALTER TABLE completions DROP CONSTRAINT IF EXISTS completions_participant_id_key;
ALTER TABLE votes DROP CONSTRAINT IF EXISTS votes_voter_id_key;

-- Add new year-aware unique constraints
-- A user can register once per event year
ALTER TABLE participants
ADD CONSTRAINT participants_user_year_unique UNIQUE(user_id, event_year);

-- Email must be unique per event year
ALTER TABLE participants
ADD CONSTRAINT participants_email_year_unique UNIQUE(email, event_year);

-- Bib numbers must be unique per event year
ALTER TABLE participants
ADD CONSTRAINT participants_bib_year_unique UNIQUE(bib_number, event_year);

-- A participant can have one completion per event year
ALTER TABLE completions
ADD CONSTRAINT completions_participant_year_unique UNIQUE(participant_id, event_year);

-- A voter can only vote once per event year (not per completion)
ALTER TABLE votes
ADD CONSTRAINT votes_voter_year_unique UNIQUE(voter_id, event_year);

COMMENT ON CONSTRAINT participants_user_year_unique ON participants IS 'User can register once per event year';
COMMENT ON CONSTRAINT participants_email_year_unique ON participants IS 'Email must be unique within each event year';
COMMENT ON CONSTRAINT participants_bib_year_unique ON participants IS 'Bib number must be unique within each event year';
COMMENT ON CONSTRAINT completions_participant_year_unique ON completions IS 'Participant can have one completion per event year';
COMMENT ON CONSTRAINT votes_voter_year_unique ON votes IS 'Voter can vote once per event year';

-- ===========================================================================
-- STEP 4: Update triggers to be year-aware
-- ===========================================================================

-- Update the completion status trigger to be year-aware
CREATE OR REPLACE FUNCTION update_participant_completion()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Set has_completed = true for the participant in the same year
    UPDATE participants
    SET has_completed = true
    WHERE id = NEW.participant_id
      AND event_year = NEW.event_year;
  ELSIF TG_OP = 'DELETE' THEN
    -- Set has_completed = false for the participant in the same year
    UPDATE participants
    SET has_completed = false
    WHERE id = OLD.participant_id
      AND event_year = OLD.event_year;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Update the vote count trigger to be year-aware
CREATE OR REPLACE FUNCTION update_vote_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increment vote count for completion in the same year
    UPDATE completions
    SET vote_count = vote_count + 1
    WHERE id = NEW.completion_id
      AND event_year = NEW.event_year;
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrement vote count for completion in the same year
    UPDATE completions
    SET vote_count = GREATEST(0, vote_count - 1)
    WHERE id = OLD.completion_id
      AND event_year = OLD.event_year;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Update self-voting prevention to be year-aware
CREATE OR REPLACE FUNCTION prevent_self_voting()
RETURNS TRIGGER AS $$
DECLARE
  completion_participant_id UUID;
BEGIN
  -- Get the participant_id for the completion being voted on
  SELECT participant_id INTO completion_participant_id
  FROM completions
  WHERE id = NEW.completion_id
    AND event_year = NEW.event_year;

  -- Check if voter is trying to vote for their own completion
  IF NEW.voter_id = completion_participant_id THEN
    RAISE EXCEPTION 'Cannot vote for your own completion';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update comment count trigger to be year-aware
CREATE OR REPLACE FUNCTION update_comment_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE completions
    SET comment_count = comment_count + 1
    WHERE id = NEW.completion_id
      AND event_year = NEW.event_year;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE completions
    SET comment_count = GREATEST(0, comment_count - 1)
    WHERE id = OLD.completion_id
      AND event_year = OLD.event_year;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- ===========================================================================
-- STEP 5: Create helper functions for year-based operations
-- ===========================================================================

-- Function to get the current event year based on date
-- Returns the year if we're in November or later, otherwise returns previous year
CREATE OR REPLACE FUNCTION get_current_event_year()
RETURNS INTEGER AS $$
DECLARE
  current_month INTEGER;
  current_year INTEGER;
BEGIN
  current_month := EXTRACT(MONTH FROM NOW());
  current_year := EXTRACT(YEAR FROM NOW());

  -- If we're in November (month 11) or December (month 12), return current year
  -- Otherwise return previous year (since the event is in November)
  IF current_month >= 11 THEN
    RETURN current_year;
  ELSE
    RETURN current_year - 1;
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION get_current_event_year() IS 'Returns the current event year based on date (Nov-Dec = current year, Jan-Oct = previous year)';

-- Function to check if we're currently in November (edit window)
CREATE OR REPLACE FUNCTION is_november_edit_window()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXTRACT(MONTH FROM NOW()) = 11;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION is_november_edit_window() IS 'Returns true if current month is November (when edits are allowed)';

-- Function to check if a year is editable (current year + November only)
CREATE OR REPLACE FUNCTION is_year_editable(year_to_check INTEGER)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN year_to_check = get_current_event_year() AND is_november_edit_window();
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION is_year_editable(INTEGER) IS 'Returns true if the specified year is currently editable (current event year + November only)';

-- Function to validate completion date matches event year
CREATE OR REPLACE FUNCTION validate_completion_date_year()
RETURNS TRIGGER AS $$
BEGIN
  -- Ensure the completion date is within the event year
  IF EXTRACT(YEAR FROM NEW.completed_date) != NEW.event_year THEN
    RAISE EXCEPTION 'Completion date year (%) does not match event year (%)',
      EXTRACT(YEAR FROM NEW.completed_date), NEW.event_year;
  END IF;

  -- Ensure completion date is in November of the event year
  IF EXTRACT(MONTH FROM NEW.completed_date) != 11 THEN
    RAISE EXCEPTION 'Completion date must be in November (month 11), got month %',
      EXTRACT(MONTH FROM NEW.completed_date);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply completion date validation trigger
CREATE TRIGGER validate_completion_date_year_trigger
  BEFORE INSERT OR UPDATE ON completions
  FOR EACH ROW
  EXECUTE FUNCTION validate_completion_date_year();

COMMENT ON TRIGGER validate_completion_date_year_trigger ON completions IS 'Validates that completion date matches event year and is in November';

-- ===========================================================================
-- STEP 6: Create view for current event year data
-- ===========================================================================

-- View for current year participants
CREATE OR REPLACE VIEW current_year_participants AS
SELECT *
FROM participants
WHERE event_year = get_current_event_year();

COMMENT ON VIEW current_year_participants IS 'All participants for the current event year';

-- View for current year completions
CREATE OR REPLACE VIEW current_year_completions AS
SELECT c.*, p.full_name, p.email, p.bib_number
FROM completions c
JOIN participants p ON c.participant_id = p.id AND c.event_year = p.event_year
WHERE c.event_year = get_current_event_year();

COMMENT ON VIEW current_year_completions IS 'All completions for the current event year';

-- View for current year votes
CREATE OR REPLACE VIEW current_year_votes AS
SELECT v.*, p.full_name as voter_name
FROM votes v
JOIN participants p ON v.voter_id = p.id AND v.event_year = p.event_year
WHERE v.event_year = get_current_event_year();

COMMENT ON VIEW current_year_votes IS 'All votes for the current event year';

-- ===========================================================================
-- STEP 7: Create function to get participant history across years
-- ===========================================================================

CREATE OR REPLACE FUNCTION get_participant_history(p_user_id UUID)
RETURNS TABLE (
  event_year INTEGER,
  participant_id UUID,
  email TEXT,
  full_name TEXT,
  bib_number INTEGER,
  has_completed BOOLEAN,
  registration_date TIMESTAMPTZ,
  completion_date DATE,
  vote_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.event_year,
    p.id as participant_id,
    p.email,
    p.full_name,
    p.bib_number,
    p.has_completed,
    p.created_at as registration_date,
    c.completed_date,
    COALESCE(c.vote_count, 0) as vote_count
  FROM participants p
  LEFT JOIN completions c ON p.id = c.participant_id AND p.event_year = c.event_year
  WHERE p.user_id = p_user_id
  ORDER BY p.event_year DESC;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_participant_history(UUID) IS 'Returns participation history for a user across all event years';

-- ===========================================================================
-- STEP 8: Grant appropriate permissions
-- ===========================================================================

-- Grant access to views for authenticated users
GRANT SELECT ON current_year_participants TO authenticated;
GRANT SELECT ON current_year_completions TO authenticated;
GRANT SELECT ON current_year_votes TO authenticated;
GRANT SELECT ON current_year_participants TO anon;
GRANT SELECT ON current_year_completions TO anon;
GRANT SELECT ON current_year_votes TO anon;

-- Grant execute on helper functions
GRANT EXECUTE ON FUNCTION get_current_event_year() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION is_november_edit_window() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION is_year_editable(INTEGER) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_participant_history(UUID) TO authenticated;
