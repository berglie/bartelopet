-- Remove unused Vipps OAuth components (vipps_sub column and vipps_sessions table)

-- ============================================================================
-- PART 1: Remove vipps_sub from participants table
-- ============================================================================

-- Step 1: Drop the view first to break the dependency
DROP VIEW IF EXISTS current_year_participants;

-- Step 2: Drop the index
DROP INDEX IF EXISTS idx_participants_vipps_sub;

-- Step 3: Remove the column
ALTER TABLE participants
DROP COLUMN IF EXISTS vipps_sub;

-- Step 4: Recreate the view without vipps_sub
CREATE OR REPLACE VIEW current_year_participants AS
SELECT 
  id,
  user_id,
  email,
  full_name,
  postal_address,
  phone_number,
  bib_number,
  has_completed,
  auth_provider,
  event_year,
  created_at,
  updated_at
FROM participants
WHERE event_year = get_current_event_year();

-- Step 5: Restore grants on the view
GRANT SELECT ON current_year_participants TO authenticated;
GRANT SELECT ON current_year_participants TO anon;

-- Step 6: Restore comment on the view
COMMENT ON VIEW current_year_participants IS 'All participants for the current event year';

-- ============================================================================
-- PART 2: Remove vipps_sessions table and related objects
-- ============================================================================

-- Step 7: Drop the cleanup function (it references the table)
DROP FUNCTION IF EXISTS cleanup_expired_vipps_sessions();

-- Step 8: Drop indexes on vipps_sessions
DROP INDEX IF EXISTS idx_vipps_sessions_state;
DROP INDEX IF EXISTS idx_vipps_sessions_expires_at;

-- Step 9: Drop the vipps_sessions table
DROP TABLE IF EXISTS vipps_sessions;
