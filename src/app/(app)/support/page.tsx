import Link from "next/link";
import { getAllTickets, getSupportDashboardData, getClientsForSelect } from "@/lib/queries";
import { StatCard, Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/Empty";
import { TICKET_STATUSES, TICKET_CATEGORIES, TICKET_PRIORITIES } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { LifeBuoy, Search } from "lucide-react";

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
  searchParams: Promise<{ client?: string; status?: string; category?: string; priority?: string; q?: string }>;
}) {
  const params = await searchParams;
  const [tickets, metrics, clients] = await Promise.all([
    getAllTickets({
      clientId: params.client,
      status: params.status,
      category: params.category,
      priority: params.priority,
      query: params.q,
    }),
    getSupportDashboardData(),
    getClientsForSelect(),
  ]);

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Soporte</h1>
        <p className="mt-1 text-sm text-muted">Bandeja de tickets de todos los clientes.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Abiertos" value={metrics.open} />
        <StatCard label="Requieren atención" value={metrics.needsAttention} tone="warning" />
        <StatCard label="Esperando cliente" value={metrics.waitingClient} />
        <StatCard label="Resueltos hoy" value={metrics.resolvedToday} tone="success" />
      </div>

      <Card className="p-4">
        <form className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6" method="get">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3">
              <Search size={14} className="text-muted-2" />
              <input
                name="q"
                defaultValue={params.q}
                placeholder="Buscar por # o asunto…"
                className="h-9 w-full bg-transparent text-sm outline-none placeholder:text-muted-2"
              />
            </div>
          </div>
          <Select name="client" defaultValue={params.client ?? ""}>
            <option value="">Todos los clientes</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.business_name}
              </option>
            ))}
          </Select>
          <Select name="status" defaultValue={params.status ?? ""}>
            <option value="">Todos los estados</option>
            {TICKET_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </Select>
          <Select name="category" defaultValue={params.category ?? ""}>
            <option value="">Todas las categorías</option>
            {TICKET_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </Select>
          <Select name="priority" defaultValue={params.priority ?? ""}>
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
      </Card>

      {tickets.length === 0 ? (
        <EmptyState icon={LifeBuoy} title="Sin tickets" description="No hay solicitudes que coincidan con estos filtros." />
      ) : (
        <div className="space-y-2">
          {tickets.map((t) => (
            <Link key={t.id} href={`/support/${t.id}`}>
              <Card className="p-4 transition-colors hover:border-muted-2">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-mono text-xs text-muted-2">#{t.number}</p>
                    <p className="truncate font-medium">{t.subject}</p>
                    <p className="text-xs text-muted-2">
                      {(t.clients as { business_name?: string } | null)?.business_name} ·{" "}
                      {(t.projects as { name?: string } | null)?.name} · {formatDate(t.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
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
          ))}
        </div>
      )}
    </div>
  );
}
