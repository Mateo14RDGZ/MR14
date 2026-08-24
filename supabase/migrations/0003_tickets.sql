-- MR14 · Sistema de soporte mediante tickets
-- Requiere 0001_init.sql y 0002_roles_and_portal.sql

-- ============================================================
-- ENUMS
-- ============================================================
create type ticket_status as enum (
  'received','reviewing','in_progress','waiting_client',
  'requires_quote','approved','resolved','closed'
);

create type ticket_category as enum (
  'bug','content_change','new_feature','domain','hosting',
  'email','site_down','other'
);

create type ticket_priority as enum ('low','normal','high','critical');

create type ticket_event_type as enum (
  'created','status_changed','priority_changed','message',
  'attachment_added','quote_created','quote_accepted','quote_rejected',
  'assigned','closed','reopened'
);

create type quote_status as enum ('pending','accepted','rejected','superseded');

create type notification_type as enum (
  'ticket_created','ticket_message','ticket_status_changed',
  'ticket_needs_client_reply','quote_received','quote_accepted',
  'quote_rejected','ticket_resolved'
);

-- ============================================================
-- SECUENCIA DE NUMERACIÓN MR14-0001
-- ============================================================
create sequence ticket_number_seq start 1;

create or replace function public.next_ticket_number()
returns text
language sql
security definer
set search_path = public
as $$
  select 'MR14-' || lpad(nextval('ticket_number_seq')::text, 4, '0');
$$;

grant usage on sequence ticket_number_seq to authenticated;

