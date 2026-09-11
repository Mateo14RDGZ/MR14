"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Card, CardBody } from "@/components/ui/Card";
import { Textarea, Select, Label, Field } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { createTicketAction } from "@/actions/tickets";
import { HelpCircle, Lightbulb, PencilLine, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { TicketAttachments } from "@/components/shared/TicketAttachments";

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
  const [category, setCategory] = useState(initialCategory ?? "other");
  const [description, setDescription] = useState(initialDescription ?? "");
  const valid = Boolean(description.trim() && projects[0]?.id);
  const subject = initialSubject || description.trim().split("\n")[0].slice(0, 120) || "Consulta";

  function onSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await createTicketAction(clientId, formData);
      if (result?.error) toast.error(result.error);
    });
  }

  return (
    <Card>
      <CardBody>
        <form action={onSubmit} className="space-y-5">
          {projects.length === 0 && <p className="rounded-lg bg-surface-2 p-4 text-sm">Todavía no hay una web asociada a tu cuenta. Escribinos a contacto@mateordgz.dev para ayudarte.</p>}
          {projects.length > 1 ? (
            <Field className="mb-0">
              <Label>¿Sobre qué web querés hablar?</Label>
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
          <input type="hidden" name="subject" value={subject} />
          <input type="hidden" name="category" value={category} />
          <Field className="mb-0">
            <Label className="mb-2 text-sm text-foreground">Contanos qué necesitás</Label>
            <Textarea
              name="description"
              required
              rows={5}
              maxLength={10000}
              readOnly={pending}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Por ejemplo: quiero cambiar el horario que aparece en mi página…"
              className="min-h-36 text-base leading-relaxed"
            />
            <p className="mt-2 text-sm text-muted">Escribí como te salga. Nosotros te ayudamos a resolverlo.</p>
          </Field>
          <details className="rounded-xl border border-border p-3">
            <summary className="min-h-8 cursor-pointer text-sm font-medium">Elegir el motivo (opcional)</summary>
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
          </details>
          <TicketAttachments disabled={pending} />
          <Button type="submit" size="lg" disabled={pending || !valid} className="w-full">
            {pending ? "Enviando…" : "Enviar a Mateo"}
          </Button>
          <p className="text-center text-sm text-muted">La respuesta quedará en esta conversación. Activá los avisos en Ayuda para recibirla también en tu celular.</p>
        </form>
      </CardBody>
    </Card>
  );
}
