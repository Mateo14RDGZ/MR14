-- ============================================================
-- MÉTODOS DE PAGO (cuentas bancarias del admin, para mostrarle
-- al cliente adónde transferir)
-- ============================================================
create table payment_methods (
  id uuid primary key default uuid_generate_v4(),
  label text not null,
  bank text,
  account_holder text,
  account_number text,
  account_type text,
  currency text not null default 'UYU',
  notes text,
  is_active boolean not null default true,
  position int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_payment_methods_updated before update on payment_methods for each row execute function set_updated_at();

alter table payment_methods enable row level security;

create policy "admin_all_payment_methods" on payment_methods
  for all to authenticated using (is_admin()) with check (is_admin());

-- Cualquier usuario del portal puede ver los métodos activos (adónde pagar
-- no es información sensible por cliente, es la misma para todos).
create policy "member_select_active_payment_methods" on payment_methods
  for select to authenticated using (
    is_active and exists (select 1 from client_members where user_id = auth.uid())
  );
