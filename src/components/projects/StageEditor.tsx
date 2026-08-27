"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Select, Input, Label, Field } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { updateProjectStageAction, setProjectSpecialStatusAction, clearProjectSpecialStatusAction } from "@/actions/checklist";
import { STAGE_META, type ProjectStage, type ProjectStatus } from "@/lib/types";

const SPECIAL_STATUSES: { value: "mantenimiento" | "pausado" | "cancelado"; label: string }[] = [
  { value: "mantenimiento", label: "Mantenimiento" },
  { value: "pausado", label: "Pausado" },
  { value: "cancelado", label: "Cancelado" },
];

export function StageEditor({
  projectId,
  clientId,
  stage,
  status,
  nextStep,
}: {
  projectId: string;
  clientId: string;
  stage: ProjectStage;
  status: ProjectStatus;
  nextStep: string | null;
}) {
  const [pending, startTransition] = useTransition();

  function onSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await updateProjectStageAction(projectId, clientId, formData);
      if (result?.error) toast.error(result.error);
      else toast.success("Proyecto actualizado — el cliente ya lo ve reflejado.");
    });
  }

  function setSpecial(value: "mantenimiento" | "pausado" | "cancelado") {
    startTransition(async () => {
      const result = await setProjectSpecialStatusAction(projectId, clientId, value);
      if (result?.error) toast.error(result.error);
      else toast.success("Estado actualizado.");
    });
  }

  function clearSpecial() {
    startTransition(async () => {
      const result = await clearProjectSpecialStatusAction(projectId, clientId);
      if (result?.error) toast.error(result.error);
      else toast.success("Proyecto vuelve al flujo normal.");
    });
  }

  const isSpecial = SPECIAL_STATUSES.some((s) => s.value === status);

  return (
    <div className="space-y-4">
      <form action={onSubmit} className="space-y-3">
        <Field className="mb-0">
          <Label>¿En qué etapa está?</Label>
          <Select name="stage" defaultValue={stage}>
            {(Object.entries(STAGE_META) as [ProjectStage, (typeof STAGE_META)[ProjectStage]][]).map(
              ([value, meta]) => (
                <option key={value} value={value}>
                  {meta.adminLabel}
                </option>
              )
            )}
          </Select>
        </Field>
        <Field className="mb-0">
          <Label>Próximo paso (opcional)</Label>
          <Input name="next_step" defaultValue={nextStep ?? ""} placeholder="Ej: Esperando textos del cliente" />
        </Field>
        <Button type="submit" size="sm" disabled={pending} className="w-full">
          {pending ? "Guardando…" : "Actualizar"}
        </Button>
      </form>

      <div className="border-t border-border pt-3">
        <p className="text-caption mb-2">¿El proyecto está pausado, cancelado, o en mantenimiento?</p>
        <div className="flex flex-wrap gap-1.5">
          {SPECIAL_STATUSES.map((s) => (
            <Button
              key={s.value}
              type="button"
              size="sm"
              variant={status === s.value ? "primary" : "outline"}
              disabled={pending}
              onClick={() => (status === s.value ? clearSpecial() : setSpecial(s.value))}
            >
              {s.label}
            </Button>
          ))}
        </div>
        {isSpecial && (
          <p className="text-caption mt-2">
            Hacé clic de nuevo en &quot;{SPECIAL_STATUSES.find((s) => s.value === status)?.label}&quot; para volver al
            flujo normal.
          </p>
        )}
      </div>
    </div>
  );
}
