"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Select, Label, Field } from "@/components/ui/Input";
import { createTicketAction } from "@/actions/tickets";
import { TICKET_CATEGORIES, TICKET_PRIORITIES } from "@/lib/types";
import { LifeBuoy } from "lucide-react";

interface ClientOption {
  id: string;
  business_name: string;
}
interface ProjectOption {
  id: string;
  name: string;
  client_id: string;
}

/**
 * Crea un ticket en nombre de un cliente, desde el admin. Reutiliza
 * createTicketAction tal cual (mismos tickets/ticket_messages/ticket_events,
 * misma numeración #MR14-XXXX) — la única diferencia con el form del
 * portal es que acá el admin también elige cliente y prioridad.
 */
export function NewTicketDialog({
  clients,
  projects,
  defaultClientId,
  defaultProjectId,
  triggerLabel = "Nuevo ticket",
  autoOpen = false,
}: {
  clients: ClientOption[];
  projects: ProjectOption[];
  defaultClientId?: string;
  defaultProjectId?: string;
  triggerLabel?: string;
  autoOpen?: boolean;
}) {
  const [open, setOpen] = useState(autoOpen);
  const [clientId, setClientId] = useState(defaultClientId ?? clients[0]?.id ?? "");
  const [pending, startTransition] = useTransition();

  const clientProjects = projects.filter((p) => p.client_id === clientId);

  function onSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await createTicketAction(clientId, formData);
      if (result?.error) toast.error(result.error);
      else {
        toast.success("Ticket creado.");
        setOpen(false);
      }
    });
  }

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <LifeBuoy size={14} /> {triggerLabel}
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)} title="Nuevo ticket">
        <form action={onSubmit} className="space-y-4">
          <Field className="mb-0">
            <Label>Cliente</Label>
            <Select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              disabled={clients.length <= 1}
              required
            >
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.business_name}
                </option>
              ))}
            </Select>
          </Field>
          <Field className="mb-0">
            <Label>Proyecto</Label>
            <Select name="project_id" required defaultValue={defaultProjectId ?? clientProjects[0]?.id ?? ""}>
              {clientProjects.length === 0 && <option value="">Sin proyectos para este cliente</option>}
              {clientProjects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field className="mb-0">
            <Label>Categoría</Label>
            <Select name="category" defaultValue="other">
              {TICKET_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field className="mb-0">
            <Label>Asunto</Label>
            <Input name="subject" required placeholder="Ej: Cambiar horario del sábado" />
          </Field>
          <Field className="mb-0">
            <Label>Descripción</Label>
            <Textarea name="description" required rows={4} placeholder="Detalle de lo que pidió o necesita el cliente" />
          </Field>
          <Field className="mb-0">
            <Label>Prioridad</Label>
            <Select name="priority" defaultValue="normal">
              {TICKET_PRIORITIES.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </Select>
          </Field>
          <Button type="submit" disabled={pending || !clientId || clientProjects.length === 0} className="w-full">
            {pending ? "Creando…" : "Crear ticket"}
          </Button>
        </form>
      </Dialog>
    </>
  );
}
