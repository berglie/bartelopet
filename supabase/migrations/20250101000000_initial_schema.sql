-- Create participants table
-- Note: Using gen_random_uuid() which is built-in to PostgreSQL/Supabase
CREATE TABLE participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  postal_address TEXT NOT NULL,
  phone_number TEXT,
  bib_number INTEGER NOT NULL UNIQUE,
  has_completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create completions table
CREATE TABLE completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID REFERENCES participants(id) ON DELETE CASCADE NOT NULL UNIQUE,
  completed_date DATE NOT NULL,
  duration_text TEXT,
  photo_url TEXT NOT NULL,
  comment TEXT,
  vote_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Ensure completion date is reasonable
  CONSTRAINT valid_completion_date CHECK (completed_date >= '2025-11-01' AND completed_date <= NOW()::DATE)
);

-- Create votes table
CREATE TABLE votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  voter_id UUID REFERENCES participants(id) ON DELETE CASCADE NOT NULL,
  completion_id UUID REFERENCES completions(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Ensure one vote per participant (can only vote once total)
  UNIQUE(voter_id)

  -- Note: Self-voting prevention is enforced via trigger below
);

-- Create indexes
CREATE INDEX idx_participants_user_id ON participants(user_id);
CREATE INDEX idx_participants_email ON participants(email);
CREATE INDEX idx_participants_bib_number ON participants(bib_number);
CREATE INDEX idx_completions_participant_id ON completions(participant_id);
CREATE INDEX idx_completions_vote_count ON completions(vote_count DESC);
CREATE INDEX idx_votes_voter_id ON votes(voter_id);
CREATE INDEX idx_votes_completion_id ON votes(completion_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to tables
CREATE TRIGGER update_participants_updated_at
  BEFORE UPDATE ON participants
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_completions_updated_at
  BEFORE UPDATE ON completions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create function to update participant completion status
CREATE OR REPLACE FUNCTION update_participant_completion()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE participants
    SET has_completed = true
    WHERE id = NEW.participant_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE participants
    SET has_completed = false
    WHERE id = OLD.participant_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to update completion status
CREATE TRIGGER update_participant_completion_trigger
  AFTER INSERT OR DELETE ON completions
  FOR EACH ROW
  EXECUTE FUNCTION update_participant_completion();

-- Create function to update vote counts
CREATE OR REPLACE FUNCTION update_vote_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE completions
    SET vote_count = vote_count + 1
    WHERE id = NEW.completion_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE completions
    SET vote_count = GREATEST(0, vote_count - 1)
    WHERE id = OLD.completion_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to update vote counts
CREATE TRIGGER update_vote_counts_trigger
  AFTER INSERT OR DELETE ON votes
  FOR EACH ROW
  EXECUTE FUNCTION update_vote_counts();

-- Create function to prevent self-voting
CREATE OR REPLACE FUNCTION prevent_self_voting()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if voter is trying to vote for their own completion
  IF NEW.voter_id = (SELECT participant_id FROM completions WHERE id = NEW.completion_id) THEN
    RAISE EXCEPTION 'Cannot vote for your own completion';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to prevent self-voting
CREATE TRIGGER prevent_self_voting_trigger
  BEFORE INSERT ON votes
  FOR EACH ROW
  EXECUTE FUNCTION prevent_self_voting();
