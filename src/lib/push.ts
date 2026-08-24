import "server-only";
import webpush from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";

let configured = false;

function ensureConfigured() {
  if (configured) return true;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) return false;
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:contacto@mateordgz.dev",
    publicKey,
    privateKey
  );
  configured = true;
  return true;
}

/** Manda una notificación push a todos los dispositivos suscriptos de esos usuarios. */
export async function sendPushToUsers(
  userIds: string[],
  payload: { title: string; body?: string; url?: string }
) {
  const uniqueIds = Array.from(new Set(userIds)).filter(Boolean);
  if (uniqueIds.length === 0) return;
  if (!ensureConfigured()) return;

  const admin = createAdminClient();
  const { data: subs } = await admin.from("push_subscriptions").select("*").in("user_id", uniqueIds);
  if (!subs || subs.length === 0) return;

  const json = JSON.stringify({
    title: payload.title,
    body: payload.body ?? "",
    url: payload.url ?? "/",
  });

  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth_key } },
          json
        );
      } catch (err: unknown) {
        const statusCode = (err as { statusCode?: number })?.statusCode;
        if (statusCode === 404 || statusCode === 410) {
          // Suscripción vencida o el usuario desinstaló/revocó el permiso.
          await admin.from("push_subscriptions").delete().eq("id", s.id);
        }
      }
    })
  );
}
