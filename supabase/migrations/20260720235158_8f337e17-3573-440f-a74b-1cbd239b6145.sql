
-- Admin email allowlist
CREATE EXTENSION IF NOT EXISTS citext;

CREATE TABLE public.admin_email_allowlist (
  email citext PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.admin_email_allowlist TO authenticated;
GRANT ALL ON public.admin_email_allowlist TO service_role;
ALTER TABLE public.admin_email_allowlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins read allowlist" ON public.admin_email_allowlist
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins write allowlist" ON public.admin_email_allowlist
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins delete allowlist" ON public.admin_email_allowlist
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Auto-grant admin on verified signup when email is allowlisted
CREATE OR REPLACE FUNCTION public.grant_admin_if_allowlisted()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email_confirmed_at IS NOT NULL
     AND EXISTS (SELECT 1 FROM public.admin_email_allowlist WHERE email = NEW.email) THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_grant_admin
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.grant_admin_if_allowlisted();

CREATE TRIGGER on_auth_user_confirmed_grant_admin
AFTER UPDATE OF email_confirmed_at ON auth.users
FOR EACH ROW
WHEN (OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL)
EXECUTE FUNCTION public.grant_admin_if_allowlisted();

-- Moderation flags
ALTER TABLE public.opportunities ADD COLUMN IF NOT EXISTS featured boolean NOT NULL DEFAULT false;
ALTER TABLE public.opportunities ADD COLUMN IF NOT EXISTS hidden_at timestamptz;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS hidden_at timestamptz;
ALTER TABLE public.post_comments ADD COLUMN IF NOT EXISTS hidden_at timestamptz;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS banned_at timestamptz;

-- Admins can update/delete opportunities and organisations
CREATE POLICY "admins update opportunities" ON public.opportunities
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins delete opportunities" ON public.opportunities
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins insert opportunities" ON public.opportunities
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admins update organisations" ON public.organisations
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins delete organisations" ON public.organisations
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins insert organisations" ON public.organisations
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admins update posts" ON public.posts
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins delete posts" ON public.posts
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admins update comments" ON public.post_comments
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins delete comments" ON public.post_comments
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admins update profiles" ON public.profiles
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Aggregated admin stats via SECURITY DEFINER (avoid leaking raw PII to non-admins)
CREATE OR REPLACE FUNCTION public.get_admin_signups_by_day(_days int DEFAULT 30)
RETURNS TABLE(day date, count bigint)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  RETURN QUERY
    SELECT (created_at AT TIME ZONE 'UTC')::date AS day, count(*)::bigint
    FROM auth.users
    WHERE created_at >= now() - (_days || ' days')::interval
    GROUP BY 1
    ORDER BY 1;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_admin_signups_by_day(int) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_admin_signups_by_day(int) TO authenticated;
