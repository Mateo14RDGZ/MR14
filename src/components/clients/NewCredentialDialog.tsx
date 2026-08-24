"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea, Label, Field } from "@/components/ui/Input";
import { createCredentialAction } from "@/actions/credentials";
import { CREDENTIAL_SERVICES } from "@/lib/types";
import { Plus } from "lucide-react";

export function NewCredentialDialog({
  clientId,
  projects,
}: {
  clientId: string;
  projects: { id: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [visibility, setVisibility] = useState("internal");
  const [pending, startTransition] = useTransition();

  function onSubmit(formData: FormData) {
    const projectId = String(formData.get("project_id") || "") || null;
    startTransition(async () => {
      const result = await createCredentialAction(clientId, projectId, formData);
      if (result?.error) toast.error(result.error);
      else {
        toast.success("Credencial agregada.");
        setOpen(false);
      }
    });
  }

  return (
    <>
      <Button size="sm" variant="secondary" onClick={() => setOpen(true)}>
        <Plus size={14} /> Agregar credencial
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)} title="Nueva credencial">
        <form action={onSubmit} className="space-y-4">
          <div className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger">
            No compartas este documento sin autorización del cliente.
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field className="mb-0">
              <Label>Servicio</Label>
              <Select name="service" defaultValue="otro">
                {CREDENTIAL_SERVICES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field className="mb-0">
              <Label>Etiqueta</Label>
              <Input name="service_label" placeholder="Ej: Vercel producción" />
            </Field>
          </div>
          {projects.length > 0 && (
            <Field className="mb-0">
              <Label>Proyecto (opcional)</Label>
              <Select name="project_id" defaultValue="">
                <option value="">Sin asociar</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Select>
            </Field>
          )}
          <div className="grid grid-cols-2 gap-4">
            <Field className="mb-0">
              <Label>Usuario / email</Label>
              <Input name="username" />
            </Field>
            <Field className="mb-0">
              <Label>Contraseña / secreto *</Label>
              <Input name="secret" type="password" required />
            </Field>
          </div>
          <Field className="mb-0">
            <Label>URL de acceso</Label>
            <Input name="access_url" placeholder="https://" />
          </Field>
          <Field className="mb-0">
            <Label>Notas</Label>
            <Textarea name="notes" rows={2} />
          </Field>
          <Field className="mb-0">
            <Label>Visibilidad</Label>
            <Select name="visibility" value={visibility} onChange={(e) => setVisibility(e.target.value)}>
              <option value="internal">Solo MR14 (interna)</option>
              <option value="client">Visible para el cliente</option>
              <option value="temporary">Visible temporalmente</option>
            </Select>
          </Field>
          {visibility === "temporary" && (
            <Field className="mb-0">
              <Label>Visible hasta</Label>
              <Input type="datetime-local" name="visible_until" />
            </Field>
          )}
          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Guardando…" : "Guardar credencial"}
          </Button>
        </form>
      </Dialog>
    </>
  );
}
