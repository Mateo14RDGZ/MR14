"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logHistory } from "@/lib/history";
import { notifyUsers, getClientMemberUserIds } from "@/lib/notifications";
import { STAGE_META, type ProjectStage } from "@/lib/types";

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

/**
 * Un solo campo (la etapa) actualiza todo lo demás: progreso, status
 * interno y el texto que ve el cliente. Así el admin no tiene que tocar
 * 3 controles distintos para mantener todo consistente.
 */
export async function updateProjectStageAction(
  projectId: string,
  clientId: string,
  formData: FormData
) {
  const supabase = await createClient();
  const stage = String(formData.get("stage") || "contrato") as ProjectStage;
  const next_step = String(formData.get("next_step") || "").trim() || null;
  const meta = STAGE_META[stage];

  const { error } = await supabase
    .from("projects")
    .update({ stage, progress_percent: meta.progress, status: meta.status, next_step })
    .eq("id", projectId);
  if (error) return { error: error.message };

  // visibility "client": esto lo lee el cliente en su propio historial — va
  // en su idioma (clientLabel), no en la jerga interna del admin ni con el
  // % pelado, que no le dice nada a alguien sin conocimientos técnicos.
  await logHistory({ clientId, projectId, event: `Tu proyecto avanzó a: ${meta.clientLabel}`, visibility: "client" });

  const clientMemberIds = await getClientMemberUserIds(clientId);
  await notifyUsers({
    userIds: clientMemberIds,
    type: "project_updated",
    title: "Tu web sigue avanzando",
    body: `${meta.clientLabel}. Tocá para ver cómo va.`,
    url: "/portal",
  });

  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/portal");
  revalidatePath("/dashboard");
}

/** Para los estados excepcionales que no forman parte del avance lineal. */
export async function setProjectSpecialStatusAction(
  projectId: string,
  clientId: string,
  status: "mantenimiento" | "pausado" | "cancelado"
) {
  const supabase = await createClient();
  const { error } = await supabase.from("projects").update({ status }).eq("id", projectId);
  if (error) return { error: error.message };

  const label = { mantenimiento: "En mantenimiento", pausado: "Pausado", cancelado: "Cancelado" }[status];
  await logHistory({ clientId, projectId, event: `Estado del proyecto: "${label}"` });

  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/dashboard");
}

/**
 * Saca al proyecto de mantenimiento/pausado/cancelado, volviendo al status
 * que le corresponde por su etapa actual (stage) — la misma etapa no se
 * toca, solo se recalcula el status para que deje de estar "congelado".
 */
export async function clearProjectSpecialStatusAction(projectId: string, clientId: string) {
  const supabase = await createClient();
  const { data: project, error: fetchError } = await supabase
    .from("projects")
    .select("stage")
    .eq("id", projectId)
    .single();
  if (fetchError || !project) return { error: fetchError?.message ?? "Proyecto no encontrado." };

  const status = STAGE_META[project.stage as ProjectStage].status;
  const { error } = await supabase.from("projects").update({ status }).eq("id", projectId);
  if (error) return { error: error.message };

  await logHistory({ clientId, projectId, event: "Estado del proyecto: vuelve al flujo normal" });

  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/dashboard");
}

export async function markProjectDeliveredAction(projectId: string, clientId: string) {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);
  const { error } = await supabase
    .from("projects")
    .update({ status: "entregado", stage: "entregado", progress_percent: 100, actual_delivery_date: today })
    .eq("id", projectId);
  if (error) throw new Error(error.message);
  await logHistory({ clientId, projectId, event: "Proyecto marcado como entregado" });

  const clientMemberIds = await getClientMemberUserIds(clientId);
  await notifyUsers({
    userIds: clientMemberIds,
    type: "project_updated",
    title: "Tu web ya está pronta",
    body: "Podés abrirla y revisar toda la información desde el portal.",
    url: "/portal",
  });

  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/dashboard");
}
