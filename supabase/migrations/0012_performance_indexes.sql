-- MR14 · Índices justificados por queries reales del código actual.
-- Cada uno resuelve un patrón de acceso concreto, no "por las dudas".

-- 1) Toda lista de tickets (bandeja admin, "Mis solicitudes" del portal,
--    y el orden ascendente de getAttentionItems) ordena por created_at.
--    Sin índice, Postgres tiene que ordenar en memoria a medida que la
--    tabla crezca.
create index if not exists idx_tickets_created_at on tickets(created_at);

-- 2) getPortalDocuments y getPortalDeliveryChecklist (checklist de
--    "Entrega del proyecto") filtran siempre por client_id + visibility
--    juntos. idx_documents_client (0001) solo cubre client_id.
create index if not exists idx_documents_client_visibility on documents(client_id, visibility);

-- 3) La política RLS member_select_credentials filtra por client_id +
--    visibility en cada lectura de credenciales del cliente (portal y
--    checklist de entrega), igual que arriba.
create index if not exists idx_credentials_client_visibility on credentials(client_id, visibility);
