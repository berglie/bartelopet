-- Add Vipps OAuth support to participants table
ALTER TABLE participants
ADD COLUMN IF NOT EXISTS vipps_sub TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS auth_provider TEXT NOT NULL DEFAULT 'email' CHECK (auth_provider IN ('email', 'vipps', 'both'));

-- Create index on vipps_sub for faster lookups
CREATE INDEX IF NOT EXISTS idx_participants_vipps_sub ON participants(vipps_sub);

-- Create vipps_sessions table for OAuth PKCE flow
CREATE TABLE IF NOT EXISTS vipps_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  state TEXT NOT NULL UNIQUE,
  code_verifier TEXT NOT NULL,
  code_challenge TEXT NOT NULL,
  redirect_uri TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '10 minutes'),

  -- Ensure session is valid for 10 minutes max
  CONSTRAINT valid_session CHECK (expires_at > created_at)
);

-- Create index on state for fast lookups
CREATE INDEX IF NOT EXISTS idx_vipps_sessions_state ON vipps_sessions(state);

-- Create index on expires_at for cleanup queries
CREATE INDEX IF NOT EXISTS idx_vipps_sessions_expires_at ON vipps_sessions(expires_at);

-- Create function to clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_vipps_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM vipps_sessions
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a scheduled job to clean up expired sessions (optional, can also be done via cron)
-- This is a comment placeholder - actual cron job should be set up in Supabase dashboard
-- Or called periodically from application code

-- Grant permissions for authenticated users
GRANT SELECT, INSERT, DELETE ON vipps_sessions TO authenticated;
GRANT SELECT ON vipps_sessions TO anon;

-- Comment on table
COMMENT ON TABLE vipps_sessions IS 'Stores OAuth PKCE session data for Vipps login flow';
COMMENT ON COLUMN participants.vipps_sub IS 'Vipps user subject identifier for OAuth linking';
COMMENT ON COLUMN participants.auth_provider IS 'Authentication provider: email (magic link), vipps (OAuth), or both (linked accounts)';
