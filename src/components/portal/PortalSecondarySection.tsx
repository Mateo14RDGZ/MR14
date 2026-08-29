import { getPortalSecondary } from "@/lib/queries";
import { formatDateTime } from "@/lib/utils";
import { Activity, ArrowRight } from "lucide-react";

/**
 * Actividad secundaria del dashboard del portal, plegada. Vive en su
 * propio Server Component async
 * para poder streamearlo en un <Suspense> aparte y no bloquear el primer
 * render con estas queries.
 */
export async function PortalSecondarySection({ clientId }: { clientId: string }) {
  const { recentActivity } = await getPortalSecondary(clientId);

  return (
    <>
      {recentActivity.length > 0 && (
        <details className="group rounded-2xl border border-border bg-surface/60">
          <summary className="flex min-h-12 cursor-pointer list-none items-center gap-2 px-4 py-3 text-sm text-muted marker:content-none group-open:border-b group-open:border-border">
            <Activity size={15} className="shrink-0" />
            <span className="flex-1">Últimos movimientos</span>
            <ArrowRight size={14} className="transition-transform group-open:rotate-90" />
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
