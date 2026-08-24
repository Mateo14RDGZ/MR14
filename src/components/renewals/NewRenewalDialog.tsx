"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea, Label, Field } from "@/components/ui/Input";
import { createRenewalAction } from "@/actions/renewals";
import { Plus } from "lucide-react";

export function NewRenewalDialog({ clients }: { clients: { id: string; business_name: string }[] }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function onSubmit(formData: FormData) {
    const clientId = String(formData.get("client_id") || "");
    startTransition(async () => {
      const result = await createRenewalAction(clientId, formData);
      if (result?.error) toast.error(result.error);
      else {
        toast.success("Renovación registrada.");
        setOpen(false);
      }
    });
  }

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus size={14} /> Nueva renovación
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)} title="Nueva renovación">
        <form action={onSubmit} className="space-y-4">
          <Field className="mb-0">
            <Label>Cliente</Label>
            <Select name="client_id" required defaultValue="">
              <option value="" disabled>
                Seleccionar cliente…
              </option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.business_name}
                </option>
              ))}
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field className="mb-0">
              <Label>Tipo</Label>
              <Select name="kind" defaultValue="dominio">
                <option value="dominio">Dominio</option>
                <option value="hosting">Hosting</option>
                <option value="email">Email</option>
                <option value="servicio_externo">Servicio externo</option>
                <option value="otro">Otro</option>
              </Select>
            </Field>
            <Field className="mb-0">
              <Label>Vencimiento *</Label>
              <Input type="date" name="due_date" required />
            </Field>
          </div>
          <Field className="mb-0">
            <Label>Servicio</Label>
            <Input name="service_name" required placeholder="Ej: Dominio motocenter.com.uy" />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field className="mb-0">
              <Label>Precio</Label>
              <Input type="number" name="price" min={0} />
            </Field>
            <Field className="mb-0 flex items-end">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="auto_renew" className="h-4 w-4" /> Renovación automática
              </label>
            </Field>
          </div>
          <Field className="mb-0">
            <Label>Notas</Label>
            <Textarea name="notes" rows={2} />
          </Field>
          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Guardando…" : "Registrar"}
          </Button>
        </form>
      </Dialog>
    </>
  );
}
