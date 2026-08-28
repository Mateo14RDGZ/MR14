"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input, Label, Field } from "@/components/ui/Input";
import { updatePaymentAction } from "@/actions/payments";
import type { Payment } from "@/lib/types";
import { Receipt } from "lucide-react";

/**
 * Genera el comprobante de pago con todos los datos que ya están en la
 * base (cliente, proyecto, historial, cuotas) — automático. Lo único que
 * puede faltar es el método de pago (campo opcional al registrar el
 * pago), así que si no está cargado se pide antes de abrir el PDF, en
 * vez de generar un comprobante incompleto.
 */
export function ComprobanteButton({ clientId, payment }: { clientId: string; payment: Payment }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const pdfUrl = `/api/pdf?type=comprobante&paymentId=${payment.id}`;

  if (payment.method) {
    return (
      <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
        <Button size="sm" variant="ghost">
          <Receipt size={14} /> Comprobante
        </Button>
      </a>
    );
  }

  function onSubmit(formData: FormData) {
    startTransition(async () => {
      // Se preservan monto/fecha/notas tal cual estaban — solo se completa el método.
      formData.set("amount", String(payment.amount));
      formData.set("paid_at", payment.paid_at);
      formData.set("notes", payment.notes ?? "");
      const result = await updatePaymentAction(payment.id, clientId, payment.project_id, formData);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      setOpen(false);
      window.open(pdfUrl, "_blank", "noopener,noreferrer");
    });
  }

  return (
    <>
      <Button size="sm" variant="ghost" onClick={() => setOpen(true)}>
        <Receipt size={14} /> Comprobante
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)} title="Falta el método de pago">
        <form action={onSubmit} className="space-y-4">
          <p className="text-sm text-muted-2">
            Este pago no tiene método cargado — completalo para que el comprobante quede bien.
          </p>
          <Field className="mb-0">
            <Label>Método</Label>
            <Input name="method" required autoFocus placeholder="Transferencia, efectivo…" />
          </Field>
          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Generando…" : "Guardar y generar comprobante"}
          </Button>
        </form>
      </Dialog>
    </>
  );
}
