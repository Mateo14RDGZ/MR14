"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Select } from "@/components/ui/Input";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
import {
  addTicketMessageAction,
  updateTicketStatusAction,
  updateTicketPriorityAction,
  createQuoteAction,
  decideQuoteAction,
  closeTicketAction,
  reopenTicketAction,
  getTicketAttachmentUrlAction,
} from "@/actions/tickets";
import {
  TICKET_STATUSES,
  TICKET_CATEGORIES,
  TICKET_PRIORITIES,
  type Ticket,
  type TicketMessage,
  type TicketAttachment,
  type TicketEvent,
  type TicketQuote,
  type TicketQuoteVersion,
} from "@/lib/types";
import { formatCurrency, formatDateTime, daysUntil } from "@/lib/utils";
import { Paperclip, Send, FileDown, Clock } from "lucide-react";

const STATUS_TONE: Record<string, "muted" | "warning" | "accent" | "success" | "danger"> = {
  received: "muted",
  reviewing: "warning",
  in_progress: "accent",
  waiting_client: "warning",
  requires_quote: "warning",
  approved: "accent",
  resolved: "success",
  closed: "muted",
};

const PRIORITY_TONE: Record<string, "muted" | "warning" | "danger" | "accent"> = {
  low: "muted",
  normal: "accent",
  high: "warning",
  critical: "danger",
};

type QuoteWithVersions = TicketQuote & { ticket_quote_versions: TicketQuoteVersion[] };

