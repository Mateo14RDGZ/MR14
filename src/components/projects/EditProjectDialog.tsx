"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Select, Label, Field } from "@/components/ui/Input";
import { updateProjectAction } from "@/actions/projects";
import { PROJECT_TYPES, PROJECT_STATUSES, type Project } from "@/lib/types";
import { Pencil } from "lucide-react";

const PAYMENT_STATUSES = [
  { value: "pendiente", label: "Pendiente" },
  { value: "parcial", label: "Parcial" },
  { value: "pagado", label: "Pagado" },
] as const;

export function EditProjectDialog({ clientId, project }: { clientId: string; project: Project }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function onSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await updateProjectAction(project.id, clientId, formData);
      if (result?.error) toast.error(result.error);
      else setOpen(false);
    });
  }

  return (
    <>
      <Button size="sm" variant="secondary" onClick={() => setOpen(true)}>
        <Pencil size={14} /> Editar
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)} title="Editar proyecto">
        <form action={onSubmit} className="space-y-4">
          <Field className="mb-0">
            <Label>Nombre *</Label>
            <Input name="name" required defaultValue={project.name} />
          </Field>
          <Field className="mb-0">
            <Label>Tipo</Label>
            <Select name="type" defaultValue={project.type}>
              {PROJECT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field className="mb-0">
            <Label>Descripción</Label>
            <Textarea name="description" rows={2} defaultValue={project.description ?? ""} />
          </Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field className="mb-0">
              <Label>Estado</Label>
              <Select name="status" defaultValue={project.status}>
                {PROJECT_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field className="mb-0">
              <Label>Estado de pago</Label>
              <Select name="payment_status" defaultValue={project.payment_status}>
                {PAYMENT_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field className="mb-0">
              <Label>Fecha de inicio</Label>
              <Input type="date" name="start_date" defaultValue={project.start_date ?? ""} />
            </Field>
            <Field className="mb-0">
              <Label>Entrega estimada</Label>
              <Input type="date" name="estimated_delivery_date" defaultValue={project.estimated_delivery_date ?? ""} />
            </Field>
            <Field className="mb-0">
              <Label>Entrega real</Label>
              <Input type="date" name="actual_delivery_date" defaultValue={project.actual_delivery_date ?? ""} />
            </Field>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field className="mb-0">
              <Label>Precio</Label>
              <Input type="number" name="price" min={0} step="1" defaultValue={project.price} />
            </Field>
            <Field className="mb-0">
              <Label>Anticipo</Label>
              <Input type="number" name="deposit" min={0} step="1" defaultValue={project.deposit} />
            </Field>
            <Field className="mb-0">
              <Label>Moneda</Label>
              <Select name="currency" defaultValue={project.currency}>
                <option value="UYU">UYU</option>
                <option value="USD">USD</option>
              </Select>
            </Field>
          </div>
          <Field className="mb-0">
            <Label>Notas</Label>
            <Textarea name="notes" rows={3} defaultValue={project.notes ?? ""} />
          </Field>
          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Guardando…" : "Guardar cambios"}
          </Button>
        </form>
      </Dialog>
    </>
  );
}
