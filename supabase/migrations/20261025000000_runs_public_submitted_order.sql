-- "Siste turer" needs runs in the order they were registered. Runs have a date but no time, so
-- run_date alone cannot tell today's runs apart. submitted_order exposes only that order, not
-- the submission timestamps the view leaves out on purpose. Numbered per year, so a query for
-- one year does not number every year's runs.
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
  row_number() OVER (PARTITION BY r.event_year ORDER BY r.created_at, r.id) AS submitted_order
FROM public.runs r
JOIN public.participants p ON p.id = r.participant_id AND p.event_year = r.event_year;
