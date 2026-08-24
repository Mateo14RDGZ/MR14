"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Input, Label, Field } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { updatePasswordAction } from "@/actions/profile";

export function PasswordForm() {
  const [pending, startTransition] = useTransition();

  function onSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await updatePasswordAction(formData);
      if (result?.error) toast.error(result.error);
      else toast.success("Contraseña actualizada.");
    });
  }

  return (
    <form action={onSubmit} className="space-y-4">
      <Field className="mb-0">
        <Label>Nueva contraseña</Label>
        <Input type="password" name="password" minLength={8} required />
      </Field>
      <Field className="mb-0">
        <Label>Confirmar contraseña</Label>
        <Input type="password" name="confirm" minLength={8} required />
      </Field>
      <Button type="submit" disabled={pending}>
        {pending ? "Guardando…" : "Actualizar contraseña"}
      </Button>
    </form>
  );
}
