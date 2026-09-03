"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  LifeBuoy,
  MessageSquare,
  FileText,
  KeyRound,
  Receipt,
  FolderKanban,
  UserPlus,
  CheckCircle2,
  type LucideIcon,
} from "lucide-react";
import { Dialog } from "@/components/ui/Dialog";
import { markNotificationReadAction, markAllNotificationsReadAction } from "@/actions/notifications";
import type { AppNotification, NotificationType } from "@/lib/types";
import { timeAgo } from "@/lib/utils";
import { cn } from "@/lib/utils";

const NOTIFICATION_ICON: Record<NotificationType, LucideIcon> = {
  ticket_created: LifeBuoy,
  ticket_message: MessageSquare,
  ticket_status_changed: LifeBuoy,
  ticket_needs_client_reply: LifeBuoy,
  quote_received: Receipt,
  quote_accepted: CheckCircle2,
  quote_rejected: Receipt,
  ticket_resolved: CheckCircle2,
  member_pending_approval: UserPlus,
  project_updated: FolderKanban,
  document_uploaded: FileText,
  credential_delivered: KeyRound,
};

export function NotificationBell({
  notifications,
  unreadCount,
  ticketBasePath,
  audience = "admin",
}: {
  notifications: AppNotification[];
  unreadCount: number;
  ticketBasePath: string;
  audience?: "admin" | "client";
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [readIds, setReadIds] = useState<Set<string>>(() => new Set());
  const router = useRouter();
  const effectiveUnread = Math.max(0, unreadCount - readIds.size);

  function resolveHref(n: AppNotification): string | null {
    if (n.url) return n.url;
    if (n.ticket_id) return `${ticketBasePath}/${n.ticket_id}`;
    return null;
  }

  function onSelect(n: AppNotification) {
    if (!n.read_at) setReadIds((current) => new Set(current).add(n.id));
    startTransition(async () => {
      if (!n.read_at) await markNotificationReadAction(n.id);
    });
    setOpen(false);
    const href = resolveHref(n);
    if (href) router.push(href);
  }

  function markAllRead() {
    setReadIds(new Set(notifications.filter((item) => !item.read_at).map((item) => item.id)));
    startTransition(async () => markAllNotificationsReadAction());
  }

  function clientCopy(n: AppNotification) {
    const copy: Partial<Record<NotificationType, { title: string; body?: string }>> = {
      ticket_message: { title: "Mateo te respondió", body: n.body ?? "Abrí la consulta para leer el mensaje." },
      ticket_needs_client_reply: { title: "Mateo necesita tu respuesta", body: "Abrí la consulta para responderle." },
      ticket_resolved: { title: "Tu consulta fue resuelta", body: "Podés revisar la respuesta o avisar si todavía necesitás ayuda." },
      quote_received: { title: "Tenés un presupuesto para revisar", body: "Abrilo para ver el trabajo, el precio y decidir con tranquilidad." },
      project_updated: { title: "Hay novedades sobre tu web", body: "Tocá para ver qué cambió." },
      document_uploaded: { title: "Tenés un documento nuevo", body: n.body ? `${n.body} ya está disponible.` : "Podés abrirlo desde Documentos." },
      credential_delivered: { title: "Tenés un acceso nuevo", body: "Está guardado de forma segura en Mis accesos." },
    };
    return copy[n.type] ?? { title: n.title, body: n.body ?? undefined };
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label={effectiveUnread > 0 ? `Abrir avisos, ${effectiveUnread} sin leer` : "Abrir avisos"}
        className="relative flex h-11 w-11 items-center justify-center rounded-lg text-muted hover:bg-surface-2 lg:h-9 lg:w-9"
      >
        <Bell size={18} />
        {effectiveUnread > 0 && <span aria-hidden="true" className="absolute right-0.5 top-0.5 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">{Math.min(effectiveUnread, 9)}{effectiveUnread > 9 ? "+" : ""}</span>}
      </button>

      <Dialog open={open} onClose={() => setOpen(false)} title={audience === "client" ? "Avisos" : "Notificaciones"} className="max-w-sm">
        {effectiveUnread > 0 && (
          <button
            disabled={pending}
            onClick={markAllRead}
            className="mb-3 min-h-10 text-sm font-medium text-accent hover:underline"
          >
            Marcar todo como leído
          </button>
        )}
        {notifications.length === 0 ? (
          <p className="py-8 text-center text-base text-muted">No tenés avisos por ahora.</p>
        ) : (
          <div className="-mx-5 divide-y divide-border">
            {notifications.map((n) => {
              const Icon = NOTIFICATION_ICON[n.type] ?? Bell;
              const display = audience === "client" ? clientCopy(n) : { title: n.title, body: n.body ?? undefined };
              const isRead = Boolean(n.read_at || readIds.has(n.id));
              return (
                <button
                  key={n.id}
                  onClick={() => onSelect(n)}
                  className={cn(
                    "flex w-full min-h-16 items-start gap-3 px-5 py-3.5 text-left transition-colors hover:bg-surface-2",
                    !isRead && "bg-accent/5"
                  )}
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-2 text-muted">
                    <Icon size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-base font-medium">{display.title}</p>
                    {display.body && <p className="mt-1 line-clamp-3 text-sm leading-relaxed text-muted">{display.body}</p>}
                    <p className="mt-1.5 text-xs text-muted-2">Hace {timeAgo(n.created_at)}</p>
                  </div>
                  {!isRead && <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-accent" />}
                </button>
              );
            })}
          </div>
        )}
      </Dialog>
    </>
  );
}
