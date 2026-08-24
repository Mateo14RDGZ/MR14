"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { markNotificationReadAction, markAllNotificationsReadAction } from "@/actions/notifications";
import type { AppNotification } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";
import { cn } from "@/lib/utils";

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

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-surface-2"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute right-1.5 top-1.5 flex h-2 w-2 rounded-full bg-danger" />
        )}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-2 w-[min(20rem,calc(100vw-2rem))] rounded-xl border border-border bg-surface shadow-2xl">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <p className="text-card-title">Notificaciones</p>
              {unreadCount > 0 && (
                <button
                  disabled={pending}
                  onClick={() => startTransition(async () => markAllNotificationsReadAction())}
                  className="text-xs text-accent hover:underline"
                >
                  Marcar todas
                </button>
              )}
            </div>
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="px-4 py-6 text-center text-xs text-muted-2">Sin notificaciones.</p>
              ) : (
                notifications.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => {
                      startTransition(async () => {
                        if (!n.read_at) await markNotificationReadAction(n.id);
                      });
                      setOpen(false);
                      if (n.ticket_id) router.push(`${ticketBasePath}/${n.ticket_id}`);
                    }}
                    className={cn(
                      "block w-full border-b border-border px-4 py-3 text-left last:border-0 hover:bg-surface-2",
                      !n.read_at && "bg-accent/5"
                    )}
                  >
                    <p className="text-sm font-medium">{n.title}</p>
                    {n.body && <p className="mt-0.5 truncate text-xs text-muted">{n.body}</p>}
                    <p className="mt-1 text-[10px] text-muted-2">{formatDateTime(n.created_at)}</p>
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
