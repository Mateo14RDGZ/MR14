// Isolated PostgreSQL tests: npm install --no-save @electric-sql/pglite
// Then: node --test tests/ticket-workflow.test.cjs
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { PGlite } = require(process.env.PGLITE_MODULE || '@electric-sql/pglite');

test('ticket workflow enforces ownership and commits replies and decisions atomically', async () => {
  const db = new PGlite();
  const admin = '00000000-0000-4000-8000-000000000001';
  const client = '00000000-0000-4000-8000-000000000002';
  const outsider = '00000000-0000-4000-8000-000000000003';
  try {
    await db.exec(`
      create role authenticated; create role anon;
      create schema auth; create table auth.users(id uuid primary key);
      create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
      create type user_role as enum ('admin','client');
      create table profiles(id uuid primary key, role user_role);
      create table clients(id uuid primary key);
      create table projects(id uuid primary key, client_id uuid references clients(id));
      create table client_members(client_id uuid, user_id uuid);
      create function is_admin() returns boolean language sql security definer set search_path=public as $$ select exists(select 1 from profiles where id=auth.uid() and role='admin') $$;
      create function is_client_member(cid uuid) returns boolean language sql security definer set search_path=public as $$ select exists(select 1 from client_members where client_id=cid and user_id=auth.uid()) $$;
      create function uuid_generate_v4() returns uuid language sql as $$ select gen_random_uuid() $$;
      create function set_updated_at() returns trigger language plpgsql as $$ begin new.updated_at=now(); return new; end $$;
      insert into auth.users values ('${admin}'), ('${client}'), ('${outsider}');
      insert into profiles values ('${admin}','admin'), ('${client}','client'), ('${outsider}','client');
      insert into clients values ('${client}'); insert into projects values ('${client}','${client}');
      insert into client_members values ('${client}','${client}');
    `);
    const initial = readFileSync(resolve(__dirname, '../supabase/migrations/0003_tickets.sql'), 'utf8').split('-- STORAGE:')[0];
    await db.exec(initial);
    await db.exec('grant usage on schema public, auth to authenticated; grant select, insert, update, delete on all tables in schema public to authenticated;');
    await db.exec(readFileSync(resolve(__dirname, '../supabase/migrations/0020_ticket_workflow.sql'), 'utf8'));
    const as = async id => { await db.exec('reset role'); await db.query("select set_config('request.jwt.claim.sub', $1, false)", [id]); await db.exec('set role authenticated'); };
    await as(client);
    const ticket = (await db.query(`insert into tickets(client_id,project_id,created_by,subject,description) values ($1,$1,$1,'Test','Test') returning id`, [client])).rows[0].id;
    const status = async () => (await db.query('select status from tickets where id=$1', [ticket])).rows[0]?.status;
    await db.query("update tickets set status='closed', subject='not allowed', priority='high' where id=$1", [ticket]);
    assert.equal(await status(), 'closed');
    const protectedRow = (await db.query('select subject,priority from tickets where id=$1', [ticket])).rows[0];
    assert.deepEqual(protectedRow, {subject:'Test',priority:'normal'});
    await assert.rejects(db.query('select send_ticket_reply($1,$2)', [ticket,'Cannot reply to closed']));
    await db.query("update tickets set status='reviewing' where id=$1", [ticket]);
    assert.equal(await status(), 'reviewing');
    await as(admin);
    await db.query('select send_ticket_reply($1,$2)', [ticket,'Admin response']);
    assert.equal(await status(), 'waiting_client');
    await as(client);
    await db.query('select send_ticket_reply($1,$2)', [ticket,'Client response']);
    assert.equal(await status(), 'reviewing');
    const before = (await db.query('select count(*)::int n from ticket_messages')).rows[0].n;
    await assert.rejects(db.query('select send_ticket_reply($1,$2,true)', [ticket,'Unauthorized resolution']));
    assert.equal((await db.query('select count(*)::int n from ticket_messages')).rows[0].n, before);
    await as(outsider);
    assert.equal(await status(), undefined);
    await assert.rejects(db.query('select send_ticket_reply($1,$2)', [ticket,'Unauthorized reply']));
    assert.equal((await db.query("update tickets set status='closed' where id=$1 returning id", [ticket])).rows.length, 0);
    await as(admin);
    await db.query('select send_ticket_reply($1,$2,true)', [ticket,'Solved']);
    assert.equal(await status(), 'resolved');
    await as(client);
    await db.query("update tickets set status='reviewing' where id=$1", [ticket]);
    await as(admin);
    const q = (await db.query('insert into ticket_quotes(ticket_id) values($1) returning id', [ticket])).rows[0].id;
    const v = (await db.query("insert into ticket_quote_versions(quote_id,version,description,amount) values($1,1,'Work',100) returning id", [q])).rows[0].id;
    await db.query("update tickets set status='requires_quote' where id=$1", [ticket]);
    await as(outsider);
    await assert.rejects(db.query("select decide_ticket_quote($1,$2,'accepted')", [ticket,v]));
    await as(client);
    await db.query("select decide_ticket_quote($1,$2,'accepted')", [ticket,v]);
    assert.equal(await status(), 'approved');
    assert.equal((await db.query('select status from ticket_quotes where id=$1', [q])).rows[0].status, 'accepted');
    await assert.rejects(db.query("select decide_ticket_quote($1,$2,'rejected')", [ticket,v]));
    assert.equal((await db.query("select count(*)::int n from ticket_events where event_type='quote_accepted'")).rows[0].n, 1);
  } finally { await db.close(); }
});
