import "server-only";
import { createClient } from "@/lib/supabase/server";
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

  const supabase = await createClient();
  await supabase.from("notifications").insert(
    uniqueIds.map((user_id) => ({
      user_id,
      type: params.type,
      title: params.title,
      body: params.body ?? null,
      ticket_id: params.ticketId ?? null,
      url: params.url ?? null,
    }))
  );

  await sendPushToUsers(uniqueIds, { title: params.title, body: params.body, url: params.url });
}

export async function getAdminUserIds(): Promise<string[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("id").eq("role", "admin");
  return (data ?? []).map((p) => p.id);
}

export async function getClientMemberUserIds(clientId: string): Promise<string[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("client_members").select("user_id").eq("client_id", clientId);
  return (data ?? []).map((m) => m.user_id);
}
