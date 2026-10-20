-- Security hardening before the 2026 launch.
--
-- The anon key ships to every browser, so RLS, grants and function permissions are the only
-- thing protecting the data. This migration closes every hole found in the October 2026 audit:
--
-- * participants: no public reads, no direct inserts/updates. Registration goes through
--   register_participant(), which ties the row to the caller and assigns the bib number.
-- * Settings functions (event year, submission window) are no longer callable through the API.
-- * runs, race_prizes and draw_results are readable by the public only through views that
--   leave out internal columns (donations, admin ids, notes, declined winners).
-- * Draws can only be written through draw_race_prize(), annul_draw() and publish_draws(),
--   and draws are serialized so two organizers cannot draw at the same time.
-- * Storage buckets can no longer be listed, and run evidence is stored per participant id
--   instead of per auth user id.
-- * Users can export and delete their own data (GDPR art. 15, 17 and 20).
-- * Admin rights are read from auth.users, so removing the role takes effect at once.
-- * 2025 votes are private; only the totals are public.
-- * Organizers can delete postal addresses and phone numbers once prizes are delivered.

-- ============================================================================
-- 0. Admin check
-- ============================================================================

-- Reads the role from auth.users instead of the JWT. A JWT keeps its claims until it expires
-- (up to an hour), so removing someone's organizer role, or deleting the user, now takes
-- effect immediately. The role is in app_metadata, which users cannot change themselves.
CREATE OR REPLACE FUNCTION public.is_event_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT COALESCE(
    (SELECT u.raw_app_meta_data ->> 'role' FROM auth.users u WHERE u.id = auth.uid())
      IN ('admin', 'organizer'),
    false
  );
$$;

REVOKE EXECUTE ON FUNCTION public.is_event_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_event_admin() TO anon, authenticated;

-- ============================================================================
-- 1. participants
-- ============================================================================

-- Drops every participants policy except the two below, including ones added by hand in the
-- dashboard (the test project had "Public can SELECT for safe view access" USING (true)).
DO $$
DECLARE
  policy RECORD;
BEGIN
  FOR policy IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'participants'
      AND policyname NOT IN (
        'Users can view own full participant record',
        'Admins view participant contact details'
      )
  LOOP
    EXECUTE format('DROP POLICY %I ON public.participants', policy.policyname);
  END LOOP;
END;
$$;

DROP POLICY IF EXISTS "Users can view own full participant record" ON participants;
CREATE POLICY "Users can view own full participant record" ON participants FOR SELECT
  USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admins view participant contact details" ON participants;
CREATE POLICY "Admins view participant contact details" ON participants FOR SELECT
  USING (public.is_event_admin());

-- Remaining SELECT policies: "Users can view own full participant record" (own rows) and
-- "Admins view participant contact details". The public reads participants_safe.
REVOKE ALL ON participants FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON participants FROM authenticated;
GRANT SELECT ON participants TO authenticated;

