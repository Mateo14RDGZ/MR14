"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { savePushSubscriptionAction, removePushSubscriptionAction } from "@/actions/push";
import { Bell, BellOff } from "lucide-react";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export function NotificationsToggle() {
  const [supported, setSupported] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [checking, setChecking] = useState(true);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const isSupported = typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window;
    setSupported(isSupported);
    if (!isSupported) {
      setChecking(false);
      return;
    }
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setSubscribed(Boolean(sub)))
      .finally(() => setChecking(false));
  }, []);

  function subscribe() {
    startTransition(async () => {
      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!publicKey) {
        toast.error("Las notificaciones push todavía no están configuradas.");
        return;
      }
      try {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          toast.error("No diste permiso para notificaciones.");
          return;
        }
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        });
        const json = sub.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } };
        const result = await savePushSubscriptionAction(json);
        if (result?.error) {
          toast.error(result.error);
          return;
        }
        setSubscribed(true);
        toast.success("Notificaciones activadas.");
      } catch {
        toast.error("No se pudo activar las notificaciones.");
      }
    });
  }

  function unsubscribe() {
    startTransition(async () => {
      try {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          await removePushSubscriptionAction(sub.endpoint);
          await sub.unsubscribe();
        }
        setSubscribed(false);
        toast.success("Notificaciones desactivadas.");
      } catch {
        toast.error("No se pudo desactivar las notificaciones.");
      }
    });
  }

  if (checking) return null;

  if (!supported) {
    return (
      <p className="text-sm text-muted">
        Tu navegador no soporta notificaciones push. En iPhone, instalá MR14 en la pantalla de inicio primero
        (Safari → Compartir → Agregar a inicio) y abrila desde ahí.
      </p>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3">
      <p className="text-sm text-muted">
        {subscribed ? "Vas a recibir notificaciones aunque tengas la app cerrada." : "Activá los avisos para enterarte al instante, aunque no tengas la app abierta."}
      </p>
      <Button
        type="button"
        variant={subscribed ? "secondary" : "primary"}
        size="sm"
        disabled={pending}
        onClick={subscribed ? unsubscribe : subscribe}
        className="shrink-0"
      >
        {subscribed ? <BellOff size={14} /> : <Bell size={14} />}
        {pending ? "..." : subscribed ? "Desactivar" : "Activar notificaciones"}
      </Button>
    </div>
  );
}
