"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Select, Label, Field } from "@/components/ui/Input";
import { regenerateInstallmentsAction } from "@/actions/projects";
import { ListOrdered } from "lucide-react";

export function InstallmentsEditor({
  projectId,
  clientId,
  currentCount,
  deposit,
}: {
  projectId: string;
  clientId: string;
  currentCount: number;
  deposit: number;
}) {
  const [pending, startTransition] = useTransition();

  function onSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await regenerateInstallmentsAction(projectId, clientId, formData);
      if (result?.error) toast.error(result.error);
      else toast.success("Plan de cuotas actualizado.");
    });
  }

  return (
    <Card>
      <CardHeader>
        <h2 className="flex items-center gap-2 text-card-title">
          <ListOrdered size={16} className="text-accent" /> Plan de cuotas
        </h2>
        <p className="mt-0.5 text-caption">Cambiar la cantidad reparte el precio de nuevo — no afecta lo ya cobrado.</p>
      </CardHeader>
      <CardBody>
        <form action={onSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <Field className="mb-0 flex-1">
            <Label>Cuotas (incluyendo el anticipo, si hay)</Label>
            <Select name="installments_count" defaultValue={String(currentCount || 1)}>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  {n === 1 ? "Pago único" : `${n} cuotas`}
                </option>
              ))}
            </Select>
          </Field>
          <Field className="mb-0 flex-1">
            <Label>Anticipo</Label>
            <Input type="number" name="deposit" min={0} step="1" defaultValue={deposit} />
          </Field>
          <Button type="submit" disabled={pending}>
            {pending ? "Guardando…" : "Actualizar plan"}
          </Button>
        </form>
      </CardBody>
    </Card>
  );
}