CREATE OR REPLACE FUNCTION public.register_participant(
  p_full_name TEXT,
  p_postal_address TEXT,
  p_phone_number TEXT,
  p_interests TEXT[]
)
RETURNS TABLE (new_participant_id UUID, new_bib_number INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_email TEXT;
  v_confirmed_at TIMESTAMPTZ;
  v_year INTEGER := public.get_current_event_year();
  v_name TEXT := btrim(regexp_replace(COALESCE(p_full_name, ''), '<[^>]*>', '', 'g'));
  v_address TEXT := btrim(regexp_replace(COALESCE(p_postal_address, ''), '<[^>]*>', '', 'g'));
  v_phone TEXT := NULLIF(btrim(COALESCE(p_phone_number, '')), '');
  v_interests TEXT[];
  v_id UUID;
  v_bib INTEGER;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;

  SELECT u.email, u.email_confirmed_at INTO v_email, v_confirmed_at
  FROM auth.users u
  WHERE u.id = v_uid;

  IF v_email IS NULL OR v_confirmed_at IS NULL THEN
    RAISE EXCEPTION 'Email address is not confirmed';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.event_editions e
    WHERE e.event_year = v_year AND e.registration_open
  ) THEN
    RAISE EXCEPTION 'Registration is closed';
  END IF;

  -- Registering twice returns the existing registration, so retries are harmless.
  SELECT p.id, p.bib_number INTO v_id, v_bib
  FROM public.participants p
  WHERE p.user_id = v_uid AND p.event_year = v_year;

  IF FOUND THEN
    RETURN QUERY SELECT v_id, v_bib;
    RETURN;
  END IF;

  IF char_length(v_name) NOT BETWEEN 2 AND 100 THEN
    RAISE EXCEPTION 'Invalid name';
  END IF;

  IF char_length(v_address) NOT BETWEEN 5 AND 200 THEN
    RAISE EXCEPTION 'Invalid postal address';
  END IF;

  IF v_phone IS NOT NULL AND v_phone !~ '^\+?[0-9 ()-]{5,20}$' THEN
    RAISE EXCEPTION 'Invalid phone number';
  END IF;

  SELECT array_agg(DISTINCT c.slug) INTO v_interests
  FROM public.distance_categories c
  WHERE c.event_year = v_year AND c.slug = ANY (COALESCE(p_interests, ARRAY[]::TEXT[]));

  IF v_interests IS NULL OR cardinality(v_interests) <> cardinality(ARRAY(
    SELECT DISTINCT unnest(p_interests)
  )) THEN
    RAISE EXCEPTION 'Invalid distance categories';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.participants p
    WHERE lower(p.email) = lower(v_email) AND p.event_year = v_year
  ) THEN
    RAISE EXCEPTION 'Email address is already registered';
  END IF;

  -- Bib numbers are assigned here, one registration at a time per year, so they are unique,
  -- sequential and cannot be chosen by the client.
  PERFORM pg_advisory_xact_lock(hashtext('participants_bib_number'), v_year);

  SELECT COALESCE(MAX(p.bib_number), 0) + 1 INTO v_bib
  FROM public.participants p
  WHERE p.event_year = v_year;

  INSERT INTO public.participants (
    user_id, email, full_name, postal_address, phone_number, bib_number, event_year
  ) VALUES (
    v_uid, lower(v_email), v_name, v_address, v_phone, v_bib, v_year
  ) RETURNING id INTO v_id;

  -- seed_2026_distance_interests() adds every category; keep only the chosen ones.
  DELETE FROM public.participant_distance_interests i
  WHERE i.participant_id = v_id AND i.event_year = v_year;

  INSERT INTO public.participant_distance_interests (participant_id, event_year, category_slug)
  SELECT v_id, v_year, slug FROM unnest(v_interests) AS slug;

  RETURN QUERY SELECT v_id, v_bib;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.register_participant(TEXT, TEXT, TEXT, TEXT[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.register_participant(TEXT, TEXT, TEXT, TEXT[]) TO authenticated;

-- Returned email, and has been broken since vote_count was dropped.
DROP FUNCTION IF EXISTS public.get_participant_history(UUID);

-- Unused, and joined participants with the caller's rights, so it is empty for the public.
DROP VIEW IF EXISTS public.current_year_completions;

-- Users can no longer update participants, so the 2025 completion trigger runs as the owner.
ALTER FUNCTION public.update_participant_completion() SECURITY DEFINER;

-- ============================================================================
-- 2. Settings functions: database owner only
-- ============================================================================

CREATE OR REPLACE FUNCTION public.open_submission_window()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.settings
  SET submission_window_open = true, updated_at = NOW(), updated_by = current_user
  WHERE id = 1;
END;
$$;

CREATE OR REPLACE FUNCTION public.close_submission_window()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.settings
  SET submission_window_open = false, updated_at = NOW(), updated_by = current_user
  WHERE id = 1;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_current_event_year(new_year INTEGER)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF new_year < 2025 OR new_year > 2100 THEN
    RAISE EXCEPTION 'Event year must be between 2025 and 2100, got %', new_year;
  END IF;

  UPDATE public.settings
  SET current_event_year = new_year, updated_at = NOW(), updated_by = current_user
  WHERE id = 1;
END;
$$;

-- Run these from the SQL editor (as postgres), never through the API.
REVOKE EXECUTE ON FUNCTION public.open_submission_window() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.close_submission_window() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_current_event_year(INTEGER) FROM PUBLIC, anon, authenticated;

-- ============================================================================
-- 3. runs
-- ============================================================================

DROP POLICY IF EXISTS "Runs are public" ON runs;
CREATE POLICY "Participants and admins view runs" ON runs FOR SELECT
  USING (
    public.is_event_admin()
    OR EXISTS (
      SELECT 1 FROM public.participants p
      WHERE p.id = runs.participant_id AND p.user_id = auth.uid()
    )
  );

-- Columns users may write. donation_amount_nok, updated_at are set by validate_2026_run();
-- created_at and donation_confirmed_at are not writable.
REVOKE ALL ON runs FROM anon;
REVOKE INSERT, UPDATE, TRUNCATE, REFERENCES, TRIGGER ON runs FROM authenticated;
GRANT INSERT (
  participant_id, event_year, run_date, distance_km, donation_amount_nok,
  title, duration_text, comment, evidence_url
) ON runs TO authenticated;
GRANT UPDATE (run_date, distance_km, title, duration_text, comment, evidence_url)
  ON runs TO authenticated;

-- https only; plain http just for a local Supabase stack in development.
ALTER TABLE runs ADD CONSTRAINT runs_evidence_url_https
  CHECK (
    evidence_url IS NULL
    OR evidence_url ~ '^https://[^/\s]+'
    OR evidence_url ~ '^http://(127\.0\.0\.1|localhost)(:[0-9]+)?/'
  ) NOT VALID;

-- Updates that keep the date, distance and owner skip the period checks, so delete_my_account()
-- can clear personal text from a winning run after submissions close. Users still cannot edit
-- closed runs: the RLS update policy requires submissions_open.
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
  IF TG_OP = 'UPDATE'
    AND NEW.participant_id = OLD.participant_id
    AND NEW.event_year = OLD.event_year
    AND NEW.run_date = OLD.run_date
    AND NEW.distance_km = OLD.distance_km
  THEN
    NEW.donation_amount_nok := OLD.donation_amount_nok;
    NEW.created_at := OLD.created_at;
    NEW.updated_at := NOW();
    RETURN NEW;
  END IF;

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

  IF ROUND(NEW.distance_km) < 3 THEN
    RAISE EXCEPTION 'Run distance must be at least 3 km';
  END IF;

  IF NEW.distance_km > 120 THEN
    RAISE EXCEPTION 'Run distance must be at most 120 km';
  END IF;

  NEW.donation_amount_nok := CEIL(NEW.distance_km * edition.donation_rate_nok);
  IF TG_OP = 'UPDATE' THEN
    NEW.created_at := OLD.created_at;
  END IF;
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

-- Public run list without donation amounts or submission timestamps.
DROP VIEW IF EXISTS runs_public;
CREATE VIEW runs_public
WITH (security_invoker = off)
AS
SELECT
  r.id,
  r.participant_id,
  r.event_year,
  r.run_date,
  r.distance_km,
  r.title,
  r.duration_text,
  r.comment,
  r.evidence_url,
  p.full_name,
  p.bib_number,
  ARRAY(
    SELECT i.category_slug
    FROM public.participant_distance_interests i
    WHERE i.participant_id = r.participant_id
      AND i.event_year = r.event_year
    ORDER BY i.category_slug
  ) AS interest_categories
FROM public.runs r
JOIN public.participants p ON p.id = r.participant_id AND p.event_year = r.event_year;

ALTER VIEW runs_public OWNER TO postgres;
REVOKE ALL ON runs_public FROM anon, authenticated;
GRANT SELECT ON runs_public TO anon, authenticated;

-- ============================================================================
-- 4. Prizes and draws
-- ============================================================================

-- "Admins manage prizes" remains for admin reads and writes.
DROP POLICY IF EXISTS "Available prizes are public" ON race_prizes;

ALTER TABLE race_prizes ADD CONSTRAINT race_prizes_website_url_http
  CHECK (website_url IS NULL OR website_url ~ '^https?://[^/\s]+') NOT VALID;
ALTER TABLE event_editions ADD CONSTRAINT event_editions_donation_url_http
  CHECK (donation_url IS NULL OR donation_url ~ '^https?://[^/\s]+') NOT VALID;

-- Published prizes without internal notes.
CREATE VIEW race_prizes_public
WITH (security_invoker = off)
AS
SELECT
  id, event_year, category_slug, race_name, distance_km, donor_name, race_date, website_url,
  status, created_at
FROM public.race_prizes
WHERE status <> 'draft';

ALTER VIEW race_prizes_public OWNER TO postgres;
REVOKE ALL ON race_prizes_public FROM anon, authenticated;
GRANT SELECT ON race_prizes_public TO anon, authenticated;

-- Admins create prizes and edit their text. A prize's distance and category are fixed once
-- created, and only draw_race_prize()/annul_draw() move a prize in or out of 'drawn'.
REVOKE ALL ON race_prizes FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON race_prizes FROM authenticated;
GRANT INSERT (
  event_year, category_slug, race_name, distance_km, donor_name, race_date, website_url,
  notes, status
) ON race_prizes TO authenticated;
GRANT UPDATE (race_name, donor_name, race_date, website_url, notes, status, updated_at)
  ON race_prizes TO authenticated;
GRANT DELETE ON race_prizes TO authenticated;

CREATE OR REPLACE FUNCTION public.protect_drawn_prize_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  -- Inside draw_race_prize()/annul_draw() (SECURITY DEFINER) current_user is the owner.
  IF current_user IN ('anon', 'authenticated') THEN
    IF TG_OP = 'INSERT' AND NEW.status = 'drawn' THEN
      RAISE EXCEPTION 'Prizes are drawn with draw_race_prize()';
    END IF;
    IF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status
      AND (OLD.status = 'drawn' OR NEW.status = 'drawn') THEN
      RAISE EXCEPTION 'Prizes are drawn with draw_race_prize()';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER protect_drawn_prize_status_trigger
  BEFORE INSERT OR UPDATE ON race_prizes
  FOR EACH ROW EXECUTE FUNCTION public.protect_drawn_prize_status();

-- draw_results: admins read, nobody writes directly.
DROP POLICY IF EXISTS "Admins manage draws" ON draw_results;
DROP POLICY IF EXISTS "Published draws are public" ON draw_results;
CREATE POLICY "Admins view draws" ON draw_results FOR SELECT USING (public.is_event_admin());

REVOKE ALL ON draw_results FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON draw_results FROM authenticated;
GRANT SELECT ON draw_results TO authenticated;

-- Published draws, including annulled ones so redraws are visible. Annulled draws do not name
-- the participant, so nobody can see who declined a prize. Admin ids are never public.
CREATE VIEW draw_results_public
WITH (security_invoker = off)
AS
SELECT
  d.id,
  d.event_year,
  d.prize_id,
  CASE WHEN d.annulled_at IS NULL THEN d.participant_id END AS participant_id,
  d.candidate_count,
  d.drawn_at,
  d.published_at,
  d.annulled_at
FROM public.draw_results d
WHERE d.published_at IS NOT NULL;

ALTER VIEW draw_results_public OWNER TO postgres;
REVOKE ALL ON draw_results_public FROM anon, authenticated;
GRANT SELECT ON draw_results_public TO anon, authenticated;

-- Same as 20261020000001, plus a lock so concurrent draws cannot pick the same winner or
-- skip the longest-first rule.
CREATE OR REPLACE FUNCTION draw_race_prize(p_prize_id UUID)
RETURNS draw_results
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  prize public.race_prizes%ROWTYPE;
  edition public.event_editions%ROWTYPE;
  winning_entry RECORD;
  result public.draw_results%ROWTYPE;
BEGIN
  IF NOT public.is_event_admin() THEN
    RAISE EXCEPTION 'Administrator access required';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext('bartelopet_draws'));

  SELECT * INTO prize
  FROM public.race_prizes
  WHERE id = p_prize_id
  FOR UPDATE;

  IF NOT FOUND OR prize.status <> 'available' THEN
    RAISE EXCEPTION 'Prize is not available for drawing';
  END IF;

  SELECT * INTO edition
  FROM public.event_editions
  WHERE event_year = prize.event_year;

  IF edition.registration_open OR edition.submissions_open THEN
    RAISE EXCEPTION 'Close registration and run submissions before drawing';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.draw_results
    WHERE prize_id = p_prize_id AND annulled_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Prize has already been drawn';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.race_prizes p
    WHERE p.event_year = prize.event_year
      AND p.status = 'available'
      AND p.distance_km > prize.distance_km
  ) THEN
    RAISE EXCEPTION 'Longer prizes must be drawn first';
  END IF;

  WITH pot AS (
    SELECT
      e.run_id,
      e.participant_id,
      e.tickets,
      EXISTS (
        SELECT 1 FROM public.draw_results d
        WHERE d.event_year = prize.event_year
          AND d.participant_id = e.participant_id
          AND d.annulled_at IS NULL
      ) AS has_won
    FROM public.eligible_entries e
    WHERE e.event_year = prize.event_year
      AND e.category_slug = prize.category_slug
      AND NOT EXISTS (
        SELECT 1 FROM public.draw_results d
        WHERE d.prize_id = prize.id
          AND d.participant_id = e.participant_id
          AND d.declined
      )
  ),
  eligible AS (
    SELECT * FROM pot
    WHERE NOT has_won OR NOT EXISTS (SELECT 1 FROM pot WHERE NOT has_won)
  )
  SELECT run_id, participant_id, COUNT(*) OVER () AS pot_size INTO winning_entry
  FROM eligible
  CROSS JOIN LATERAL generate_series(1, eligible.tickets)
  ORDER BY gen_random_uuid()
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No eligible entries are available';
  END IF;

  INSERT INTO public.draw_results (
    event_year, prize_id, participant_id, winning_run_id,
    candidate_count, drawn_by, published_at
  ) VALUES (
    prize.event_year, prize.id, winning_entry.participant_id,
    winning_entry.run_id, winning_entry.pot_size, auth.uid(),
    CASE WHEN edition.winners_published THEN NOW() END
  ) RETURNING * INTO result;

  UPDATE public.race_prizes SET status = 'drawn', updated_at = NOW()
  WHERE id = prize.id;

  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION annul_draw(p_result_id UUID, p_declined BOOLEAN)
