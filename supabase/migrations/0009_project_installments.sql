-- ============================================================
-- PLAN DE CUOTAS DEL PROYECTO
-- ============================================================
-- Es solo el PLAN esperado (monto + vencimiento de cada cuota). El
-- dinero que realmente entra sigue registrándose en "payments" como
-- siempre — acá no se marca nada como "pagado" a mano: se calcula al
-- vuelo comparando projects.amount_paid contra el monto acumulado de
-- cada cuota, así nunca se puede desincronizar.

create table project_installments (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references projects(id) on delete cascade,
  number int not null,
  label text,
  amount numeric(12,2) not null,
  due_date date,
  created_at timestamptz not null default now(),
  unique (project_id, number)
);

create index idx_project_installments_project on project_installments(project_id);

alter table project_installments enable row level security;

create policy "admin_all_project_installments" on project_installments
  for all to authenticated using (is_admin()) with check (is_admin());

create policy "member_select_project_installments" on project_installments
  for select to authenticated using (
    is_client_member((select client_id from projects where id = project_id))
  );
