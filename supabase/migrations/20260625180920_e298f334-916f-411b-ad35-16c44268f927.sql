
-- organisation_views: remove public row reads, keep counts public via definer view
DROP POLICY IF EXISTS "counts via view" ON public.organisation_views;

-- Aggregate counts view bypasses RLS so anon can still read counts
ALTER VIEW public.organisation_view_counts SET (security_invoker = false);
GRANT SELECT ON public.organisation_view_counts TO anon, authenticated;

-- Tighten INSERT: anon must insert null user_id; authenticated must insert own user_id
DROP POLICY IF EXISTS "anyone records a view" ON public.organisation_views;
CREATE POLICY "anyone records a view"
  ON public.organisation_views
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());

-- community_members: restrict reads to authenticated users
DROP POLICY IF EXISTS "public read members" ON public.community_members;
CREATE POLICY "authenticated read members"
  ON public.community_members
  FOR SELECT
  TO authenticated
  USING (true);

REVOKE SELECT ON public.community_members FROM anon;
