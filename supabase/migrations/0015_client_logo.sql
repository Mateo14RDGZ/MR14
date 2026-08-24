-- ============================================================
-- Logo por cliente: bucket público de Storage
-- (clients.logo_url ya existe desde 0001_init.sql, nunca se había usado)
-- ============================================================

-- Bucket público: el logo es un asset de marca, no información sensible
-- (a diferencia de "documents"), y se necesita mostrar en la animación de
-- login sin depender de URLs firmadas con expiración.
insert into storage.buckets (id, name, public)
values ('client-logos', 'client-logos', true)
on conflict (id) do nothing;

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
