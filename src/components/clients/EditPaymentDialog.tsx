"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Label, Field } from "@/components/ui/Input";
import { PaymentMethodField } from "@/components/clients/PaymentMethodField";
import { updatePaymentAction } from "@/actions/payments";
import type { Payment, PaymentMethod } from "@/lib/types";
import { Pencil } from "lucide-react";

export function EditPaymentDialog({
  clientId,
  payment,
  paymentMethods,
}: {
  clientId: string;
  payment: Payment;
  paymentMethods: PaymentMethod[];
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function onSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await updatePaymentAction(payment.id, clientId, payment.project_id, formData);
      if (result?.error) toast.error(result.error);
      else {
        toast.success("Pago actualizado.");
        setOpen(false);
      }
    });
  }

  return (
    <>
      <Button size="icon" variant="ghost" onClick={() => setOpen(true)}>
        <Pencil size={14} />
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)} title="Editar pago">
        <form action={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field className="mb-0">
              <Label>Monto *</Label>
              <Input type="number" name="amount" min={0} step="1" required defaultValue={payment.amount} />
            </Field>
            <Field className="mb-0">
              <Label>Fecha</Label>
              <Input type="date" name="paid_at" defaultValue={payment.paid_at?.slice(0, 10)} />
            </Field>
          </div>
          <PaymentMethodField paymentMethods={paymentMethods} defaultValue={payment.method} />
          <Field className="mb-0">
            <Label>Notas</Label>
            <Textarea name="notes" rows={2} defaultValue={payment.notes ?? ""} />
          </Field>
          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Guardando…" : "Guardar cambios"}
          </Button>
        </form>
      </Dialog>
    </>
  );
}
