
-- Profile columns
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS first_name text,
  ADD COLUMN IF NOT EXISTS last_name text,
  ADD COLUMN IF NOT EXISTS date_of_birth date,
  ADD COLUMN IF NOT EXISTS gender text,
  ADD COLUMN IF NOT EXISTS bio text,
  ADD COLUMN IF NOT EXISTS avatar_path text,
  ADD COLUMN IF NOT EXISTS banner_path text,
  ADD COLUMN IF NOT EXISTS institution text,
  ADD COLUMN IF NOT EXISTS field_of_study text,
  ADD COLUMN IF NOT EXISTS skills text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- Storage policies: each user manages their own folder <bucket>/<uid>/...
CREATE POLICY "own avatar read"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "own avatar write"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "own avatar update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "own avatar delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "own banner read"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'banners' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "own banner write"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'banners' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "own banner update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'banners' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "own banner delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'banners' AND (storage.foldername(name))[1] = auth.uid()::text);
