import { getAllRenewals, getClientsForSelect } from "@/lib/queries";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/Empty";
import { NewRenewalDialog } from "@/components/renewals/NewRenewalDialog";
import { RenewalActions } from "@/components/renewals/RenewalActions";
import { formatCurrency, formatDate, daysUntil } from "@/lib/utils";
import { RENEWAL_WORKFLOW_STATUSES } from "@/lib/types";
import { RefreshCw } from "lucide-react";

const WORKFLOW_TONE: Record<string, "muted" | "warning" | "accent" | "success" | "danger"> = {
  pending: "muted",
  client_notified: "warning",
  confirmed: "accent",
  renewed: "success",
  not_renewed: "danger",
};

export default async function RenewalsPage() {
  const [renewals, clients] = await Promise.all([getAllRenewals(), getClientsForSelect()]);

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Renovaciones"
        description={`${renewals.length} servicios registrados`}
        action={<NewRenewalDialog clients={clients} />}
      />

      {renewals.length === 0 ? (
        <EmptyState icon={RefreshCw} title="Sin renovaciones registradas" />
      ) : (
        <div className="space-y-3">
          {renewals.map((r) => {
            const days = daysUntil(r.due_date);
            const urgent = days !== null && days <= 30 && days >= 0 && r.status !== "renovado";
            const overdue = days !== null && days < 0 && r.status !== "renovado";
            return (
              <Card key={r.id} className="p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">{r.service_name}</p>
                    <p className="text-xs text-muted-2">
                      {(r.clients as { business_name?: string } | null)?.business_name} · {r.kind.replace(/_/g, " ")}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge tone={overdue ? "danger" : urgent ? "warning" : "success"}>
                      {overdue ? "Vencido" : urgent ? `${days} días` : r.status.replace(/_/g, " ")}
                    </Badge>
                    <Badge tone={WORKFLOW_TONE[r.workflow_status] ?? "muted"}>
                      {RENEWAL_WORKFLOW_STATUSES.find((w) => w.value === r.workflow_status)?.label ?? r.workflow_status}
                    </Badge>
                    <span className="text-sm text-muted-2">{formatDate(r.due_date)}</span>
                    <span className="text-sm text-muted-2">{r.price ? formatCurrency(r.price) : "-"}</span>
                    <RenewalActions id={r.id} clientId={r.client_id} workflowStatus={r.workflow_status} />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
