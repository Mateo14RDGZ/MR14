import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/Empty";
import { RegisterPaymentDialog } from "@/components/clients/RegisterPaymentDialog";
import { EditPaymentDialog } from "@/components/clients/EditPaymentDialog";
import { ComprobanteButton } from "@/components/clients/ComprobanteButton";
import { DeletePaymentButton } from "@/components/clients/DeletePaymentButton";
import { installmentsWithStatus } from "@/lib/installments";
import type { Payment, ProjectInstallment } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { CircleDollarSign } from "lucide-react";

interface ProjectPaymentInfo {
  id: string;
  name: string;
  price: number;
  amount_paid: number;
  balance: number;
  currency: string;
}

export function PaymentsTab({
  clientId,
  payments,
  projects,
  installments,
}: {
  clientId: string;
  payments: Payment[];
  projects: ProjectPaymentInfo[];
  installments: ProjectInstallment[];
}) {
  return (
    <div className="space-y-4">
      {/* Precio/Pagado/Saldo/Cuotas por proyecto — de un vistazo, antes de
          entrar al historial. Un solo proyecto es el caso normal; si hay
          varios, cada uno tiene su propio resumen. */}
      <div className="space-y-2">
        {projects.map((p) => {
          const rows = installmentsWithStatus(
            installments.filter((i) => i.project_id === p.id),
            p.amount_paid
          );
          const paidCount = rows.filter((r) => r.paid).length;
          return (
            <Card key={p.id} className="p-4">
              {projects.length > 1 && <p className="mb-2 text-xs font-medium text-muted-2">{p.name}</p>}
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div>
                  <p className="text-caption">Precio</p>
                  <p className="font-medium tabular-nums">{formatCurrency(p.price, p.currency)}</p>
                </div>
                <div>
                  <p className="text-caption">Pagado</p>
                  <p className="font-medium tabular-nums text-success">{formatCurrency(p.amount_paid, p.currency)}</p>
                </div>
                <div>
                  <p className="text-caption">Saldo</p>
                  <p className={`font-medium tabular-nums ${p.balance > 0 ? "text-warning" : "text-success"}`}>
                    {p.balance > 0 ? formatCurrency(p.balance, p.currency) : "Al día"}
                  </p>
                </div>
              </div>
              {rows.length > 0 && (
                <p className="mt-2 text-xs text-muted-2">
                  {paidCount} de {rows.length} cuotas pagas
                </p>
              )}
            </Card>
          );
        })}
      </div>

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
              <div className="flex shrink-0 items-center gap-1">
                <ComprobanteButton clientId={clientId} payment={p} />
                <EditPaymentDialog clientId={clientId} payment={p} />
                <DeletePaymentButton id={p.id} clientId={clientId} projectId={p.project_id} />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
