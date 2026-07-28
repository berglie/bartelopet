-- Barteløpet 2026: self-registered runs, distance interests, prizes and draws.
-- The 2025 completions/gallery schema is deliberately left unchanged.

CREATE TABLE event_editions (
  event_year INTEGER PRIMARY KEY CHECK (event_year BETWEEN 2025 AND 2100),
  registration_open BOOLEAN NOT NULL DEFAULT false,
  submissions_open BOOLEAN NOT NULL DEFAULT false,
  submissions_start DATE NOT NULL,
  submissions_end DATE NOT NULL,
  donation_rate_nok INTEGER NOT NULL CHECK (donation_rate_nok > 0),
  donation_url TEXT,
  winners_published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (submissions_end >= submissions_start)
);

INSERT INTO event_editions (
  event_year,
  registration_open,
  submissions_open,
  submissions_start,
  submissions_end,
  donation_rate_nok
) VALUES (2026, true, false, DATE '2026-11-01', DATE '2026-11-30', 5);

CREATE TABLE distance_categories (
  event_year INTEGER NOT NULL REFERENCES event_editions(event_year) ON DELETE CASCADE,
  slug TEXT NOT NULL CHECK (slug ~ '^[a-z0-9-]+$'),
  label TEXT NOT NULL,
  minimum_km NUMERIC(7,2) NOT NULL CHECK (minimum_km >= 0),
  maximum_km NUMERIC(7,2),
  display_order INTEGER NOT NULL,
  color TEXT NOT NULL,
  PRIMARY KEY (event_year, slug),
  CHECK (maximum_km IS NULL OR maximum_km > minimum_km)
);

INSERT INTO distance_categories
  (event_year, slug, label, minimum_km, maximum_km, display_order, color)
VALUES
  (2026, 'short', '0–10 km', 0, 10, 1, '#2dd4bf'),
  (2026, 'medium', '10–30 km', 10, 30, 2, '#f59e0b'),
  (2026, 'long', '30+ km', 30, NULL, 3, '#a855f7');

CREATE TABLE participant_distance_interests (
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  event_year INTEGER NOT NULL,
  category_slug TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (participant_id, event_year, category_slug),
  FOREIGN KEY (event_year, category_slug)
    REFERENCES distance_categories(event_year, slug) ON DELETE CASCADE
);

CREATE OR REPLACE FUNCTION seed_2026_distance_interests()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.event_year = 2026 THEN
    INSERT INTO public.participant_distance_interests (
      participant_id, event_year, category_slug
    ) VALUES
      (NEW.id, NEW.event_year, 'short'),
      (NEW.id, NEW.event_year, 'medium'),
      (NEW.id, NEW.event_year, 'long')
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER seed_2026_distance_interests_trigger
  AFTER INSERT ON participants
  FOR EACH ROW EXECUTE FUNCTION seed_2026_distance_interests();

CREATE TABLE runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  event_year INTEGER NOT NULL REFERENCES event_editions(event_year) ON DELETE RESTRICT,
  run_date DATE NOT NULL,
  distance_km NUMERIC(7,2) NOT NULL CHECK (distance_km > 0 AND distance_km <= 500),
  donation_amount_nok INTEGER NOT NULL CHECK (donation_amount_nok > 0),
  donation_confirmed_at TIMESTAMPTZ NOT NULL,
  title TEXT CHECK (char_length(title) <= 100),
  duration_text TEXT CHECK (char_length(duration_text) <= 50),
  comment TEXT CHECK (char_length(comment) <= 500),
  evidence_url TEXT CHECK (char_length(evidence_url) <= 2048),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (participant_id, run_date)
);

CREATE INDEX idx_runs_year_distance ON runs(event_year, distance_km);
CREATE INDEX idx_runs_year_date ON runs(event_year, run_date DESC);
CREATE INDEX idx_runs_participant ON runs(participant_id, run_date DESC);

CREATE TABLE race_prizes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_year INTEGER NOT NULL REFERENCES event_editions(event_year) ON DELETE CASCADE,
  category_slug TEXT NOT NULL,
  race_name TEXT NOT NULL CHECK (char_length(race_name) BETWEEN 1 AND 120),
  distance_km NUMERIC(7,2) NOT NULL CHECK (distance_km > 0),
  donor_name TEXT CHECK (char_length(donor_name) <= 120),
  race_date DATE,
  website_url TEXT CHECK (char_length(website_url) <= 2048),
  notes TEXT CHECK (char_length(notes) <= 500),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'available', 'drawn')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  FOREIGN KEY (event_year, category_slug)
    REFERENCES distance_categories(event_year, slug) ON DELETE RESTRICT
);

CREATE TABLE draw_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_year INTEGER NOT NULL REFERENCES event_editions(event_year) ON DELETE CASCADE,
  prize_id UUID NOT NULL REFERENCES race_prizes(id) ON DELETE RESTRICT,
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE RESTRICT,
  winning_run_id UUID NOT NULL REFERENCES runs(id) ON DELETE RESTRICT,
  candidate_count INTEGER NOT NULL CHECK (candidate_count > 0),
  drawn_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  drawn_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  published_at TIMESTAMPTZ,
  annulled_at TIMESTAMPTZ,
  annulled_by UUID REFERENCES auth.users(id) ON DELETE RESTRICT
);

