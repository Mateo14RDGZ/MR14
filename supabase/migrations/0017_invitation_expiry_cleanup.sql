-- ============================================================
-- Links de invitación: vencen a los 2 días (antes 14) y se borran solos
-- ============================================================
-- Al completar el registro ya se borraba la invitación (completeInvitationAction,
-- src/actions/members.ts) — esta migración cubre el otro caso: el link que
-- nadie usó. Antes quedaba en la tabla para siempre (solo se trataba como
-- "vencido" al leerlo, sin borrarse nunca). Ahora se borra solo.

alter table client_invitations
  alter column expires_at set default (now() + interval '2 days');

-- pg_cron corre DENTRO de Postgres — no depende de que la app esté
-- desplegada ni de un cron externo (Vercel, etc.). Si el proyecto de
-- Supabase no tiene la extensión disponible, este `create extension`
-- falla y hay que habilitarla a mano desde Database > Extensions antes
-- de reintentar esta migración.
create extension if not exists pg_cron with schema extensions;

select
  cron.schedule(
    'delete-expired-client-invitations',
    '0 6 * * *', -- todos los días a las 06:00 UTC (03:00 en Uruguay)
    $$ delete from client_invitations where used_at is null and expires_at < now(); $$
  )
where not exists (
  select 1 from cron.job where jobname = 'delete-expired-client-invitations'
);
