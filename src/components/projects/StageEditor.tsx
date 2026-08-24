"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Select, Input, Label, Field } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { updateProjectStageAction } from "@/actions/checklist";
import { PROJECT_STAGES, type ProjectStage } from "@/lib/types";

export function StageEditor({
  projectId,
  clientId,
  stage,
  progress,
  nextStep,
}: {
  projectId: string;
  clientId: string;
  stage: ProjectStage;
  progress: number;
  nextStep: string | null;
}) {
  const [pending, startTransition] = useTransition();

  function onSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await updateProjectStageAction(projectId, clientId, formData);
      if (result?.error) toast.error(result.error);
      else toast.success("Etapa actualizada.");
    });
  }

  return (
    <form action={onSubmit} className="space-y-3">
      <Field className="mb-0">
        <Label>Etapa</Label>
        <Select name="stage" defaultValue={stage}>
          {PROJECT_STAGES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </Select>
      </Field>
      <Field className="mb-0">
        <Label>Progreso (%)</Label>
        <Input type="number" name="progress_percent" min={0} max={100} defaultValue={progress} />
      </Field>
      <Field className="mb-0">
        <Label>Próximo paso</Label>
        <Input name="next_step" defaultValue={nextStep ?? ""} placeholder="Ej: Revisión del cliente" />
      </Field>
      <Button type="submit" size="sm" disabled={pending} className="w-full">
        {pending ? "Guardando…" : "Actualizar etapa"}
      </Button>
    </form>
  );
}
