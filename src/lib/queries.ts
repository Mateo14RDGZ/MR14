import "server-only";
import { createClient } from "@/lib/supabase/server";
import { daysUntil } from "@/lib/utils";

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

export async function getClients() {
  const supabase = await createClient();
  const { data } = await supabase.from("clients").select("*").order("created_at", { ascending: false });
  return data ?? [];
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

  const [client, domains, hosting, repositories, databases, tasks, history] = await Promise.all([
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

export async function getPortalWebsiteInfo(projectId: string) {
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
  return {
    domain: domains.data?.[0] ?? null,
    hosting: hosting.data?.[0] ?? null,
    lastAudit: audits.data?.[0] ?? null,
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

export async function getClientsForSelect() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("clients")
    .select("id,business_name")
    .order("business_name", { ascending: true });
  return data ?? [];
}
