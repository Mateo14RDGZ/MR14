-- NULL selects the automatic logo palette. Existing clients need no re-upload.
alter table public.clients add column if not exists brand_color text;
do $$ begin
  alter table public.clients add constraint clients_brand_color_hex
    check (brand_color is null or brand_color ~ '^#[0-9A-Fa-f]{6}$');
exception when duplicate_object then null;
end $$;

-- Explicit brand preference requested by the owner for the existing client.
update public.clients set brand_color = '#C62828'
where lower(business_name) like '%motocenter%' and brand_color is null;
