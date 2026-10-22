-- Rate limiting per user in the database, replacing Upstash Redis.
-- One row per user and bucket with a fixed window. Only check_rate_limit() touches the table,
-- and it always uses the caller's own auth.uid(), so nobody can use up another user's quota.
-- The rows go away with the auth user (delete_my_account()).

CREATE TABLE public.rate_limits (
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  bucket TEXT NOT NULL,
  window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  count INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (user_id, bucket)
);

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.rate_limits FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_bucket TEXT,
  p_max INTEGER,
  p_window_seconds INTEGER
)
RETURNS TABLE (allowed BOOLEAN, remaining INTEGER, reset_at TIMESTAMPTZ)
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_window INTERVAL := make_interval(secs => p_window_seconds);
  v_row public.rate_limits;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.rate_limits AS r (user_id, bucket)
  VALUES (v_uid, p_bucket)
  ON CONFLICT (user_id, bucket) DO UPDATE
  SET window_start = CASE WHEN r.window_start + v_window <= NOW() THEN NOW() ELSE r.window_start END,
      count = CASE WHEN r.window_start + v_window <= NOW() THEN 1 ELSE r.count + 1 END
  RETURNING r.* INTO v_row;

  RETURN QUERY SELECT v_row.count <= p_max, GREATEST(p_max - v_row.count, 0), v_row.window_start + v_window;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.check_rate_limit(TEXT, INTEGER, INTEGER) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.check_rate_limit(TEXT, INTEGER, INTEGER) TO authenticated;
