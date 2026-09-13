"use client";

import { useEffect } from "react";
import { toast } from "sonner";

/** Last-resort recovery for connectivity failures in asynchronous controls. */
export function ClientErrorGuard() {
  useEffect(() => {
    const onRejection = (event: PromiseRejectionEvent) => {
      const digest = (event.reason as { digest?: string } | undefined)?.digest;
      if (typeof digest === "string" && (digest.startsWith("NEXT_REDIRECT") || digest === "NEXT_NOT_FOUND")) return;
      event.preventDefault();
      console.error("unhandled_user_action", event.reason);
      toast.error("No pudimos completar la acción. Revisá tu conexión e intentá nuevamente.", { id: "unhandled-user-action" });
    };
    window.addEventListener("unhandledrejection", onRejection);
    return () => window.removeEventListener("unhandledrejection", onRejection);
  }, []);
  return null;
}
