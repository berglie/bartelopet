-- ============================================================================
-- BARTELØPET - QUICK COMMAND REFERENCE
-- ============================================================================
-- Copy and paste these commands into Supabase SQL Editor
-- ============================================================================

-- ----------------------------------------------------------------------------
-- SUBMISSION WINDOW CONTROL
-- ----------------------------------------------------------------------------

-- Open submission window (allow users to submit and edit)
SELECT open_submission_window();

-- Close submission window (read-only mode)
SELECT close_submission_window();

-- Check current status
SELECT
  submission_window_open as "Window Open?",
  current_event_year as "Current Year",
  updated_at as "Last Updated",
  updated_by as "Updated By"
FROM settings
WHERE id = 1;

-- ----------------------------------------------------------------------------
-- EVENT YEAR MANAGEMENT
-- ----------------------------------------------------------------------------

-- Get current event year
SELECT get_current_event_year() as "Current Event Year";

-- Set event year to 2025
SELECT set_current_event_year(2025);

-- Set event year to 2026 (for next year)
SELECT set_current_event_year(2026);

-- ----------------------------------------------------------------------------
-- STATISTICS & MONITORING
-- ----------------------------------------------------------------------------

-- Count participants by year
SELECT
  event_year,
  COUNT(*) as participant_count,
  COUNT(CASE WHEN has_completed THEN 1 END) as completed_count
FROM participants
GROUP BY event_year
ORDER BY event_year DESC;

-- Count submissions by year
SELECT
  event_year,
  COUNT(*) as submission_count
FROM completions
GROUP BY event_year
ORDER BY event_year DESC;

-- View recent registrations
SELECT
  full_name,
  email,
  bib_number,
  event_year,
  created_at
FROM participants
ORDER BY created_at DESC
LIMIT 10;

-- View recent completions
SELECT
  p.full_name,
  p.bib_number,
  c.completed_date,
  c.vote_count,
  c.event_year,
  c.created_at
FROM completions c
JOIN participants p ON c.participant_id = p.id
ORDER BY c.created_at DESC
LIMIT 10;

-- ----------------------------------------------------------------------------
-- DIRECT SETTINGS UPDATE (Alternative method)
-- ----------------------------------------------------------------------------

-- Open window (direct update)
UPDATE settings
SET submission_window_open = true, updated_at = NOW()
WHERE id = 1;

-- Close window (direct update)
UPDATE settings
SET submission_window_open = false, updated_at = NOW()
WHERE id = 1;

-- ----------------------------------------------------------------------------
-- VERIFICATION QUERIES
-- ----------------------------------------------------------------------------

-- Verify submission window is working
SELECT is_submission_window_open() as "Is Window Open?";

-- Check if specific year is editable
SELECT is_year_editable(2025) as "Can Edit 2025?";

-- View all settings
SELECT * FROM settings;

-- ----------------------------------------------------------------------------
-- TROUBLESHOOTING
-- ----------------------------------------------------------------------------

-- Check RLS policies are in place
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename IN ('participants', 'completions', 'votes', 'photo_comments')
ORDER BY tablename, policyname;

-- Verify settings table exists and has data
SELECT
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'settings'
ORDER BY ordinal_position;

-- ----------------------------------------------------------------------------
-- TYPICAL WORKFLOW EXAMPLES
-- ----------------------------------------------------------------------------

-- Example 1: Start accepting registrations for 2025
SELECT set_current_event_year(2025);
SELECT open_submission_window();
SELECT * FROM settings WHERE id = 1; -- Verify

-- Example 2: Close registration after event
SELECT close_submission_window();
SELECT * FROM settings WHERE id = 1; -- Verify

-- Example 3: Reopen for late submissions
SELECT open_submission_window();

-- Example 4: Prepare for next year (November 2026)
SELECT set_current_event_year(2026);
SELECT open_submission_window();

-- ----------------------------------------------------------------------------
-- NOTES
-- ----------------------------------------------------------------------------

-- The submission window is now controlled manually via feature toggle
-- No longer restricted to November month
-- You have complete control over when users can submit
-- All changes are logged in the settings table (updated_at, updated_by)
-- Frontend automatically adapts to window status
-- Database RLS policies enforce security
