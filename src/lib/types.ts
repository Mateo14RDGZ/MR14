export type ClientStatus =
  | "prospecto"
  | "contactado"
  | "interesado"
  | "contrato_enviado"
  | "contrato_firmado"
  | "esperando_anticipo"
  | "en_desarrollo"
  | "en_revision"
  | "esperando_saldo"
  | "entregado"
  | "mantenimiento"
  | "cerrado";

export const CLIENT_STATUSES: { value: ClientStatus; label: string }[] = [
  { value: "prospecto", label: "Prospecto" },
  { value: "contactado", label: "Contactado" },
  { value: "interesado", label: "Interesado" },
  { value: "contrato_enviado", label: "Contrato enviado" },
  { value: "contrato_firmado", label: "Contrato firmado" },
  { value: "esperando_anticipo", label: "Esperando anticipo" },
  { value: "en_desarrollo", label: "En desarrollo" },
  { value: "en_revision", label: "En revisión" },
  { value: "esperando_saldo", label: "Esperando saldo" },
  { value: "entregado", label: "Entregado" },
  { value: "mantenimiento", label: "Mantenimiento" },
  { value: "cerrado", label: "Cerrado" },
];

export type ProjectType =
  | "web_presencia"
  | "landing_page"
  | "ecommerce"
  | "sistema_web"
  | "pwa"
  | "rediseno"
  | "mantenimiento"
  | "otro";

export const PROJECT_TYPES: { value: ProjectType; label: string }[] = [
  { value: "web_presencia", label: "Web presencia" },
  { value: "landing_page", label: "Landing page" },
  { value: "ecommerce", label: "Ecommerce" },
  { value: "sistema_web", label: "Sistema web" },
  { value: "pwa", label: "PWA" },
  { value: "rediseno", label: "Rediseño" },
  { value: "mantenimiento", label: "Mantenimiento" },
  { value: "otro", label: "Otro" },
];

export type ProjectStatus =
  | "planificacion"
  | "en_desarrollo"
  | "en_revision"
  | "esperando_aprobacion"
  | "esperando_saldo"
  | "entregado"
  | "publicado"
  | "mantenimiento"
  | "pausado"
  | "cancelado";

export const PROJECT_STATUSES: { value: ProjectStatus; label: string }[] = [
  { value: "planificacion", label: "Planificación" },
  { value: "en_desarrollo", label: "En desarrollo" },
  { value: "en_revision", label: "En revisión" },
  { value: "esperando_aprobacion", label: "Esperando aprobación" },
  { value: "esperando_saldo", label: "Esperando saldo" },
  { value: "entregado", label: "Entregado" },
  { value: "publicado", label: "Publicado" },
  { value: "mantenimiento", label: "Mantenimiento" },
  { value: "pausado", label: "Pausado" },
  { value: "cancelado", label: "Cancelado" },
];

export type PaymentStatus = "pendiente" | "parcial" | "pagado" | "vencido";

export const PAYMENT_STATUSES: { value: PaymentStatus; label: string }[] = [
  { value: "pendiente", label: "Pendiente" },
  { value: "parcial", label: "Parcial" },
  { value: "pagado", label: "Pagado" },
  { value: "vencido", label: "Vencido" },
];

export type HostingPlatform = "vercel" | "netlify" | "cloudflare" | "hosting_tradicional" | "otro";
export type DbProvider = "supabase" | "firebase" | "postgresql" | "mysql" | "otro";
export type RenewalKind = "dominio" | "hosting" | "email" | "servicio_externo" | "otro";
export type RenewalStatus = "vigente" | "proximo_a_vencer" | "vencido" | "renovado";
export type CredentialService =
  | "vercel" | "github" | "dominio" | "hosting" | "email" | "supabase"
  | "cloudflare" | "wordpress" | "analytics" | "search_console"
  | "instagram" | "facebook" | "otro";

export const CREDENTIAL_SERVICES: { value: CredentialService; label: string }[] = [
  { value: "vercel", label: "Vercel" },
  { value: "github", label: "GitHub" },
  { value: "dominio", label: "Dominio" },
  { value: "hosting", label: "Hosting" },
  { value: "email", label: "Email" },
  { value: "supabase", label: "Supabase" },
  { value: "cloudflare", label: "Cloudflare" },
  { value: "wordpress", label: "WordPress" },
  { value: "analytics", label: "Analytics" },
  { value: "search_console", label: "Search Console" },
  { value: "instagram", label: "Instagram" },
  { value: "facebook", label: "Facebook" },
  { value: "otro", label: "Otro" },
];

export type UserRole = "admin" | "client";
export type CredentialVisibility = "internal" | "client" | "temporary";
export type DocumentVisibility = "internal" | "client";
export type HistoryVisibility = "internal" | "client";
export type MemberStatus = "invited" | "active";
export type RequestType =
  | "cambio_contenido" | "problema_web" | "nueva_funcionalidad" | "dominio" | "correo" | "otro";
