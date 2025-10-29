-- Migration: Add Feature Toggle for Submission Window
-- Description: Replace date-based restrictions with a manual feature toggle
--              This allows admins to open/close submissions at any time

-- ===========================================================================
-- STEP 1: Create settings table
-- ===========================================================================

CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  submission_window_open BOOLEAN NOT NULL DEFAULT true,
  current_event_year INTEGER NOT NULL DEFAULT 2025,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by TEXT,

  -- Ensure only one settings row exists
  CONSTRAINT single_settings_row CHECK (id = 1)
);

COMMENT ON TABLE settings IS 'Global application settings and feature toggles';
COMMENT ON COLUMN settings.submission_window_open IS 'Feature toggle: Allow submissions and edits when true';
COMMENT ON COLUMN settings.current_event_year IS 'The current active event year';

-- Insert initial settings row
INSERT INTO settings (id, submission_window_open, current_event_year)
VALUES (1, true, 2025)
ON CONFLICT (id) DO NOTHING;

-- ===========================================================================
-- STEP 2: Update helper functions to use feature toggle
-- ===========================================================================

-- Function to check if submissions are currently allowed (replaces is_november_edit_window)
CREATE OR REPLACE FUNCTION is_submission_window_open()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (SELECT submission_window_open FROM settings WHERE id = 1);
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION is_submission_window_open() IS 'Returns true if submission window is open (controlled by feature toggle)';

-- Update is_year_editable to use feature toggle instead of November check
CREATE OR REPLACE FUNCTION is_year_editable(year_to_check INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
  current_year INTEGER;
  window_open BOOLEAN;
BEGIN
  SELECT current_event_year INTO current_year FROM settings WHERE id = 1;
  SELECT submission_window_open INTO window_open FROM settings WHERE id = 1;

  RETURN year_to_check = current_year AND window_open;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION is_year_editable(INTEGER) IS 'Returns true if the specified year is currently editable (current year + submission window open)';

-- Function to get current event year from settings
CREATE OR REPLACE FUNCTION get_current_event_year()
RETURNS INTEGER AS $$
BEGIN
  RETURN (SELECT current_event_year FROM settings WHERE id = 1);
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_current_event_year() IS 'Returns the current event year from settings';

-- ===========================================================================
-- STEP 3: Remove November-specific date validation
-- ===========================================================================

-- Update completion date validation to only check year match (not November requirement)
CREATE OR REPLACE FUNCTION validate_completion_date_year()
RETURNS TRIGGER AS $$
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

COMMENT ON FUNCTION validate_completion_date_year() IS 'Validates that completion date year matches event year';

-- ===========================================================================
-- STEP 4: Create admin functions to control the toggle
-- ===========================================================================

-- Function to open submission window
CREATE OR REPLACE FUNCTION open_submission_window()
RETURNS void AS $$
BEGIN
  UPDATE settings
  SET submission_window_open = true,
      updated_at = NOW(),
      updated_by = current_user
  WHERE id = 1;

  RAISE NOTICE 'Submission window opened';
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION open_submission_window() IS 'Admin function to open the submission window';

-- Function to close submission window
CREATE OR REPLACE FUNCTION close_submission_window()
RETURNS void AS $$
BEGIN
  UPDATE settings
  SET submission_window_open = false,
      updated_at = NOW(),
      updated_by = current_user
  WHERE id = 1;

  RAISE NOTICE 'Submission window closed';
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION close_submission_window() IS 'Admin function to close the submission window';

-- Function to set current event year
CREATE OR REPLACE FUNCTION set_current_event_year(new_year INTEGER)
RETURNS void AS $$
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
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION set_current_event_year(INTEGER) IS 'Admin function to set the current event year';

-- ===========================================================================
-- STEP 5: Grant permissions
-- ===========================================================================

-- Public can read settings
GRANT SELECT ON settings TO anon, authenticated;

-- Grant execute on helper functions
GRANT EXECUTE ON FUNCTION is_submission_window_open() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION is_year_editable(INTEGER) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_current_event_year() TO authenticated, anon;

-- Admin functions require authentication (you can add role-based restrictions later)
GRANT EXECUTE ON FUNCTION open_submission_window() TO authenticated;
GRANT EXECUTE ON FUNCTION close_submission_window() TO authenticated;
GRANT EXECUTE ON FUNCTION set_current_event_year(INTEGER) TO authenticated;

-- ===========================================================================
-- STEP 6: Update initial schema constraint to allow any date in year
-- ===========================================================================

-- Note: The constraint in 20250101000000_initial_schema.sql still restricts to November
-- This will be overridden by the updated validation function above
-- If you want to update the constraint, you can modify it like this:

ALTER TABLE completions DROP CONSTRAINT IF EXISTS valid_completion_date;

ALTER TABLE completions
ADD CONSTRAINT valid_completion_date
CHECK (completed_date >= '2025-01-01' AND completed_date <= NOW()::DATE);

COMMENT ON CONSTRAINT valid_completion_date ON completions IS 'Completion date must be in 2025 or later and not in the future';
