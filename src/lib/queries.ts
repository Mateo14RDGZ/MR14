import "server-only";
import { createClient } from "@/lib/supabase/server";
import { daysUntil, formatCurrency } from "@/lib/utils";
import type { ProjectInstallment } from "@/lib/types";

/**
 * Solo lo que hace falta para los KPIs principales del dashboard admin
 * (clientes + proyectos). Renovaciones e historial quedan en
 * getDashboardSecondary(), que se pide aparte y se streamea en su propio
 * Suspense para no bloquear el primer render con contenido secundario.
 */
export async function getDashboardCore() {
  const supabase = await createClient();

  const [clients, projects] = await Promise.all([
    supabase.from("clients").select("id,business_name,status"),
    supabase
      .from("projects")
      .select("id,name,status,price,amount_paid,balance,payment_status,client_id,clients(business_name)"),
  ]);

  const clientList = clients.data ?? [];
  const projectList = projects.data ?? [];

  const activeClients = clientList.filter((c) => !["cerrado", "prospecto"].includes(c.status)).length;
  const inDevelopment = projectList.filter((p) => p.status === "en_desarrollo").length;
  const pending = projectList.filter((p) =>
    ["planificacion", "esperando_aprobacion", "esperando_saldo"].includes(p.status)
  ).length;
  const delivered = projectList.filter((p) => ["entregado", "publicado"].includes(p.status)).length;

  const moneyPending = projectList
    .filter((p) => p.payment_status !== "pagado")
    .reduce((sum, p) => sum + Number(p.balance ?? 0), 0);
  // amount_paid es lo realmente cobrado (suma de "payments" que el admin
  // registra a mano) — no el anticipo esperado del proyecto (deposit), que
  // es solo un dato de planificación, no dinero efectivamente recibido.
  const moneyCollected = projectList.reduce((sum, p) => sum + Number(p.amount_paid ?? 0), 0);

  const clientsWithPendingPayments = projectList.filter(
    (p) => p.payment_status === "pendiente" || p.payment_status === "parcial"
  ).length;

  return {
    activeClients,
    totalClients: clientList.length,
    inDevelopment,
    pending,
    delivered,
    moneyPending,
    moneyCollected,
    clientsWithPendingPayments,
  };
}

