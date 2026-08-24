-- Nuevos tipos de notificación para avisos al cliente: actualizaciones de
-- su proyecto y documentos nuevos subidos por MR14.
alter type notification_type add value if not exists 'project_updated';
alter type notification_type add value if not exists 'document_uploaded';
