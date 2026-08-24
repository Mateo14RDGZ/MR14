"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createQuickReplyAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const text = String(formData.get("text") || "").trim();
  if (!text) return { error: "Escribí el texto de la plantilla." };

  const { count } = await supabase.from("quick_replies").select("id", { count: "exact", head: true });

  const { error } = await supabase
    .from("quick_replies")
    .insert({ text, position: (count ?? 0) + 1, created_by: user?.id ?? null });
  if (error) return { error: error.message };

  revalidatePath("/settings");
}

export async function updateQuickReplyAction(id: string, text: string) {
  const supabase = await createClient();
  const trimmed = text.trim();
  if (!trimmed) throw new Error("La plantilla no puede quedar vacía.");
  const { error } = await supabase.from("quick_replies").update({ text: trimmed }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/settings");
}

export async function deleteQuickReplyAction(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("quick_replies").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/settings");
}
