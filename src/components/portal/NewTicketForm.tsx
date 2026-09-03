"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Card, CardBody } from "@/components/ui/Card";
import { Textarea, Select, Label, Field } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { createTicketAction } from "@/actions/tickets";
import { FileImage, HelpCircle, Lightbulb, Paperclip, PencilLine, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

// Simplificado a 4 opciones en el idioma del cliente — las 8 categorías
// internas (bug/content_change/new_feature/domain/hosting/email/
// site_down/other) siguen existiendo igual, esto es solo cómo se le
// pregunta. La prioridad no se le pregunta al cliente: es un criterio
// interno que decide MR14.
const CLIENT_CATEGORY_OPTIONS = [
  { value: "content_change", label: "Quiero cambiar algo", hint: "Textos, fotos u horarios", icon: PencilLine },
  { value: "bug", label: "Algo no funciona", hint: "Un error o problema en la web", icon: TriangleAlert },
  { value: "new_feature", label: "Quiero agregar algo", hint: "Una idea o función nueva", icon: Lightbulb },
  { value: "other", label: "Tengo una consulta", hint: "Cualquier otra duda", icon: HelpCircle },
];

export function NewTicketForm({
  clientId,
  projects,
  initialCategory,
  initialSubject,
  initialDescription,
}: {
  clientId: string;
  projects: { id: string; name: string }[];
  initialCategory?: string;
  initialSubject?: string;
  initialDescription?: string;
}) {
  const [pending, startTransition] = useTransition();
  const [category, setCategory] = useState(initialCategory ?? "content_change");
  const [description, setDescription] = useState(initialDescription ?? "");
  const [fileCount, setFileCount] = useState(0);
  const valid = Boolean(description.trim() && projects[0]?.id);
  const subject = initialSubject || CLIENT_CATEGORY_OPTIONS.find((item) => item.value === category)?.label || "Consulta";

  function onSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await createTicketAction(clientId, formData);
      if (result?.error) toast.error(result.error);
    });
  }

  return (
    <Card>
      <CardBody>
        <form action={onSubmit} className="space-y-6">
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
            <Label className="mb-3 text-sm text-foreground">1. Elegí una opción</Label>
            <input type="hidden" name="category" value={category} />
            <input type="hidden" name="subject" value={subject} />
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {CLIENT_CATEGORY_OPTIONS.map((item) => {
                const Icon = item.icon;
                const selected = category === item.value;
                return (
                  <button
                    key={item.value}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setCategory(item.value)}
                    className={cn(
                      "portal-press flex min-h-20 items-center gap-3 rounded-xl border p-3 text-left",
                      selected ? "border-accent bg-accent-soft" : "border-border bg-surface-2 hover:border-border-strong"
                    )}
                  >
                    <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full", selected ? "bg-accent text-white" : "bg-surface-3 text-muted")}>
                      <Icon size={19} />
                    </span>
                    <span>
                      <span className="block text-sm font-semibold">{item.label}</span>
                      <span className="mt-0.5 block text-xs leading-snug text-muted">{item.hint}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </Field>
          <Field className="mb-0">
            <Label className="mb-2 text-sm text-foreground">2. Contanos qué necesitás</Label>
            <Textarea
              name="description"
              required
              rows={6}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Por ejemplo: quiero cambiar el horario que aparece en mi página…"
              className="min-h-36 text-base leading-relaxed"
            />
            <p className="mt-2 text-sm text-muted">Escribí como te salga. Nosotros te ayudamos a resolverlo.</p>
          </Field>
          <Field id="ticket-files" className="mb-0">
            <Label className="mb-2 flex items-center gap-1.5 text-sm text-foreground">
              <Paperclip size={15} /> 3. Agregar una foto (opcional)
            </Label>
            <input
              type="file"
              id="ticket-files"
              name="files"
              multiple
              accept="image/*,.pdf"
              onChange={(event) => setFileCount(event.target.files?.length ?? 0)}
              className="sr-only"
            />
            <label htmlFor="ticket-files" className="portal-press flex min-h-14 cursor-pointer items-center justify-center gap-2 rounded-xl border border-border bg-surface-2 px-4 text-sm font-medium hover:border-border-strong">
              <FileImage size={18} /> {fileCount > 0 ? `${fileCount} archivo${fileCount === 1 ? "" : "s"} elegido${fileCount === 1 ? "" : "s"}` : "Elegir foto o archivo"}
            </label>
          </Field>
          <Button type="submit" size="lg" disabled={pending || !valid} className="w-full">
            {pending ? "Enviando…" : "Enviar a Mateo"}
          </Button>
          <p className="text-center text-sm text-muted">Te avisaremos cuando Mateo responda.</p>
        </form>
      </CardBody>
    </Card>
  );
}
