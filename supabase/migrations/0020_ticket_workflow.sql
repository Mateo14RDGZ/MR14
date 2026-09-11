begin;

-- Clients can finish or resume their own conversation, without changing
-- ownership, prices, priority, or any other administrative field.
create or replace function public.protect_ticket_client_update()
returns trigger language plpgsql security definer set search_path = public as $$
declare requested public.ticket_status := new.status;
begin
  if public.is_admin() then return new; end if;
  if not public.is_client_member(old.client_id) then
    raise exception 'No tenés acceso a esta consulta.';
  end if;
  new := old;
  if requested = old.status then return new; end if;
  if requested = 'closed' then
    new.status := 'closed';
    new.closed_at := now();
  elsif requested = 'reviewing' and old.status in ('resolved', 'closed', 'waiting_client') then
    new.status := 'reviewing';
    new.closed_at := null;
    new.resolved_at := null;
    new.reopen_deadline := null;
  elsif requested in ('approved', 'in_progress') and old.status not in ('closed', 'resolved') and exists (
    select 1 from public.ticket_quotes q join public.ticket_quote_versions v
      on v.quote_id = q.id and v.version = q.current_version
    where q.ticket_id = old.id and v.decided_by = auth.uid()
      and v.decision = case when requested = 'approved' then 'accepted' else 'rejected' end
  ) then
    new.status := requested;
  else
    raise exception 'No se puede realizar ese cambio de estado.';
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop policy if exists member_insert_own_ticket_events on public.ticket_events;
create policy member_insert_own_ticket_events on public.ticket_events
for insert to authenticated with check (
  actor_id = auth.uid()
  and event_type in ('created', 'message', 'closed', 'reopened')
  and exists (select 1 from public.tickets t where t.id = ticket_id and public.is_client_member(t.client_id))
);

-- One transaction: save the reply and its outcome together. Locking the
-- ticket also prevents a reply racing with a close from silently reopening it.
create or replace function public.send_ticket_reply(p_ticket_id uuid, p_body text, p_resolve boolean default false)
returns uuid language plpgsql security invoker set search_path = public as $$
declare t public.tickets; message_id uuid; admin_user boolean := public.is_admin();
begin
  if auth.uid() is null then raise exception 'Iniciá sesión para responder.'; end if;
  if length(trim(p_body)) = 0 or length(p_body) > 10000 then
    raise exception 'Escribí un mensaje de hasta 10.000 caracteres.';
  end if;
  select * into t from public.tickets where id = p_ticket_id for update;
  if not found then raise exception 'Consulta no encontrada.'; end if;
  if t.status = 'closed' then raise exception 'Retomá la consulta antes de responder.'; end if;
  if p_resolve and not admin_user then raise exception 'Acción no permitida.'; end if;
  insert into public.ticket_messages(ticket_id, author_id, author_role, body)
    values(p_ticket_id, auth.uid(), case when admin_user then 'admin'::public.user_role else 'client'::public.user_role end, trim(p_body))
    returning id into message_id;
  if admin_user then
    update public.tickets set
      status = case when p_resolve then 'resolved'::public.ticket_status else 'waiting_client'::public.ticket_status end,
      resolved_at = case when p_resolve then now() else null end,
      closed_at = null, reopen_deadline = null
    where id = p_ticket_id;
  elsif t.status in ('waiting_client', 'resolved') then
    update public.tickets set status = 'reviewing' where id = p_ticket_id;
  else
    update public.tickets set updated_at = now() where id = p_ticket_id;
  end if;
  insert into public.ticket_events(ticket_id, actor_id, event_type)
    values(p_ticket_id, auth.uid(), 'message');
  return message_id;
end;
$$;
revoke all on function public.send_ticket_reply(uuid, text, boolean) from public, anon;
grant execute on function public.send_ticket_reply(uuid, text, boolean) to authenticated;

-- A decision belongs to one current quote on one authorized ticket. Commit
-- the version, quote, ticket and audit record together, never partially.
create or replace function public.decide_ticket_quote(p_ticket_id uuid, p_version_id uuid, p_decision public.quote_status, p_reason text default null)
returns void language plpgsql security definer set search_path = public as $$
declare t public.tickets; q public.ticket_quotes; v public.ticket_quote_versions;
begin
  if auth.uid() is null or p_decision not in ('accepted', 'rejected') or p_decision is null then raise exception 'Decisión no válida.'; end if;
  select * into t from public.tickets where id = p_ticket_id for update;
  if not found or not public.is_client_member(t.client_id) then raise exception 'Consulta no encontrada.'; end if;
  if t.status in ('closed', 'resolved') then raise exception 'Retomá la consulta antes de revisar el presupuesto.'; end if;
  select * into v from public.ticket_quote_versions where id = p_version_id for update;
  if not found then raise exception 'Presupuesto no encontrado.'; end if;
  select * into q from public.ticket_quotes where id = v.quote_id for update;
  if q.ticket_id <> t.id or q.current_version <> v.version or q.status <> 'pending' or v.decided_at is not null then
    raise exception 'Este presupuesto ya fue respondido o reemplazado.';
  end if;
  if v.valid_until is not null and v.valid_until < current_date then raise exception 'Este presupuesto venció. Pedile a Mateo que lo actualice.'; end if;
  update public.ticket_quote_versions set decision = p_decision::text, decided_at = now(), decided_by = auth.uid() where id = v.id;
  update public.ticket_quotes set status = p_decision where id = q.id;
  update public.tickets set status = case when p_decision = 'accepted' then 'approved'::public.ticket_status else 'in_progress'::public.ticket_status end where id = t.id;
  insert into public.ticket_events(ticket_id, actor_id, event_type, meta) values (
    t.id, auth.uid(), case when p_decision = 'accepted' then 'quote_accepted'::public.ticket_event_type else 'quote_rejected'::public.ticket_event_type end,
    jsonb_build_object('amount', v.amount, 'currency', v.currency, 'reason', left(p_reason, 500))
  );
end;
$$;
revoke all on function public.decide_ticket_quote(uuid, uuid, public.quote_status, text) from public, anon;
grant execute on function public.decide_ticket_quote(uuid, uuid, public.quote_status, text) to authenticated;
commit;