-- ============================================================
-- TICKETS
-- ============================================================
create table tickets (
  id uuid primary key default uuid_generate_v4(),
  number text not null unique default public.next_ticket_number(),
  client_id uuid not null references clients(id) on delete cascade,
  project_id uuid not null references projects(id) on delete cascade,
  created_by uuid references auth.users(id),
  assigned_to uuid references auth.users(id),
  category ticket_category not null default 'other',
  subject text not null,
  description text not null,
  status ticket_status not null default 'received',
  priority ticket_priority not null default 'normal',
  resolved_at timestamptz,
  closed_at timestamptz,
  reopen_deadline timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_tickets_client on tickets(client_id);
create index idx_tickets_project on tickets(project_id);
create index idx_tickets_status on tickets(status);
create trigger trg_tickets_updated before update on tickets for each row execute function set_updated_at();

-- ============================================================
-- TICKET MESSAGES (conversación)
-- ============================================================
create table ticket_messages (
  id uuid primary key default uuid_generate_v4(),
  ticket_id uuid not null references tickets(id) on delete cascade,
  author_id uuid references auth.users(id),
  author_role user_role not null default 'client',
  body text not null,
  edited_at timestamptz,
  created_at timestamptz not null default now()
);

create index idx_ticket_messages_ticket on ticket_messages(ticket_id);

-- ============================================================
-- TICKET ATTACHMENTS (Storage: bucket "ticket-attachments")
-- ============================================================
create table ticket_attachments (
  id uuid primary key default uuid_generate_v4(),
  ticket_id uuid not null references tickets(id) on delete cascade,
  message_id uuid references ticket_messages(id) on delete cascade,
  uploaded_by uuid references auth.users(id),
  name text not null,
  storage_path text not null,
  mime_type text,
  size_bytes bigint,
  created_at timestamptz not null default now()
);

create index idx_ticket_attachments_ticket on ticket_attachments(ticket_id);

-- ============================================================
-- TICKET EVENTS (timeline inmutable)
-- ============================================================
create table ticket_events (
  id uuid primary key default uuid_generate_v4(),
  ticket_id uuid not null references tickets(id) on delete cascade,
  actor_id uuid references auth.users(id),
  event_type ticket_event_type not null,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index idx_ticket_events_ticket on ticket_events(ticket_id);

-- ============================================================
-- TICKET QUOTES (presupuestos, con versionado)
-- ============================================================
create table ticket_quotes (
  id uuid primary key default uuid_generate_v4(),
  ticket_id uuid not null references tickets(id) on delete cascade,
  status quote_status not null default 'pending',
  current_version int not null default 1,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_ticket_quotes_updated before update on ticket_quotes for each row execute function set_updated_at();

create table ticket_quote_versions (
  id uuid primary key default uuid_generate_v4(),
  quote_id uuid not null references ticket_quotes(id) on delete cascade,
  version int not null,
  description text not null,
  amount numeric(12,2) not null,
  currency text not null default 'UYU',
  estimated_days int,
  notes text,
  valid_until date,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  -- Registro de aceptación/rechazo (inmutable una vez decidido)
  decided_by uuid references auth.users(id),
  decided_at timestamptz,
  decision text, -- 'accepted' | 'rejected'
  unique (quote_id, version)
);

create index idx_quote_versions_quote on ticket_quote_versions(quote_id);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
create table notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type notification_type not null,
  title text not null,
  body text,
  ticket_id uuid references tickets(id) on delete cascade,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index idx_notifications_user on notifications(user_id, read_at);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table tickets enable row level security;
alter table ticket_messages enable row level security;
alter table ticket_attachments enable row level security;
alter table ticket_events enable row level security;
alter table ticket_quotes enable row level security;
alter table ticket_quote_versions enable row level security;
alter table notifications enable row level security;

-- TICKETS
create policy "admin_all_tickets" on tickets for all to authenticated
  using (is_admin()) with check (is_admin());
create policy "member_select_tickets" on tickets for select to authenticated
  using (is_client_member(client_id));
create policy "member_insert_tickets" on tickets for insert to authenticated
  with check (
    is_client_member(client_id)
    and created_by = auth.uid()
    and priority <> 'critical'
  );
-- El cliente puede actualizar su propio ticket solo para cerrar o reabrir dentro del plazo;
-- el trigger protect_ticket_client_update descarta cualquier otro cambio.
create policy "member_update_own_tickets" on tickets for update to authenticated
  using (is_client_member(client_id))
  with check (is_client_member(client_id));

create or replace function public.protect_ticket_client_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_admin() then
    return new;
  end if;
  -- El cliente solo puede: cerrar un ticket resuelto, o reabrirlo dentro del plazo.
  if old.status = 'resolved' and new.status = 'closed' then
    new.closed_at := now();
  elsif old.status in ('resolved', 'closed')
        and new.status = 'waiting_client'
        and old.reopen_deadline is not null
        and now() <= old.reopen_deadline then
    new.closed_at := null;
    new.resolved_at := null;
  else
    return old;
  end if;

  new.number := old.number;
  new.client_id := old.client_id;
  new.project_id := old.project_id;
  new.created_by := old.created_by;
  new.assigned_to := old.assigned_to;
  new.category := old.category;
  new.subject := old.subject;
  new.description := old.description;
  new.priority := old.priority;
  new.reopen_deadline := old.reopen_deadline;
  return new;
end;
$$;

create trigger trg_protect_ticket_client_update
  before update on tickets
  for each row execute function public.protect_ticket_client_update();

create policy "member_select_ticket_events" on ticket_events for select to authenticated
  using (is_client_member((select client_id from tickets where id = ticket_id)));

-- TICKET MESSAGES
create policy "admin_all_ticket_messages" on ticket_messages for all to authenticated
  using (is_admin()) with check (is_admin());
create policy "member_select_ticket_messages" on ticket_messages for select to authenticated
  using (is_client_member((select client_id from tickets where id = ticket_id)));
create policy "member_insert_ticket_messages" on ticket_messages for insert to authenticated
  with check (
    is_client_member((select client_id from tickets where id = ticket_id))
    and author_id = auth.uid()
    and author_role = 'client'
  );

-- TICKET ATTACHMENTS
create policy "admin_all_ticket_attachments" on ticket_attachments for all to authenticated
  using (is_admin()) with check (is_admin());
create policy "member_select_ticket_attachments" on ticket_attachments for select to authenticated
  using (is_client_member((select client_id from tickets where id = ticket_id)));
create policy "member_insert_ticket_attachments" on ticket_attachments for insert to authenticated
  with check (
    is_client_member((select client_id from tickets where id = ticket_id))
    and uploaded_by = auth.uid()
  );

-- TICKET EVENTS (select-only para cliente, ya declarado arriba con nombre reutilizado; se agrega insert admin)
create policy "admin_all_ticket_events" on ticket_events for all to authenticated
  using (is_admin()) with check (is_admin());

-- TICKET QUOTES
create policy "admin_all_ticket_quotes" on ticket_quotes for all to authenticated
  using (is_admin()) with check (is_admin());
create policy "member_select_ticket_quotes" on ticket_quotes for select to authenticated
  using (is_client_member((select client_id from tickets where id = ticket_id)));

-- TICKET QUOTE VERSIONS
create policy "admin_all_quote_versions" on ticket_quote_versions for all to authenticated
  using (is_admin()) with check (is_admin());
create policy "member_select_quote_versions" on ticket_quote_versions for select to authenticated
  using (
    is_client_member((select client_id from tickets t join ticket_quotes q on q.ticket_id = t.id where q.id = quote_id))
  );
-- El cliente registra su decisión (aceptar/rechazar) mediante un UPDATE controlado por Server Action;
-- solo puede tocar decided_by/decided_at/decision, y solo si aún no fue decidido.
create policy "member_decide_quote_version" on ticket_quote_versions for update to authenticated
  using (
    is_client_member((select client_id from tickets t join ticket_quotes q on q.ticket_id = t.id where q.id = quote_id))
    and decided_at is null
  )
  with check (
    is_client_member((select client_id from tickets t join ticket_quotes q on q.ticket_id = t.id where q.id = quote_id))
  );

create or replace function public.protect_quote_version_client_decision()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_admin() then
    return new;
  end if;
  if old.decided_at is not null or new.decision not in ('accepted','rejected') then
    return old;
  end if;
  new.decided_by := auth.uid();
  new.decided_at := now();
  new.quote_id := old.quote_id;
  new.version := old.version;
  new.description := old.description;
  new.amount := old.amount;
  new.currency := old.currency;
  new.estimated_days := old.estimated_days;
  new.notes := old.notes;
  new.valid_until := old.valid_until;
  new.created_by := old.created_by;
  return new;
end;
$$;

create trigger trg_protect_quote_version_client_decision
  before update on ticket_quote_versions
  for each row execute function public.protect_quote_version_client_decision();

-- NOTIFICATIONS
create policy "admin_all_notifications" on notifications for all to authenticated
  using (is_admin()) with check (is_admin());
create policy "self_select_notifications" on notifications for select to authenticated
  using (user_id = auth.uid());
create policy "self_update_notifications" on notifications for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ============================================================
-- STORAGE: bucket privado "ticket-attachments"
-- ============================================================
insert into storage.buckets (id, name, public)
values ('ticket-attachments', 'ticket-attachments', false)
on conflict (id) do nothing;

create policy "admin_all_ticket_attachments_storage" on storage.objects for all to authenticated
  using (bucket_id = 'ticket-attachments' and is_admin())
  with check (bucket_id = 'ticket-attachments' and is_admin());

-- Convención de path: <client_id>/<ticket_id>/<archivo>. El cliente solo accede a su propia carpeta.
create policy "client_rw_own_ticket_attachments_storage" on storage.objects for all to authenticated
  using (
    bucket_id = 'ticket-attachments'
    and is_client_member(((storage.foldername(name))[1])::uuid)
  )
  with check (
    bucket_id = 'ticket-attachments'
    and is_client_member(((storage.foldername(name))[1])::uuid)
  );
