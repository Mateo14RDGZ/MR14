-- ============================================================
-- INVITACIONES DE CLIENTE (link con formulario de auto-registro)
-- ============================================================
-- El admin genera un token asociado a un cliente. El cliente abre
-- /invitacion/<token>, completa sus propios datos y contraseña, y el
-- usuario + client_members se crean automáticamente. Todo el acceso a
-- esta tabla se hace desde server actions con el cliente de service
-- role (bypassa RLS), así que las políticas de abajo solo cubren el
-- acceso directo de un usuario autenticado normal.

create table client_invitations (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid not null references clients(id) on delete cascade,
  token text not null unique,
  role_in_client text not null default 'colaborador',
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '14 days'),
  used_at timestamptz
);

create index idx_client_invitations_client on client_invitations(client_id);
create index idx_client_invitations_token on client_invitations(token);

alter table client_invitations enable row level security;

create policy "admin_all_client_invitations" on client_invitations
  for all to authenticated using (is_admin()) with check (is_admin());

-- Datos adicionales del miembro del cliente, completados por él mismo
-- al aceptar la invitación.
alter table client_members add column if not exists phone text;
