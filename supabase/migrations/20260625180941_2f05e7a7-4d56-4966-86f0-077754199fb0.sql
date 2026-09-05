
ALTER VIEW public.organisation_view_counts SET (security_invoker = true);

CREATE OR REPLACE FUNCTION public.get_org_view_counts()
RETURNS TABLE(org_id uuid, view_count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT org_id, count(*)::bigint AS view_count
  FROM public.organisation_views
  GROUP BY org_id;
$$;

REVOKE ALL ON FUNCTION public.get_org_view_counts() FROM public;
GRANT EXECUTE ON FUNCTION public.get_org_view_counts() TO anon, authenticated;
