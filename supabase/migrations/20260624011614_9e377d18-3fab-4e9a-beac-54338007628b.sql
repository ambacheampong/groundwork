
-- ============ NOTIFICATIONS ============
CREATE TYPE public.notification_kind AS ENUM ('activity', 'opportunity', 'system');

CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind public.notification_kind NOT NULL,
  title text NOT NULL,
  body text,
  link text CHECK (link IS NULL OR link ~* '^(https?://|/)'),
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX notifications_user_created_idx ON public.notifications(user_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own notifications read" ON public.notifications
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own notifications update" ON public.notifications
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own notifications delete" ON public.notifications
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "admins write notifications" ON public.notifications
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin') OR auth.uid() = user_id);

-- ============ ORG VIEWS ============
CREATE TABLE public.organisation_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX organisation_views_org_idx ON public.organisation_views(org_id);

GRANT INSERT ON public.organisation_views TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.organisation_views TO service_role;
GRANT ALL ON public.organisation_views TO service_role;

ALTER TABLE public.organisation_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone records a view" ON public.organisation_views
  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "admins read views" ON public.organisation_views
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE VIEW public.organisation_view_counts
WITH (security_invoker = true) AS
SELECT org_id, COUNT(*)::bigint AS view_count
FROM public.organisation_views
GROUP BY org_id;

-- view inherits caller perms; expose counts to all
GRANT SELECT ON public.organisation_view_counts TO anon, authenticated;
-- need underlying SELECT for the aggregate to work via the view (security_invoker)
CREATE POLICY "counts via view" ON public.organisation_views
  FOR SELECT TO anon, authenticated USING (true);

-- ============ COMMUNITIES ============
CREATE TYPE public.community_kind AS ENUM ('topic', 'region', 'org', 'general');

CREATE TABLE public.communities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  kind public.community_kind NOT NULL DEFAULT 'topic',
  banner_url text CHECK (banner_url IS NULL OR banner_url ~* '^https?://'),
  icon_url text CHECK (icon_url IS NULL OR icon_url ~* '^https?://'),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX communities_kind_idx ON public.communities(kind);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.communities TO authenticated;
GRANT SELECT ON public.communities TO anon;
GRANT ALL ON public.communities TO service_role;

ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read communities" ON public.communities
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "signed-in create communities" ON public.communities
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "creator updates community" ON public.communities
  FOR UPDATE TO authenticated USING (auth.uid() = created_by) WITH CHECK (auth.uid() = created_by);
CREATE POLICY "creator deletes community" ON public.communities
  FOR DELETE TO authenticated USING (auth.uid() = created_by);

CREATE TRIGGER communities_updated_at BEFORE UPDATE ON public.communities
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- members
CREATE TABLE public.community_members (
  community_id uuid NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (community_id, user_id)
);
GRANT SELECT, INSERT, DELETE ON public.community_members TO authenticated;
GRANT SELECT ON public.community_members TO anon;
GRANT ALL ON public.community_members TO service_role;

ALTER TABLE public.community_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read members" ON public.community_members
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "join community" ON public.community_members
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "leave community" ON public.community_members
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============ POSTS ============
CREATE TYPE public.post_kind AS ENUM ('post', 'repost', 'quote');

CREATE TABLE public.posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id uuid NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind public.post_kind NOT NULL DEFAULT 'post',
  parent_post_id uuid REFERENCES public.posts(id) ON DELETE SET NULL,
  title text,
  body text,
  link_url text CHECK (link_url IS NULL OR link_url ~* '^https?://'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX posts_community_created_idx ON public.posts(community_id, created_at DESC);
CREATE INDEX posts_author_idx ON public.posts(author_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.posts TO authenticated;
GRANT SELECT ON public.posts TO anon;
GRANT ALL ON public.posts TO service_role;

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read posts" ON public.posts
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "signed-in create posts" ON public.posts
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);
CREATE POLICY "author updates post" ON public.posts
  FOR UPDATE TO authenticated USING (auth.uid() = author_id) WITH CHECK (auth.uid() = author_id);
CREATE POLICY "author deletes post" ON public.posts
  FOR DELETE TO authenticated USING (auth.uid() = author_id);

CREATE TRIGGER posts_updated_at BEFORE UPDATE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- comments
CREATE TABLE public.post_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_comment_id uuid REFERENCES public.post_comments(id) ON DELETE CASCADE,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX post_comments_post_idx ON public.post_comments(post_id, created_at);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.post_comments TO authenticated;
GRANT SELECT ON public.post_comments TO anon;
GRANT ALL ON public.post_comments TO service_role;

ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read comments" ON public.post_comments
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "signed-in create comments" ON public.post_comments
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);
CREATE POLICY "author updates comment" ON public.post_comments
  FOR UPDATE TO authenticated USING (auth.uid() = author_id) WITH CHECK (auth.uid() = author_id);
CREATE POLICY "author deletes comment" ON public.post_comments
  FOR DELETE TO authenticated USING (auth.uid() = author_id);

CREATE TRIGGER post_comments_updated_at BEFORE UPDATE ON public.post_comments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- votes
CREATE TABLE public.post_votes (
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vote smallint NOT NULL CHECK (vote IN (-1, 1)),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.post_votes TO authenticated;
GRANT SELECT ON public.post_votes TO anon;
GRANT ALL ON public.post_votes TO service_role;

ALTER TABLE public.post_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read votes" ON public.post_votes
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "own vote insert" ON public.post_votes
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own vote update" ON public.post_votes
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own vote delete" ON public.post_votes
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============ SEED A FEW DEFAULT COMMUNITIES ============
INSERT INTO public.communities (slug, name, description, kind) VALUES
  ('scholarships', 'Scholarships', 'Funding for studies abroad and at home.', 'topic'),
  ('fellowships', 'Fellowships', 'Research and leadership fellowships.', 'topic'),
  ('grants', 'Grants', 'Project, travel, and research grants.', 'topic'),
  ('africa', 'Africa', 'Opportunities and conversations across Africa.', 'region'),
  ('lounge', 'The Lounge', 'Off-topic chat for Groundwork members.', 'general')
ON CONFLICT (slug) DO NOTHING;
