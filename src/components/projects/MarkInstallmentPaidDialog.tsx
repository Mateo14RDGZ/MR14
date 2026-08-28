"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Label, Field } from "@/components/ui/Input";
import { createPaymentAction } from "@/actions/payments";
import { formatCurrency } from "@/lib/utils";
import { CheckCircle2 } from "lucide-react";

/**
 * Marca una cuota como paga registrando el pago que hace falta para
 * cubrirla — el status "paga" de cada cuota se sigue calculando solo,
 * comparando payments contra el plan (installmentsWithStatus); esto solo
 * es un atajo para no tener que ir a "Registrar pago" y calcular el
 * monto a mano.
 */
export function MarkInstallmentPaidDialog({
  clientId,
  projectId,
  label,
  amountDue,
  currency,
}: {
  clientId: string;
  projectId: string;
  label: string;
  amountDue: number;
  currency: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function onSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await createPaymentAction(clientId, projectId, formData);
      if (result?.error) toast.error(result.error);
      else {
        toast.success("Cuota marcada como paga.");
        setOpen(false);
      }
    });
  }

  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        <CheckCircle2 size={14} /> Marcar como paga
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)} title={`Marcar "${label}" como paga`}>
        <form action={onSubmit} className="space-y-4">
          <p className="text-sm text-muted-2">
            Se registra un pago de {formatCurrency(amountDue, currency)} para cubrir esta cuota. Ajustá el monto si
            hace falta.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <Field className="mb-0">
              <Label>Monto *</Label>
              <Input type="number" name="amount" min={0} step="1" required defaultValue={amountDue} />
            </Field>
            <Field className="mb-0">
              <Label>Fecha</Label>
              <Input type="date" name="paid_at" defaultValue={new Date().toISOString().slice(0, 10)} />
            </Field>
          </div>
          <Field className="mb-0">
            <Label>Método</Label>
            <Input name="method" placeholder="Transferencia, efectivo…" />
          </Field>
          <Field className="mb-0">
            <Label>Notas</Label>
            <Textarea name="notes" rows={2} defaultValue={label} />
          </Field>
          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Guardando…" : "Marcar como paga"}
          </Button>
        </form>
      </Dialog>
    </>
  );
}
