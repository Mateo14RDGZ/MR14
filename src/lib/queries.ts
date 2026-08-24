import "server-only";
import { createClient } from "@/lib/supabase/server";
import { daysUntil, formatCurrency } from "@/lib/utils";

export async function getDashboardData() {
  const supabase = await createClient();

  const [clients, projects, renewals, history] = await Promise.all([
    supabase.from("clients").select("id,business_name,status"),
    supabase
      .from("projects")
      .select("id,name,status,price,deposit,balance,payment_status,client_id,clients(business_name)"),
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

  const clientList = clients.data ?? [];
  const projectList = projects.data ?? [];
  const renewalList = renewals.data ?? [];

  const activeClients = clientList.filter((c) => !["cerrado", "prospecto"].includes(c.status)).length;
  const inDevelopment = projectList.filter((p) => p.status === "en_desarrollo").length;
  const pending = projectList.filter((p) =>
    ["planificacion", "esperando_aprobacion", "esperando_saldo"].includes(p.status)
  ).length;
  const delivered = projectList.filter((p) => ["entregado", "publicado"].includes(p.status)).length;

  const moneyPending = projectList
    .filter((p) => p.payment_status !== "pagado")
    .reduce((sum, p) => sum + Number(p.balance ?? 0), 0);
  const moneyCollected = projectList.reduce((sum, p) => sum + Number(p.deposit ?? 0), 0);

  const upcomingRenewals = renewalList
    .map((r) => ({ ...r, days: daysUntil(r.due_date) }))
    .filter((r) => r.status !== "renovado" && r.days !== null && r.days <= 30 && r.days >= 0)
    .slice(0, 8);

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
    upcomingRenewals,
    clientsWithPendingPayments,
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

export async function getClients() {
  const supabase = await createClient();
  const { data } = await supabase.from("clients").select("*").order("created_at", { ascending: false });
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
  const [client, projects, credentials, documents, history, renewals, members, payments, requests] =
    await Promise.all([
      supabase.from("clients").select("*").eq("id", id).single(),
      supabase.from("projects").select("*").eq("client_id", id).order("created_at", { ascending: false }),
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

export async function getAllProjects() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("projects")
    .select("*,clients(id,business_name)")
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

export async function getPortalDashboardData(clientId: string) {
  const supabase = await createClient();
  const [projects, renewals, history] = await Promise.all([
    supabase
      .from("projects")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false }),
    supabase.from("renewals").select("*").eq("client_id", clientId).order("due_date", { ascending: true }),
    supabase
      .from("project_history")
      .select("*")
      .eq("client_id", clientId)
      .eq("visibility", "client")
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const project = projects.data?.[0] ?? null;
  let infra: { domains: unknown[]; hosting: unknown[] } = { domains: [], hosting: [] };
  if (project) {
    const [domains, hosting] = await Promise.all([
      supabase.from("domains").select("*").eq("project_id", project.id),
      supabase.from("hosting").select("*").eq("project_id", project.id),
    ]);
    infra = { domains: domains.data ?? [], hosting: hosting.data ?? [] };
  }

  return {
    projects: projects.data ?? [],
    project,
    domain: (infra.domains as { domain: string; status: string | null; expiry_date: string | null; registrar: string | null }[])[0] ?? null,
    hosting: (infra.hosting as { platform: string; production_url: string | null }[])[0] ?? null,
    renewals: renewals.data ?? [],
    recentActivity: history.data ?? [],
  };
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

export async function getPortalCredentials(clientId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("credentials")
    .select("*")
    .eq("client_id", clientId)
    .order("last_updated", { ascending: false });
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
  let q = supabase
    .from("tickets")
    .select("*,clients(id,business_name),projects(id,name)")
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

  const [messages, attachments, events, quotes] = await Promise.all([
    supabase.from("ticket_messages").select("*").eq("ticket_id", id).order("created_at", { ascending: true }),
    supabase.from("ticket_attachments").select("*").eq("ticket_id", id).order("created_at", { ascending: true }),
    supabase.from("ticket_events").select("*").eq("ticket_id", id).order("created_at", { ascending: false }),
    supabase.from("ticket_quotes").select("*, ticket_quote_versions(*)").eq("ticket_id", id),
  ]);

  return {
    ticket,
    messages: messages.data ?? [],
    attachments: attachments.data ?? [],
    events: events.data ?? [],
    quotes: quotes.data ?? [],
  };
}

export async function getPortalTickets(clientId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("tickets")
    .select("*,projects(id,name)")
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

export async function getClientSupportSummary(clientId: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("tickets").select("id,status,created_at").eq("client_id", clientId);
  const list = data ?? [];
  return {
    total: list.length,
    resolved: list.filter((t) => ["resolved", "closed"].includes(t.status)).length,
    open: list.filter((t) => !["resolved", "closed"].includes(t.status)).length,
    lastRequestDate: list.sort((a, b) => b.created_at.localeCompare(a.created_at))[0]?.created_at ?? null,
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
