"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea, Label, Field } from "@/components/ui/Input";
import { updateCredentialAction } from "@/actions/credentials";
import { CREDENTIAL_SERVICES, type CredentialRow } from "@/lib/types";
import { Pencil } from "lucide-react";

export function EditCredentialDialog({ clientId, credential }: { clientId: string; credential: CredentialRow }) {
  const [open, setOpen] = useState(false);
  const [visibility, setVisibility] = useState(credential.visibility);
  const [pending, startTransition] = useTransition();

  function onSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await updateCredentialAction(credential.id, clientId, formData);
      if (result?.error) toast.error(result.error);
      else {
        toast.success("Credencial actualizada.");
        setOpen(false);
      }
    });
  }

  return (
    <>
      <Button size="icon" variant="ghost" onClick={() => setOpen(true)}>
        <Pencil size={14} />
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)} title="Editar credencial">
        <form action={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field className="mb-0">
              <Label>Servicio</Label>
              <Select name="service" defaultValue={credential.service}>
                {CREDENTIAL_SERVICES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field className="mb-0">
              <Label>Etiqueta</Label>
              <Input name="service_label" defaultValue={credential.service_label ?? ""} placeholder="Ej: Vercel producción" />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field className="mb-0">
              <Label>Usuario / email</Label>
              <Input name="username" defaultValue={credential.username ?? ""} />
            </Field>
            <Field className="mb-0">
              <Label>Contraseña / secreto</Label>
              <Input name="secret" type="password" placeholder="Dejar vacío para no cambiarla" />
            </Field>
          </div>
          <Field className="mb-0">
            <Label>URL de acceso</Label>
            <Input name="access_url" defaultValue={credential.access_url ?? ""} placeholder="https://" />
          </Field>
          <Field className="mb-0">
            <Label>Notas</Label>
            <Textarea name="notes" defaultValue={credential.notes ?? ""} rows={2} />
          </Field>
          <Field className="mb-0">
            <Label>Visibilidad</Label>
            <Select name="visibility" value={visibility} onChange={(e) => setVisibility(e.target.value as typeof visibility)}>
              <option value="internal">Solo MR14 (interna)</option>
              <option value="client">Visible para el cliente</option>
              <option value="temporary">Visible temporalmente</option>
            </Select>
          </Field>
          {visibility === "temporary" && (
            <Field className="mb-0">
              <Label>Visible hasta</Label>
              <Input type="datetime-local" name="visible_until" defaultValue={credential.visible_until?.slice(0, 16) ?? ""} />
            </Field>
          )}
          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Guardando…" : "Guardar cambios"}
          </Button>
        </form>
      </Dialog>
    </>
  );
}
