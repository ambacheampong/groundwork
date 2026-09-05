
ALTER TABLE public.opportunities
  ADD CONSTRAINT opportunities_apply_url_safe_scheme
  CHECK (apply_url ~* '^https?://');

ALTER TABLE public.opportunities
  ADD CONSTRAINT opportunities_source_url_safe_scheme
  CHECK (source_url IS NULL OR source_url ~* '^https?://');

ALTER TABLE public.organisations
  ADD CONSTRAINT organisations_website_safe_scheme
  CHECK (website IS NULL OR website ~* '^https?://');

CREATE POLICY "admins manage user_roles insert"
  ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admins manage user_roles update"
  ON public.user_roles FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admins manage user_roles delete"
  ON public.user_roles FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
