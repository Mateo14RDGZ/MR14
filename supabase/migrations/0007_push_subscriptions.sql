-- ============================================================
-- SUSCRIPCIONES DE NOTIFICACIONES PUSH (Web Push)
-- ============================================================
-- Cada fila es un dispositivo/navegador suscripto de un usuario. Un mismo
-- usuario puede tener varias (celular, PC, etc.).

create table push_subscriptions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth_key text not null,
  created_at timestamptz not null default now()
);

create index idx_push_subscriptions_user on push_subscriptions(user_id);

alter table push_subscriptions enable row level security;

create policy "self_manage_push_subscriptions" on push_subscriptions
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
