import Link from "next/link";
import { getDashboardData } from "@/lib/queries";
import { StatCard, Card, CardBody, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/Empty";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { Activity, Clock3, AlertTriangle } from "lucide-react";

export default async function DashboardPage() {
  const data = await getDashboardData();

  return (
    <div className="animate-fade-in space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-muted">Resumen general de MR14</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Clientes activos" value={data.activeClients} hint={`${data.totalClients} en total`} />
        <StatCard label="En desarrollo" value={data.inDevelopment} tone="default" />
        <StatCard label="Pendientes" value={data.pending} tone="warning" />
        <StatCard label="Entregados" value={data.delivered} tone="success" />
        <StatCard
          label="Dinero pendiente"
          value={formatCurrency(data.moneyPending)}
          tone="warning"
        />
        <StatCard label="Dinero cobrado" value={formatCurrency(data.moneyCollected)} tone="success" />
        <StatCard label="Renovaciones próximas" value={data.upcomingRenewals.length} tone="warning" />
        <StatCard
          label="Clientes con pagos pendientes"
          value={data.clientsWithPendingPayments}
          tone="danger"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock3 size={16} className="text-accent" />
              <h2 className="text-sm font-semibold">Dominios que vencen pronto</h2>
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
                    <span className="shrink-0 rounded-full border border-warning/30 bg-warning/10 px-2.5 py-0.5 text-xs font-medium text-warning">
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
            <h2 className="text-sm font-semibold">Actividad reciente</h2>
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
