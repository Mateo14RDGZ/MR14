-- Datos de demostración editables — cliente Motocenter
-- Ejecutar después de 0001_init.sql y 0002_roles_and_portal.sql
-- No crea usuarios ni credenciales reales. Para probar el Portal del Cliente,
-- invitá un usuario desde Clientes → Motocenter → Usuarios → Invitar usuario.

with new_client as (
  insert into clients (
    business_name, contact_name, phone, whatsapp, email, city, state, country,
    website, status, start_date, notes
  ) values (
    'Motocenter', 'Roberto Telechea', '+598 99 123 456', '+598 99 123 456',
    'roberto@motocenter.com.uy', 'Montevideo', 'Montevideo', 'Uruguay',
    'https://motocenter.com.uy', 'en_desarrollo', current_date,
    'Cliente demo cargado como seed inicial de MR14.'
  )
  returning id
),
new_project as (
  insert into projects (
    client_id, name, type, description, start_date, estimated_delivery_date,
    status, price, deposit, currency, payment_status, notes,
    stage, progress_percent, next_step
  )
  select id, 'Web presencia Motocenter', 'web_presencia',
    'Sitio de presencia institucional con catálogo de servicios y contacto directo por WhatsApp.',
    current_date, current_date + interval '21 days',
    'en_desarrollo', 5900, 2950, 'UYU', 'parcial',
    'Anticipo del 50% recibido. Falta saldo contra entrega.',
    'desarrollo', 60, 'Revisión del cliente'
  from new_client
  returning id, client_id
)
insert into project_history (client_id, project_id, event, visibility)
select client_id, id, 'Cliente creado (seed demo)', 'internal' from new_project
union all
select client_id, id, 'Proyecto "Web presencia Motocenter" creado', 'client' from new_project
union all
select client_id, id, 'Contrato firmado', 'client' from new_project
union all
select client_id, id, 'Anticipo recibido ($2.950 UYU)', 'client' from new_project
union all
select client_id, id, 'Proyecto iniciado', 'client' from new_project;

-- Pago del anticipo (recalcula automáticamente projects.amount_paid vía trigger)
with proj as (
  select p.id as project_id, p.client_id from projects p join clients c on c.id = p.client_id
  where c.business_name = 'Motocenter' limit 1
)
insert into payments (client_id, project_id, amount, method, paid_at, notes)
select client_id, project_id, 2950, 'Transferencia bancaria', current_date, 'Anticipo 50%'
from proj;

-- Dominio, hosting, repo y checklist de ejemplo
with proj as (
  select p.id as project_id, p.client_id
  from projects p join clients c on c.id = p.client_id
  where c.business_name = 'Motocenter' limit 1
)
insert into domains (project_id, domain, registrar, purchase_date, expiry_date, auto_renew, status)
select project_id, 'motocenter.com.uy', 'ANTEL / RAU', current_date, current_date + interval '335 days', true, 'activo'
from proj;

with proj as (
  select p.id as project_id from projects p join clients c on c.id = p.client_id
  where c.business_name = 'Motocenter' limit 1
)
insert into hosting (project_id, platform, project_name, production_url, plan, notes)
select project_id, 'vercel', 'motocenter', 'https://motocenter.com.uy', 'Hobby', 'Deploy automático desde GitHub'
from proj;

with proj as (
  select p.id as project_id from projects p join clients c on c.id = p.client_id
  where c.business_name = 'Motocenter' limit 1
)
insert into repositories (project_id, name, organization, main_branch, url, is_private)
select project_id, 'motocenter-web', 'mr14-dev', 'main', 'https://github.com/mr14-dev/motocenter-web', true
from proj;

with proj as (
  select p.id as project_id from projects p join clients c on c.id = p.client_id
  where c.business_name = 'Motocenter' limit 1
)
insert into tasks (project_id, label, position)
select project_id, label, position from proj, (values
  ('Revisar mobile',1),('Revisar desktop',2),('Revisar enlaces',3),('Revisar WhatsApp',4),
  ('Revisar ubicación',5),('Revisar horarios',6),('Revisar SEO',7),('Revisar favicon',8),
  ('Revisar Open Graph',9),('Revisar SSL',10),('Revisar dominio',11),('Revisar DNS',12),
  ('Revisar imágenes',13),('Revisar textos',14),('Revisar consola',15),('Revisar performance',16),
  ('Revisar accesibilidad básica',17),('Confirmar pago final',18),('Crear documentación',19),
  ('Backup',20),('Entregar accesos',21)
) as t(label, position);

with proj as (
  select p.id as project_id, p.client_id from projects p join clients c on c.id = p.client_id
  where c.business_name = 'Motocenter' limit 1
)
insert into renewals (client_id, project_id, kind, service_name, due_date, price, status, auto_renew)
select client_id, project_id, 'dominio', 'Dominio motocenter.com.uy', current_date + interval '335 days', 900, 'vigente', true
from proj;

-- Documento visible para el cliente (metadata de ejemplo; sin archivo real en Storage)
with proj as (
  select p.id as project_id, p.client_id from projects p join clients c on c.id = p.client_id
  where c.business_name = 'Motocenter' limit 1
)
insert into documents (client_id, project_id, name, storage_path, category, visibility, tags)
select client_id, project_id, 'Contrato de servicio.pdf', client_id || '/demo-contrato.pdf', 'contrato', 'client', array['contrato']
from proj;
