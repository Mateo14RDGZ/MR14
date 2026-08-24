-- Las notificaciones solo navegaban al hacer click cuando tenían ticket_id;
-- el resto (documento nuevo, proyecto actualizado, credencial entregada...)
-- no llevaban a ningún lado desde el centro de notificaciones in-app. Se
-- guarda el destino igual que ya se le pasa al payload de web push.
alter table notifications add column if not exists url text;
