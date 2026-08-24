import Link from "next/link";
import { getDashboardSecondary } from "@/lib/queries";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/Empty";
import { formatDateTime } from "@/lib/utils";
import { Clock3, Activity, AlertTriangle } from "lucide-react";

/**
 * Dominios por vencer + actividad reciente del dashboard admin. Server
 * Component async aparte para poder streamearlo en un <Suspense> propio
 * sin bloquear los KPIs principales.
 */
export async function DashboardSecondarySection() {
  const { upcomingRenewals, recentActivity } = await getDashboardSecondary();

  return (
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
          {upcomingRenewals.length === 0 ? (
            <EmptyState
              icon={AlertTriangle}
              title="Sin renovaciones próximas"
              description="No hay dominios ni servicios por vencer en los próximos 30 días."
            />
          ) : (
            <ul className="space-y-3">
              {upcomingRenewals.map((r) => (
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
          {recentActivity.length === 0 ? (
            <EmptyState icon={Activity} title="Sin actividad todavía" />
          ) : (
            <ul className="space-y-4">
              {recentActivity.map((h) => (
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
  );
}
