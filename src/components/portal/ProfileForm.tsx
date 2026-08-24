"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Input, Label, Field } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { updateProfileAction } from "@/actions/profile";

export function ProfileForm({ defaultName, defaultPhone }: { defaultName: string; defaultPhone: string }) {
  const [pending, startTransition] = useTransition();

  function onSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await updateProfileAction(formData);
      if (result?.error) toast.error(result.error);
      else toast.success("Perfil actualizado.");
    });
  }

  return (
    <form action={onSubmit} className="space-y-4">
      <Field className="mb-0">
        <Label>Nombre</Label>
        <Input name="full_name" defaultValue={defaultName} />
      </Field>
      <Field className="mb-0">
        <Label>Teléfono</Label>
        <Input name="phone" defaultValue={defaultPhone} />
      </Field>
      <Button type="submit" disabled={pending}>
        {pending ? "Guardando…" : "Guardar cambios"}
      </Button>
    </form>
  );
}