RETURNS draw_results
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  result public.draw_results%ROWTYPE;
BEGIN
  IF NOT public.is_event_admin() THEN
    RAISE EXCEPTION 'Administrator access required';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext('bartelopet_draws'));

  UPDATE public.draw_results
  SET annulled_at = NOW(), annulled_by = auth.uid(), declined = p_declined
  WHERE id = p_result_id AND annulled_at IS NULL
  RETURNING * INTO result;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Draw not found or already annulled';
  END IF;

  UPDATE public.race_prizes SET status = 'available', updated_at = NOW()
  WHERE id = result.prize_id;

  RETURN result;
END;
$$;

-- Publishing (or hiding) winners. Annulled draws are published too, so a redraw is visible.
-- Publishing keeps earlier timestamps; hiding clears them all.
CREATE OR REPLACE FUNCTION public.publish_draws(p_event_year INTEGER, p_publish BOOLEAN)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT public.is_event_admin() THEN
    RAISE EXCEPTION 'Administrator access required';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext('bartelopet_draws'));

  UPDATE public.event_editions
  SET winners_published = p_publish, updated_at = NOW()
  WHERE event_year = p_event_year;

  IF p_publish THEN
    UPDATE public.draw_results SET published_at = NOW()
    WHERE event_year = p_event_year AND published_at IS NULL;
  ELSE
    UPDATE public.draw_results SET published_at = NULL
    WHERE event_year = p_event_year;
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.draw_race_prize(UUID) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.annul_draw(UUID, BOOLEAN) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.publish_draws(INTEGER, BOOLEAN) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.draw_race_prize(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.annul_draw(UUID, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.publish_draws(INTEGER, BOOLEAN) TO authenticated;

-- Trigger functions are never called through the API.
REVOKE EXECUTE ON FUNCTION public.validate_2026_run() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.seed_2026_distance_interests() FROM PUBLIC, anon, authenticated;

-- ============================================================================
-- 5. 2025 photo votes: the self-vote rule must restrict, not widen, inserts
-- ============================================================================

DROP POLICY IF EXISTS "Participants cannot vote for themselves" ON photo_votes;
CREATE POLICY "Participants cannot vote for themselves" ON photo_votes
  AS RESTRICTIVE FOR INSERT
  WITH CHECK (
    NOT EXISTS (
      SELECT 1 FROM public.completions c
      WHERE c.id = photo_votes.completion_id
        AND c.participant_id = photo_votes.voter_id
    )
  );

-- Votes showed who voted for whom. Voters now see only their own votes; the public sees totals
-- through completions_with_counts, which reads votes with the owner's rights.
DROP POLICY IF EXISTS "Public can view all photo votes (all years)" ON photo_votes;
DROP POLICY IF EXISTS "Public can view all votes (all years)" ON photo_votes;
CREATE POLICY "Voters view own votes" ON photo_votes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.participants p
      WHERE p.id = photo_votes.voter_id AND p.user_id = auth.uid()
    )
  );

