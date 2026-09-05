-- 1. new role value (not referenced elsewhere in this migration)
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'org';

-- 2. profile additions
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS must_change_password boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_login_at timestamptz;

-- 3. organisation applications
CREATE TABLE IF NOT EXISTS public.org_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_name text NOT NULL,
  org_type public.org_type NOT NULL,
  official_email text NOT NULL,
  website text,
  document_path text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  review_note text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  org_id uuid REFERENCES public.organisations(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.org_applications TO authenticated;
GRANT ALL ON public.org_applications TO service_role;
ALTER TABLE public.org_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners read own application" ON public.org_applications
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Owners create own application" ON public.org_applications
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins update applications" ON public.org_applications
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER org_applications_updated_at BEFORE UPDATE ON public.org_applications
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 4. single-use invite codes
CREATE TABLE IF NOT EXISTS public.account_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  role text NOT NULL CHECK (role IN ('user','org','admin')),
  email text,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  used_by uuid,
  revoked_at timestamptz,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.account_invites TO authenticated;
GRANT ALL ON public.account_invites TO service_role;
ALTER TABLE public.account_invites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read invites" ON public.account_invites
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 5. admin audit trail
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid NOT NULL,
  actor_email text,
  action text NOT NULL,
  target_type text,
  target_id text,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.admin_audit_log TO authenticated;
GRANT ALL ON public.admin_audit_log TO service_role;
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read audit log" ON public.admin_audit_log
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));