"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input, Select, Label, Field } from "@/components/ui/Input";
import { inviteClientMemberAction } from "@/actions/members";
import { UserPlus } from "lucide-react";

export function InviteMemberDialog({ clientId }: { clientId: string }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function onSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await inviteClientMemberAction(clientId, formData);
      if (result?.error) toast.error(result.error);
      else {
        toast.success("Invitación enviada.");
        setOpen(false);
      }
    });
  }

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <UserPlus size={14} /> Invitar usuario
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)} title="Invitar usuario al portal">
        <form action={onSubmit} className="space-y-4">
          <Field className="mb-0">
            <Label>Nombre</Label>
            <Input name="name" placeholder="Roberto Telechea" />
          </Field>
          <Field className="mb-0">
            <Label>Email *</Label>
            <Input type="email" name="email" required placeholder="roberto@motocenter.com.uy" />
          </Field>
          <Field className="mb-0">
            <Label>Rol dentro del cliente</Label>
            <Select name="role_in_client" defaultValue="owner">
              <option value="owner">Titular</option>
              <option value="colaborador">Colaborador</option>
            </Select>
          </Field>
          <p className="text-xs text-muted-2">
            MR14 no conoce ni almacena la contraseña personal del cliente: recibirá un enlace de Supabase Auth
            para crearla.
          </p>
          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Enviando…" : "Enviar invitación"}
          </Button>
        </form>
      </Dialog>
    </>
  );
}
