-- MR14 · Roles, Portal de Clientes y Row Level Security multi-tenant
-- Requiere haber ejecutado 0001_init.sql

-- ============================================================
-- ENUMS NUEVOS
-- ============================================================
create type user_role as enum ('admin','client');
create type credential_visibility as enum ('internal','client','temporary');
create type document_visibility as enum ('internal','client');
create type history_visibility as enum ('internal','client');
create type member_status as enum ('invited','active');
create type request_type as enum ('cambio_contenido','problema_web','nueva_funcionalidad','dominio','correo','otro');
create type request_priority as enum ('baja','media','alta');
create type request_status as enum ('recibida','en_revision','en_proceso','resuelta');
create type project_stage as enum (
  'contrato','anticipo','material','desarrollo','primera_version',
  'revision','ajustes','pago_final','publicado','entregado'
);

-- ============================================================
-- PROFILES (1:1 con auth.users)
-- ============================================================
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  avatar_url text,
  role user_role not null default 'client',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_profiles_updated before update on profiles for each row execute function set_updated_at();

-- Crea automáticamente un profile (rol client por defecto) cuando se crea un auth.users.
-- El primer admin se promueve manualmente: update profiles set role='admin' where id = '<uuid>';
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''), 'client')
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger trg_handle_new_user
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Evita que un usuario no-admin escale su propio rol.
create or replace function public.protect_profile_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role <> old.role and not public.is_admin() then
    new.role := old.role;
  end if;
  return new;
end;
$$;

create trigger trg_protect_profile_role
  before update on profiles
  for each row execute function public.protect_profile_role();

