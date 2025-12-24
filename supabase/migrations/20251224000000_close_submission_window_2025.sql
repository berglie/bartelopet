-- Close submission window for Barteløpet 2025
-- The race is over, winners have been drawn, and sign-ups should be prevented

UPDATE settings
SET submission_window_open = false,
    updated_at = NOW(),
    updated_by = 'migration'
WHERE id = 1;

COMMENT ON TABLE settings IS 'Global application settings - submission window closed for 2025 event';
