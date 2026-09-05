REVOKE EXECUTE ON FUNCTION public.get_org_view_counts() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_admin_signups_by_day(integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_org_view_counts() TO service_role;
GRANT EXECUTE ON FUNCTION public.get_admin_signups_by_day(integer) TO service_role;