CREATE UNIQUE INDEX draw_results_one_active_per_prize
  ON draw_results(prize_id) WHERE annulled_at IS NULL;
CREATE UNIQUE INDEX draw_results_one_active_win_per_participant
  ON draw_results(event_year, participant_id) WHERE annulled_at IS NULL;

CREATE OR REPLACE FUNCTION is_event_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $$
  SELECT COALESCE(
    (auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'organizer'),
    false
  );
$$;

CREATE OR REPLACE FUNCTION validate_2026_run()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  edition public.event_editions%ROWTYPE;
  participant_year INTEGER;
  oslo_today DATE := (NOW() AT TIME ZONE 'Europe/Oslo')::DATE;
BEGIN
  SELECT * INTO edition
  FROM public.event_editions
  WHERE event_year = NEW.event_year;

  SELECT event_year INTO participant_year
  FROM public.participants
  WHERE id = NEW.participant_id;

  IF participant_year IS DISTINCT FROM NEW.event_year THEN
    RAISE EXCEPTION 'Participant and run must belong to the same event year';
  END IF;

  IF NOT edition.submissions_open THEN
    RAISE EXCEPTION 'Run submissions are closed';
  END IF;

  IF NEW.run_date < edition.submissions_start OR NEW.run_date > edition.submissions_end THEN
    RAISE EXCEPTION 'Run date is outside the submission period';
  END IF;

  IF NEW.run_date > oslo_today THEN
    RAISE EXCEPTION 'Run date cannot be in the future';
  END IF;

  NEW.distance_km := ROUND(NEW.distance_km, 2);
  NEW.donation_amount_nok := CEIL(NEW.distance_km * edition.donation_rate_nok);
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_2026_run_trigger
  BEFORE INSERT OR UPDATE ON runs
  FOR EACH ROW EXECUTE FUNCTION validate_2026_run();

CREATE VIEW runs_public
WITH (security_invoker = off)
AS
SELECT
  r.id,
  r.participant_id,
  r.event_year,
  r.run_date,
  r.distance_km,
  r.donation_amount_nok,
  r.title,
  r.duration_text,
  r.comment,
  r.evidence_url,
  r.created_at,
  p.full_name,
  p.bib_number,
  ARRAY(
    SELECT i.category_slug
    FROM participant_distance_interests i
    WHERE i.participant_id = r.participant_id
      AND i.event_year = r.event_year
    ORDER BY i.category_slug
  ) AS interest_categories
FROM runs r
JOIN participants p ON p.id = r.participant_id AND p.event_year = r.event_year;

ALTER VIEW runs_public OWNER TO postgres;

CREATE VIEW eligible_entries
WITH (security_invoker = off)
AS
SELECT
  r.id AS run_id,
  r.participant_id,
  r.event_year,
  i.category_slug
FROM runs r
JOIN participant_distance_interests i
  ON i.participant_id = r.participant_id
 AND i.event_year = r.event_year
JOIN distance_categories c
  ON c.event_year = i.event_year
 AND c.slug = i.category_slug
WHERE (c.minimum_km = 0 AND r.distance_km > 0)
   OR (c.minimum_km > 0 AND c.maximum_km IS NOT NULL AND r.distance_km > c.minimum_km)
   OR (c.maximum_km IS NULL AND r.distance_km >= c.minimum_km);

ALTER VIEW eligible_entries OWNER TO postgres;

CREATE OR REPLACE FUNCTION draw_race_prize(p_prize_id UUID)
RETURNS draw_results
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  prize public.race_prizes%ROWTYPE;
  winning_entry RECORD;
  candidates INTEGER;
  result public.draw_results%ROWTYPE;
BEGIN
  IF NOT public.is_event_admin() THEN
    RAISE EXCEPTION 'Administrator access required';
  END IF;

  SELECT * INTO prize
  FROM public.race_prizes
  WHERE id = p_prize_id
  FOR UPDATE;

  IF NOT FOUND OR prize.status <> 'available' THEN
    RAISE EXCEPTION 'Prize is not available for drawing';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.draw_results
    WHERE prize_id = p_prize_id AND annulled_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Prize has already been drawn';
  END IF;

  SELECT COUNT(*) INTO candidates
  FROM public.eligible_entries e
  WHERE e.event_year = prize.event_year
    AND e.category_slug = prize.category_slug
    AND NOT EXISTS (
      SELECT 1 FROM public.draw_results d
      WHERE d.event_year = prize.event_year
        AND d.participant_id = e.participant_id
        AND d.annulled_at IS NULL
    );

  IF candidates = 0 THEN
    RAISE EXCEPTION 'No eligible entries are available';
  END IF;

  SELECT e.run_id, e.participant_id INTO winning_entry
  FROM public.eligible_entries e
  WHERE e.event_year = prize.event_year
    AND e.category_slug = prize.category_slug
    AND NOT EXISTS (
      SELECT 1 FROM public.draw_results d
      WHERE d.event_year = prize.event_year
        AND d.participant_id = e.participant_id
        AND d.annulled_at IS NULL
    )
  ORDER BY random()
  LIMIT 1;

  INSERT INTO public.draw_results (
    event_year, prize_id, participant_id, winning_run_id,
    candidate_count, drawn_by
  ) VALUES (
    prize.event_year, prize.id, winning_entry.participant_id,
    winning_entry.run_id, candidates, auth.uid()
  ) RETURNING * INTO result;

  UPDATE public.race_prizes SET status = 'drawn', updated_at = NOW()
  WHERE id = prize.id;

  RETURN result;
