-- ============================================================================
-- Migration: Fix Function Search Path Security
-- Date: 2025-01-31
-- Description: Adds SET search_path to all functions to prevent security vulnerabilities
--              This fixes the "function_search_path_mutable" linter warnings
-- ============================================================================

-- ============================================================================
-- STEP 1: Fix sync_starred_image_url function
-- ============================================================================

CREATE OR REPLACE FUNCTION sync_starred_image_url()
RETURNS TRIGGER
SET search_path = 'public'
AS $$
BEGIN
  -- This function is kept for future use but no longer updates photo_url
  -- since that column has been removed from completions table
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 2: Fix prevent_last_image_deletion function
-- ============================================================================

CREATE OR REPLACE FUNCTION prevent_last_image_deletion()
RETURNS TRIGGER
SET search_path = 'public'
AS $$
DECLARE
  image_count INTEGER;
BEGIN
  -- Count remaining images for this completion
  SELECT COUNT(*) INTO image_count
  FROM photos
  WHERE completion_id = OLD.completion_id;

  -- If this is the last image, prevent deletion
  IF image_count = 1 THEN
    RAISE EXCEPTION 'Cannot delete the last image. A completion must have at least one image.';
  END IF;

  -- If deleting a starred image, automatically star the next image
  IF OLD.is_starred = true THEN
    UPDATE photos
    SET is_starred = true
    WHERE id = (
      SELECT id
      FROM photos
      WHERE completion_id = OLD.completion_id
        AND id != OLD.id
      ORDER BY display_order
      LIMIT 1
    );
  END IF;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 3: Fix validate_image_year_consistency function
-- ============================================================================

CREATE OR REPLACE FUNCTION validate_image_year_consistency()
RETURNS TRIGGER
SET search_path = 'public'
AS $$
DECLARE
  completion_year INTEGER;
  completion_participant_id UUID;
BEGIN
  -- Get completion's year and participant_id
  SELECT event_year, participant_id INTO completion_year, completion_participant_id
  FROM completions
  WHERE id = NEW.completion_id;

  -- Ensure image year matches completion year
  IF NEW.event_year != completion_year THEN
    RAISE EXCEPTION 'Image event_year (%) must match completion event_year (%)',
      NEW.event_year, completion_year;
  END IF;

  -- Ensure participant_id matches
  IF NEW.participant_id != completion_participant_id THEN
    RAISE EXCEPTION 'Image participant_id must match completion participant_id';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 4: Fix update_updated_at_column function
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
SET search_path = 'public'
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 5: Fix update_participant_completion function
-- ============================================================================

CREATE OR REPLACE FUNCTION update_participant_completion()
RETURNS TRIGGER
SET search_path = 'public'
AS $$
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

-- ============================================================================
-- STEP 6: Fix prevent_self_voting function
-- ============================================================================

CREATE OR REPLACE FUNCTION prevent_self_voting()
RETURNS TRIGGER
SET search_path = 'public'
AS $$
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

-- ============================================================================
-- STEP 7: Fix is_november_edit_window function
-- ============================================================================

CREATE OR REPLACE FUNCTION is_november_edit_window()
RETURNS BOOLEAN
SET search_path = 'public'
AS $$
BEGIN
  RETURN EXTRACT(MONTH FROM NOW()) = 11;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- STEP 8: Fix get_participant_history function
-- ============================================================================

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
)
SET search_path = 'public'
AS $$
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

-- ============================================================================
-- STEP 9: Fix validate_completion_date_year function
-- ============================================================================

CREATE OR REPLACE FUNCTION validate_completion_date_year()
RETURNS TRIGGER
SET search_path = 'public'
AS $$
BEGIN
  -- Ensure the completion date year matches event year
  IF EXTRACT(YEAR FROM NEW.completed_date) != NEW.event_year THEN
    RAISE EXCEPTION 'Completion date year (%) does not match event year (%)',
      EXTRACT(YEAR FROM NEW.completed_date), NEW.event_year;
  END IF;

  -- Allow any month in the event year (no longer restricted to November)
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 10: Fix open_submission_window function
-- ============================================================================

CREATE OR REPLACE FUNCTION open_submission_window()
RETURNS void
SET search_path = 'public'
AS $$
BEGIN
  UPDATE settings
  SET submission_window_open = true,
      updated_at = NOW(),
      updated_by = current_user
  WHERE id = 1;

  RAISE NOTICE 'Submission window opened';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 11: Fix close_submission_window function
-- ============================================================================

CREATE OR REPLACE FUNCTION close_submission_window()
RETURNS void
SET search_path = 'public'
AS $$
BEGIN
  UPDATE settings
  SET submission_window_open = false,
      updated_at = NOW(),
      updated_by = current_user
  WHERE id = 1;

  RAISE NOTICE 'Submission window closed';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 12: Fix is_submission_window_open function
-- ============================================================================

CREATE OR REPLACE FUNCTION is_submission_window_open()
RETURNS BOOLEAN
SET search_path = 'public'
AS $$
BEGIN
  RETURN (SELECT submission_window_open FROM settings WHERE id = 1);
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- STEP 13: Fix is_year_editable function
-- ============================================================================

CREATE OR REPLACE FUNCTION is_year_editable(year_to_check INTEGER)
RETURNS BOOLEAN
SET search_path = 'public'
AS $$
DECLARE
  current_year INTEGER;
  window_open BOOLEAN;
BEGIN
  SELECT current_event_year INTO current_year FROM settings WHERE id = 1;
  SELECT submission_window_open INTO window_open FROM settings WHERE id = 1;

  RETURN year_to_check = current_year AND window_open;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- STEP 14: Fix get_current_event_year function
-- ============================================================================

CREATE OR REPLACE FUNCTION get_current_event_year()
RETURNS INTEGER
SET search_path = 'public'
AS $$
BEGIN
  RETURN (SELECT current_event_year FROM settings WHERE id = 1);
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- STEP 15: Fix set_current_event_year function
-- ============================================================================

CREATE OR REPLACE FUNCTION set_current_event_year(new_year INTEGER)
RETURNS void
SET search_path = 'public'
AS $$
BEGIN
  IF new_year < 2025 OR new_year > 2100 THEN
    RAISE EXCEPTION 'Event year must be between 2025 and 2100, got %', new_year;
  END IF;

  UPDATE settings
  SET current_event_year = new_year,
      updated_at = NOW(),
      updated_by = current_user
  WHERE id = 1;

  RAISE NOTICE 'Current event year set to %', new_year;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

