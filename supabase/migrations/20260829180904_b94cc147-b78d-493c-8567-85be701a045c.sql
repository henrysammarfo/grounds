CREATE OR REPLACE FUNCTION public.my_sessions()
RETURNS TABLE (
  id uuid,
  created_at timestamptz,
  refreshed_at timestamptz,
  not_after timestamptz,
  user_agent text,
  ip text,
  is_current boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT s.id,
         s.created_at,
         COALESCE(s.refreshed_at, s.updated_at) AS refreshed_at,
         s.not_after,
         s.user_agent,
         host(s.ip) AS ip,
         s.id = NULLIF(current_setting('request.jwt.claims', true)::jsonb ->> 'session_id', '')::uuid AS is_current
  FROM auth.sessions s
  WHERE s.user_id = auth.uid()
  ORDER BY COALESCE(s.refreshed_at, s.updated_at, s.created_at) DESC
$$;

CREATE OR REPLACE FUNCTION public.revoke_session(_session_id uuid)
RETURNS boolean
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _current uuid := NULLIF(current_setting('request.jwt.claims', true)::jsonb ->> 'session_id', '')::uuid;
  _deleted int;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF _session_id = _current THEN
    RAISE EXCEPTION 'Cannot revoke the session you are currently using';
  END IF;

  DELETE FROM auth.sessions
  WHERE id = _session_id AND user_id = auth.uid();

  GET DIAGNOSTICS _deleted = ROW_COUNT;
  RETURN _deleted > 0;
END;
$$;

REVOKE ALL ON FUNCTION public.my_sessions() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.revoke_session(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.my_sessions() TO authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_session(uuid) TO authenticated;