"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPushToUsers } from "@/lib/push";

export async function savePushSubscriptionAction(sub: {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado." };

  let url: URL;
  try { url = new URL(sub.endpoint); } catch { return { error: "Suscripción no válida." }; }
  const allowedHost = /^(fcm\.googleapis\.com|([a-z0-9-]+\.)*push\.services\.mozilla\.com|([a-z0-9-]+\.)*push\.apple\.com|([a-z0-9-]+\.)*notify\.windows\.com)$/i;
  if (url.protocol !== "https:" || url.port || url.username || url.password || !allowedHost.test(url.hostname) ||
      sub.endpoint.length > 4096 || !/^[A-Za-z0-9_-]{80,100}$/.test(sub.keys?.p256dh ?? "") ||
      !/^[A-Za-z0-9_-]{20,30}$/.test(sub.keys?.auth ?? "")) return { error: "Este servicio de avisos no es compatible." };
  const admin = createAdminClient();
  const { data: existing } = await admin.from("push_subscriptions").select("p256dh, auth_key").eq("endpoint", sub.endpoint).maybeSingle();
  // Possession of both browser keys allows safe account switching on this device.
  if (existing && (existing.p256dh !== sub.keys.p256dh || existing.auth_key !== sub.keys.auth)) return { error: "Volvé a activar los avisos en este dispositivo." };
  const { error } = await admin.from("push_subscriptions").upsert(
    {
      user_id: user.id,
      endpoint: sub.endpoint,
      p256dh: sub.keys.p256dh,
      auth_key: sub.keys.auth,
    },
    { onConflict: "endpoint" }
  );

  if (error) return { error: "No pudimos guardar los avisos. Intentá nuevamente." };
}

export async function removePushSubscriptionAction(endpoint: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint);
  if (error) throw new Error("No pudimos desactivar los avisos.");
}

export async function testPushNotificationAction() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Iniciá sesión para probar los avisos.");
  const sent = await sendPushToUsers([user.id], { title: "Tus avisos de MR14", body: "Así te avisaremos cuando haya una consulta o respuesta nueva.", url: "/" });
  if (!sent) throw new Error("No pudimos enviar el aviso. Desactivá y volvé a activar los avisos en este dispositivo.");
}
