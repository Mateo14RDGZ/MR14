-- ============================================================
-- Logo por cliente: bucket público de Storage (paso 1/2)
-- (clients.logo_url ya existe desde 0001_init.sql, nunca se había usado)
-- ============================================================

-- Bucket público: el logo es un asset de marca, no información sensible
-- (a diferencia de "documents"), y se necesita mostrar en la animación de
-- login sin depender de URLs firmadas con expiración.
--
-- Se separa de las políticas (0016) porque insertar en storage.buckets y
-- crear políticas sobre storage.objects en la misma transacción puede
-- generar un deadlock con el proceso de Storage de Supabase, que también
-- lee/escribe esas tablas en paralelo. Ejecutar este archivo primero y
-- el 0016 en una corrida aparte.
insert into storage.buckets (id, name, public)
values ('client-logos', 'client-logos', true)
on conflict (id) do nothing;
