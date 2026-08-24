# MR14

Panel interno de MR14 para gestionar clientes, proyectos, infraestructura, documentación y credenciales — más un **Portal privado para clientes**. PWA instalable, oscura, mobile-first, construida con Next.js (App Router) y Supabase.

## 1. Arquitectura

- **Framework**: Next.js 15 (App Router, Server Components + Server Actions), TypeScript, Tailwind v4.
- **Backend**: Supabase (Postgres + Auth + Storage + Row Level Security). No hay backend propio: toda mutación pasa por Server Actions (`src/actions/*`) que corren en el servidor y usan las claves de Supabase de forma segura (nunca expuestas al cliente).
- **Dos capas de acceso, una sola PWA**:
  - `src/app/(app)/*` → Panel interno MR14 (`/dashboard`, `/clients`, `/projects`, `/renewals`, `/documents`, `/audits`, `/settings`). Requiere `profiles.role = 'admin'`.
  - `src/app/(portal)/portal/*` → Portal del cliente (`/portal`, `/portal/mi-web`, `/portal/documentos`, `/portal/renovaciones`, `/portal/solicitudes`, `/portal/perfil`). Requiere una fila en `client_members` para el usuario autenticado.
- **Soporte mediante tickets**: `/support` (admin) y `/portal/solicitudes` (cliente) comparten el mismo componente de detalle (`components/shared/TicketDetail.tsx`) y las mismas Server Actions (`src/actions/tickets.ts`), con permisos distintos según el rol. Ver sección 9.
  - `src/middleware.ts` protege ambas capas exigiendo sesión; cada `layout.tsx` de grupo exige además el rol correcto y redirige si no corresponde.
- **PDFs**: `@react-pdf/renderer`, generados on-demand en `/api/pdf` (ficha técnica, credenciales, entrega, infraestructura).
- **Analizador de webs**: `/api/analyze`, fetch + `cheerio` en servidor, sin datos inventados ("Información no disponible" cuando algo no se detecta).
- **PWA**: `public/manifest.webmanifest`, `public/sw.js` (app shell + fallback offline), `public/icons/*`, prompt de instalación (`InstallPrompt`).
- **Cifrado de credenciales**: AES-256-GCM en `src/lib/crypto.ts`, ejecutado exclusivamente en servidor (`server-only`). Las contraseñas nunca se envían al cliente salvo que el usuario autorizado pida explícitamente "Mostrar" o "Copiar" (y esa acción queda registrada en `credential_access_log`).

## 2. Tablas creadas (Supabase / Postgres)

Migraciones en `supabase/migrations/`:

**`0001_init.sql`**
`clients`, `projects`, `domains`, `hosting`, `repositories`, `project_databases`, `credentials`, `documents`, `renewals`, `tasks` (checklist), `project_history`, `website_audits` + bucket de Storage `documents`.

**`0002_roles_and_portal.sql`** (capa de roles y portal de clientes)
`profiles` (1:1 con `auth.users`, rol `admin`/`client`), `client_members` (relación cliente↔usuario, N:N), `payments`, `requests` (solicitudes de soporte), `credential_access_log`. Agrega columnas: `credentials.visibility/visible_until`, `documents.visibility`, `project_history.visibility`, `projects.stage/progress_percent/next_step/amount_paid`. Reemplaza las políticas RLS iniciales por políticas admin/cliente basadas en `is_admin()` e `is_client_member()`.

**`0003_tickets.sql`** (sistema de soporte)
`tickets` (numerados automáticamente `MR14-0001`, `MR14-0002`…), `ticket_messages` (conversación), `ticket_attachments` (Storage), `ticket_events` (timeline inmutable), `ticket_quotes` + `ticket_quote_versions` (presupuestos versionados), `notifications`. Agrega bucket de Storage `ticket-attachments`. Ver sección 9.

