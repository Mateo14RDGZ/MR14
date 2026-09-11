import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPushToUsers } from "@/lib/push";
import type { NotificationType } from "@/lib/types";

export async function notifyUsers(params: {
  userIds: string[];
  type: NotificationType;
  title: string;
  body?: string;
  ticketId?: string;
  /** A dónde debe llevar la notificación push al tocarla. Ej: "/support/abc123". */
  url?: string;
}) {
  const uniqueIds = Array.from(new Set(params.userIds)).filter(Boolean);
  if (uniqueIds.length === 0) return;

  // Called only by server-side actions after authorizing the operation.
  // Recipients cannot be discovered or notified through the actor's RLS.
  const supabase = createAdminClient();
  const { error } = await supabase.from("notifications").insert(
    uniqueIds.map((user_id) => ({
      user_id,
      type: params.type,
      title: params.title,
      body: params.body ?? null,
      ticket_id: params.ticketId ?? null,
      url: params.url ?? null,
    }))
  );

  if (error) console.error("notification_insert_failed", error.code);
  try {
    await sendPushToUsers(uniqueIds, { title: params.title, body: params.body, url: params.url });
  } catch {
    console.error("notification_push_failed");
  }
}

export async function getAdminUserIds(): Promise<string[]> {
  const supabase = createAdminClient();
  const { data } = await supabase.from("profiles").select("id").eq("role", "admin");
  return (data ?? []).map((p) => p.id);
}

export async function getClientMemberUserIds(clientId: string): Promise<string[]> {
  const supabase = createAdminClient();
  const { data } = await supabase.from("client_members").select("user_id").eq("client_id", clientId).eq("status", "active");
  return (data ?? []).map((m) => m.user_id);
}
