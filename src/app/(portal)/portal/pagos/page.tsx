import { getPortalContext } from "@/lib/portal";
import { getPortalPaymentsData, getActivePaymentMethods } from "@/lib/queries";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/Empty";
import { PageHeader } from "@/components/ui/PageHeader";
import { installmentsWithStatus } from "@/lib/installments";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Wallet, CheckCircle2, Clock, Landmark, ArrowRight, ReceiptText } from "lucide-react";
import { CopyButton } from "@/components/portal/CopyButton";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

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
      <PageHeader title="Pagos" description="Acá podés ver cuánto pagaste y si queda algo pendiente." />

      {allPaid ? (
        <p className="flex items-center gap-1.5 px-1 text-sm font-medium text-success">
          <CheckCircle2 size={18} /> Está todo pago. No necesitás hacer nada.
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
            <h2 className="text-card-title">Detalle de los pagos</h2>
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
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
            {paymentMethods.map((m) => (
              <Card key={m.id} className="flex flex-col p-5 text-sm">
                <p className="font-medium">{m.label}</p>
                <p className="mt-1 text-xs text-muted-2">{[m.bank, m.account_type, m.currency].filter(Boolean).join(" · ")}</p>
                {m.account_holder && <p className="mt-2 text-xs text-muted-2">Titular: {m.account_holder}</p>}
                {m.account_number && (
                  <div className="mt-2 flex items-center gap-1">
                    <p className="break-all text-lg font-semibold tabular-nums">{m.account_number}</p>
                    <CopyButton value={m.account_number} />
                  </div>
                )}
                {m.notes && <p className="mt-auto pt-3 text-xs text-muted-2">{m.notes}</p>}
              </Card>
            ))}
          </div>
          <Card className="mt-3 p-5">
            <div className="flex items-start gap-3">
              <ReceiptText size={18} className="mt-0.5 shrink-0 text-accent" />
              <div className="min-w-0 flex-1">
                <h3 className="text-card-title">¿Ya hiciste la transferencia?</h3>
                <ol className="mt-2 space-y-1 text-sm text-muted">
                  <li>1. Guardá una foto o el archivo del comprobante.</li>
                  <li>2. Tocá el botón de abajo y adjuntalo.</li>
                  <li>3. Te avisaremos cuando el pago quede registrado.</li>
                </ol>
                <Link href="/portal/solicitudes/nueva?motivo=pago">
                  <Button className="mt-4" variant="secondary">
                    Enviar comprobante <ArrowRight size={15} />
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
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
                  <a
                    href={`/api/pdf?type=comprobante&paymentId=${p.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 text-xs font-medium text-accent hover:underline"
                  >
                    Comprobante
                  </a>
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