/** Contenido secundario del dashboard admin: dominios por vencer + actividad reciente. */
export async function getDashboardSecondary() {
  const supabase = await createClient();
  const [renewals, history] = await Promise.all([
    supabase
      .from("renewals")
      .select("id,service_name,due_date,status,client_id,clients(business_name)")
      .order("due_date", { ascending: true }),
    supabase
      .from("project_history")
      .select("id,event,created_at,client_id,clients(business_name)")
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const upcomingRenewals = (renewals.data ?? [])
    .map((r) => ({ ...r, days: daysUntil(r.due_date) }))
    .filter((r) => r.status !== "renovado" && r.days !== null && r.days <= 30 && r.days >= 0)
    .slice(0, 8);

  return {
    upcomingRenewals,
    recentActivity: history.data ?? [],
  };
}

export interface AttentionItem {
  type: "ticket" | "payment" | "renewal";
  client: string;
  motivo: string;
  timestamp: string;
  href: string;
}

/**
 * Reúne, desde datos que ya existen (sin tablas nuevas), todo lo que
 * requiere una acción real del admin: tickets sin atender, saldos
 * pendientes y dominios por vencer. Cada item lleva a la pantalla que
 * resuelve la acción.
 */
export async function getAttentionItems(): Promise<{ items: AttentionItem[]; today: { newTickets: number; pendingReview: number; pendingPayments: number; renewalsThisWeek: number } }> {
  const supabase = await createClient();
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [ticketsRes, projectsRes, renewalsRes] = await Promise.all([
    supabase
      .from("tickets")
      .select("id,number,subject,status,created_at,client_id,clients(business_name)")
      .in("status", ["received", "reviewing", "requires_quote"])
      .order("created_at", { ascending: true })
      .limit(10),
    supabase
      .from("projects")
      .select("id,name,balance,client_id,clients(business_name)")
      .in("payment_status", ["pendiente", "parcial"])
      .gt("balance", 0)
      .order("balance", { ascending: false })
      .limit(10),
    supabase
      .from("renewals")
      .select("id,service_name,due_date,status,client_id,clients(business_name)")
      .neq("status", "renovado")
      .order("due_date", { ascending: true })
      .limit(15),
  ]);

  const tickets = ticketsRes.data ?? [];
  const projects = projectsRes.data ?? [];
  const renewalsUpcoming = (renewalsRes.data ?? [])
    .map((r) => ({ ...r, days: daysUntil(r.due_date) }))
    .filter((r) => r.days !== null && r.days <= 30 && r.days >= 0);

  const items: AttentionItem[] = [
    ...tickets.map((t) => ({
      type: "ticket" as const,
      client: (t.clients as { business_name?: string } | null)?.business_name ?? "-",
      motivo: `Ticket ${t.number}: ${t.subject}`,
      timestamp: t.created_at,
      href: `/support/${t.id}`,
    })),
    ...projects.map((p) => ({
      type: "payment" as const,
      client: (p.clients as { business_name?: string } | null)?.business_name ?? "-",
      motivo: `Saldo pendiente: ${formatCurrency(p.balance)}`,
      timestamp: "",
      href: `/projects/${p.id}`,
    })),
    ...renewalsUpcoming.map((r) => ({
      type: "renewal" as const,
      client: (r.clients as { business_name?: string } | null)?.business_name ?? "-",
      motivo: `${r.service_name} vence en ${r.days} día${r.days === 1 ? "" : "s"}`,
      timestamp: "",
      href: `/renewals`,
    })),
  ];

  return {
    items,
    today: {
      newTickets: tickets.filter((t) => new Date(t.created_at) >= startOfToday).length,
      pendingReview: tickets.length,
      pendingPayments: projects.length,
      renewalsThisWeek: renewalsUpcoming.filter((r) => (r.days ?? 99) <= 7).length,
    },
  };
}

export type ClientHealth = "bien" | "atencion" | "riesgo";

/**
 * Estado interno simple por cliente (no visible para el cliente), a partir
 * de señales que ya existen: pago vencido, proyecto atrasado, dominio por
 * vencer y tickets sin atender. Tres queries en bloque (sin N+1) y un
 * puntaje básico, nada de algoritmo complejo.
 */
export async function getClientHealthMap(): Promise<Map<string, ClientHealth>> {
  const supabase = await createClient();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [projectsRes, ticketsRes, renewalsRes] = await Promise.all([
    supabase
      .from("projects")
      .select("client_id,payment_status,balance,estimated_delivery_date,status"),
    supabase.from("tickets").select("client_id,status"),
    supabase.from("renewals").select("client_id,due_date,status"),
  ]);

  const scores = new Map<string, number>();
  const bump = (clientId: string) => scores.set(clientId, (scores.get(clientId) ?? 0) + 1);

  for (const p of projectsRes.data ?? []) {
    if ((p.payment_status === "pendiente" || p.payment_status === "parcial") && Number(p.balance) > 0) {
      bump(p.client_id);
    }
    if (
      p.estimated_delivery_date &&
      new Date(p.estimated_delivery_date) < today &&
      !["entregado", "publicado", "mantenimiento", "cancelado"].includes(p.status)
    ) {
      bump(p.client_id);
    }
  }

  const openTicketStatuses = new Set(["received", "reviewing", "requires_quote"]);
  const seenTicketClients = new Set<string>();
  for (const t of ticketsRes.data ?? []) {
    if (openTicketStatuses.has(t.status) && !seenTicketClients.has(t.client_id)) {
      bump(t.client_id);
      seenTicketClients.add(t.client_id);
    }
  }

  const seenRenewalClients = new Set<string>();
  for (const r of renewalsRes.data ?? []) {
    const days = daysUntil(r.due_date);
    if (r.status !== "renovado" && days !== null && days <= 14 && days >= 0 && !seenRenewalClients.has(r.client_id)) {
      bump(r.client_id);
      seenRenewalClients.add(r.client_id);
    }
  }

  const health = new Map<string, ClientHealth>();
  for (const [clientId, score] of scores) {
    health.set(clientId, score >= 2 ? "riesgo" : "atencion");
  }
  return health;
}

/**
 * internal_notes.created_by referencia auth.users, no profiles — Postgres/
 * PostgREST no puede embeber "profiles(...)" directamente ahí (no hay FK
 * entre esas dos tablas), así que el nombre del autor se resuelve acá con
 * una segunda consulta en batch en vez de un join que fallaría.
 */
async function attachAuthorNames<T extends { created_by: string | null }>(
  supabase: Awaited<ReturnType<typeof createClient>>,
  notes: T[]
): Promise<(T & { author_name: string | null })[]> {
  const ids = [...new Set(notes.map((n) => n.created_by).filter((id): id is string => Boolean(id)))];
  if (ids.length === 0) return notes.map((n) => ({ ...n, author_name: null }));

  const { data: profiles } = await supabase.from("profiles").select("id,full_name").in("id", ids);
  const nameById = new Map((profiles ?? []).map((p) => [p.id, p.full_name]));
  return notes.map((n) => ({ ...n, author_name: (n.created_by && nameById.get(n.created_by)) || null }));
}

export async function getClientInternalNotes(clientId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("internal_notes")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });
  return attachAuthorNames(supabase, data ?? []);
}

