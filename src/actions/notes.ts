"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createInternalNoteAction(
  target: { clientId: string; projectId?: string | null },
  formData: FormData
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const content = String(formData.get("content") || "").trim();
  if (!content) return { error: "Escribí algo para guardar la nota." };

  const { error } = await supabase.from("internal_notes").insert({
    client_id: target.clientId,
    project_id: target.projectId ?? null,
    content,
    created_by: user?.id ?? null,
  });
  if (error) return { error: error.message };

  revalidatePath(`/clients/${target.clientId}`);
  if (target.projectId) revalidatePath(`/projects/${target.projectId}`);
}

export async function updateInternalNoteAction(
  id: string,
  target: { clientId: string; projectId?: string | null },
  content: string
) {
  const supabase = await createClient();
  const trimmed = content.trim();
  if (!trimmed) throw new Error("La nota no puede quedar vacía.");

  const { error } = await supabase.from("internal_notes").update({ content: trimmed }).eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath(`/clients/${target.clientId}`);
  if (target.projectId) revalidatePath(`/projects/${target.projectId}`);
}

export async function deleteInternalNoteAction(id: string, target: { clientId: string; projectId?: string | null }) {
  const supabase = await createClient();
  const { error } = await supabase.from("internal_notes").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath(`/clients/${target.clientId}`);
  if (target.projectId) revalidatePath(`/projects/${target.projectId}`);
}
