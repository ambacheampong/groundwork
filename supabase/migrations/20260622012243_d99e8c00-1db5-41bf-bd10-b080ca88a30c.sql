
-- Enums
CREATE TYPE public.app_role AS ENUM ('user', 'admin');
CREATE TYPE public.org_type AS ENUM ('company', 'ngo', 'government', 'academic', 'foundation');
CREATE TYPE public.opportunity_category AS ENUM ('scholarship', 'postgraduate', 'fellowship', 'internship', 'job', 'freelance', 'programme');
CREATE TYPE public.source_type AS ENUM ('direct', 'aggregator', 'official_page');
CREATE TYPE public.education_level AS ENUM ('secondary', 'undergraduate', 'graduate', 'postgraduate', 'professional');

-- updated_at helper
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  country TEXT,
  education_level public.education_level,
  fields_of_interest TEXT[] NOT NULL DEFAULT '{}',
  onboarded BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile read" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE TRIGGER profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- user_roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- organisations
CREATE TABLE public.organisations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  type public.org_type NOT NULL,
  country TEXT,
  description TEXT,
  logo_url TEXT,
  website TEXT,
  verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.organisations TO anon, authenticated;
GRANT ALL ON public.organisations TO service_role;
ALTER TABLE public.organisations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read organisations" ON public.organisations FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "admin write organisations" ON public.organisations FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER organisations_updated BEFORE UPDATE ON public.organisations FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- opportunities
CREATE TABLE public.opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category public.opportunity_category NOT NULL,
  location TEXT,
  remote BOOLEAN NOT NULL DEFAULT false,
  fields TEXT[] NOT NULL DEFAULT '{}',
  eligibility_summary TEXT,
  description TEXT NOT NULL,
  apply_url TEXT NOT NULL,
  source_url TEXT,
  source_type public.source_type NOT NULL DEFAULT 'direct',
  last_verified_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  opens_at TIMESTAMPTZ,
  deadline_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.opportunities TO anon, authenticated;
GRANT ALL ON public.opportunities TO service_role;
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read opportunities" ON public.opportunities FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "admin write opportunities" ON public.opportunities FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER opportunities_updated BEFORE UPDATE ON public.opportunities FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX opportunities_deadline_idx ON public.opportunities (deadline_at);
CREATE INDEX opportunities_category_idx ON public.opportunities (category);

-- saved_opportunities
CREATE TABLE public.saved_opportunities (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  opportunity_id UUID NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, opportunity_id)
);
GRANT SELECT, INSERT, DELETE ON public.saved_opportunities TO authenticated;
GRANT ALL ON public.saved_opportunities TO service_role;
ALTER TABLE public.saved_opportunities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own saves" ON public.saved_opportunities FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- tracked_organisations
CREATE TABLE public.tracked_organisations (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, org_id)
);
GRANT SELECT, INSERT, DELETE ON public.tracked_organisations TO authenticated;
GRANT ALL ON public.tracked_organisations TO service_role;
ALTER TABLE public.tracked_organisations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own tracks" ON public.tracked_organisations FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
