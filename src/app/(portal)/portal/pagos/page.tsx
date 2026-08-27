import { getPortalContext } from "@/lib/portal";
import { getPortalPaymentsData, getActivePaymentMethods } from "@/lib/queries";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/Empty";
import { PageHeader } from "@/components/ui/PageHeader";
import { installmentsWithStatus } from "@/lib/installments";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Wallet, CheckCircle2, Clock, Landmark } from "lucide-react";

export default async function PortalPagosPage() {
  const { activeClientId } = await getPortalContext();
  const { project, installments, payments } = await getPortalPaymentsData(activeClientId);

  if (!project) {
    return <EmptyState icon={Wallet} title="Todavía no hay un proyecto asociado" />;
  }

  const rows = installmentsWithStatus(installments, project.amount_paid);
  const nextInstallment = rows.find((r) => r.isNext) ?? null;
  const allPaid = project.balance <= 0;
  const paymentMethods = allPaid ? [] : await getActivePaymentMethods();

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Pagos" description={`Proyecto ${project.name}`} />

      {allPaid ? (
        <p className="flex items-center gap-1.5 px-1 text-sm font-medium text-success">
          <CheckCircle2 size={16} /> Todo pago
        </p>
      ) : (
        <Card className="p-6 sm:p-8">
          <div className="space-y-2 text-sm">
            <Row label="Total" value={formatCurrency(project.price, project.currency)} />
            <Row label="Pagado" value={formatCurrency(project.amount_paid, project.currency)} tone="success" />
            <Row label="Pendiente" value={formatCurrency(project.balance, project.currency)} tone="warning" />
            {nextInstallment && (
              <Row label="Próximo pago" value={formatCurrency(nextInstallment.amount, project.currency)} />
            )}
          </div>
        </Card>
      )}

      {rows.length > 0 && (
        <Card>
          <CardHeader>
            <h2 className="text-card-title">Plan de cuotas</h2>
          </CardHeader>
          <CardBody className="space-y-0 divide-y divide-border">
            {rows.map((r) => (
              <div key={r.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                <div className="flex items-center gap-3 min-w-0">
                  {r.paid ? (
                    <CheckCircle2 size={18} className="shrink-0 text-success" />
                  ) : (
                    <Clock size={18} className="shrink-0 text-muted-2" />
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{r.label || `Cuota ${r.number}`}</p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-sm font-medium tabular-nums">{formatCurrency(r.amount, project.currency)}</span>
                  <Badge tone={r.paid ? "success" : r.isNext ? "warning" : "muted"}>
                    {r.paid ? "Pagada" : r.isNext ? "Próxima" : "Pendiente"}
                  </Badge>
                </div>
              </div>
            ))}
          </CardBody>
        </Card>
      )}

      {paymentMethods.length > 0 && (
        <div>
          <h2 className="mb-3 flex items-center gap-2 text-card-title">
            <Landmark size={16} className="text-accent" /> Cómo pagar
          </h2>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {paymentMethods.map((m) => (
              <Card key={m.id} className="w-[240px] shrink-0 p-4 text-sm">
                <p className="font-medium">{m.label}</p>
                <p className="mt-1 text-xs text-muted-2">{[m.bank, m.account_type, m.currency].filter(Boolean).join(" · ")}</p>
                {m.account_holder && <p className="text-xs text-muted-2">Titular: {m.account_holder}</p>}
                {m.account_number && <p className="break-all text-xs text-muted-2">{m.account_number}</p>}
                {m.notes && <p className="mt-2 text-xs text-muted-2">{m.notes}</p>}
              </Card>
            ))}
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <h2 className="text-card-title">Pagos recibidos</h2>
        </CardHeader>
        <CardBody>
          {payments.length === 0 ? (
            <EmptyState icon={Wallet} title="Todavía no registramos ningún pago" />
          ) : (
            <div className="space-y-0 divide-y divide-border">
              {payments.map((p) => (
                <div key={p.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                  <div>
                    <p className="text-sm font-medium">{formatCurrency(p.amount, project.currency)}</p>
                    <p className="text-xs text-muted-2">{p.method || "Sin método"} · {formatDate(p.paid_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

function Row({ label, value, tone }: { label: string; value: string; tone?: "success" | "warning" }) {
  const toneClass = tone === "success" ? "text-success" : tone === "warning" ? "text-warning" : "";
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted">{label}</span>
      <span className={`font-medium tabular-nums ${toneClass}`}>{value}</span>
    </div>
  );
}