Ejecutar las tres migraciones en orden (SQL Editor de Supabase o `supabase db push`). Luego, opcionalmente, `supabase/seed.sql` para cargar el cliente demo **Motocenter** (incluye el ticket `MR14-0001`).

### Primer usuario admin

El trigger `handle_new_user` crea automáticamente un `profiles` con `role = 'client'` para cualquier usuario nuevo. Para promover el primer administrador de MR14:

```sql
update profiles set role = 'admin' where id = (select id from auth.users where email = 'tu-email@mr14.dev');
```

## 3. Variables de entorno

Ver `.env.example`.

| Variable | Uso |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave anónima (RLS aplica siempre) |
| `SUPABASE_SERVICE_ROLE_KEY` | Solo servidor. Usada únicamente para invitar usuarios vía Supabase Auth Admin API (`src/lib/supabase/admin.ts`). Nunca se importa desde código de cliente |
| `CREDENTIALS_ENCRYPTION_KEY` | Hex de 64 caracteres (32 bytes) para AES-256-GCM. Generar con `openssl rand -hex 32` |
| `NEXT_PUBLIC_APP_URL` | URL pública de la app (usada en el link de invitación) |

## 4. Despliegue en Vercel

1. Crear un proyecto en Supabase, correr las migraciones y el seed (opcional).
2. En Storage, verificar que los buckets `documents` y `ticket-attachments` existan (las migraciones los crean) y sean privados.
3. En Supabase → Authentication → URL Configuration, agregar `https://app.mateordgz.dev/auth/set-password` (o tu dominio) como Redirect URL permitida.
4. Crear el proyecto en Vercel apuntando a este repositorio (independiente del portfolio).
5. Configurar las 5 variables de entorno del punto 3 en Vercel (Production + Preview).
6. Deploy. Dominio sugerido: `app.mateordgz.dev` (subdominio independiente del portfolio `mateordgz.dev`; no comparten código ni deployment).
7. Promover el primer admin (paso 2.1) y desde el panel invitar a los primeros clientes (Clientes → cliente → Usuarios → Invitar usuario).

## 5. Build

```bash
npm install
npm run build
```

Verificado localmente con variables de entorno placeholder (build 100% estático/dinámico sin conexión real a Supabase — las páginas que requieren datos son rutas dinámicas `ƒ`, se resuelven en runtime).

## 6. Partes que requieren servicios externos

- **Supabase** (Auth, Postgres, Storage): obligatorio para que la app funcione — no hay modo mock.
- **Analizador de webs** (`/api/analyze`): hace `fetch` server-side al sitio que se quiera auditar, más `robots.txt`/`sitemap.xml`. No usa APIs de terceros ni claves adicionales.
- **Generación de PDF**: 100% local (`@react-pdf/renderer`), sin dependencias externas.
- **Invitación de usuarios cliente**: usa `supabase.auth.admin.inviteUserByEmail`, que a su vez depende de que el proyecto Supabase tenga configurado un proveedor de email (SMTP propio o el servicio de Supabase) para que la invitación llegue a destino.

## 7. Protección de información sensible

