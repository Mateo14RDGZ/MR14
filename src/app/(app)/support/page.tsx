import Link from "next/link";
import { NotificationsToggle } from "@/components/shared/NotificationsToggle";
import { TicketLiveUpdates } from "@/components/shared/TicketLiveUpdates";
import { getAllTickets, getSupportDashboardData, getClientsForSelect, getAllProjects } from "@/lib/queries";
import { StatCard, Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/Empty";
import { NewTicketDialog } from "@/components/shared/NewTicketDialog";
import { TICKET_STATUSES, TICKET_CATEGORIES, TICKET_PRIORITIES } from "@/lib/types";
import { formatDate, timeAgo } from "@/lib/utils";
import { LifeBuoy, Search, Clock } from "lucide-react";

const NEEDS_REPLY_STATUSES = new Set(["received", "reviewing", "requires_quote"]);

const STATUS_TONE: Record<string, "muted" | "warning" | "accent" | "success" | "danger"> = {
  received: "muted",
  reviewing: "warning",
  in_progress: "accent",
  waiting_client: "warning",
  requires_quote: "warning",
  approved: "accent",
  resolved: "success",
  closed: "muted",
};

const PRIORITY_TONE: Record<string, "muted" | "warning" | "danger" | "accent"> = {
  low: "muted",
  normal: "accent",
  high: "warning",
  critical: "danger",
};

export default async function SupportPage({
  searchParams,
}: {
  searchParams: Promise<{
    client?: string;
    status?: string;
    category?: string;
    priority?: string;
    q?: string;
    new?: string;
    view?: "attention" | "waiting" | "critical" | "done" | "all";
  }>;
}) {
  const params = await searchParams;
  const [tickets, metrics, clients, projects] = await Promise.all([
    getAllTickets({
      clientId: params.client,
      status: params.status,
      category: params.category,
      priority: params.priority,
      query: params.q,
    }),
    getSupportDashboardData(),
    getClientsForSelect(),
    getAllProjects(),
  ]);
  const projectOptions = projects.map((p) => ({ id: p.id, name: p.name, client_id: p.client_id }));

  // Prioridad visual: lo que espera respuesta de MR14 va primero (más
  // antiguo primero, porque es lo más urgente), el resto queda por fecha
  // de creación como antes. Sin agregar ninguna métrica nueva.
  const visibleTickets = tickets.filter((ticket) => {
    if (params.view === "done") return ["resolved", "closed"].includes(ticket.status);
    if (!params.view && !params.status) return !["resolved", "closed"].includes(ticket.status);
    if (params.view === "attention") return NEEDS_REPLY_STATUSES.has(ticket.status);
    if (params.view === "waiting") return ticket.status === "waiting_client";
    if (params.view === "critical") return ticket.priority === "critical";
    return true;
  });
  const sortedTickets = [...visibleTickets].sort((a, b) => {
    const aWaiting = NEEDS_REPLY_STATUSES.has(a.status);
    const bWaiting = NEEDS_REPLY_STATUSES.has(b.status);
    if (aWaiting !== bWaiting) return aWaiting ? -1 : 1;
    if (aWaiting && bWaiting) return new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
  const hasFilters = Boolean(params.client || params.status || params.category || params.priority || params.q || params.view);

  return (
    <div className="animate-fade-in space-y-6">
      <TicketLiveUpdates />
      <PageHeader
        title="Tickets"
        description="Respondé, seguí el trabajo y cerrá las consultas desde acá."
        action={<NewTicketDialog clients={clients} projects={projectOptions} autoOpen={params.new === "ticket"} />}
      />
      <NotificationsToggle audience="admin" />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Abiertos" value={metrics.open} />
        <StatCard label="Requieren atención" value={metrics.needsAttention} tone="warning" />
        <StatCard label="Esperando cliente" value={metrics.waitingClient} />
        <StatCard label="Resueltos hoy" value={metrics.resolvedToday} tone="success" />
      </div>

      <nav aria-label="Vistas rápidas de tickets" className="flex flex-wrap items-center gap-2">
        <QuickView href="/support" active={!params.view}>En curso</QuickView>
        <QuickView href="/support?view=attention" active={params.view === "attention"}>Requieren atención</QuickView>
        <QuickView href="/support?view=waiting" active={params.view === "waiting"}>Esperando cliente</QuickView>
        <QuickView href="/support?view=critical" active={params.view === "critical"}>Críticos</QuickView>
        <QuickView href="/support?view=done" active={params.view === "done"}>Terminados</QuickView>
        <QuickView href="/support?view=all" active={params.view === "all"}>Todos</QuickView>
        {hasFilters && (
          <Link href="/support" className="ml-auto text-xs font-medium text-accent hover:underline">
            Limpiar filtros
          </Link>
        )}
      </nav>

      <details open={Boolean(params.client || params.status || params.category || params.priority || params.q)} className="rounded-xl border border-border bg-surface p-4">
        <summary className="min-h-8 cursor-pointer text-sm font-medium">Buscar y filtrar consultas</summary>
        <form className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6" method="get">
          {params.view && <input type="hidden" name="view" value={params.view} />}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3">
              <Search size={14} className="text-muted-2" />
              <input
                name="q"
                aria-label="Buscar tickets por número o asunto"
                defaultValue={params.q}
                placeholder="Buscar por # o asunto…"
                className="h-9 w-full bg-transparent text-sm outline-none placeholder:text-muted-2"
              />
            </div>
          </div>
          <Select name="client" aria-label="Filtrar por cliente" defaultValue={params.client ?? ""}>
            <option value="">Todos los clientes</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.business_name}
              </option>
            ))}
          </Select>
          <Select name="status" aria-label="Filtrar por estado" defaultValue={params.status ?? ""}>
            <option value="">Todos los estados</option>
            {TICKET_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </Select>
          <Select name="category" aria-label="Filtrar por categoría" defaultValue={params.category ?? ""}>
            <option value="">Todas las categorías</option>
            {TICKET_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </Select>
          <Select name="priority" aria-label="Filtrar por prioridad" defaultValue={params.priority ?? ""}>
            <option value="">Toda prioridad</option>
            {TICKET_PRIORITIES.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </Select>
          <Button type="submit" variant="secondary" size="sm" className="lg:col-span-6 lg:w-40">
            Filtrar
          </Button>
        </form>
      </details>

      {sortedTickets.length === 0 ? (
        <EmptyState
          icon={LifeBuoy}
          title={hasFilters ? "Sin resultados" : "Sin tickets"}
          description={hasFilters ? "No hay solicitudes que coincidan con estos filtros." : "Los nuevos tickets aparecerán acá."}
          action={hasFilters ? <Link href="/support" className="text-sm font-medium text-accent hover:underline">Limpiar filtros</Link> : undefined}
        />
      ) : (
        <div className="space-y-2">
          {sortedTickets.map((t) => {
            const needsReply = NEEDS_REPLY_STATUSES.has(t.status);
            const hoursSince = (Date.now() - new Date(t.updated_at).getTime()) / 36e5;
            const isStale = needsReply && hoursSince >= 24;
            return (
              <Link key={t.id} href={`/support/${t.id}`} className="block">
                <Card className={`p-4 transition-colors hover:border-muted-2 ${isStale ? "border-danger/30" : ""}`}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-mono text-xs text-muted-2">#{t.number}</p>
                      <p className="break-words font-medium">{t.subject}</p>
                      <p className="text-xs text-muted-2">
                        {(t.clients as { business_name?: string } | null)?.business_name} ·{" "}
                        {(t.projects as { name?: string } | null)?.name} · {formatDate(t.created_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {needsReply && (
                        <span className={`flex items-center gap-1 text-xs ${isStale ? "font-medium text-danger" : "text-muted-2"}`}>
                          <Clock size={12} /> Sin responder hace {timeAgo(t.updated_at)}
                        </span>
                      )}
                      <Badge tone={PRIORITY_TONE[t.priority]}>
                        {TICKET_PRIORITIES.find((p) => p.value === t.priority)?.label}
                      </Badge>
                      <Badge tone={STATUS_TONE[t.status]}>
                        {TICKET_STATUSES.find((s) => s.value === t.status)?.label}
                      </Badge>
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function QuickView({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`inline-flex min-h-11 items-center rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
        active ? "border-accent bg-accent-soft text-foreground" : "border-border text-muted hover:border-border-strong hover:text-foreground"
      }`}
    >
      {children}
    </Link>
  );
}
