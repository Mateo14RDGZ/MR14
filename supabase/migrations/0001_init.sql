-- MR14 · Panel interno · Esquema inicial
-- Ejecutar en el SQL Editor de Supabase (o via `supabase db push`)

create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";

-- ============================================================
-- ENUMS
-- ============================================================
create type client_status as enum (
  'prospecto','contactado','interesado','contrato_enviado','contrato_firmado',
  'esperando_anticipo','en_desarrollo','en_revision','esperando_saldo',
  'entregado','mantenimiento','cerrado'
);

create type project_type as enum (
  'web_presencia','landing_page','ecommerce','sistema_web','pwa','rediseno','mantenimiento','otro'
);

create type project_status as enum (
  'planificacion','en_desarrollo','en_revision','esperando_aprobacion',
  'esperando_saldo','entregado','publicado','mantenimiento','pausado','cancelado'
);

create type payment_status as enum ('pendiente','parcial','pagado','vencido');

create type hosting_platform as enum ('vercel','netlify','cloudflare','hosting_tradicional','otro');

create type db_provider as enum ('supabase','firebase','postgresql','mysql','otro');

create type renewal_kind as enum ('dominio','hosting','email','servicio_externo','otro');

create type renewal_status as enum ('vigente','proximo_a_vencer','vencido','renovado');

create type credential_service as enum (
  'vercel','github','dominio','hosting','email','supabase','cloudflare',
  'wordpress','analytics','search_console','instagram','facebook','otro'
);

-- ============================================================
-- CLIENTS
-- ============================================================
create table clients (
  id uuid primary key default uuid_generate_v4(),
  business_name text not null,
  contact_name text,
  ci text,
  rut text,
  phone text,
  whatsapp text,
  email text,
  address text,
  city text,
  state text,
  country text default 'Uruguay',
  social_links jsonb default '{}'::jsonb, -- {instagram, facebook, tiktok, linkedin, x}
  website text,
  logo_url text,
  notes text,
  status client_status not null default 'prospecto',
  start_date date,
  delivery_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id)
);

