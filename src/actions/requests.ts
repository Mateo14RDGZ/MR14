"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { RequestPriority, RequestStatus, RequestType } from "@/lib/types";

export async function createRequestAction(clientId: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado." };

  const title = String(formData.get("title") || "").trim();
  if (!title) return { error: "El título es obligatorio." };

  const payload = {
    client_id: clientId,
    created_by: user.id,
    type: (String(formData.get("type") || "otro")) as RequestType,
    title,
    description: String(formData.get("description") || "").trim() || null,
    priority: (String(formData.get("priority") || "media")) as RequestPriority,
  };

  const { error } = await supabase.from("requests").insert(payload);
  if (error) return { error: error.message };

  revalidatePath("/portal/solicitudes");
}

export async function updateRequestStatusAction(id: string, clientId: string, status: RequestStatus) {
  const supabase = await createClient();
  const { error } = await supabase.from("requests").update({ status }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/portal/solicitudes");
}
