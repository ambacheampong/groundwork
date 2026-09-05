-- Both "admin write" RLS policies (from the original migrations) were never
-- usable because authenticated users were only ever GRANTed SELECT on these
-- two tables. Postgres checks table-level GRANTs before row-level policies,
-- so admins got "permission denied for table X" regardless of their role.
-- RLS still correctly restricts this to admins only — this just grants the
-- table-level permission the existing policies already assumed.
GRANT UPDATE, DELETE ON public.opportunities TO authenticated;
GRANT UPDATE, DELETE ON public.organisations TO authenticated;