export async function getProjectInternalNotes(projectId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("internal_notes")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });
  return attachAuthorNames(supabase, data ?? []);
}

export async function getQuickReplies() {
  const supabase = await createClient();
  const { data } = await supabase.from("quick_replies").select("*").order("position", { ascending: true });
  return data ?? [];
}

export async function getPaymentMethods() {
  const supabase = await createClient();
  const { data } = await supabase.from("payment_methods").select("*").order("position", { ascending: true });
  return data ?? [];
}

export async function getActivePaymentMethods() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("payment_methods")
    .select("*")
    .eq("is_active", true)
    .order("position", { ascending: true });
  return data ?? [];
}

/** Lista de clientes: solo las columnas que pinta /clients (la ficha completa usa getClientDetail). */
export async function getClients() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("clients")
    .select("id,business_name,contact_name,city,status,created_at")
    .order("created_at", { ascending: false });
  return data ?? [];
}

/** Ids de clientes con al menos una solicitud de acceso pendiente de aprobación. */
export async function getClientIdsWithPendingApproval(): Promise<Set<string>> {
  const supabase = await createClient();
  const { data } = await supabase.from("client_members").select("client_id").eq("status", "invited");
  return new Set((data ?? []).map((m) => m.client_id));
}

export async function getClientDetail(id: string) {
  const supabase = await createClient();
  // Los ids de proyecto hacen falta para pedir las cuotas (project_installments
  // no tiene client_id propio), así que projects se resuelve antes que el resto.
  const [client, projects] = await Promise.all([
    supabase.from("clients").select("*").eq("id", id).single(),
    supabase.from("projects").select("*").eq("client_id", id).order("created_at", { ascending: false }),
  ]);
  const projectIds = (projects.data ?? []).map((p) => p.id);

  const [credentials, documents, history, renewals, members, payments, requests, installments] =
    await Promise.all([
      supabase.from("credentials").select("*").eq("client_id", id).order("last_updated", { ascending: false }),
      supabase.from("documents").select("*").eq("client_id", id).order("uploaded_at", { ascending: false }),
      supabase
        .from("project_history")
        .select("*")
        .eq("client_id", id)
        .order("created_at", { ascending: false })
        .limit(50),
      supabase.from("renewals").select("*").eq("client_id", id).order("due_date", { ascending: true }),
      supabase.from("client_members").select("*").eq("client_id", id).order("created_at", { ascending: false }),
      supabase.from("payments").select("*").eq("client_id", id).order("paid_at", { ascending: false }),
      supabase.from("requests").select("*").eq("client_id", id).order("created_at", { ascending: false }),
      projectIds.length > 0
        ? supabase.from("project_installments").select("*").in("project_id", projectIds).order("number", { ascending: true })
        : Promise.resolve({ data: [] as ProjectInstallment[] }),
    ]);

  return {
    client: client.data,
    projects: projects.data ?? [],
    credentials: credentials.data ?? [],
    documents: documents.data ?? [],
    history: history.data ?? [],
    renewals: renewals.data ?? [],
    members: members.data ?? [],
    payments: payments.data ?? [],
    requests: requests.data ?? [],
    installments: installments.data ?? [],
  };
}

