ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'super_admin';

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS recovery_hint text,
  ADD COLUMN IF NOT EXISTS recovery_hint_set_at timestamptz;

ALTER TABLE public.account_invites
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'approved',
  ADD COLUMN IF NOT EXISTS approved_by uuid,
  ADD COLUMN IF NOT EXISTS approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS rejected_by uuid,
  ADD COLUMN IF NOT EXISTS rejected_at timestamptz;

UPDATE public.account_invites SET status = 'approved' WHERE status IS NULL;