-- Study level enum
DO $$ BEGIN
  CREATE TYPE public.study_level AS ENUM ('undergraduate','masters','phd','fellowship','job','other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Extend opportunities
ALTER TABLE public.opportunities
  ADD COLUMN IF NOT EXISTS source_url text,
  ADD COLUMN IF NOT EXISTS source_name text,
  ADD COLUMN IF NOT EXISTS study_level public.study_level,
  ADD COLUMN IF NOT EXISTS funding_type text,
  ADD COLUMN IF NOT EXISTS ingested_at timestamptz,
  ADD COLUMN IF NOT EXISTS raw jsonb;

CREATE UNIQUE INDEX IF NOT EXISTS opportunities_source_url_key
  ON public.opportunities (source_url) WHERE source_url IS NOT NULL;

-- Ingestion runs log
CREATE TABLE IF NOT EXISTS public.ingestion_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  inserted_count int NOT NULL DEFAULT 0,
  updated_count int NOT NULL DEFAULT 0,
  error_count int NOT NULL DEFAULT 0,
  notes text
);

GRANT SELECT ON public.ingestion_runs TO authenticated;
GRANT ALL ON public.ingestion_runs TO service_role;

ALTER TABLE public.ingestion_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins read ingestion runs"
  ON public.ingestion_runs FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