export async function getProjectDetail(id: string) {
  const supabase = await createClient();
  const { data: project } = await supabase.from("projects").select("*").eq("id", id).single();
  if (!project) return null;

  const [client, domains, hosting, repositories, databases, tasks, history, installments] = await Promise.all([
    supabase.from("clients").select("*").eq("id", project.client_id).single(),
    supabase.from("domains").select("*").eq("project_id", id),
    supabase.from("hosting").select("*").eq("project_id", id),
    supabase.from("repositories").select("*").eq("project_id", id),
    supabase.from("project_databases").select("*").eq("project_id", id),
    supabase.from("tasks").select("*").eq("project_id", id).order("position", { ascending: true }),
    supabase
      .from("project_history")
      .select("*")
      .eq("project_id", id)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase.from("project_installments").select("*").eq("project_id", id).order("number", { ascending: true }),
  ]);

  return {
    project,
    client: client.data,
    domains: domains.data ?? [],
    hosting: hosting.data ?? [],
    repositories: repositories.data ?? [],
    databases: databases.data ?? [],
    tasks: tasks.data ?? [],
    history: history.data ?? [],
    installments: installments.data ?? [],
  };
}

export async function getPortalPaymentsData(clientId: string) {
  const supabase = await createClient();
  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!project) return { project: null, installments: [], payments: [] };

  const [installments, payments] = await Promise.all([
    supabase.from("project_installments").select("*").eq("project_id", project.id).order("number", { ascending: true }),
    supabase.from("payments").select("*").eq("project_id", project.id).order("paid_at", { ascending: false }),
  ]);

  return {
    project,
    installments: installments.data ?? [],
    payments: payments.data ?? [],
  };
}

/** Lista global de proyectos: solo las columnas que pinta /projects (la ficha usa getProjectDetail). */
export async function getAllProjects() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("projects")
    .select("id,name,type,status,progress_percent,price,currency,balance,estimated_delivery_date,client_id,clients(id,business_name)")
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function getAllRenewals() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("renewals")
    .select("*,clients(id,business_name)")
    .order("due_date", { ascending: true });
  return data ?? [];
}

export async function getAllDocuments() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("documents")
    .select("*,clients(id,business_name)")
    .order("uploaded_at", { ascending: false });
  return data ?? [];
}

export async function getRecentAudits(limit = 20) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("website_audits")
    .select("*,clients(id,business_name)")
    .order("created_at", { ascending: false })
    .limit(limit);
  return data ?? [];
}

export async function getClientAudits(clientId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("website_audits")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });
  return data ?? [];
}

/**
 * Solo lo que hace falta para pintar la pantalla principal del portal al
 * toque: el proyecto más reciente del cliente + su dominio/hosting. Nada
 * de historial ni renovaciones acá — eso se pide aparte (getPortalSecondary)
 * y se streamea en un Suspense separado para no bloquear el primer render.
 */
export async function getPortalDashboardCore(clientId: string) {
  const supabase = await createClient();
  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let infra: { domains: unknown[]; hosting: unknown[] } = { domains: [], hosting: [] };
  if (project) {
    const [domains, hosting] = await Promise.all([
      supabase.from("domains").select("*").eq("project_id", project.id),
      supabase.from("hosting").select("*").eq("project_id", project.id),
    ]);
    infra = { domains: domains.data ?? [], hosting: hosting.data ?? [] };
  }

  return {
    project,
    domain: (infra.domains as { domain: string; status: string | null; expiry_date: string | null; registrar: string | null }[])[0] ?? null,
    hosting: (infra.hosting as { platform: string; production_url: string | null }[])[0] ?? null,
  };
}

