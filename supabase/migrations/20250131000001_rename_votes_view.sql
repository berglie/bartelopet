-- Migration: Remove current_year_votes view
-- Description: Drops the current_year_votes view as it's not needed

-- Drop the view and revoke permissions
DROP VIEW IF EXISTS current_year_votes CASCADE;

