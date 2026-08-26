import Link from "next/link";
import { getPortalSecondary } from "@/lib/queries";
import { formatDateTime, daysUntil } from "@/lib/utils";
import { Activity, RefreshCw, AlertTriangle } from "lucide-react";

/**
 * Contenido secundario del dashboard del portal (renovación próxima +
 * actividad reciente, plegada). Vive en su propio Server Component async
 * para poder streamearlo en un <Suspense> aparte y no bloquear el primer
 * render con estas queries.
 */
export async function PortalSecondarySection({ clientId }: { clientId: string }) {
  const { renewals, recentActivity } = await getPortalSecondary(clientId);

  const upcomingRenewal = renewals.find((r) => {
    const d = daysUntil(r.due_date);
    return d !== null && d <= 30 && d >= 0 && r.status !== "renovado";
  });

  return (
    <>
      {/* Renovaciones: sin protagonismo salvo que haya una próxima a vencer. */}
      {upcomingRenewal && (
        <Link
          href="/portal/renovaciones"
          className="flex items-center gap-3 rounded-lg border border-warning/30 bg-warning-soft/20 px-4 py-3 text-sm text-warning transition-colors hover:border-warning/50"
        >
          <AlertTriangle size={15} className="shrink-0" />
          <span className="flex-1">Tu dominio está por vencer</span>
          <RefreshCw size={15} className="shrink-0" />
        </Link>
      )}

      {/* Actividad: plegada — es información secundaria, no compite con lo esencial. */}
      {recentActivity.length > 0 && (
        <details className="group rounded-lg border border-border">
          <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-sm text-muted marker:content-none group-open:border-b group-open:border-border">
            <Activity size={15} className="shrink-0" />
            Actividad reciente
          </summary>
          <ul className="space-y-4 p-4">
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
        </details>
      )}
    </>
  );
}
