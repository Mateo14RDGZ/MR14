-- MR14 · Notas internas, estados de documentos, entrega de credenciales,
-- flujo operativo de renovaciones y respuestas rápidas de tickets.
-- Requiere 0001..0009. No modifica ni borra datos existentes: todo lo
-- nuevo se agrega con defaults compatibles con las filas actuales.
--
-- Nota: el nuevo valor 'delivered' de credential_visibility se agrega acá
-- pero se usa recién en 0011 (Postgres no permite usar un valor de enum
-- nuevo dentro de la misma transacción en la que se lo crea).

-- ============================================================
-- 1. NOTAS INTERNAS (clientes y proyectos, invisibles para el cliente)
-- ============================================================
create table internal_notes (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid references clients(id) on delete cascade,
  project_id uuid references projects(id) on delete cascade,
  content text not null,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint internal_notes_target_check check (client_id is not null or project_id is not null)
);

create index idx_internal_notes_client on internal_notes(client_id);
create index idx_internal_notes_project on internal_notes(project_id);
create trigger trg_internal_notes_updated before update on internal_notes for each row execute function set_updated_at();

alter table internal_notes enable row level security;
-- Sin política de lectura para clientes: RLS deniega por default, la tabla
-- es 100% invisible para cualquier usuario que no sea admin.
create policy "admin_all_internal_notes" on internal_notes
  for all to authenticated using (is_admin()) with check (is_admin());

-- ============================================================
-- 2. ESTADOS DE DOCUMENTOS
-- ============================================================
create type document_status as enum ('draft','sent','signed','archived');

-- Default 'sent': los documentos ya existentes quedan como "enviados"
-- (el estado más neutro posible dado que ya fueron subidos/entregados),
-- sin necesidad de que el admin los reclasifique uno por uno.
alter table documents add column status document_status not null default 'sent';
alter table documents add column signed_by_mr14 boolean not null default false;
alter table documents add column signed_by_client boolean not null default false;

-- ============================================================
-- 3. ENTREGA DE CREDENCIALES AL CLIENTE (columnas + enum; la política RLS
--    que usa el nuevo valor 'delivered' se agrega en 0011)
-- ============================================================
alter type credential_visibility add value if not exists 'delivered';

alter table credentials add column delivered_at timestamptz;
alter table credentials add column delivered_by uuid references auth.users(id);

-- ============================================================
-- 4. FLUJO OPERATIVO DE RENOVACIONES
-- ============================================================
-- Columna nueva y separada de "status" (renewal_status: vigente/próximo a
-- vencer/vencido/renovado, que sigue siendo la urgencia calculada). Este
-- workflow_status es la gestión operativa manual del aviso/confirmación.
create type renewal_workflow_status as enum (
  'pending','client_notified','confirmed','renewed','not_renewed'
);

alter table renewals add column workflow_status renewal_workflow_status not null default 'pending';
alter table renewals add column notified_at timestamptz;
alter table renewals add column confirmed_at timestamptz;
alter table renewals add column renewed_at timestamptz;

-- ============================================================
-- 5. RESPUESTAS RÁPIDAS DE TICKETS (plantillas editables por el admin)
-- ============================================================
create table quick_replies (
  id uuid primary key default uuid_generate_v4(),
  text text not null,
  position int not null default 0,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

alter table quick_replies enable row level security;
create policy "admin_all_quick_replies" on quick_replies
  for all to authenticated using (is_admin()) with check (is_admin());

insert into quick_replies (text, position) values
  ('Recibido, lo reviso y te aviso.', 1),
  ('Necesito un poco más de información.', 2),
  ('Este pedido requiere presupuesto.', 3),
  ('El cambio ya quedó realizado.', 4),
  ('Podés revisar nuevamente la web.', 5);