-- ============================================================
-- CLIENT MEMBERS (usuarios autorizados por cliente)
-- ============================================================
create table client_members (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid not null references clients(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  email text not null,
  name text,
  role_in_client text not null default 'colaborador', -- 'owner' | 'colaborador'
  status member_status not null default 'invited',
  invited_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  unique (client_id, user_id)
);

create index idx_client_members_client on client_members(client_id);
create index idx_client_members_user on client_members(user_id);

-- ============================================================
-- FUNCIONES DE AUTORIZACIÓN (security definer para evitar recursión de RLS)
-- ============================================================
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function public.is_client_member(target_client_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from client_members
    where client_id = target_client_id and user_id = auth.uid()
  );
$$;

create or replace function public.member_client_ids()
returns setof uuid
language sql
security definer
stable
set search_path = public
as $$
  select client_id from client_members where user_id = auth.uid();
$$;

create or replace function public.project_client_id(pid uuid)
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select client_id from projects where id = pid;
$$;

-- ============================================================
-- COLUMNAS NUEVAS: visibilidad y progreso
-- ============================================================
alter table credentials add column visibility credential_visibility not null default 'internal';
alter table credentials add column visible_until timestamptz;

alter table documents add column visibility document_visibility not null default 'internal';

alter table project_history add column visibility history_visibility not null default 'internal';

alter table projects add column stage project_stage not null default 'contrato';
alter table projects add column progress_percent int not null default 0;
alter table projects add column next_step text;
alter table projects add column amount_paid numeric(12,2) not null default 0;

-- Recalcular balance en función de amount_paid en lugar de deposit
alter table projects drop column balance;
alter table projects add column balance numeric(12,2) generated always as (coalesce(price,0) - coalesce(amount_paid,0)) stored;

-- ============================================================
-- PAYMENTS (pagos registrados manualmente por MR14)
-- ============================================================
create table payments (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid not null references clients(id) on delete cascade,
  project_id uuid not null references projects(id) on delete cascade,
  amount numeric(12,2) not null,
  method text,
  paid_at date not null default current_date,
  receipt_document_id uuid references documents(id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id)
);

create index idx_payments_project on payments(project_id);
create index idx_payments_client on payments(client_id);

create or replace function public.recompute_project_amount_paid()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  pid uuid;
begin
  pid := coalesce(new.project_id, old.project_id);
  update projects
  set amount_paid = (select coalesce(sum(amount), 0) from payments where project_id = pid)
  where id = pid;
  return null;
end;
$$;

create trigger trg_payments_recompute
  after insert or update or delete on payments
  for each row execute function public.recompute_project_amount_paid();

-- ============================================================
-- REQUESTS (solicitudes / soporte simple)
-- ============================================================
create table requests (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid not null references clients(id) on delete cascade,
  project_id uuid references projects(id) on delete set null,
  created_by uuid references auth.users(id),
  type request_type not null default 'otro',
  title text not null,
  description text,
  priority request_priority not null default 'media',
  status request_status not null default 'recibida',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_requests_updated before update on requests for each row execute function set_updated_at();
create index idx_requests_client on requests(client_id);

-- ============================================================
-- CREDENTIAL ACCESS LOG
-- ============================================================
create table credential_access_log (
  id uuid primary key default uuid_generate_v4(),
  credential_id uuid not null references credentials(id) on delete cascade,
  user_id uuid references auth.users(id),
  action text not null, -- 'view' | 'copy'
  created_at timestamptz not null default now()
);

create index idx_cred_log_credential on credential_access_log(credential_id);

-- ============================================================
-- REEMPLAZO DE POLÍTICAS RLS (admin total, cliente acotado)
-- ============================================================
do $$
declare
  t text;
begin
  for t in select unnest(array[
    'clients','projects','domains','hosting','repositories','project_databases',
    'credentials','documents','renewals','tasks','project_history','website_audits'
  ])
  loop
    execute format('drop policy if exists "authenticated_all_%1$s" on %1$I;', t);
  end loop;
end $$;

-- CLIENTS
create policy "admin_all_clients" on clients for all to authenticated using (is_admin()) with check (is_admin());
create policy "member_select_clients" on clients for select to authenticated using (is_client_member(id));

-- PROJECTS
create policy "admin_all_projects" on projects for all to authenticated using (is_admin()) with check (is_admin());
create policy "member_select_projects" on projects for select to authenticated using (is_client_member(client_id));

-- DOMAINS / HOSTING / REPOSITORIES / DATABASES (infra por proyecto)
create policy "admin_all_domains" on domains for all to authenticated using (is_admin()) with check (is_admin());
create policy "member_select_domains" on domains for select to authenticated using (is_client_member(project_client_id(project_id)));

create policy "admin_all_hosting" on hosting for all to authenticated using (is_admin()) with check (is_admin());
create policy "member_select_hosting" on hosting for select to authenticated using (is_client_member(project_client_id(project_id)));

create policy "admin_all_repositories" on repositories for all to authenticated using (is_admin()) with check (is_admin());
create policy "member_select_repositories" on repositories for select to authenticated using (is_client_member(project_client_id(project_id)));

create policy "admin_all_project_databases" on project_databases for all to authenticated using (is_admin()) with check (is_admin());
-- Sin política de lectura para clientes: la base de datos es información interna.

-- CREDENTIALS (cliente ve solo las visibles y vigentes)
create policy "admin_all_credentials" on credentials for all to authenticated using (is_admin()) with check (is_admin());
create policy "member_select_credentials" on credentials for select to authenticated using (
  is_client_member(client_id)
  and visibility in ('client','temporary')
  and (visibility <> 'temporary' or (visible_until is not null and now() <= visible_until))
);

-- DOCUMENTS
create policy "admin_all_documents" on documents for all to authenticated using (is_admin()) with check (is_admin());
create policy "member_select_documents" on documents for select to authenticated using (
  is_client_member(client_id) and visibility = 'client'
);

-- RENEWALS
create policy "admin_all_renewals" on renewals for all to authenticated using (is_admin()) with check (is_admin());
create policy "member_select_renewals" on renewals for select to authenticated using (is_client_member(client_id));

-- TASKS (checklist interno, sin acceso de cliente)
create policy "admin_all_tasks" on tasks for all to authenticated using (is_admin()) with check (is_admin());

-- PROJECT HISTORY
create policy "admin_all_project_history" on project_history for all to authenticated using (is_admin()) with check (is_admin());
create policy "member_select_project_history" on project_history for select to authenticated using (
  is_client_member(client_id) and visibility = 'client'
);

-- WEBSITE AUDITS
create policy "admin_all_website_audits" on website_audits for all to authenticated using (is_admin()) with check (is_admin());
create policy "member_select_website_audits" on website_audits for select to authenticated using (
  client_id is not null and is_client_member(client_id)
);

-- PROFILES
alter table profiles enable row level security;
create policy "self_select_profile" on profiles for select to authenticated using (id = auth.uid());
create policy "self_update_profile" on profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy "admin_select_all_profiles" on profiles for select to authenticated using (is_admin());
create policy "admin_update_all_profiles" on profiles for update to authenticated using (is_admin()) with check (is_admin());

-- CLIENT MEMBERS
alter table client_members enable row level security;
create policy "admin_all_client_members" on client_members for all to authenticated using (is_admin()) with check (is_admin());
create policy "self_select_client_members" on client_members for select to authenticated using (user_id = auth.uid());
create policy "self_activate_client_members" on client_members for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Un usuario no-admin solo puede mover su propia membresía de 'invited' a 'active';
-- cualquier otro cambio (client_id, role_in_client, etc.) se descarta silenciosamente.
create or replace function public.protect_membership_self_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_admin() then
    return new;
  end if;
  if old.status = 'invited' and new.status = 'active' then
    new.client_id := old.client_id;
    new.user_id := old.user_id;
    new.email := old.email;
    new.name := old.name;
    new.role_in_client := old.role_in_client;
    new.invited_by := old.invited_by;
    return new;
  end if;
  return old;
end;
$$;

create trigger trg_protect_membership_self_update
  before update on client_members
  for each row execute function public.protect_membership_self_update();

-- PAYMENTS
alter table payments enable row level security;
create policy "admin_all_payments" on payments for all to authenticated using (is_admin()) with check (is_admin());
create policy "member_select_payments" on payments for select to authenticated using (is_client_member(client_id));

-- REQUESTS
alter table requests enable row level security;
create policy "admin_all_requests" on requests for all to authenticated using (is_admin()) with check (is_admin());
create policy "member_select_requests" on requests for select to authenticated using (is_client_member(client_id));
create policy "member_insert_requests" on requests for insert to authenticated with check (
  is_client_member(client_id) and created_by = auth.uid()
);

-- CREDENTIAL ACCESS LOG
alter table credential_access_log enable row level security;
create policy "admin_select_credential_log" on credential_access_log for select to authenticated using (is_admin());
create policy "insert_credential_log" on credential_access_log for insert to authenticated with check (user_id = auth.uid());

-- ============================================================
-- STORAGE: reemplazar políticas del bucket "documents"
-- ============================================================
drop policy if exists "authenticated_read_documents" on storage.objects;
drop policy if exists "authenticated_write_documents" on storage.objects;
drop policy if exists "authenticated_update_documents" on storage.objects;
drop policy if exists "authenticated_delete_documents" on storage.objects;

create policy "admin_all_documents_storage" on storage.objects for all to authenticated
  using (bucket_id = 'documents' and is_admin())
  with check (bucket_id = 'documents' and is_admin());

-- El cliente solo puede leer objetos de documentos propios marcados como visibles.
create policy "client_read_own_documents_storage" on storage.objects for select to authenticated
  using (
    bucket_id = 'documents'
    and exists (
      select 1 from documents d
      where d.storage_path = storage.objects.name
        and d.visibility = 'client'
        and is_client_member(d.client_id)
    )
  );