export type RequestPriority = "baja" | "media" | "alta";
export type RequestStatus = "recibida" | "en_revision" | "en_proceso" | "resuelta";
export type ProjectStage =
  | "contrato" | "anticipo" | "material" | "desarrollo" | "primera_version"
  | "revision" | "ajustes" | "pago_final" | "publicado" | "entregado";

export const PROJECT_STAGES: { value: ProjectStage; label: string }[] = [
  { value: "contrato", label: "Contrato" },
  { value: "anticipo", label: "Anticipo" },
  { value: "material", label: "Material" },
  { value: "desarrollo", label: "Desarrollo" },
  { value: "primera_version", label: "Primera versión" },
  { value: "revision", label: "Revisión" },
  { value: "ajustes", label: "Ajustes" },
  { value: "pago_final", label: "Pago final" },
  { value: "publicado", label: "Publicado" },
  { value: "entregado", label: "Entregado" },
];

export const REQUEST_TYPES: { value: RequestType; label: string }[] = [
  { value: "cambio_contenido", label: "Cambio de contenido" },
  { value: "problema_web", label: "Problema con la web" },
  { value: "nueva_funcionalidad", label: "Nueva funcionalidad" },
  { value: "dominio", label: "Dominio" },
  { value: "correo", label: "Correo" },
  { value: "otro", label: "Otro" },
];

export const REQUEST_STATUSES: { value: RequestStatus; label: string }[] = [
  { value: "recibida", label: "Recibida" },
  { value: "en_revision", label: "En revisión" },
  { value: "en_proceso", label: "En proceso" },
  { value: "resuelta", label: "Resuelta" },
];

export interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  role: UserRole;
}

export interface ClientMember {
  id: string;
  client_id: string;
  user_id: string;
  email: string;
  name: string | null;
  phone: string | null;
  role_in_client: string;
  status: MemberStatus;
  created_at: string;
}

export interface Payment {
  id: string;
  client_id: string;
  project_id: string;
  amount: number;
  method: string | null;
  paid_at: string;
  receipt_document_id: string | null;
  notes: string | null;
  created_at: string;
}

export interface Request {
  id: string;
  client_id: string;
  project_id: string | null;
  created_by: string | null;
  type: RequestType;
  title: string;
  description: string | null;
  priority: RequestPriority;
  status: RequestStatus;
  created_at: string;
}

export type TicketStatus =
  | "received" | "reviewing" | "in_progress" | "waiting_client"
  | "requires_quote" | "approved" | "resolved" | "closed";

export type TicketCategory =
  | "bug" | "content_change" | "new_feature" | "domain"
  | "hosting" | "email" | "site_down" | "other";

export type TicketPriority = "low" | "normal" | "high" | "critical";

export type TicketEventType =
  | "created" | "status_changed" | "priority_changed" | "message"
  | "attachment_added" | "quote_created" | "quote_accepted"
  | "quote_rejected" | "assigned" | "closed" | "reopened";

export type QuoteStatus = "pending" | "accepted" | "rejected" | "superseded";

export type NotificationType =
  | "ticket_created" | "ticket_message" | "ticket_status_changed"
  | "ticket_needs_client_reply" | "quote_received" | "quote_accepted"
  | "quote_rejected" | "ticket_resolved" | "member_pending_approval"
  | "project_updated" | "document_uploaded";

export const TICKET_STATUSES: { value: TicketStatus; label: string }[] = [
  { value: "received", label: "Recibido" },
  { value: "reviewing", label: "En revisión" },
  { value: "in_progress", label: "En proceso" },
  { value: "waiting_client", label: "Esperando respuesta" },
  { value: "requires_quote", label: "Requiere presupuesto" },
  { value: "approved", label: "Aprobado" },
  { value: "resolved", label: "Resuelto" },
  { value: "closed", label: "Cerrado" },
];

export const TICKET_CATEGORIES: { value: TicketCategory; label: string }[] = [
  { value: "bug", label: "Error en la web" },
  { value: "content_change", label: "Cambio de contenido" },
  { value: "new_feature", label: "Nueva funcionalidad" },
  { value: "domain", label: "Dominio" },
  { value: "hosting", label: "Hosting" },
  { value: "email", label: "Correo" },
  { value: "site_down", label: "Mi sitio no está disponible" },
  { value: "other", label: "Otro" },
];

export const TICKET_PRIORITIES: { value: TicketPriority; label: string }[] = [
  { value: "low", label: "Baja" },
  { value: "normal", label: "Normal" },
  { value: "high", label: "Alta" },
  { value: "critical", label: "Crítica" },
];