/** Contenido secundario del dashboard del portal: renovaciones + historial reciente. */
export async function getPortalSecondary(clientId: string) {
  const supabase = await createClient();
  const [renewals, history] = await Promise.all([
    supabase.from("renewals").select("*").eq("client_id", clientId).order("due_date", { ascending: true }),
    supabase
      .from("project_history")
      .select("*")
      .eq("client_id", clientId)
      .eq("visibility", "client")
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  return {
    renewals: renewals.data ?? [],
    recentActivity: history.data ?? [],
  };
}

/** Proyecto activo del cliente sin traer renovaciones/historial que la pantalla no usa (ej. Mi Web). */
export async function getActiveProject(clientId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("projects")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data;
}

export async function getPortalWebsiteInfo(projectId: string, clientId?: string) {
  const supabase = await createClient();
  const [domains, hosting, audits] = await Promise.all([
    supabase.from("domains").select("*").eq("project_id", projectId),
    supabase.from("hosting").select("*").eq("project_id", projectId),
    supabase
      .from("website_audits")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false })
      .limit(1),
  ]);

  let lastAudit = audits.data?.[0] ?? null;

  // Fallback: auditorías asociadas al cliente pero sin proyecto puntual (ej. hechas antes de
  // que existiera el selector de proyecto, o desde /audits sin elegir uno).
  if (!lastAudit && clientId) {
    const { data } = await supabase
      .from("website_audits")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false })
      .limit(1);
    lastAudit = data?.[0] ?? null;
  }

  return {
    domain: domains.data?.[0] ?? null,
    hosting: hosting.data?.[0] ?? null,
    lastAudit,
  };
}

/** Para el checklist de "Entrega del proyecto": solo cuenta, sin traer filas completas. */
export async function getPortalDeliveryChecklist(clientId: string) {
  const supabase = await createClient();
  const [documents, credentials] = await Promise.all([
    supabase.from("documents").select("id", { count: "exact", head: true }).eq("client_id", clientId).eq("visibility", "client"),
    supabase.from("credentials").select("id", { count: "exact", head: true }).eq("client_id", clientId).eq("visibility", "delivered"),
  ]);
  return {
    hasDocuments: (documents.count ?? 0) > 0,
    hasDeliveredCredentials: (credentials.count ?? 0) > 0,
  };
}

export async function getPortalDocuments(clientId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("documents")
    .select("*")
    .eq("client_id", clientId)
    .eq("visibility", "client")
    .order("uploaded_at", { ascending: false });
  return data ?? [];
}

/** Credenciales que el cliente puede ver (RLS ya las filtra), para /portal/credenciales. */
export async function getPortalCredentials(clientId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("credentials")
    .select("id,service,service_label,username,access_url,delivered_at,last_updated")
    .eq("client_id", clientId)
    .order("delivered_at", { ascending: false });
  return data ?? [];
}

export async function getPortalRenewals(clientId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("renewals")
    .select("*")
    .eq("client_id", clientId)
    .order("due_date", { ascending: true });
  return data ?? [];
}

export async function getPortalPayments(clientId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("payments")
    .select("*")
    .eq("client_id", clientId)
    .order("paid_at", { ascending: false });
  return data ?? [];
}

export async function getPortalRequests(clientId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("requests")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function getPortalProjectsForSelect(clientId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("projects")
    .select("id,name,status")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });
  return data ?? [];
}

// ---------------- TICKETS / SOPORTE ----------------

export async function getSupportDashboardData() {
  const supabase = await createClient();
  const { data: tickets } = await supabase
    .from("tickets")
    .select("id,status,priority,created_at,resolved_at,closed_at");

  const list = tickets ?? [];
  const open = list.filter((t) => !["resolved", "closed"].includes(t.status));
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const resolvedToday = list.filter(
    (t) => t.resolved_at && new Date(t.resolved_at) >= startOfToday
  ).length;

  const resolvedWithDuration = list.filter((t) => t.resolved_at);
  const avgResolutionHours =
    resolvedWithDuration.length > 0
      ? resolvedWithDuration.reduce((sum, t) => {
          const created = new Date(t.created_at).getTime();
          const resolved = new Date(t.resolved_at!).getTime();
          return sum + (resolved - created) / 36e5;
        }, 0) / resolvedWithDuration.length
      : null;

  return {
    open: open.length,
    received: list.filter((t) => t.status === "received").length,
    reviewing: list.filter((t) => t.status === "reviewing").length,
    inProgress: list.filter((t) => t.status === "in_progress").length,
    waitingClient: list.filter((t) => t.status === "waiting_client").length,
    requiresQuote: list.filter((t) => t.status === "requires_quote").length,
    resolvedToday,
    avgResolutionHours,
    needsAttention: list.filter((t) =>
      ["received", "reviewing", "requires_quote"].includes(t.status)
    ).length,
  };
}

