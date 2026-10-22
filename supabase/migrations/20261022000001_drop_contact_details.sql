-- Prizes are delivered digitally from 2026, so postal addresses and phone numbers are no longer
-- needed. Winners are contacted by e-mail. This drops both columns, which also deletes the
-- addresses and phone numbers stored for earlier years, and removes the copies kept in auth
-- metadata for e-mail signups that were never confirmed.

DROP FUNCTION IF EXISTS public.purge_contact_details(INTEGER);
DROP FUNCTION IF EXISTS public.register_participant(TEXT, TEXT, TEXT, TEXT[]);

CREATE OR REPLACE FUNCTION public.register_participant(
  p_full_name TEXT,
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

  INSERT INTO public.participants (user_id, email, full_name, bib_number, event_year)
  VALUES (v_uid, lower(v_email), v_name, v_bib, v_year)
  RETURNING id INTO v_id;

  -- seed_2026_distance_interests() adds every category; keep only the chosen ones.
  DELETE FROM public.participant_distance_interests i
  WHERE i.participant_id = v_id AND i.event_year = v_year;

  INSERT INTO public.participant_distance_interests (participant_id, event_year, category_slug)
  SELECT v_id, v_year, slug FROM unnest(v_interests) AS slug;

  RETURN QUERY SELECT v_id, v_bib;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.register_participant(TEXT, TEXT[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.register_participant(TEXT, TEXT[]) TO authenticated;

-- Same as before, without the contact columns.
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

ALTER TABLE public.participants DROP COLUMN IF EXISTS postal_address;
ALTER TABLE public.participants DROP COLUMN IF EXISTS phone_number;

UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data
  #- '{registration,postal_address}'
  #- '{registration,phone_number}'
WHERE raw_user_meta_data -> 'registration' ?| ARRAY['postal_address', 'phone_number'];
