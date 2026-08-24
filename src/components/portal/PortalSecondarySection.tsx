import Link from "next/link";
import { getPortalSecondary } from "@/lib/queries";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/Empty";
import { formatDateTime, daysUntil } from "@/lib/utils";
import { Activity, FileText, RefreshCw } from "lucide-react";

/**
 * Contenido secundario del dashboard del portal (renovaciones + historial).
 * Vive en su propio Server Component async para poder streamearlo en un
 * <Suspense> aparte y no bloquear el primer render con estas queries.
 */
export async function PortalSecondarySection({ clientId }: { clientId: string }) {
  const { renewals, recentActivity } = await getPortalSecondary(clientId);

  const hasUpcomingRenewal = renewals.some((r) => {
    const d = daysUntil(r.due_date);
    return d !== null && d <= 30 && d >= 0 && r.status !== "renovado";
  });

  return (
    <>
      <div className="grid gap-2 sm:grid-cols-2">
        <Link
          href="/portal/documentos"
          className="flex items-center gap-3 rounded-lg border border-border px-4 py-3 text-sm text-muted transition-colors hover:border-muted-2 hover:text-foreground"
        >
          <FileText size={15} className="shrink-0" />
          <span className="flex-1">Documentos</span>
        </Link>
        <Link
          href="/portal/renovaciones"
          className="flex items-center gap-3 rounded-lg border border-border px-4 py-3 text-sm text-muted transition-colors hover:border-muted-2 hover:text-foreground"
        >
          <RefreshCw size={15} className="shrink-0" />
          <span className="flex-1">Renovaciones</span>
          {hasUpcomingRenewal && <Badge tone="warning">Próxima a vencer</Badge>}
        </Link>
      </div>

      <Card>
        <CardHeader className="flex items-center gap-2">
          <Activity size={15} className="text-muted" />
          <h2 className="text-card-title">Historial reciente</h2>
        </CardHeader>
        <CardBody>
          {recentActivity.length === 0 ? (
            <EmptyState icon={Activity} title="Sin novedades todavía" />
          ) : (
            <ul className="space-y-4">
              {recentActivity.slice(0, 5).map((h) => (
                <li key={h.id} className="flex gap-3 text-sm">
                  <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-2" />
                  <div>
                    <p>{h.event}</p>
                    <p className="text-xs text-muted-2">{formatDateTime(h.created_at)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </>
  );
}
