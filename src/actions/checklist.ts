"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logHistory } from "@/lib/history";
import { notifyUsers, getClientMemberUserIds } from "@/lib/notifications";
import { PROJECT_STAGES } from "@/lib/types";

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

  const { data: project, error } = await supabase
    .from("projects")
    .update({ stage, progress_percent, next_step })
    .eq("id", projectId)
    .select("name")
    .single();
  if (error) return { error: error.message };

  await logHistory({ clientId, projectId, event: `Etapa actualizada: "${stage}" (${progress_percent}%)`, visibility: "client" });

  const stageLabel = PROJECT_STAGES.find((s) => s.value === stage)?.label ?? stage;
  const clientMemberIds = await getClientMemberUserIds(clientId);
  await notifyUsers({
    userIds: clientMemberIds,
    type: "project_updated",
    title: `Tu proyecto avanzó: ${stageLabel}`,
    body: project?.name ? `${project.name} · ${progress_percent}% completado` : `${progress_percent}% completado`,
    url: "/portal",
  });

  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/portal");
}

export async function markProjectDeliveredAction(projectId: string, clientId: string) {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);
  const { data: project, error } = await supabase
    .from("projects")
    .update({ status: "entregado", actual_delivery_date: today })
    .eq("id", projectId)
    .select("name")
    .single();
  if (error) throw new Error(error.message);
  await logHistory({ clientId, projectId, event: "Proyecto marcado como entregado" });

  const clientMemberIds = await getClientMemberUserIds(clientId);
  await notifyUsers({
    userIds: clientMemberIds,
    type: "project_updated",
    title: "¡Tu proyecto fue entregado!",
    body: project?.name ?? undefined,
    url: "/portal",
  });

  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/dashboard");
}
