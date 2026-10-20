-- Barteløpet 2026: fairer prize draws.
-- * One ticket per km: each run gives ROUND(distance_km) tickets in every chosen category it
--   qualifies for. The rounded distance also decides the categories (Mellom over 10, Lang 30+).
-- * Draws are blocked while registration or run submissions are open, so the pot is frozen.
-- * Prizes are drawn longest first, so long-distance runners are not used up on short prizes.
-- * A winner who declines is excluded from the redraw of that prize.
-- * Draws are published immediately when winners are already published.
-- * One prize per participant, unless everyone left in the pot has already won. Then the
--   prize goes to a previous winner instead of staying undrawn. The unique index that
--   enforced one win per participant is replaced by this rule in draw_race_prize().
-- * Winners are picked with gen_random_uuid(), which uses PostgreSQL's strong random source.

ALTER TABLE draw_results ADD COLUMN declined BOOLEAN NOT NULL DEFAULT false;

-- The short category (minimum 0) takes every run; validate_2026_run() enforces the 3 km minimum.
CREATE OR REPLACE VIEW eligible_entries
WITH (security_invoker = off)
AS
SELECT
  r.id AS run_id,
  r.participant_id,
  r.event_year,
  i.category_slug,
  ROUND(r.distance_km)::INTEGER AS tickets
FROM runs r
JOIN participant_distance_interests i
  ON i.participant_id = r.participant_id
 AND i.event_year = r.event_year
JOIN distance_categories c
  ON c.event_year = i.event_year
 AND c.slug = i.category_slug
WHERE c.minimum_km = 0
   OR (c.maximum_km IS NOT NULL AND ROUND(r.distance_km) > c.minimum_km)
   OR (c.maximum_km IS NULL AND ROUND(r.distance_km) >= c.minimum_km);

-- Ticket sums computed in the database. eligible_entries has one row per run and category,
-- which quickly passes the API's 1000-row limit, so pages must not sum it themselves.
CREATE VIEW participant_ticket_totals
WITH (security_invoker = off)
AS
SELECT participant_id, event_year, category_slug, SUM(tickets)::INTEGER AS tickets
FROM eligible_entries
GROUP BY participant_id, event_year, category_slug;

ALTER VIEW participant_ticket_totals OWNER TO postgres;

CREATE VIEW category_ticket_totals
WITH (security_invoker = off)
AS
SELECT event_year, category_slug, SUM(tickets)::INTEGER AS tickets
FROM eligible_entries
GROUP BY event_year, category_slug;

ALTER VIEW category_ticket_totals OWNER TO postgres;

GRANT SELECT ON participant_ticket_totals, category_ticket_totals TO anon, authenticated;

DROP INDEX draw_results_one_active_win_per_participant;

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

  -- The pot is every qualifying ticket except those of anyone who declined this prize.
  -- Previous winners are left out unless nobody else is left. Each run is expanded to one
  -- row per ticket, so a uniform pick gives every ticket the same chance.
  -- COUNT(*) OVER () sees the whole pot before LIMIT picks the winner.
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

GRANT EXECUTE ON FUNCTION annul_draw(UUID, BOOLEAN) TO authenticated;
