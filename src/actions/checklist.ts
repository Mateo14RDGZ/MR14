"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logHistory } from "@/lib/history";

export async function toggleChecklistItemAction(
  taskId: string,
  projectId: string,
  clientId: string,
  isDone: boolean
) {
  const supabase = await createClient();
  const { error } = await supabase.from("tasks").update({ is_done: isDone }).eq("id", taskId);
  if (error) throw new Error(error.message);
  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/clients/${clientId}`);
}

export async function addChecklistItemAction(projectId: string, clientId: string, label: string) {
  const supabase = await createClient();
  const { count } = await supabase
    .from("tasks")
    .select("id", { count: "exact", head: true })
    .eq("project_id", projectId);

  const { error } = await supabase
    .from("tasks")
    .insert({ project_id: projectId, label, position: count ?? 0 });
  if (error) throw new Error(error.message);
  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/clients/${clientId}`);
}

export async function deleteChecklistItemAction(taskId: string, projectId: string, clientId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("tasks").delete().eq("id", taskId);
  if (error) throw new Error(error.message);
  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/clients/${clientId}`);
}

export async function updateProjectStageAction(
  projectId: string,
  clientId: string,
  formData: FormData
) {
  const supabase = await createClient();
  const stage = String(formData.get("stage") || "contrato");
  const progress_percent = Number(formData.get("progress_percent") || 0);
  const next_step = String(formData.get("next_step") || "").trim() || null;

  const { error } = await supabase
    .from("projects")
    .update({ stage, progress_percent, next_step })
    .eq("id", projectId);
  if (error) return { error: error.message };

  await logHistory({ clientId, projectId, event: `Etapa actualizada: "${stage}" (${progress_percent}%)`, visibility: "client" });
  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/portal");
}

export async function markProjectDeliveredAction(projectId: string, clientId: string) {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);
  const { error } = await supabase
    .from("projects")
    .update({ status: "entregado", actual_delivery_date: today })
    .eq("id", projectId);
  if (error) throw new Error(error.message);
  await logHistory({ clientId, projectId, event: "Proyecto marcado como entregado" });
  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/dashboard");
}
