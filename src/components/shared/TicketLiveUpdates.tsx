"use client";

import { useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { markTicketNotificationsReadAction } from "@/actions/notifications";

export function TicketLiveUpdates({ ticketId, updatedAt }: { ticketId?: string; updatedAt?: string }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  useEffect(() => {
    if (ticketId) void markTicketNotificationsReadAction(ticketId).catch(() => {});
  }, [ticketId, updatedAt]);
  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === "visible") startTransition(() => router.refresh());
    };
    const timer = window.setInterval(refresh, 20000);
    document.addEventListener("visibilitychange", refresh);
    navigator.serviceWorker?.addEventListener("message", refresh);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", refresh);
      navigator.serviceWorker?.removeEventListener("message", refresh);
    };
  }, [router]);
  return null;
}
