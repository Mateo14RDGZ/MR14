"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Label, Field } from "@/components/ui/Input";
import { createPaymentAction } from "@/actions/payments";
import { CircleDollarSign } from "lucide-react";

export function RegisterPaymentDialog({
  clientId,
  projects,
}: {
  clientId: string;
  projects: { id: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  if (projects.length === 0) return null;

  function onSubmit(formData: FormData) {
    const projectId = String(formData.get("project_id") || "");
    startTransition(async () => {
      const result = await createPaymentAction(clientId, projectId, formData);
      if (result?.error) toast.error(result.error);
      else {
        toast.success("Pago registrado.");
        setOpen(false);
      }
    });
  }

  return (
    <>
      <Button size="sm" variant="secondary" onClick={() => setOpen(true)}>
        <CircleDollarSign size={14} /> Registrar pago
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)} title="Registrar pago">
        <form action={onSubmit} className="space-y-4">
          <Field className="mb-0">
            <Label>Proyecto</Label>
            <select
              name="project_id"
              required
              className="w-full rounded-lg border border-border bg-surface px-3 h-10 text-sm outline-none focus:border-accent"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field className="mb-0">
              <Label>Monto *</Label>
              <Input type="number" name="amount" min={0} step="1" required />
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
            <Textarea name="notes" rows={2} />
          </Field>
          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Guardando…" : "Registrar pago"}
          </Button>
        </form>
      </Dialog>
    </>
  );
}
