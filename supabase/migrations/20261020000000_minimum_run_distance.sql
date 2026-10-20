-- Barteløpet 2026: distance limits for runs, and donation no longer required.
-- Distances are rounded to the nearest whole km for tickets and categories, so the official
-- 3 km minimum accepts 2.5 km and up (GPS slack). The 120 km maximum catches typos.
-- Mirrors MIN_RUN_KM and MAX_RUN_KM in app/_shared/types/event-2026.ts.

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

  IF ROUND(NEW.distance_km) < 3 THEN
    RAISE EXCEPTION 'Run distance must be at least 3 km';
  END IF;

  IF NEW.distance_km > 120 THEN
    RAISE EXCEPTION 'Run distance must be at most 120 km';
  END IF;

  NEW.donation_amount_nok := CEIL(NEW.distance_km * edition.donation_rate_nok);
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

UPDATE distance_categories
SET label = 'Opptil 10 km'
WHERE event_year = 2026 AND slug = 'short';

-- Donating is encouraged but no longer a condition for registering a run. Tickets come from
-- activity only: a required donation would be a stake (innsats) under pengespilloven § 2, and
-- Spleis does not allow prize draws among donors. Old rows keep their timestamp.
ALTER TABLE runs ALTER COLUMN donation_confirmed_at DROP NOT NULL;