export interface Ticket {
  id: string;
  number: string;
  client_id: string;
  project_id: string;
  created_by: string | null;
  assigned_to: string | null;
  category: TicketCategory;
  subject: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  resolved_at: string | null;
  closed_at: string | null;
  reopen_deadline: string | null;
  created_at: string;
  updated_at: string;
}

export interface TicketMessage {
  id: string;
  ticket_id: string;
  author_id: string | null;
  author_role: UserRole;
  body: string;
  edited_at: string | null;
  created_at: string;
}

export interface TicketAttachment {
  id: string;
  ticket_id: string;
  message_id: string | null;
  uploaded_by: string | null;
  name: string;
  storage_path: string;
  mime_type: string | null;
  size_bytes: number | null;
  created_at: string;
}

export interface TicketEvent {
  id: string;
  ticket_id: string;
  actor_id: string | null;
  event_type: TicketEventType;
  meta: Record<string, unknown>;
  created_at: string;
}

export interface TicketQuote {
  id: string;
  ticket_id: string;
  status: QuoteStatus;
  current_version: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface TicketQuoteVersion {
  id: string;
  quote_id: string;
  version: number;
  description: string;
  amount: number;
  currency: string;
  estimated_days: number | null;
  notes: string | null;
  valid_until: string | null;
  created_by: string | null;
  created_at: string;
  decided_by: string | null;
  decided_at: string | null;
  decision: "accepted" | "rejected" | null;
}

export interface AppNotification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  ticket_id: string | null;
  read_at: string | null;
  created_at: string;
}

export interface Client {
  id: string;
  business_name: string;
  contact_name: string | null;
  ci: string | null;
  rut: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  social_links: Record<string, string> | null;
  website: string | null;
  logo_url: string | null;
  notes: string | null;
  status: ClientStatus;
  start_date: string | null;
  delivery_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  client_id: string;
  name: string;
  type: ProjectType;
  description: string | null;
  start_date: string | null;
  estimated_delivery_date: string | null;
  actual_delivery_date: string | null;
  status: ProjectStatus;
  price: number;
  deposit: number;
  balance: number;
  currency: string;
  payment_status: PaymentStatus;
  notes: string | null;
  stage: ProjectStage;
  progress_percent: number;
  next_step: string | null;
  amount_paid: number;
  created_at: string;
  updated_at: string;
}

export interface DomainRow {
  id: string;
  project_id: string;
  domain: string;
  registrar: string | null;
  owner_name: string | null;
  purchase_date: string | null;
  expiry_date: string | null;
  renewal_price: number | null;
  auto_renew: boolean;
  nameservers: string | null;
  dns_notes: string | null;
  status: string | null;
}

export interface HostingRow {
  id: string;
  project_id: string;
  platform: HostingPlatform;
  project_name: string | null;
  production_url: string | null;
  preview_url: string | null;
  account: string | null;
  team: string | null;
  created_date: string | null;
  plan: string | null;
  notes: string | null;
}

export interface RepositoryRow {
  id: string;
  project_id: string;
  name: string | null;
  organization: string | null;
  main_branch: string | null;
  url: string | null;
  is_private: boolean;
  created_date: string | null;
}

export interface DatabaseRow {
  id: string;
  project_id: string;
  provider: DbProvider;
  project_name: string | null;
  url: string | null;
  region: string | null;
  notes: string | null;
}

export interface CredentialRow {
  id: string;
  client_id: string;
  project_id: string | null;
  service: CredentialService;
  service_label: string | null;
  username: string | null;
  secret_encrypted: string;
  access_url: string | null;
  notes: string | null;
  last_updated: string;
  visibility: CredentialVisibility;
  visible_until: string | null;
}

export interface DocumentRow {
  id: string;
  client_id: string;
  project_id: string | null;
  name: string;
  storage_path: string;
  mime_type: string | null;
  size_bytes: number | null;
  tags: string[];
  category: string | null;
  visibility: DocumentVisibility;
  uploaded_at: string;
}

export interface RenewalRow {
  id: string;
  client_id: string;
  project_id: string | null;
  kind: RenewalKind;
  service_name: string;
  due_date: string;
  price: number | null;
  status: RenewalStatus;
  auto_renew: boolean;
  notes: string | null;
}

export interface TaskRow {
  id: string;
  project_id: string;
  label: string;
  is_done: boolean;
  position: number;
}

export interface HistoryRow {
  id: string;
  client_id: string | null;
  project_id: string | null;
  event: string;
  meta: Record<string, unknown>;
  visibility: HistoryVisibility;
  created_at: string;
}

export interface WebsiteAuditRow {
  id: string;
  client_id: string | null;
  project_id: string | null;
  url: string;
  result: Record<string, unknown>;
  score: Record<string, unknown>;
  created_at: string;
}