ALTER VIEW public.completions_with_counts SET (security_invoker = off);
ALTER VIEW public.completions_with_counts OWNER TO postgres;

-- ============================================================================
-- 6. Storage
-- ============================================================================

-- Public buckets serve /object/public/ URLs without a SELECT policy. These policies only
-- allowed anyone to list every file (and every uploader's id) in the buckets.
DROP POLICY IF EXISTS "Run evidence is public" ON storage.objects;
DROP POLICY IF EXISTS "Public can view completion photos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view completion photos" ON storage.objects;

-- Run evidence lives under <participant id>/, re-encoded on the server without metadata.
DROP POLICY IF EXISTS "Users upload own run evidence" ON storage.objects;
DROP POLICY IF EXISTS "Users update own run evidence" ON storage.objects;
DROP POLICY IF EXISTS "Users delete own run evidence" ON storage.objects;

CREATE POLICY "Participants view own run evidence" ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'run-evidence'
    AND (storage.foldername(name))[1] IN (
      SELECT p.id::TEXT FROM public.participants p WHERE p.user_id = auth.uid()
    )
  );
CREATE POLICY "Participants upload own run evidence" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'run-evidence'
    AND (storage.foldername(name))[1] IN (
      SELECT p.id::TEXT FROM public.participants p WHERE p.user_id = auth.uid()
    )
  );
