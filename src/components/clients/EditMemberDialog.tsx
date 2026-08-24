"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input, Select, Label, Field } from "@/components/ui/Input";
import { updateClientMemberAction } from "@/actions/members";
import type { ClientMember } from "@/lib/types";
import { Pencil } from "lucide-react";

export function EditMemberDialog({ clientId, member }: { clientId: string; member: ClientMember }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function onSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await updateClientMemberAction(member.id, clientId, formData);
      if (result?.error) toast.error(result.error);
      else {
        toast.success("Usuario actualizado.");
        setOpen(false);
      }
    });
  }

  return (
    <>
      <Button size="icon" variant="ghost" onClick={() => setOpen(true)}>
        <Pencil size={14} />
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)} title="Editar usuario">
        <form action={onSubmit} className="space-y-4">
          <Field className="mb-0">
            <Label>Nombre</Label>
            <Input name="name" defaultValue={member.name ?? ""} />
          </Field>
          <Field className="mb-0">
            <Label>Teléfono / WhatsApp</Label>
            <Input type="tel" name="phone" defaultValue={member.phone ?? ""} placeholder="09XXXXXXXX" />
          </Field>
          <Field className="mb-0">
            <Label>Rol dentro del cliente</Label>
            <Select name="role_in_client" defaultValue={member.role_in_client}>
              <option value="owner">Titular</option>
              <option value="colaborador">Colaborador</option>
            </Select>
          </Field>
          <p className="text-xs text-muted-2">El email no se puede editar acá — se define cuando el cliente crea su cuenta.</p>
          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Guardando…" : "Guardar cambios"}
          </Button>
        </form>
      </Dialog>
    </>
  );
}
