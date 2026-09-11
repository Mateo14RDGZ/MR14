"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { savePushSubscriptionAction, removePushSubscriptionAction, testPushNotificationAction } from "@/actions/push";
import { Bell, Check } from "lucide-react";

async function registration() {
  await navigator.serviceWorker.register("/sw.js");
  return Promise.race([
    navigator.serviceWorker.ready,
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error("No pudimos conectar los avisos. Intentá de nuevo.")), 8000)),
  ]);
}

function serialize(sub: PushSubscription) {
  return sub.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } };
}

export function NotificationsToggle({ audience = "client" }: { audience?: "client" | "admin" }) {
  const [state, setState] = useState<"checking" | "unsupported" | "install" | "blocked" | "off" | "on">("checking");
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    let mounted = true;
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    if (ios && !window.matchMedia("(display-mode: standalone)").matches) {
      setState("install");
      return;
    }
    if (!("serviceWorker" in navigator && "PushManager" in window && "Notification" in window)) {
      setState("unsupported");
      return;
    }
    if (Notification.permission === "denied") { setState("blocked"); return; }
    registration().then(reg => reg.pushManager.getSubscription()).then(async sub => {
      const result = sub ? await savePushSubscriptionAction(serialize(sub)) : null;
      if (mounted) setState(sub && !result?.error ? "on" : "off");
    }).catch(() => { if (mounted) setState("off"); });
    return () => { mounted = false; };
  }, []);

  function activate() {
    // Request from the user's click, before awaiting service-worker work.
    const permission = Notification.requestPermission();
    startTransition(async () => {
      try {
        const granted = await permission;
        if (granted !== "granted") {
          setState(granted === "denied" ? "blocked" : "off");
          return;
        }
        const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (!key) throw new Error("Los avisos todavía no están disponibles. Podés ver las novedades desde la campana.");
        const base64 = key.replace(/-/g, "+").replace(/_/g, "/");
        const bytes = Uint8Array.from(atob(base64 + "=".repeat((4 - base64.length % 4) % 4)), c => c.charCodeAt(0));
        const reg = await registration();
        const sub = await reg.pushManager.getSubscription() ?? await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: bytes });
        const result = await savePushSubscriptionAction(serialize(sub));
        if (result?.error) throw new Error(result.error);
        setState("on");
        toast.success("Avisos activados en este dispositivo.");
      } catch (error) { toast.error(error instanceof Error ? error.message : "No pudimos activar los avisos."); }
    });
  }

  function deactivate() {
    startTransition(async () => {
      try {
        const sub = await (await registration()).pushManager.getSubscription();
        if (sub) {
          await removePushSubscriptionAction(sub.endpoint);
          await sub.unsubscribe();
        }
        setState("off");
        toast.success("Avisos desactivados en este dispositivo.");
      } catch { toast.error("No pudimos desactivar los avisos."); }
    });
  }

  return (
    <section aria-label="Avisos en este dispositivo" className="rounded-xl border border-border bg-surface p-4">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 text-accent">{state === "on" ? <Check size={20} /> : <Bell size={20} />}</span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">{state === "on" ? "Avisos activados" : "Recibí los avisos en tu celular"}</p>
          <p className="mt-1 text-sm leading-relaxed text-muted" role="status">
            {state === "checking" ? "Comprobando los avisos…"
              : state === "install" ? "En iPhone: abrí esta página en Safari, tocá Compartir → Agregar a inicio. Después abrí MR14 desde ese ícono y activá los avisos acá."
              : state === "unsupported" ? "Este navegador no permite avisos push. Podés seguir viendo las novedades en la campana o abrir MR14 en un navegador compatible."
              : state === "blocked" ? "Los avisos están bloqueados. Permitilos en la configuración de este sitio o de la app y volvé a abrir MR14."
              : audience === "admin" ? "Te avisaremos cuando un cliente abra una consulta o responda, aunque no tengas MR14 abierto."
              : "Te avisaremos cuando Mateo te escriba o abra una consulta, aunque no tengas MR14 abierto."}
          </p>
          {state === "off" && <Button onClick={activate} disabled={pending} className="mt-3 w-full sm:w-auto">{pending ? "Activando…" : "Activar avisos"}</Button>}
          {state === "on" && <div className="mt-2 flex flex-wrap gap-2">
            <Button variant="secondary" disabled={pending} onClick={() => startTransition(async () => {
              try { await testPushNotificationAction(); toast.success("Prueba enviada. Revisá los avisos del dispositivo."); }
              catch (error) { toast.error(error instanceof Error ? error.message : "No pudimos enviar la prueba."); }
            })}>Probar aviso</Button>
            <Button variant="ghost" disabled={pending} onClick={deactivate}>Desactivar</Button>
          </div>}
        </div>
      </div>
    </section>
  );
}