END;
$$;

ALTER TABLE event_editions ENABLE ROW LEVEL SECURITY;
ALTER TABLE distance_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE participant_distance_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE race_prizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE draw_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Event editions are public" ON event_editions FOR SELECT USING (true);
CREATE POLICY "Categories are public" ON distance_categories FOR SELECT USING (true);
CREATE POLICY "Runs are public" ON runs FOR SELECT USING (true);
CREATE POLICY "Available prizes are public" ON race_prizes FOR SELECT
  USING (status <> 'draft' OR is_event_admin());
CREATE POLICY "Published draws are public" ON draw_results FOR SELECT
  USING (published_at IS NOT NULL OR is_event_admin());
CREATE POLICY "Interests are public for ticket calculations"
  ON participant_distance_interests FOR SELECT USING (true);

CREATE POLICY "Participants manage own interests"
  ON participant_distance_interests FOR ALL
  USING (EXISTS (
    SELECT 1 FROM participants p
    WHERE p.id = participant_id AND p.user_id = auth.uid()
  ) AND EXISTS (
    SELECT 1 FROM event_editions e
    WHERE e.event_year = participant_distance_interests.event_year
      AND (e.registration_open OR e.submissions_open)
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM participants p
    WHERE p.id = participant_id
      AND p.event_year = participant_distance_interests.event_year
      AND p.user_id = auth.uid()
  ) AND EXISTS (
    SELECT 1 FROM event_editions e
    WHERE e.event_year = participant_distance_interests.event_year
      AND (e.registration_open OR e.submissions_open)
  ));

CREATE POLICY "Participants insert own runs" ON runs FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM participants p
    WHERE p.id = participant_id
      AND p.event_year = runs.event_year
      AND p.user_id = auth.uid()
  ));
CREATE POLICY "Participants update own runs" ON runs FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM participants p WHERE p.id = participant_id AND p.user_id = auth.uid()
  ) AND EXISTS (
    SELECT 1 FROM event_editions e WHERE e.event_year = runs.event_year AND e.submissions_open
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM participants p
    WHERE p.id = participant_id
      AND p.event_year = runs.event_year
      AND p.user_id = auth.uid()
  ));
CREATE POLICY "Participants delete own runs" ON runs FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM participants p WHERE p.id = participant_id AND p.user_id = auth.uid()
  ) AND EXISTS (
    SELECT 1 FROM event_editions e WHERE e.event_year = runs.event_year AND e.submissions_open
  ));

CREATE POLICY "Admins manage editions" ON event_editions FOR ALL
  USING (is_event_admin()) WITH CHECK (is_event_admin());
CREATE POLICY "Admins manage categories" ON distance_categories FOR ALL
  USING (is_event_admin()) WITH CHECK (is_event_admin());
CREATE POLICY "Admins manage prizes" ON race_prizes FOR ALL
  USING (is_event_admin()) WITH CHECK (is_event_admin());
CREATE POLICY "Admins manage draws" ON draw_results FOR ALL
  USING (is_event_admin()) WITH CHECK (is_event_admin());
CREATE POLICY "Admins view participant contact details" ON participants FOR SELECT
  USING (is_event_admin());

DROP POLICY IF EXISTS "Anyone can register for current event year" ON participants;
CREATE POLICY "Registration follows active edition" ON participants FOR INSERT
  WITH CHECK (
    event_year = get_current_event_year()
    AND EXISTS (
      SELECT 1 FROM event_editions e
      WHERE e.event_year = participants.event_year
        AND e.registration_open
    )
  );

GRANT SELECT ON event_editions, distance_categories, runs_public, eligible_entries TO anon, authenticated;
GRANT SELECT ON runs, race_prizes, draw_results, participant_distance_interests TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON runs, participant_distance_interests TO authenticated;
GRANT INSERT, UPDATE, DELETE ON event_editions, distance_categories, race_prizes, draw_results TO authenticated;
GRANT EXECUTE ON FUNCTION is_event_admin(), draw_race_prize(UUID) TO authenticated;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'run-evidence',
  'run-evidence',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

CREATE POLICY "Run evidence is public"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'run-evidence');
CREATE POLICY "Users upload own run evidence"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'run-evidence'
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
  );
CREATE POLICY "Users update own run evidence"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'run-evidence'
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
  );
CREATE POLICY "Users delete own run evidence"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'run-evidence'
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
  );

UPDATE settings
SET current_event_year = 2026,
    updated_at = NOW(),
    updated_by = '2026 event migration'
WHERE id = 1;
