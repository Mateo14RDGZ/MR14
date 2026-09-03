import { getPortalContext } from "@/lib/portal";
import { getPortalRenewals } from "@/lib/queries";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/Empty";
import { formatDate, daysUntil } from "@/lib/utils";
import { RefreshCw } from "lucide-react";

export default async function PortalRenewalsPage() {
  const { activeClientId } = await getPortalContext();
  const renewals = await getPortalRenewals(activeClientId);

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="text-page-title">Próximos vencimientos</h1>
        <p className="mt-1 text-base leading-relaxed text-muted">Te avisamos con tiempo cuando haya que renovar algo de tu web.</p>
      </div>

      {renewals.length === 0 ? (
        <EmptyState
          icon={RefreshCw}
          title="No hay vencimientos próximos"
          description="Está todo al día. Te avisaremos cuando necesitemos que revises algo."
        />
      ) : (
        <div className="space-y-3">
          {renewals.map((r) => {
            const days = daysUntil(r.due_date);
            const urgent = days !== null && days <= 30 && days >= 0 && r.status !== "renovado";
            const renewed = r.status === "renovado";
            return (
              <Card key={r.id} className="flex items-center justify-between gap-3 p-4">
                <div>
                  <p className="font-medium">{r.service_name}</p>
                  <p className="text-sm text-muted">
                    {renewed ? "Renovado." : `Vence el ${formatDate(r.due_date)}${days !== null && days >= 0 ? ` (en ${days} día${days === 1 ? "" : "s"})` : ""}.`}
                  </p>
                </div>
                {urgent && <Badge tone="warning">Vence pronto</Badge>}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