- **RLS real, no solo UI**: cada tabla sensible (`clients`, `projects`, `domains`, `hosting`, `repositories`, `credentials`, `documents`, `renewals`, `payments`, `requests`, `project_history`, `website_audits`, `tickets`, `ticket_messages`, `ticket_attachments`, `ticket_events`, `ticket_quotes`, `ticket_quote_versions`, `notifications`) tiene políticas que limitan el acceso de un usuario `client` exclusivamente a las filas de los clientes donde tiene una fila en `client_members` — usando las funciones `SECURITY DEFINER` `is_admin()` / `is_client_member()` para evitar recursión de RLS. Un cliente **nunca** puede leer datos de otro cliente aunque conozca su ID (acceso directo por URL queda bloqueado por RLS, no solo por el guard de la UI). Los adjuntos de tickets viven en el bucket privado `ticket-attachments` con la misma convención (`<client_id>/<ticket_id>/archivo`), verificada también a nivel de `storage.objects`.
- **Credenciales**: cifradas con AES-256-GCM (`src/lib/crypto.ts`), la clave vive solo en `CREDENTIALS_ENCRYPTION_KEY` del servidor. Un secreto solo se descifra al pedir "Mostrar" o "Copiar", y cada acceso queda en `credential_access_log` (usuario, acción, fecha — nunca el valor). El campo `visibility` (`internal`/`client`/`temporary`) decide si el cliente puede verla, y `visible_until` expira el acceso temporal automáticamente vía RLS.
- **Documentos**: el archivo real vive en Storage (bucket privado `documents`); las políticas de `storage.objects` exigen `is_admin()` o que exista una fila en `documents` con `visibility = 'client'` para ese cliente — no hay URLs públicas, se sirven con `createSignedUrl` de vida corta.
- **Bases de datos de proyecto**: sin política de lectura para clientes (información interna, oculta también a nivel RLS).
- **Nunca se exponen al portal**: `SUPABASE_SERVICE_ROLE_KEY`, `CREDENTIALS_ENCRYPTION_KEY`, tokens de deploy, variables de entorno internas — viven solo en el servidor y no hay ninguna ruta ni componente cliente que los lea.
- **Sesión**: Supabase Auth con cookies httpOnly gestionadas por `@supabase/ssr`; bloqueo automático tras 15 minutos de inactividad (`InactivityGuard`); confirmación explícita antes de cualquier eliminación (`ConfirmButton`).
- **Rol nunca confiado solo en frontend**: el guard de cada layout redirige por UX, pero la autorización real ocurre en Postgres vía RLS — aunque alguien manipule el cliente, las consultas siguen limitadas por la base de datos.

## 8. Cómo probar

1. **Admin**: crear usuario en Supabase Auth (o registrar uno), promoverlo a `admin` (sección 2), iniciar sesión → debe entrar a `/dashboard` con el menú completo.
2. **Cliente**: desde `/clients/<id>` → pestaña Usuarios → Invitar usuario. El invitado recibe el link de Supabase, define contraseña en `/auth/set-password` y cae en `/portal`, viendo solo su negocio.
3. **Aislamiento**: con dos clientes de prueba, verificar que un usuario del cliente A no puede ver al cliente B ni por UI ni pegando su URL/ID directamente (RLS lo bloquea a nivel de base de datos).
4. **Documentos/credenciales privados**: subir un documento con `visibility = internal` y confirmar que no aparece en `/portal/documentos`; lo mismo con una credencial sin `visibility = client`.
5. **Mobile**: la navegación inferior (`BottomNav`/`PortalBottomNav`) y los diálogos están pensados mobile-first; probar en viewport angosto.
6. **Tickets**: ver checklist completo en la sección 9.4.

## 9. Sistema de soporte mediante tickets

### 9.1 Flujo del cliente

`/portal/solicitudes/nueva` → completa proyecto, categoría, asunto, descripción y adjuntos opcionales → `createTicketAction` crea el ticket (numerado automáticamente, `MR14-0001` en adelante), registra el evento `created` y notifica a todos los admins. La categoría **"Mi sitio no está disponible"** (`site_down`) asigna automáticamente prioridad `high` — el cliente nunca puede elegir `critical`, ni desde la UI (no existe ese campo) ni por API directa (bloqueado también por RLS con `priority <> 'critical'` en la política de `insert`).

Desde `/portal/solicitudes` el cliente ve sus tickets en tres pestañas (Abiertos / Resueltos / Todos) y entra al detalle para conversar, ver el estado y —si hay un presupuesto pendiente— **Aceptar** o **Rechazar**. Cuando MR14 marca un ticket `resolved`, el cliente tiene 7 días (`reopen_deadline`) para reabrirlo; pasado ese plazo debe crear uno nuevo.

