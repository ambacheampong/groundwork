CREATE POLICY "Org owners upload own verification docs" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'org-docs' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Org owners read own verification docs" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'org-docs' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.has_role(auth.uid(), 'admin')));

CREATE POLICY "Org owners replace own verification docs" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'org-docs' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'org-docs' AND (storage.foldername(name))[1] = auth.uid()::text);