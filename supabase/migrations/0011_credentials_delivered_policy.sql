-- El cliente debe poder ver también las credenciales marcadas como
-- entregadas ('delivered'), no solo 'client'/'temporary'. Se separa de
-- 0010 porque el valor de enum 'delivered' recién queda disponible para
-- usarse una vez confirmada esa migración.
drop policy if exists "member_select_credentials" on credentials;
create policy "member_select_credentials" on credentials for select to authenticated using (
  is_client_member(client_id)
  and visibility in ('client','temporary','delivered')
  and (visibility <> 'temporary' or (visible_until is not null and now() <= visible_until))
);