En el dashboard del portal aparece una card **Soporte** con tickets abiertos, cuántos esperan respuesta del cliente y el último ticket creado. Si el proyecto está `entregado`/`publicado`/`mantenimiento`, se muestra además un banner fijo invitando a crear tickets para cualquier solicitud posterior a la entrega (WhatsApp sigue disponible para consultas comerciales o urgencias).

### 9.2 Flujo de MR14

`/support` (nuevo ítem de navegación) muestra métricas (abiertos, requieren atención, esperando cliente, resueltos hoy) y una bandeja filtrable por cliente, estado, categoría, prioridad y texto libre (número o asunto). Al abrir un ticket, MR14 puede: responder, cambiar estado (`received` → … → `resolved`/`closed`), cambiar prioridad (incluida `critical`, exclusivo de admin), y **Crear presupuesto**.

La ficha de cada cliente tiene una pestaña **Soporte** con el resumen (total/abiertos/resueltos) y la lista de sus tickets; la ficha de cada proyecto muestra el mismo resumen y lista filtrada a ese proyecto.

### 9.3 Presupuestos

`createQuoteAction` crea (o versiona) un `ticket_quotes` + `ticket_quote_versions` con descripción, monto, moneda, días estimados, notas y validez, y pone el ticket en `requires_quote`. El cliente ve el presupuesto vigente en el detalle del ticket con botones **Aceptar**/**Rechazar** (`decideQuoteAction`). Un presupuesto ya decidido (`decided_at` no nulo) es inmutable — la única forma de cambiar montos es que MR14 cree una nueva versión, que reemplaza a la anterior (`current_version` incrementa, la versión previa queda con estado `superseded`). Al aceptar, el ticket pasa a `approved` y queda un evento inmutable en el timeline (`ticket_events`) y en el historial del cliente/proyecto (`project_history`, visible para el cliente).

### 9.4 Checklist de pruebas manual

- [ ] Cliente crea un ticket con adjunto → aparece en `/support` y llega notificación al admin.
- [ ] Admin responde → cliente ve el mensaje y recibe notificación; si el ticket estaba `waiting_client`, vuelve a `reviewing` cuando el cliente contesta.
- [ ] Admin cambia estado a `requires_quote` y crea un presupuesto → cliente lo ve en el portal.
- [ ] Cliente acepta el presupuesto → ticket pasa a `approved`, queda registrado quién/cuándo, no se puede volver a decidir la misma versión.
- [ ] Admin marca `resolved` → cliente puede **Cerrar** o **Reabrir** (dentro de 7 días); pasado el plazo, el intento de reabrir es descartado por el trigger `protect_ticket_client_update`.
- [ ] Cliente A intenta abrir por URL un ticket de Cliente B (`/portal/solicitudes/<id-ajeno>`) → `notFound()` (RLS bloquea la fila en el `select`).
- [ ] Cliente intenta acceder a un adjunto de otro cliente (probando manualmente la `storage_path`) → la política `client_rw_own_ticket_attachments_storage` lo rechaza porque el primer segmento del path no coincide con un `client_id` al que pertenece.
- [ ] Responsive: crear y responder un ticket desde un viewport angosto (adjuntar foto desde el input `file` con `capture` implícito del navegador).

### 9.5 Notificaciones

Tabla `notifications` (in-app únicamente por ahora): cada acción relevante de un ticket (creado, mensaje nuevo, cambio de estado, presupuesto recibido/aceptado/rechazado, resuelto) inserta una fila por destinatario (`src/lib/notifications.ts`). La campanita en el topbar (admin) y en el portal muestra el conteo de no leídas y arma un dropdown que linkea directo al ticket. La arquitectura ya soporta agregar envío por email más adelante (bastaría un trigger o un cron que lea `notifications` sin `read_at` y las despache) sin tocar el modelo de datos.

---

MR14 · Mateo Rodríguez · mateordgz.dev
