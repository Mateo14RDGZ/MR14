"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Label, Field } from "@/components/ui/Input";
import { createPaymentAction } from "@/actions/payments";
import { formatCurrency } from "@/lib/utils";
import { CircleDollarSign } from "lucide-react";

interface ProjectOption {
  id: string;
  name: string;
  balance: number;
  currency: string;
}

export function RegisterPaymentDialog({
  clientId,
  projects,
}: {
  clientId: string;
  projects: ProjectOption[];
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [projectId, setProjectId] = useState(projects[0]?.id ?? "");

  if (projects.length === 0) return null;
  const selected = projects.find((p) => p.id === projectId) ?? projects[0];

  function onSubmit(formData: FormData) {
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
          {projects.length > 1 ? (
            <Field className="mb-0">
              <Label>Proyecto</Label>
              <select
                name="project_id"
                required
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full rounded-lg border border-border bg-surface px-3 h-10 text-sm outline-none focus:border-accent"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </Field>
          ) : (
            <input type="hidden" name="project_id" value={projectId} />
          )}

          {selected && (
            <div className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm">
              <span className="text-muted">Saldo pendiente: </span>
              <span className="font-medium text-warning">{formatCurrency(selected.balance, selected.currency)}</span>
            </div>
          )}

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
            {pending ? "Registrando…" : "Registrar pago"}
          </Button>
        </form>
      </Dialog>
    </>
  );
}
