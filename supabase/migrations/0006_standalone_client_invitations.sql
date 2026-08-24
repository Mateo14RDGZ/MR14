-- ============================================================
-- INVITACIÓN DE REGISTRO PARA CLIENTES NUEVOS (sin ficha previa)
-- ============================================================
-- Hasta ahora una invitación siempre apuntaba a un cliente ya creado
-- por el admin. Ahora también se puede generar un link "abierto" desde
-- la sección Clientes: el prospecto completa sus propios datos de
-- negocio + contraseña, y se crea tanto la ficha del cliente como su
-- usuario del portal (pendiente de aprobación), en un solo paso.

alter table client_invitations alter column client_id drop not null;
