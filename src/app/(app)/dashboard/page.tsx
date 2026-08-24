import Link from "next/link";
import { getDashboardData, getSupportDashboardData } from "@/lib/queries";
import { StatCard, Card, CardBody, CardHeader } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/Empty";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { Activity, Clock3, AlertTriangle, LifeBuoy, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export default async function DashboardPage() {
  const [data, support] = await Promise.all([getDashboardData(), getSupportDashboardData()]);

  const secondaryStats: { label: string; value: string | number; tone?: "warning" | "success" | "danger" }[] = [
    { label: "Pendientes", value: data.pending, tone: "warning" },
    { label: "Entregados", value: data.delivered, tone: "success" },
    { label: "Dinero cobrado", value: formatCurrency(data.moneyCollected), tone: "success" },
    { label: "Clientes c/ pagos pendientes", value: data.clientsWithPendingPayments, tone: "danger" },
    { label: "Tickets nuevos", value: support.received, tone: "warning" },
    { label: "Resueltos hoy", value: support.resolvedToday, tone: "success" },
  ];

  return (
    <div className="animate-fade-in space-y-8">
      <PageHeader title="Dashboard" description="Resumen general de MR14" />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Clientes activos" value={data.activeClients} hint={`${data.totalClients} en total`} />
        <StatCard label="En desarrollo" value={data.inDevelopment} />
        <StatCard label="Dinero pendiente" value={formatCurrency(data.moneyPending)} tone="warning" />
        <StatCard label="Tickets abiertos" value={support.open} tone={support.open > 0 ? "warning" : "default"} />
      </div>

      <Card className="overflow-hidden">
        <div className="grid grid-cols-2 divide-x divide-y divide-border sm:grid-cols-3 sm:divide-y-0 lg:grid-cols-6">
          {secondaryStats.map((s) => (
            <div key={s.label} className="p-4">
              <p className="text-label">{s.label}</p>
              <p
                className={cn(
                  "mt-1 text-lg font-semibold tabular-nums",
                  s.tone === "warning" && "text-warning",
                  s.tone === "success" && "text-success",
                  s.tone === "danger" && "text-danger"
                )}
              >
                {s.value}
              </p>
            </div>
          ))}
        </div>
      </Card>

      {support.needsAttention > 0 && (
        <Link
          href="/support"
          className="flex items-center gap-3 rounded-lg border border-warning/30 bg-warning-soft px-4 py-3 transition-colors hover:border-warning/50"
        >
          <LifeBuoy size={16} className="shrink-0 text-warning" />
          <p className="flex-1 text-sm text-warning">
            {support.needsAttention} ticket{support.needsAttention === 1 ? "" : "s"} requieren atención en Tickets.
          </p>
          <ChevronRight size={16} className="shrink-0 text-warning" />
        </Link>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock3 size={16} className="text-accent" />
              <h2 className="text-card-title">Dominios que vencen pronto</h2>
            </div>
            <Link href="/renewals" className="text-xs text-accent hover:underline">
              Ver todas
            </Link>
          </CardHeader>
          <CardBody>
            {data.upcomingRenewals.length === 0 ? (
              <EmptyState
                icon={AlertTriangle}
                title="Sin renovaciones próximas"
                description="No hay dominios ni servicios por vencer en los próximos 30 días."
              />
            ) : (
              <ul className="space-y-3">
                {data.upcomingRenewals.map((r) => (
                  <li key={r.id} className="flex items-center justify-between text-sm">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{r.service_name}</p>
                      <p className="truncate text-xs text-muted-2">
                        {(r.clients as { business_name?: string } | null)?.business_name ?? "-"}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-md border border-warning/30 bg-warning-soft px-2 py-0.5 text-xs font-medium text-warning">
                      {r.days} día{r.days === 1 ? "" : "s"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader className="flex items-center gap-2">
            <Activity size={16} className="text-accent" />
            <h2 className="text-card-title">Actividad reciente</h2>
          </CardHeader>
          <CardBody>
            {data.recentActivity.length === 0 ? (
              <EmptyState icon={Activity} title="Sin actividad todavía" />
            ) : (
              <ul className="space-y-4">
                {data.recentActivity.map((h) => (
                  <li key={h.id} className="flex gap-3 text-sm">
                    <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                    <div className="min-w-0">
                      <p className="truncate">
                        <span className="font-medium">
                          {(h.clients as { business_name?: string } | null)?.business_name ?? "MR14"}
                        </span>{" "}
                        <span className="text-muted">{h.event}</span>
                      </p>
                      <p className="text-xs text-muted-2">{formatDateTime(h.created_at)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