export function TicketDetail({
  role,
  ticket,
  clientName,
  projectName,
  messages,
  attachments,
  events,
  quotes,
}: {
  role: "admin" | "client";
  ticket: Ticket;
  clientName: string;
  projectName: string;
  messages: TicketMessage[];
  attachments: TicketAttachment[];
  events: TicketEvent[];
  quotes: QuoteWithVersions[];
}) {
  const attachmentsByMessage = new Map<string, TicketAttachment[]>();
  const generalAttachments: TicketAttachment[] = [];
  for (const a of attachments) {
    if (a.message_id) {
      const list = attachmentsByMessage.get(a.message_id) ?? [];
      list.push(a);
      attachmentsByMessage.set(a.message_id, list);
    } else {
      generalAttachments.push(a);
    }
  }

  const latestQuote = quotes[0];
  const latestVersion = latestQuote?.ticket_quote_versions?.slice().sort((a, b) => b.version - a.version)[0];
  const daysToReopen = ticket.reopen_deadline ? daysUntil(ticket.reopen_deadline) : null;

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <Card>
          <CardHeader className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="font-mono text-xs text-muted-2">#{ticket.number}</p>
              <h1 className="text-card-title">{ticket.subject}</h1>
            </div>
            <div className="flex items-center gap-2">
              <Badge tone={PRIORITY_TONE[ticket.priority]}>
                {TICKET_PRIORITIES.find((p) => p.value === ticket.priority)?.label}
              </Badge>
              <Badge tone={STATUS_TONE[ticket.status]}>
                {TICKET_STATUSES.find((s) => s.value === ticket.status)?.label}
              </Badge>
            </div>
          </CardHeader>
          <CardBody>
            <p className="mb-1 text-xs text-muted-2">
              {clientName} · {projectName} · {TICKET_CATEGORIES.find((c) => c.value === ticket.category)?.label}
            </p>
            <p className="whitespace-pre-line break-words text-sm text-muted">{ticket.description}</p>
            {generalAttachments.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {generalAttachments.map((a) => (
                  <AttachmentChip key={a.id} attachment={a} />
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        {latestVersion && (
          <QuoteCard ticketId={ticket.id} role={role} quote={latestQuote} version={latestVersion} />
        )}

        <Card>
          <CardHeader>
            <h2 className="text-card-title">Conversación</h2>
          </CardHeader>
          <CardBody className="space-y-0 divide-y divide-border">
            {messages.length === 0 && <p className="pb-4 text-sm text-muted-2">Sin mensajes todavía.</p>}
            {messages.map((m) => (
              <div key={m.id} className="py-4 first:pt-0 last:pb-0">
                <div className="mb-1.5 flex items-baseline gap-2">
                  <span className="text-sm font-medium">{m.author_role === "admin" ? "MR14" : "Cliente"}</span>
                  <span className="text-xs text-muted-2">{formatDateTime(m.created_at)}</span>
                </div>
                <p className="whitespace-pre-line break-words text-sm text-muted">{m.body}</p>
                {(attachmentsByMessage.get(m.id) ?? []).length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(attachmentsByMessage.get(m.id) ?? []).map((a) => (
                      <AttachmentChip key={a.id} attachment={a} />
                    ))}
                  </div>
                )}
              </div>
            ))}
            {!["closed"].includes(ticket.status) && (
              <div className="pt-4 first:pt-0">
                <ReplyForm ticketId={ticket.id} />
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      <div className="space-y-6">
        {role === "admin" && (
          <Card>
            <CardHeader>
              <h2 className="text-card-title">Gestión</h2>
            </CardHeader>
            <CardBody className="space-y-4">
              <StatusSelect ticketId={ticket.id} current={ticket.status} />
              <PrioritySelect ticketId={ticket.id} current={ticket.priority} />
              <CreateQuoteDialog ticketId={ticket.id} />
            </CardBody>
          </Card>
        )}

        {role === "client" && ticket.status === "resolved" && (
          <Card>
            <CardBody className="space-y-3">
              <p className="text-sm text-muted">
                Este ticket fue marcado como resuelto. Si necesitás reabrirlo, tenés{" "}
                {daysToReopen !== null ? `${daysToReopen} días` : "un plazo limitado"}.
              </p>
              <div className="flex gap-2">
                <ClientCloseButton ticketId={ticket.id} />
                <ClientReopenButton ticketId={ticket.id} />
              </div>
            </CardBody>
          </Card>
        )}

        <Card>
          <CardHeader className="flex items-center gap-2">
            <Clock size={14} className="text-muted" />
            <h2 className="text-card-title">Historial</h2>
          </CardHeader>
          <CardBody>
            <ol className="space-y-3 border-l border-border pl-4">
              {events.map((e) => (
                <li key={e.id} className="relative text-xs">
                  <div className="absolute -left-[19px] top-1 h-1.5 w-1.5 rounded-full bg-muted-2" />
                  <p className="text-foreground">{eventLabel(e)}</p>
                  <p className="text-muted-2">{formatDateTime(e.created_at)}</p>
                </li>
              ))}
            </ol>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

function eventLabel(e: TicketEvent) {
  const map: Record<string, string> = {
    created: "Ticket creado",
    status_changed: `Estado: ${(e.meta as { status?: string })?.status ?? ""}`,
    priority_changed: `Prioridad: ${(e.meta as { priority?: string })?.priority ?? ""}`,
    message: "Nuevo mensaje",
    attachment_added: "Adjunto agregado",
    quote_created: "Presupuesto creado",
    quote_accepted: "Presupuesto aceptado",
    quote_rejected: "Presupuesto rechazado",
    assigned: "Reasignado",
    closed: "Ticket cerrado",
    reopened: "Ticket reabierto",
  };
  return map[e.event_type] ?? e.event_type;
}

function AttachmentChip({ attachment }: { attachment: TicketAttachment }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          try {
            const url = await getTicketAttachmentUrlAction(attachment.storage_path);
            window.open(url, "_blank", "noopener,noreferrer");
          } catch {
            toast.error("No se pudo abrir el archivo.");
          }
        })
      }
      className="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs text-muted hover:border-accent hover:text-accent"
    >
      <FileDown size={12} /> {attachment.name}
    </button>
  );
}

function ReplyForm({ ticketId }: { ticketId: string }) {
  const [pending, startTransition] = useTransition();

  function onSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await addTicketMessageAction(ticketId, formData);
      if (result?.error) toast.error(result.error);
    });
  }

  return (
    <form action={onSubmit} className="space-y-2">
      <Textarea name="body" rows={3} placeholder="Escribí tu respuesta…" required />
      <div className="flex items-center justify-between gap-2">
        <label className="flex cursor-pointer items-center gap-1.5 text-xs text-muted-2">
          <Paperclip size={13} />
          <span>Adjuntar</span>
          <input type="file" name="files" multiple accept="image/*,.pdf" className="hidden" />
        </label>
        <Button type="submit" size="sm" disabled={pending}>
          <Send size={13} /> {pending ? "Enviando…" : "Enviar"}
        </Button>
      </div>
    </form>
  );
}

