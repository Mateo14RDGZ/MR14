import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/Empty";
import { RegisterPaymentDialog } from "@/components/clients/RegisterPaymentDialog";
import { DeletePaymentButton } from "@/components/clients/DeletePaymentButton";
import type { Payment } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { CircleDollarSign } from "lucide-react";

export function PaymentsTab({
  clientId,
  payments,
  projects,
}: {
  clientId: string;
  payments: Payment[];
  projects: { id: string; name: string }[];
}) {
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <RegisterPaymentDialog clientId={clientId} projects={projects} />
      </div>
      {payments.length === 0 ? (
        <EmptyState icon={CircleDollarSign} title="Sin pagos registrados" />
      ) : (
        <div className="space-y-2">
          {payments.map((p) => (
            <Card key={p.id} className="flex items-center justify-between gap-3 p-4">
              <div>
                <p className="font-medium">{formatCurrency(p.amount)}</p>
                <p className="text-xs text-muted-2">
                  {p.method || "Sin método"} · {formatDate(p.paid_at)}
                </p>
              </div>
              <DeletePaymentButton id={p.id} clientId={clientId} projectId={p.project_id} />
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
