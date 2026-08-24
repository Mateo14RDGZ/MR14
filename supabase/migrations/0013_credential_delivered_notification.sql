-- Notifica al cliente cuando MR14 le entrega el acceso a una credencial.
alter type notification_type add value if not exists 'credential_delivered';
