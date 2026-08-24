-- ============================================================
-- APROBACIÓN DE SOLICITUDES DE ACCESO DE CLIENTE
-- ============================================================
-- El estado 'invited' de client_members ahora se usa como "pendiente
-- de aprobación": el cliente ya completó su registro y creó su propia
-- contraseña, pero no puede entrar al portal hasta que un admin lo
-- apruebe (pasa a 'active'). Se agrega un tipo de notificación nuevo
-- para avisarle al admin cuando esto pasa.

alter type notification_type add value if not exists 'member_pending_approval';