-- ============================================================
-- PROJECTS
-- ============================================================
create table projects (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid not null references clients(id) on delete cascade,
  name text not null,
  type project_type not null default 'web_presencia',
  description text,
  start_date date,
  estimated_delivery_date date,
  actual_delivery_date date,
  status project_status not null default 'planificacion',
  price numeric(12,2) default 0,
  deposit numeric(12,2) default 0,
  balance numeric(12,2) generated always as (coalesce(price,0) - coalesce(deposit,0)) stored,
  currency text not null default 'UYU',
  payment_status payment_status not null default 'pendiente',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- INFRAESTRUCTURA: DOMAINS
-- ============================================================
create table domains (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references projects(id) on delete cascade,
  domain text not null,
  registrar text,
  owner_name text,
  purchase_date date,
  expiry_date date,
  renewal_price numeric(10,2),
  auto_renew boolean default false,
  nameservers text,
  dns_notes text,
  status text default 'activo',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- INFRAESTRUCTURA: HOSTING / DEPLOY
-- ============================================================
create table hosting (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references projects(id) on delete cascade,
  platform hosting_platform not null default 'vercel',
  project_name text,
  production_url text,
  preview_url text,
  account text,
  team text,
  created_date date,
  plan text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- INFRAESTRUCTURA: REPOSITORIES
-- ============================================================
create table repositories (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references projects(id) on delete cascade,
  name text,
  organization text,
  main_branch text default 'main',
  url text,
  is_private boolean default true,
  created_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- INFRAESTRUCTURA: DATABASES
-- ============================================================
create table project_databases (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references projects(id) on delete cascade,
  provider db_provider not null default 'supabase',
  project_name text,
  url text,
  region text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- CREDENCIALES (cifradas AES-256-GCM a nivel de aplicación)
-- ============================================================
create table credentials (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid not null references clients(id) on delete cascade,
  project_id uuid references projects(id) on delete set null,
  service credential_service not null default 'otro',
  service_label text,
  username text,
  secret_encrypted text not null, -- payload cifrado (iv:tag:ciphertext) en base64
  access_url text,
  notes text,
  last_updated timestamptz not null default now(),
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id)
);

-- ============================================================
-- DOCUMENTOS (metadata; binario en Supabase Storage bucket "documents")
-- ============================================================
create table documents (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid not null references clients(id) on delete cascade,
  project_id uuid references projects(id) on delete set null,
  name text not null,
  storage_path text not null,
  mime_type text,
  size_bytes bigint,
  tags text[] default '{}',
  category text, -- contrato, comprobante_anticipo, comprobante_saldo, guia_trabajo, factura, doc_tecnica, credenciales, entrega_final
  uploaded_at timestamptz not null default now(),
  uploaded_by uuid references auth.users(id)
);

-- ============================================================
-- RENOVACIONES
-- ============================================================
create table renewals (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid not null references clients(id) on delete cascade,
  project_id uuid references projects(id) on delete set null,
  kind renewal_kind not null default 'dominio',
  service_name text not null,
  due_date date not null,
  price numeric(10,2),
  status renewal_status not null default 'vigente',
  auto_renew boolean default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- CHECKLIST DE ENTREGA (tasks)
-- ============================================================
create table tasks (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references projects(id) on delete cascade,
  label text not null,
  is_done boolean not null default false,
  position int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- HISTORIAL
-- ============================================================
create table project_history (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid references clients(id) on delete cascade,
  project_id uuid references projects(id) on delete cascade,
  event text not null,
  meta jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id)
);

-- ============================================================
-- AUDITORÍAS DE SITIOS WEB
-- ============================================================
create table website_audits (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid references clients(id) on delete cascade,
  project_id uuid references projects(id) on delete set null,
  url text not null,
  result jsonb not null default '{}'::jsonb,
  score jsonb default '{}'::jsonb, -- {seo, accessibility, performance}
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id)
);

-- ============================================================
-- ÍNDICES
-- ============================================================
create index idx_projects_client on projects(client_id);
create index idx_domains_project on domains(project_id);
create index idx_hosting_project on hosting(project_id);
create index idx_repositories_project on repositories(project_id);
create index idx_databases_project on project_databases(project_id);
create index idx_credentials_client on credentials(client_id);
create index idx_documents_client on documents(client_id);
create index idx_renewals_client on renewals(client_id);
create index idx_renewals_due on renewals(due_date);
create index idx_tasks_project on tasks(project_id);
create index idx_history_client on project_history(client_id);
create index idx_history_project on project_history(project_id);
create index idx_audits_project on website_audits(project_id);
create index idx_clients_status on clients(status);
create index idx_projects_status on projects(status);

-- ============================================================
-- updated_at triggers
-- ============================================================
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_clients_updated before update on clients for each row execute function set_updated_at();
create trigger trg_projects_updated before update on projects for each row execute function set_updated_at();
create trigger trg_domains_updated before update on domains for each row execute function set_updated_at();
create trigger trg_hosting_updated before update on hosting for each row execute function set_updated_at();
create trigger trg_repositories_updated before update on repositories for each row execute function set_updated_at();
create trigger trg_databases_updated before update on project_databases for each row execute function set_updated_at();
create trigger trg_renewals_updated before update on renewals for each row execute function set_updated_at();
create trigger trg_tasks_updated before update on tasks for each row execute function set_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- Uso interno: cualquier usuario autenticado (staff de MR14) puede
-- leer/escribir. No hay acceso anónimo. Si en el futuro se necesitan
-- roles (admin/staff), agregar una tabla `profiles` y refinar aquí.
-- ============================================================
alter table clients enable row level security;
alter table projects enable row level security;
alter table domains enable row level security;
alter table hosting enable row level security;
alter table repositories enable row level security;
alter table project_databases enable row level security;
alter table credentials enable row level security;
alter table documents enable row level security;
alter table renewals enable row level security;
alter table tasks enable row level security;
alter table project_history enable row level security;
alter table website_audits enable row level security;

do $$
declare
  t text;
begin
  for t in select unnest(array[
    'clients','projects','domains','hosting','repositories','project_databases',
    'credentials','documents','renewals','tasks','project_history','website_audits'
  ])
  loop
    execute format('create policy "authenticated_all_%1$s" on %1$I for all to authenticated using (true) with check (true);', t);
  end loop;
end $$;

-- ============================================================
-- STORAGE: bucket privado para documentos
-- ============================================================
insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

create policy "authenticated_read_documents"
  on storage.objects for select to authenticated
  using (bucket_id = 'documents');

create policy "authenticated_write_documents"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'documents');

create policy "authenticated_update_documents"
  on storage.objects for update to authenticated
  using (bucket_id = 'documents');

create policy "authenticated_delete_documents"
  on storage.objects for delete to authenticated
  using (bucket_id = 'documents');