CREATE POLICY "Participants delete own run evidence" ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'run-evidence'
    AND (storage.foldername(name))[1] IN (
      SELECT p.id::TEXT FROM public.participants p WHERE p.user_id = auth.uid()
    )
  );

UPDATE storage.buckets
SET file_size_limit = 5242880, allowed_mime_types = ARRAY['image/jpeg']
WHERE id = 'run-evidence';

-- 2025 photos live under multi/<year>/<participant id>/. A scalar subquery broke for anyone
-- registered in more than one year.
DROP POLICY IF EXISTS "Users can upload to their multi-image folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own multi-images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own completion photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own completion photos" ON storage.objects;

CREATE POLICY "Users can upload to their multi-image folder" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'completion-photos'
    AND (storage.foldername(name))[1] = 'multi'
    AND (storage.foldername(name))[3] IN (
      SELECT p.id::TEXT FROM public.participants p WHERE p.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can view their own multi-images" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'completion-photos'
    AND (storage.foldername(name))[1] = 'multi'
    AND (storage.foldername(name))[3] IN (
      SELECT p.id::TEXT FROM public.participants p WHERE p.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can delete their own multi-images" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'completion-photos'
    AND (storage.foldername(name))[1] = 'multi'
    AND (storage.foldername(name))[3] IN (
      SELECT p.id::TEXT FROM public.participants p WHERE p.user_id = auth.uid()
    )
  );

-- ============================================================================
-- 7. Data export and account deletion
-- ============================================================================

CREATE OR REPLACE FUNCTION public.export_my_data()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_ids UUID[];
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;

  SELECT COALESCE(array_agg(p.id), ARRAY[]::UUID[]) INTO v_ids
  FROM public.participants p WHERE p.user_id = v_uid;

  RETURN jsonb_build_object(
    'exported_at', NOW(),
    'account', (
      SELECT jsonb_build_object('email', u.email, 'created_at', u.created_at)
      FROM auth.users u WHERE u.id = v_uid
    ),
    'registrations', COALESCE((
      SELECT jsonb_agg(to_jsonb(p) - 'user_id' ORDER BY p.event_year)
      FROM public.participants p WHERE p.id = ANY (v_ids)
    ), '[]'::JSONB),
    'distance_interests', COALESCE((
      SELECT jsonb_agg(to_jsonb(i))
      FROM public.participant_distance_interests i WHERE i.participant_id = ANY (v_ids)
    ), '[]'::JSONB),
    'runs', COALESCE((
      SELECT jsonb_agg(to_jsonb(r) ORDER BY r.run_date)
      FROM public.runs r WHERE r.participant_id = ANY (v_ids)
    ), '[]'::JSONB),
    'prizes_won', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'race_name', rp.race_name, 'drawn_at', d.drawn_at,
        'annulled_at', d.annulled_at, 'declined', d.declined
      ))
      FROM public.draw_results d
      JOIN public.race_prizes rp ON rp.id = d.prize_id
      WHERE d.participant_id = ANY (v_ids)
    ), '[]'::JSONB),
    'completions_2025', COALESCE((
      SELECT jsonb_agg(to_jsonb(c))
      FROM public.completions c WHERE c.participant_id = ANY (v_ids)
    ), '[]'::JSONB),
    'photos_2025', COALESCE((
      SELECT jsonb_agg(to_jsonb(ph))
      FROM public.photos ph WHERE ph.participant_id = ANY (v_ids)
    ), '[]'::JSONB),
    'comments_2025', COALESCE((
      SELECT jsonb_agg(to_jsonb(pc))
      FROM public.photo_comments pc WHERE pc.participant_id = ANY (v_ids)
    ), '[]'::JSONB),
    'votes_2025', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('completion_id', v.completion_id, 'created_at', v.created_at))
      FROM public.photo_votes v WHERE v.voter_id = ANY (v_ids)
    ), '[]'::JSONB)
  );