export async function getAllTickets(filters?: {
  clientId?: string;
  projectId?: string;
  status?: string;
  category?: string;
  priority?: string;
  query?: string;
}) {
  const supabase = await createClient();
  // Sin "description": las listas (bandeja admin, Mis solicitudes) no la
  // muestran; el detalle del ticket la trae aparte con getTicketDetail.
  let q = supabase
    .from("tickets")
    .select(
      "id,number,client_id,project_id,category,subject,status,priority,resolved_at,closed_at,reopen_deadline,created_at,updated_at,clients(id,business_name),projects(id,name)"
    )
    .order("created_at", { ascending: false });

  if (filters?.clientId) q = q.eq("client_id", filters.clientId);
  if (filters?.projectId) q = q.eq("project_id", filters.projectId);
  if (filters?.status) q = q.eq("status", filters.status);
  if (filters?.category) q = q.eq("category", filters.category);
  if (filters?.priority) q = q.eq("priority", filters.priority);
  if (filters?.query) q = q.or(`subject.ilike.%${filters.query}%,number.ilike.%${filters.query}%`);

  const { data } = await q;
  return data ?? [];
}

export async function getTicketDetail(id: string) {
  const supabase = await createClient();
  const { data: ticket } = await supabase
    .from("tickets")
    .select("*,clients(id,business_name),projects(id,name)")
    .eq("id", id)
    .single();
  if (!ticket) return null;

  const [messages, attachments, events, quotes, creator] = await Promise.all([
    supabase.from("ticket_messages").select("*").eq("ticket_id", id).order("created_at", { ascending: true }),
    supabase.from("ticket_attachments").select("*").eq("ticket_id", id).order("created_at", { ascending: true }),
    supabase.from("ticket_events").select("*").eq("ticket_id", id).order("created_at", { ascending: false }),
    supabase.from("ticket_quotes").select("*, ticket_quote_versions(*)").eq("ticket_id", id),
    // created_by referencia auth.users (no profiles), no se puede embeber con
    // un join: se resuelve el nombre/rol de quien originó el ticket aparte.
    ticket.created_by
      ? supabase.from("profiles").select("full_name,role").eq("id", ticket.created_by).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  return {
    ticket,
    messages: messages.data ?? [],
    attachments: attachments.data ?? [],
    events: events.data ?? [],
    quotes: quotes.data ?? [],
    creator: creator.data,
  };
}

export async function getPortalTickets(clientId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("tickets")
    .select(
      "id,number,client_id,project_id,category,subject,status,priority,resolved_at,closed_at,reopen_deadline,created_at,updated_at,projects(id,name)"
    )
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function getPortalTicketSummary(clientId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("tickets")
    .select("id,status,number,created_at")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });
  const list = data ?? [];
  return {
    open: list.filter((t) => !["resolved", "closed"].includes(t.status)).length,
    waitingReply: list.filter((t) => t.status === "waiting_client").length,
    lastTicketNumber: list[0]?.number ?? null,
  };
}

export async function getProjectSupportSummary(projectId: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("tickets").select("id,status").eq("project_id", projectId);
  const list = data ?? [];
  return {
    total: list.length,
    open: list.filter((t) => !["resolved", "closed"].includes(t.status)).length,
    resolved: list.filter((t) => ["resolved", "closed"].includes(t.status)).length,
  };
}

export async function getMyNotifications(limit = 30) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { notifications: [], unreadCount: 0 };

  const { data } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  const list = data ?? [];
  return { notifications: list, unreadCount: list.filter((n) => !n.read_at).length };
}

export async function getClientsForSelect() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("clients")
    .select("id,business_name")
    .order("business_name", { ascending: true });
  return data ?? [];
}
