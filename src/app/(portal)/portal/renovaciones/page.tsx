import { getPortalContext } from "@/lib/portal";
import { getPortalRenewals } from "@/lib/queries";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/Empty";
import { formatCurrency, formatDate, daysUntil } from "@/lib/utils";
import { RefreshCw } from "lucide-react";

export default async function PortalRenewalsPage() {
  const { activeClientId } = await getPortalContext();
  const renewals = await getPortalRenewals(activeClientId);

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Renovaciones</h1>
        <p className="mt-1 text-sm text-muted">Dominio, hosting y otros servicios asociados a tu proyecto.</p>
      </div>

      {renewals.length === 0 ? (
        <EmptyState icon={RefreshCw} title="No hay renovaciones registradas" />
      ) : (
        <div className="space-y-3">
          {renewals.map((r) => {
            const days = daysUntil(r.due_date);
            const urgent = days !== null && days <= 30 && days >= 0 && r.status !== "renovado";
            return (
              <Card key={r.id} className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">{r.service_name}</p>
                    <p className="text-xs text-muted-2 capitalize">{r.kind.replace(/_/g, " ")}</p>
                  </div>
                  <Badge tone={urgent ? "warning" : r.status === "vencido" ? "danger" : "success"}>
                    {r.status.replace(/_/g, " ")}
                  </Badge>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-muted-2">Vence</p>
                    <p className="font-medium">{formatDate(r.due_date)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-2">Faltan</p>
                    <p className="font-medium">{days !== null ? `${days} días` : "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-2">Costo estimado</p>
                    <p className="font-medium">{r.price ? formatCurrency(r.price) : "-"}</p>
                  </div>
                </div>
                {r.auto_renew && (
                  <p className="mt-2 text-xs text-success">Renovación automática activada</p>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
