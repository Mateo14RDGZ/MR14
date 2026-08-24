-- ============================================================
-- Logo por cliente: políticas de Storage (paso 2/2 — ejecutar después de 0015)
-- ============================================================

create policy "public_read_client_logos"
  on storage.objects for select
  using (bucket_id = 'client-logos');

create policy "admin_write_client_logos"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'client-logos' and is_admin());

create policy "admin_update_client_logos"
  on storage.objects for update to authenticated
  using (bucket_id = 'client-logos' and is_admin());

create policy "admin_delete_client_logos"
  on storage.objects for delete to authenticated
  using (bucket_id = 'client-logos' and is_admin());
