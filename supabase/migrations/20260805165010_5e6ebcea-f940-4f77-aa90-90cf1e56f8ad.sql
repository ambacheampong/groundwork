CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'super_admin'::app_role)
$$;
REVOKE ALL ON FUNCTION public.is_super_admin(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_super_admin(uuid) TO authenticated, service_role;

-- Only a super admin may approve/reject an invite.
CREATE OR REPLACE FUNCTION public.enforce_invite_approval()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status AND NEW.status IN ('approved','rejected') THEN
    IF NEW.approved_by IS NULL AND NEW.rejected_by IS NULL THEN
      RAISE EXCEPTION 'invite approval requires a reviewer';
    END IF;
    IF NOT public.is_super_admin(COALESCE(NEW.approved_by, NEW.rejected_by)) THEN
      RAISE EXCEPTION 'only a super admin can approve or reject invite codes';
    END IF;
  END IF;
  IF NEW.used_at IS NOT NULL AND OLD.used_at IS NULL AND NEW.status <> 'approved' THEN
    RAISE EXCEPTION 'invite code is not approved';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.enforce_invite_approval() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS account_invites_approval_gate ON public.account_invites;
CREATE TRIGGER account_invites_approval_gate
BEFORE UPDATE ON public.account_invites
FOR EACH ROW EXECUTE FUNCTION public.enforce_invite_approval();

-- Only a super admin may grant or revoke admin-level roles from the app layer.
DROP POLICY IF EXISTS "Admins manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
CREATE POLICY "Super admins manage admin roles"
ON public.user_roles FOR ALL TO authenticated
USING (public.is_super_admin(auth.uid()))
WITH CHECK (public.is_super_admin(auth.uid()));

-- Seed the owner as super admin.
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'super_admin'::app_role FROM auth.users u
WHERE lower(u.email) = 'acheampomgseth660@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;