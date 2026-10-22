-- Barteløpet 2026: participants register a run within a day of running it.
-- Runs have a date but no time, so "within 24 hours" means today or yesterday in Europe/Oslo,
-- and the date must be inside the submission period (1–30 November). A changed date or distance
-- counts as a new registration, so it follows the same rule.
-- Service role and database owners (seeding, organiser corrections) may still use any date in
-- the period that is not in the future.

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

  IF auth.role() = 'authenticated' AND NEW.run_date < oslo_today - 1 THEN
    RAISE EXCEPTION 'Run must be registered within a day of the run';
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

REVOKE EXECUTE ON FUNCTION public.validate_2026_run() FROM PUBLIC, anon, authenticated;
