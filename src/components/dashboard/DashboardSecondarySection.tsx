import Link from "next/link";
import { getDashboardSecondary } from "@/lib/queries";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/Empty";
import { TICKET_STATUSES } from "@/lib/types";
import { formatDateTime, timeAgo } from "@/lib/utils";
import { Activity, LifeBuoy } from "lucide-react";

const STATUS_TONE: Record<string, "muted" | "warning" | "accent" | "success"> = {
  received: "warning",
  reviewing: "warning",
  in_progress: "accent",
  waiting_client: "warning",
  requires_quote: "warning",
  approved: "accent",
  resolved: "success",
  closed: "muted",
};

/**
 * Bandeja de tickets + actividad reciente del dashboard admin. Server
 * Component async aparte para poder streamearlo en un <Suspense> propio
 * sin bloquear los KPIs principales.
 */
export async function DashboardSecondarySection() {
  const { ticketInbox, recentActivity } = await getDashboardSecondary();

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LifeBuoy size={16} className="text-accent" />
            <h2 className="text-card-title">Bandeja de tickets</h2>
          </div>
          <Link href="/support" className="text-xs text-accent hover:underline">
            Ver todos
          </Link>
        </CardHeader>
        <CardBody>
          {ticketInbox.length === 0 ? (
            <EmptyState icon={LifeBuoy} title="Sin tickets todavía" />
          ) : (
            <ul className="space-y-3">
              {ticketInbox.map((t) => (
                <li key={t.id}>
                  <Link href={`/support/${t.id}`} className="flex items-center justify-between gap-3 text-sm hover:opacity-80">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{t.subject}</p>
                      <p className="truncate text-xs text-muted-2">
                        {(t.clients as { business_name?: string } | null)?.business_name ?? "-"} · hace {timeAgo(t.created_at)}
                      </p>
                    </div>
                    <Badge tone={STATUS_TONE[t.status] ?? "muted"} className="shrink-0">
                      {TICKET_STATUSES.find((s) => s.value === t.status)?.label ?? t.status}
                    </Badge>
                  </Link>
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
