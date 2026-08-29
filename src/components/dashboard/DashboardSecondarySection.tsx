import { getDashboardSecondary } from "@/lib/queries";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/Empty";
import { formatDateTime } from "@/lib/utils";
import { Activity } from "lucide-react";

/**
 * Actividad reciente del dashboard admin. Server Component async aparte
 * para poder streamearlo en un <Suspense> propio sin bloquear los KPIs.
 */
export async function DashboardSecondarySection() {
  const { recentActivity } = await getDashboardSecondary();

  return (
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
  );
}
