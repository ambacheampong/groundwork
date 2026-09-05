
-- Lock down SECURITY DEFINER functions to least privilege.
REVOKE ALL ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_org_view_counts() FROM PUBLIC, anon, authenticated;

-- has_role is referenced from RLS policies evaluated as the authenticated role.
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

-- get_org_view_counts is called via .rpc() from both anonymous visitors and signed-in users.
GRANT EXECUTE ON FUNCTION public.get_org_view_counts() TO anon, authenticated;