END;
$$;

-- Deletes the caller's registrations, runs, 2025 entries and auth account. Storage files must
-- be removed through the Storage API first (deleteAccount in app/actions/account.ts does this).
-- A registration that won a prize is anonymized instead of deleted, so the draw history stays
-- verifiable: the name, contact details, run texts and other runs are removed.
CREATE OR REPLACE FUNCTION public.delete_my_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_participant RECORD;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.draw_results d WHERE d.drawn_by = v_uid OR d.annulled_by = v_uid
  ) THEN
    RAISE EXCEPTION 'Organizer accounts must be deleted by an administrator';
  END IF;

  FOR v_participant IN
    SELECT p.id FROM public.participants p WHERE p.user_id = v_uid
  LOOP
    IF EXISTS (SELECT 1 FROM public.draw_results d WHERE d.participant_id = v_participant.id) THEN
      DELETE FROM public.runs r
      WHERE r.participant_id = v_participant.id
        AND NOT EXISTS (SELECT 1 FROM public.draw_results d WHERE d.winning_run_id = r.id);
      UPDATE public.runs
      SET title = NULL, duration_text = NULL, comment = NULL, evidence_url = NULL
      WHERE participant_id = v_participant.id;
      DELETE FROM public.participant_distance_interests i
      WHERE i.participant_id = v_participant.id;
      UPDATE public.participants
      SET full_name = 'Slettet deltaker',
          email = 'slettet-' || v_participant.id || '@invalid',
          postal_address = 'Slettet',
          phone_number = NULL,
          user_id = NULL,
          updated_at = NOW()
      WHERE id = v_participant.id;
    ELSE
      DELETE FROM public.participants WHERE id = v_participant.id;
    END IF;
  END LOOP;

  DELETE FROM auth.users WHERE id = v_uid;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.export_my_data() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.delete_my_account() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.export_my_data() TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_my_account() TO authenticated;

-- ============================================================================
-- 8. Deleting contact details after prize delivery
-- ============================================================================

-- Postal addresses and phone numbers are only needed to deliver prizes. Organizers run this
-- from /admin once prizes are delivered; it can only run after registration and submissions
-- close. Names, e-mail addresses (for login) and runs are kept.
CREATE OR REPLACE FUNCTION public.purge_contact_details(p_event_year INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  IF NOT public.is_event_admin() THEN
    RAISE EXCEPTION 'Administrator access required';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.event_editions e
    WHERE e.event_year = p_event_year AND (e.registration_open OR e.submissions_open)
  ) THEN
    RAISE EXCEPTION 'Close registration and run submissions first';
  END IF;

  UPDATE public.participants
  SET postal_address = 'Slettet', phone_number = NULL, updated_at = NOW()
  WHERE event_year = p_event_year
    AND (postal_address <> 'Slettet' OR phone_number IS NOT NULL);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.purge_contact_details(INTEGER) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.purge_contact_details(INTEGER) TO authenticated;
