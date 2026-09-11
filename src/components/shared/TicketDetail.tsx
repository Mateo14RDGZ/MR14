"use client";

import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Select, Field, Label } from "@/components/ui/Input";
import { TicketActions } from "./TicketActions";
import { TicketLiveUpdates } from "./TicketLiveUpdates";
import { TicketAttachments } from "./TicketAttachments";
import { Dialog } from "@/components/ui/Dialog";
import { NewProjectDialog } from "@/components/clients/NewProjectDialog";
import {
  addTicketMessageAction,
  updateTicketStatusAction,
  updateTicketPriorityAction,
  createQuoteAction,
  decideQuoteAction,
  getTicketAttachmentUrlAction,
} from "@/actions/tickets";
import {
  TICKET_STATUSES,
  TICKET_CATEGORIES,
  TICKET_PRIORITIES,
  CLIENT_TICKET_STATUS_LABEL,
  type Ticket,
  type TicketMessage,
  type TicketAttachment,
  type TicketEvent,
  type TicketQuote,
  type TicketQuoteVersion,
  type QuickReply,
} from "@/lib/types";
import { formatCurrency, formatDate, formatDateTime, timeAgo } from "@/lib/utils";
import { Send, FileDown, Clock, Sparkles } from "lucide-react";

const NEEDS_REPLY_STATUSES = new Set(["received", "reviewing", "requires_quote"]);

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
  quickReplies = [],
  creator = null,
}: {
  role: "admin" | "client";
  ticket: Ticket;
  clientName: string;
  projectName: string;
  messages: TicketMessage[];
  attachments: TicketAttachment[];
  events: TicketEvent[];
  quotes: QuoteWithVersions[];
  quickReplies?: QuickReply[];
  creator?: { full_name: string | null; role: string } | null;
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

  return (
    <div className={`grid gap-6 ${role === "admin" ? "lg:grid-cols-3" : "mx-auto max-w-3xl"}`}>
      <TicketLiveUpdates ticketId={ticket.id} updatedAt={ticket.updated_at} />
      <div className={`min-w-0 space-y-6 ${role === "admin" ? "lg:col-span-2" : ""}`}>
        <Card>
          <CardHeader className="flex flex-wrap items-center justify-between gap-2">
            <div>
              {role === "admin" && <p className="font-mono text-xs text-muted-2">#{ticket.number}</p>}
              <h1 className="break-words text-lg font-semibold leading-snug">{ticket.subject}</h1>
            </div>
            <div className="flex items-center gap-2">
              <Badge tone={STATUS_TONE[ticket.status]}>
                {role === "client" ? CLIENT_TICKET_STATUS_LABEL[ticket.status] : TICKET_STATUSES.find((s) => s.value === ticket.status)?.label}
              </Badge>
              {role === "admin" && (
                <Badge tone={PRIORITY_TONE[ticket.priority]}>
                  {TICKET_PRIORITIES.find((p) => p.value === ticket.priority)?.label}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardBody>
            {role === "admin" && <p className="mb-1 text-xs text-muted-2">
              {clientName}
              {NEEDS_REPLY_STATUSES.has(ticket.status) && (
                <span className="text-warning"> · Sin responder hace {timeAgo(ticket.updated_at)}</span>
              )}
            </p>}
            {role === "admin" && <p className="mb-1 text-xs text-muted-2">
              {projectName} · {TICKET_CATEGORIES.find((c) => c.value === ticket.category)?.label}
            </p>}
            <p className="whitespace-pre-line break-words text-base leading-relaxed text-muted">{ticket.description}</p>
            <div className="mt-5 border-t border-border pt-4"><TicketActions ticketId={ticket.id} status={ticket.status} role={role} /></div>
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
          <QuoteCard ticketId={ticket.id} clientId={ticket.client_id} role={role} quote={latestQuote} version={latestVersion} />
        )}

        <Card>
          <CardHeader>
            <h2 className="text-card-title">{role === "client" ? "Mensajes con Mateo" : "Conversación"}</h2>
          </CardHeader>
          <CardBody className="space-y-4">
            {messages.length === 0 && <p className="pb-4 text-sm text-muted-2">Tu consulta ya está enviada. Las respuestas aparecerán acá.</p>}
            {messages.map((m) => (
              <div key={m.id} className={`max-w-[95%] rounded-2xl p-4 ${m.author_role === role ? "ml-auto bg-accent-soft" : "border border-border bg-surface-2"}`}>
                <div className="mb-1.5 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                  <span className="text-sm font-medium">{m.author_role === "admin" ? (role === "client" ? "Mateo" : "MR14") : (role === "client" ? "Vos" : "Cliente")}</span>
                  <span className="text-xs text-muted-2">{formatDateTime(m.created_at)}</span>
                </div>
                <p className="whitespace-pre-line break-words text-base leading-relaxed text-muted">{m.body}</p>
                {(attachmentsByMessage.get(m.id) ?? []).length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(attachmentsByMessage.get(m.id) ?? []).map((a) => (
                      <AttachmentChip key={a.id} attachment={a} />
                    ))}
                  </div>
                )}
              </div>
            ))}
            {!["closed", "resolved"].includes(ticket.status) && (
              <div id="responder" className="scroll-mt-20 pt-4 first:pt-0">
                <ReplyForm role={role} ticketId={ticket.id} quickReplies={role === "admin" ? quickReplies : []} />
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      <div className={role === "admin" ? "min-w-0 space-y-6" : "hidden"}>
        {role === "admin" && ticket.category === "new_feature" && (
          <div className="flex items-center gap-2 rounded-lg border border-accent/25 bg-accent-soft px-3 py-2 text-xs text-accent">
            <Sparkles size={14} className="shrink-0" />
            Posible trabajo adicional
          </div>
        )}

        {role === "admin" && (
          <Card>
            <CardHeader>
              <h2 className="text-card-title">Gestión</h2>
            </CardHeader>
            <CardBody className="space-y-4">
              <StatusSelect key={ticket.status} ticketId={ticket.id} current={ticket.status} />
              <PrioritySelect key={ticket.priority} ticketId={ticket.id} current={ticket.priority} />
              <CreateQuoteDialog ticketId={ticket.id} />

            </CardBody>
          </Card>
        )}



        <details className={role === "client" ? "hidden" : "rounded-xl border border-border bg-surface p-4"}>
          <summary className="cursor-pointer text-sm font-medium">Ver historial de la consulta</summary><Card className="mt-3 border-0 shadow-none">
          <CardHeader className="flex items-center gap-2">
            <Clock size={14} className="text-muted" />
            <h2 className="text-card-title">Historial</h2>
          </CardHeader>
          <CardBody>
            <ol className="space-y-3 border-l border-border pl-4">
              {events.map((e) => (
                <li key={e.id} className="relative text-xs">
                  <div className="absolute -left-[19px] top-1 h-1.5 w-1.5 rounded-full bg-muted-2" />
                  <p className="text-foreground">{eventLabel(e, creator)}</p>
                  <p className="text-muted-2">{formatDateTime(e.created_at)}</p>
                </li>
              ))}
            </ol>
          </CardBody>
        </Card></details>
      </div>
    </div>
  );
}

function eventLabel(e: TicketEvent, creator?: { full_name: string | null; role: string } | null) {
  if (e.event_type === "created") {
    if (creator?.role === "admin") return "MR14 creó esta solicitud.";
    return `${creator?.full_name || "El cliente"} creó esta solicitud.`;
  }
  const map: Record<string, string> = {
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
      onClick={() => {
        const viewer = window.open("about:blank", "_blank");
        if (viewer) viewer.opener = null;
        startTransition(async () => {
          try {
            const url = await getTicketAttachmentUrlAction(attachment.storage_path);
            if (viewer) viewer.location.replace(url);
            else window.location.assign(url);
          } catch {
            viewer?.close();
            toast.error("No se pudo abrir el archivo.");
          }
        });
      }}
      className="flex min-h-11 max-w-full items-center gap-1.5 break-all rounded-lg border border-border bg-surface px-3 py-2 text-left text-sm text-muted hover:border-accent hover:text-accent"
    >
      <FileDown size={12} /> {attachment.name}
    </button>
  );
}

function ReplyForm({ ticketId, role, quickReplies = [] }: { ticketId: string; role: "admin" | "client"; quickReplies?: QuickReply[] }) {
  const [pending, startTransition] = useTransition();
  const [body, setBody] = useState("");
  const [attachmentKey, setAttachmentKey] = useState(0);
  const form = useRef<HTMLFormElement>(null);

  function onSubmit(formData: FormData) {
    formData.set("body", body);
    startTransition(async () => {
      try {
        const result = await addTicketMessageAction(ticketId, formData);
        if (result?.error) { toast.error(result.error); return; }
        setBody("");
        form.current?.reset();
        setAttachmentKey(key => key + 1);
        if (result?.warning) toast.warning(result.warning);
        else toast.success(formData.get("intent") === "resolve" ? "Respuesta enviada y consulta resuelta." : "Mensaje enviado.");
      } catch { toast.error("No se pudo enviar. Tu mensaje sigue acá para reintentarlo."); }
    });
  }

  return (
    <form ref={form} action={onSubmit} className="space-y-4">
      {quickReplies.length > 0 && <Select aria-label="Usar una respuesta guardada" defaultValue="" disabled={pending}
        onChange={event => { if (event.target.value) setBody(event.target.value); event.target.value = ""; }}>
        <option value="">Usar una respuesta guardada…</option>
        {quickReplies.map(reply => <option key={reply.id} value={reply.text}>{reply.text}</option>)}
      </Select>}
      <label htmlFor="ticket-reply" className="block text-base font-medium">{role === "client" ? "Escribile a Mateo" : "Tu respuesta al cliente"}</label>
      <Textarea id="ticket-reply" name="body" value={body} onChange={event => setBody(event.target.value)}
        readOnly={pending} maxLength={10000} rows={4} placeholder={role === "client" ? "Contale qué necesitás o cómo te fue…" : "Escribí tu respuesta…"}
        className="min-h-28 text-base leading-relaxed" required />
      <TicketAttachments key={attachmentKey} disabled={pending} />
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button type="submit" name="intent" value="reply" disabled={pending || !body.trim()} className="min-h-12 flex-1">
          <Send size={17} /> {pending ? "Enviando…" : "Enviar mensaje"}
        </Button>
        {role === "admin" && <Button type="submit" name="intent" value="resolve" variant="secondary" disabled={pending || !body.trim()} className="min-h-12 flex-1">Enviar y resolver</Button>}
      </div>
      {role === "admin" && <p className="text-xs leading-relaxed text-muted">Enviar mensaje deja la consulta esperando al cliente. “Enviar y resolver” también la marca como terminada.</p>}
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
  clientId,
  role,
  quote,
  version,
}: {
  ticketId: string;
  clientId: string;
  role: "admin" | "client";
  quote: QuoteWithVersions;
  version: TicketQuoteVersion;
}) {
  const [pending, startTransition] = useTransition();
  const [decision, setDecision] = useState<"accepted" | "rejected" | null>(null);
  const [reason, setReason] = useState("");
  const decided = Boolean(version.decided_at);

  function submitDecision() {
    if (!decision) return;
    startTransition(async () => {
      try {
        await decideQuoteAction(version.id, ticketId, decision, reason);
        toast.success(decision === "accepted" ? "Presupuesto aceptado." : "Presupuesto rechazado.");
        setDecision(null);
        setReason("");
      } catch {
        toast.error("No pudimos registrar tu decisión. Intentá nuevamente.");
      }
    });
  }

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
            <Button size="sm" disabled={pending} onClick={() => setDecision("accepted")}>
              Aceptar presupuesto
            </Button>
            <Button size="sm" variant="outline" disabled={pending} onClick={() => setDecision("rejected")}>
              Rechazar presupuesto
            </Button>
          </div>
        )}
        <Dialog
          open={decision !== null}
          onClose={() => {
            if (pending) return;
            setDecision(null);
            setReason("");
          }}
          title={decision === "accepted" ? "Confirmar presupuesto" : "Rechazar presupuesto"}
          className="max-w-md"
        >
          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-surface-2 p-4">
              <p className="text-sm">{version.description}</p>
              <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-caption">Monto</dt>
                  <dd className="font-semibold">{formatCurrency(version.amount, version.currency)}</dd>
                </div>
                <div>
                  <dt className="text-caption">Plazo estimado</dt>
                  <dd>{version.estimated_days ? `${version.estimated_days} días` : "Sin definir"}</dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-caption">Válido hasta</dt>
                  <dd>{version.valid_until ? formatDate(version.valid_until) : "Sin vencimiento informado"}</dd>
                </div>
              </dl>
            </div>

            <p className="text-sm text-muted">
              {decision === "accepted"
                ? "Al confirmar, MR14 recibirá tu aprobación y la solicitud pasará a trabajo aprobado."
                : "MR14 recibirá el rechazo y podrá revisar el alcance o preparar una nueva versión."}
            </p>

            {decision === "rejected" && (
              <Field className="mb-0">
                <Label>Motivo (opcional)</Label>
                <Textarea
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  rows={3}
                  maxLength={500}
                  placeholder="Contanos qué habría que revisar"
                />
              </Field>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setDecision(null)} disabled={pending}>
                Volver
              </Button>
              <Button variant={decision === "accepted" ? "primary" : "danger"} onClick={submitDecision} disabled={pending}>
                {pending
                  ? "Guardando…"
                  : decision === "accepted"
                    ? "Aceptar presupuesto"
                    : "Rechazar presupuesto"}
              </Button>
            </div>
          </div>
        </Dialog>
        {decided && (
          <p className="pt-1 text-xs text-muted-2">
            {version.decision === "accepted" ? "Aceptado" : "Rechazado"} el {formatDateTime(version.decided_at)}
          </p>
        )}
        {role === "admin" && quote.status === "accepted" && (
          <div className="pt-2">
            <NewProjectDialog
              clientId={clientId}
              triggerLabel="Crear trabajo adicional"
              dialogTitle="Trabajo adicional"
            />
          </div>
        )}
        {quote.ticket_quote_versions.length > 1 && (
          <details className="pt-2">
            <summary className="cursor-pointer text-xs text-muted-2 hover:text-foreground">
              Ver historial de versiones ({quote.ticket_quote_versions.length})
            </summary>
            <ul className="mt-2 space-y-2 border-t border-border pt-2">
              {quote.ticket_quote_versions
                .slice()
                .sort((a, b) => b.version - a.version)
                .map((v) => (
                  <li key={v.id} className="text-xs text-muted-2">
                    <span className="font-medium text-muted">v{v.version}</span> · {formatCurrency(v.amount, v.currency)}
                    {v.decided_at
                      ? ` · ${v.decision === "accepted" ? "aceptado" : "rechazado"} el ${formatDateTime(v.decided_at)}`
                      : " · sin decisión"}
                  </li>
                ))}
            </ul>
          </details>
        )}
      </CardBody>
    </Card>
  );
}

function quotes_status_label(status: string) {
  return { pending: "pendiente", accepted: "aceptado", rejected: "rechazado", superseded: "reemplazado" }[status] ?? status;
}
