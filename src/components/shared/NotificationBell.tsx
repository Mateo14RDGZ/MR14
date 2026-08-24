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
}: {
  notifications: AppNotification[];
  unreadCount: number;
  ticketBasePath: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function resolveHref(n: AppNotification): string | null {
    if (n.url) return n.url;
    if (n.ticket_id) return `${ticketBasePath}/${n.ticket_id}`;
    return null;
  }

  function onSelect(n: AppNotification) {
    startTransition(async () => {
      if (!n.read_at) await markNotificationReadAction(n.id);
    });
    setOpen(false);
    const href = resolveHref(n);
    if (href) router.push(href);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-surface-2"
      >
        <Bell size={18} />
        {unreadCount > 0 && <span className="absolute right-1.5 top-1.5 flex h-2 w-2 rounded-full bg-danger" />}
      </button>

      <Dialog open={open} onClose={() => setOpen(false)} title="Notificaciones" className="max-w-sm">
        {unreadCount > 0 && (
          <button
            disabled={pending}
            onClick={() => startTransition(async () => markAllNotificationsReadAction())}
            className="mb-3 text-xs text-accent hover:underline"
          >
            Marcar todas como leídas
          </button>
        )}
        {notifications.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-2">Sin notificaciones.</p>
        ) : (
          <div className="-mx-5 divide-y divide-border">
            {notifications.map((n) => {
              const Icon = NOTIFICATION_ICON[n.type] ?? Bell;
              return (
                <button
                  key={n.id}
                  onClick={() => onSelect(n)}
                  className={cn(
                    "flex w-full min-h-16 items-start gap-3 px-5 py-3.5 text-left transition-colors hover:bg-surface-2",
                    !n.read_at && "bg-accent/5"
                  )}
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-2 text-muted">
                    <Icon size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{n.title}</p>
                    {n.body && <p className="mt-0.5 line-clamp-2 text-xs text-muted">{n.body}</p>}
                    <p className="mt-1 text-[11px] text-muted-2">Hace {timeAgo(n.created_at)}</p>
                  </div>
                  {!n.read_at && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent" />}
                </button>
              );
            })}
          </div>
        )}
      </Dialog>
    </>
  );
}