function StatusSelect({ ticketId, current }: { ticketId: string; current: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-muted">Estado</label>
      <Select
        defaultValue={current}
        disabled={pending}
        onChange={(e) => {
          const value = e.target.value as Ticket["status"];
          startTransition(async () => {
            try {
              await updateTicketStatusAction(ticketId, value);
              toast.success("Estado actualizado.");
            } catch {
              toast.error("No se pudo actualizar.");
            }
          });
        }}
      >
        {TICKET_STATUSES.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </Select>
    </div>
  );
}

function PrioritySelect({ ticketId, current }: { ticketId: string; current: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-muted">Prioridad</label>
      <Select
        defaultValue={current}
        disabled={pending}
        onChange={(e) => {
          const value = e.target.value as Ticket["priority"];
          startTransition(async () => {
            try {
              await updateTicketPriorityAction(ticketId, value);
              toast.success("Prioridad actualizada.");
            } catch {
              toast.error("No se pudo actualizar.");
            }
          });
        }}
      >
        {TICKET_PRIORITIES.map((p) => (
          <option key={p.value} value={p.value}>
            {p.label}
          </option>
        ))}
      </Select>
    </div>
  );
}

function CreateQuoteDialog({ ticketId }: { ticketId: string }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function onSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await createQuoteAction(ticketId, formData);
      if (result?.error) toast.error(result.error);
      else {
        toast.success("Presupuesto enviado al cliente.");
        setOpen(false);
      }
    });
  }

  if (!open) {
    return (
      <Button size="sm" variant="secondary" className="w-full" onClick={() => setOpen(true)}>
        Crear presupuesto
      </Button>
    );
  }

  return (
    <form action={onSubmit} className="space-y-3 rounded-lg border border-border p-3">
      <Textarea name="description" required rows={2} placeholder="Descripción del trabajo" />
      <div className="grid grid-cols-2 gap-2">
        <Input type="number" name="amount" placeholder="Monto" min={0} required />
        <Select name="currency" defaultValue="UYU">
          <option value="UYU">UYU</option>
          <option value="USD">USD</option>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Input type="number" name="estimated_days" placeholder="Días estimados" min={0} />
        <Input type="date" name="valid_until" />
      </div>
      <Textarea name="notes" rows={2} placeholder="Notas (opcional)" />
      <div className="flex gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
          Cancelar
        </Button>
        <Button type="submit" size="sm" disabled={pending} className="flex-1">
          {pending ? "Enviando…" : "Enviar presupuesto"}
        </Button>
      </div>
    </form>
  );
}

function QuoteCard({
  ticketId,
  role,
  quote,
  version,
}: {
  ticketId: string;
  role: "admin" | "client";
  quote: QuoteWithVersions;
  version: TicketQuoteVersion;
}) {
  const [pending, startTransition] = useTransition();
  const decided = Boolean(version.decided_at);

  return (
    <Card>
      <CardHeader>
        <h2 className="text-card-title">Presupuesto {quotes_status_label(quote.status)}</h2>
      </CardHeader>
      <CardBody className="space-y-2">
        <p className="text-sm">{version.description}</p>
        <div className="flex flex-wrap gap-4 text-sm">
          <span className="font-semibold">{formatCurrency(version.amount, version.currency)}</span>
          {version.estimated_days && <span className="text-muted">{version.estimated_days} días estimados</span>}
        </div>
        {version.notes && <p className="text-xs text-muted-2">{version.notes}</p>}
        {role === "client" && !decided && quote.status === "pending" && (
          <div className="flex gap-2 pt-2">
            <Button
              size="sm"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  try {
                    await decideQuoteAction(version.id, ticketId, "accepted");
                    toast.success("Presupuesto aceptado.");
                  } catch {
                    toast.error("No se pudo procesar.");
                  }
                })
              }
            >
              Aceptar
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  try {
                    await decideQuoteAction(version.id, ticketId, "rejected");
                    toast.success("Presupuesto rechazado.");
                  } catch {
                    toast.error("No se pudo procesar.");
                  }
                })
              }
            >
              Rechazar
            </Button>
          </div>
        )}
        {decided && (
          <p className="pt-1 text-xs text-muted-2">
            {version.decision === "accepted" ? "Aceptado" : "Rechazado"} el {formatDateTime(version.decided_at)}
          </p>
        )}
      </CardBody>
    </Card>
  );
}

function quotes_status_label(status: string) {
  return { pending: "pendiente", accepted: "aceptado", rejected: "rechazado", superseded: "reemplazado" }[status] ?? status;
}

function ClientCloseButton({ ticketId }: { ticketId: string }) {
  return (
    <ConfirmButton
      action={() => closeTicketAction(ticketId)}
      label="Cerrar ticket"
      variant="secondary"
      size="sm"
      confirmTitle="¿Cerrar ticket?"
      confirmDescription="Podés reabrirlo dentro del plazo indicado si necesitás algo más sobre esto."
    />
  );
}

function ClientReopenButton({ ticketId }: { ticketId: string }) {
  return (
    <ConfirmButton
      action={() => reopenTicketAction(ticketId)}
      label="Reabrir"
      variant="outline"
      size="sm"
      confirmTitle="¿Reabrir ticket?"
      confirmDescription="MR14 será notificado para retomar tu solicitud."
    />
  );
}
