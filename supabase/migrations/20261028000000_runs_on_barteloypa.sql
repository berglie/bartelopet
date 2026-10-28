-- Participants can mark a run as done on Barteløypa, the 11 km route through Stavanger. The mark
-- is only shown on the public pages. It gives no extra tickets: eligible_entries counts
-- distance only, so the draw stays the same for runners who live elsewhere.
ALTER TABLE runs ADD COLUMN on_barteloypa BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN runs.on_barteloypa IS
  'Run was done on Barteløypa. Display only; never use it for tickets or the draw.';

GRANT INSERT (on_barteloypa), UPDATE (on_barteloypa) ON runs TO authenticated;

-- New columns must come last in CREATE OR REPLACE VIEW.
CREATE OR REPLACE VIEW runs_public
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
  ) AS interest_categories,
  row_number() OVER (PARTITION BY r.event_year ORDER BY r.created_at, r.id) AS submitted_order,
  r.on_barteloypa
FROM public.runs r
JOIN public.participants p ON p.id = r.participant_id AND p.event_year = r.event_year;
