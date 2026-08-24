"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Select, Label, Field } from "@/components/ui/Input";
import { createProjectAction } from "@/actions/projects";
import { PROJECT_TYPES } from "@/lib/types";
import { Plus } from "lucide-react";

export function NewProjectDialog({
  clientId,
  clients,
}: {
  clientId?: string;
  clients?: { id: string; business_name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function onSubmit(formData: FormData) {
    const targetClientId = clientId ?? String(formData.get("client_id") || "");
    if (!targetClientId) {
      toast.error("Elegí un cliente.");
      return;
    }
    startTransition(async () => {
      const result = await createProjectAction(targetClientId, formData);
      if (result?.error) toast.error(result.error);
      else setOpen(false);
    });
  }

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus size={14} /> Nuevo proyecto
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)} title="Nuevo proyecto">
        <form action={onSubmit} className="space-y-4">
          {!clientId && (
            <Field className="mb-0">
              <Label>Cliente *</Label>
              <Select name="client_id" required defaultValue="">
                <option value="" disabled>
                  Elegí un cliente
                </option>
                {clients?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.business_name}
                  </option>
                ))}
              </Select>
            </Field>
          )}
          <Field className="mb-0">
            <Label>Nombre *</Label>
            <Input name="name" required placeholder="Ej: Web presencia Motocenter" />
          </Field>
          <Field className="mb-0">
            <Label>Tipo</Label>
            <Select name="type" defaultValue="web_presencia">
              {PROJECT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field className="mb-0">
            <Label>Descripción</Label>
            <Textarea name="description" rows={2} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field className="mb-0">
              <Label>Fecha de inicio</Label>
              <Input type="date" name="start_date" />
            </Field>
            <Field className="mb-0">
              <Label>Entrega estimada</Label>
              <Input type="date" name="estimated_delivery_date" />
            </Field>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Field className="mb-0">
              <Label>Precio</Label>
              <Input type="number" name="price" min={0} step="1" defaultValue={0} />
            </Field>
            <Field className="mb-0">
              <Label>Anticipo</Label>
              <Input type="number" name="deposit" min={0} step="1" defaultValue={0} />
            </Field>
            <Field className="mb-0">
              <Label>Moneda</Label>
              <Select name="currency" defaultValue="UYU">
                <option value="UYU">UYU</option>
                <option value="USD">USD</option>
              </Select>
            </Field>
          </div>
          <Field className="mb-0">
            <Label>Cuotas (incluyendo el anticipo, si hay)</Label>
            <Select name="installments_count" defaultValue="1">
              {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  {n === 1 ? "Pago único" : `${n} cuotas`}
                </option>
              ))}
            </Select>
            <p className="text-caption mt-1">
              Se genera el plan automáticamente. El cliente lo va a ver en su portal.
            </p>
          </Field>
          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Creando…" : "Crear proyecto"}
          </Button>
        </form>
      </Dialog>
    </>
  );
}
