ALTER TABLE public.opportunities
  ADD COLUMN IF NOT EXISTS salary_min numeric,
  ADD COLUMN IF NOT EXISTS salary_max numeric,
  ADD COLUMN IF NOT EXISTS salary_currency text,
  ADD COLUMN IF NOT EXISTS salary_period text,
  ADD COLUMN IF NOT EXISTS work_mode text;

ALTER TABLE public.opportunities
  ADD CONSTRAINT opportunities_work_mode_check
  CHECK (work_mode IS NULL OR work_mode IN ('remote','onsite','hybrid'));

UPDATE public.opportunities SET work_mode = CASE WHEN remote THEN 'remote' ELSE 'onsite' END WHERE work_mode IS NULL;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS privacy_consent_at timestamptz,
  ADD COLUMN IF NOT EXISTS privacy_consent_version text,
  ADD COLUMN IF NOT EXISTS app_language text NOT NULL DEFAULT 'en',
  ADD COLUMN IF NOT EXISTS last_active_at timestamptz;