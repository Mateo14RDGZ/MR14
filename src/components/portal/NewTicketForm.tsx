"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Card, CardBody } from "@/components/ui/Card";
import { Input, Textarea, Select, Label, Field } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { createTicketAction } from "@/actions/tickets";
import { TICKET_CATEGORIES } from "@/lib/types";

const CLIENT_PRIORITY_OPTIONS = [
  { value: "low", label: "No corre urgencia" },
  { value: "normal", label: "Normal" },
  { value: "high", label: "Es urgente" },
  { value: "critical", label: "Es una emergencia" },
];
import { Paperclip } from "lucide-react";

export function NewTicketForm({
  clientId,
  projects,
}: {
  clientId: string;
  projects: { id: string; name: string }[];
}) {
  const [pending, startTransition] = useTransition();

  function onSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await createTicketAction(clientId, formData);
      if (result?.error) toast.error(result.error);
    });
  }

  return (
    <Card>
      <CardBody>
        <form action={onSubmit} className="space-y-4">
          {projects.length > 1 ? (
            <Field className="mb-0">
              <Label>Proyecto</Label>
              <Select name="project_id" required defaultValue={projects[0]?.id ?? ""}>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Select>
            </Field>
          ) : (
            <input type="hidden" name="project_id" value={projects[0]?.id ?? ""} />
          )}
          <Field className="mb-0">
            <Label>¿Qué necesitás?</Label>
            <Select name="category" defaultValue="other">
              {TICKET_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field className="mb-0">
            <Label>¿Qué tan urgente es?</Label>
            <Select name="priority" defaultValue="normal">
              {CLIENT_PRIORITY_OPTIONS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field className="mb-0">
            <Label>Asunto</Label>
            <Input name="subject" required placeholder="Ej: Cambiar horario del sábado" />
          </Field>
          <Field className="mb-0">
            <Label>Contanos qué necesitás</Label>
            <Textarea name="description" required rows={5} placeholder="Con el mayor detalle posible" />
          </Field>
          <Field className="mb-0">
            <Label className="flex items-center gap-1">
              <Paperclip size={12} /> Adjuntar archivos (opcional)
            </Label>
            <input
              type="file"
              name="files"
              multiple
              accept="image/*,.pdf"
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-surface-2 file:px-3 file:py-1.5 file:text-xs file:font-medium"
            />
            <p className="mt-1 text-xs text-muted-2">Imágenes o PDF, hasta 10MB por archivo.</p>
          </Field>
          <Button type="submit" size="lg" disabled={pending} className="w-full">
            {pending ? "Enviando…" : "Enviar solicitud"}
          </Button>
        </form>
      </CardBody>
    </Card>
  );
}
