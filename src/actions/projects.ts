"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logHistory } from "@/lib/history";
import type { ProjectStatus, ProjectType, PaymentStatus } from "@/lib/types";

const DEFAULT_CHECKLIST = [
  "Revisar mobile","Revisar desktop","Revisar enlaces","Revisar WhatsApp","Revisar ubicación",
  "Revisar horarios","Revisar SEO","Revisar favicon","Revisar Open Graph","Revisar SSL",
  "Revisar dominio","Revisar DNS","Revisar imágenes","Revisar textos","Revisar consola",
  "Revisar performance","Revisar accesibilidad básica","Confirmar pago final",
  "Crear documentación","Backup","Entregar accesos",
];

function str(fd: FormData, key: string): string | null {
  const v = fd.get(key);
  const s = typeof v === "string" ? v.trim() : "";
  return s.length ? s : null;
}
function num(fd: FormData, key: string): number {
  const v = fd.get(key);
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function buildProjectPayload(formData: FormData) {
  return {
    name: str(formData, "name") ?? "Proyecto sin nombre",
    type: (str(formData, "type") ?? "web_presencia") as ProjectType,
    description: str(formData, "description"),
    start_date: str(formData, "start_date"),
    estimated_delivery_date: str(formData, "estimated_delivery_date"),
    actual_delivery_date: str(formData, "actual_delivery_date"),
    status: (str(formData, "status") ?? "planificacion") as ProjectStatus,
    price: num(formData, "price"),
    deposit: num(formData, "deposit"),
    currency: str(formData, "currency") ?? "UYU",
    payment_status: (str(formData, "payment_status") ?? "pendiente") as PaymentStatus,
    notes: str(formData, "notes"),
  };
}

export async function createProjectAction(clientId: string, formData: FormData) {
  const supabase = await createClient();
  const payload = buildProjectPayload(formData);

  const { data, error } = await supabase
    .from("projects")
    .insert({ ...payload, client_id: clientId })
    .select("id")
    .single();

  if (error || !data) return { error: error?.message ?? "No se pudo crear el proyecto." };

  const checklistRows = DEFAULT_CHECKLIST.map((label, i) => ({
    project_id: data.id,
    label,
    position: i,
  }));
  await supabase.from("tasks").insert(checklistRows);

  await logHistory({
    clientId,
    projectId: data.id,
    event: `Proyecto "${payload.name}" creado`,
    visibility: "client",
  });

  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/projects");
  redirect(`/projects/${data.id}`);
}

export async function updateProjectAction(projectId: string, clientId: string, formData: FormData) {
  const supabase = await createClient();
  const payload = buildProjectPayload(formData);

  const { data: prev } = await supabase
    .from("projects")
    .select("status,payment_status")
    .eq("id", projectId)
    .single();

  const { error } = await supabase.from("projects").update(payload).eq("id", projectId);
  if (error) return { error: error.message };

  if (prev && prev.status !== payload.status) {
    await logHistory({
      clientId,
      projectId,
      event: `Estado del proyecto: "${payload.status}"`,
      visibility: "client",
    });
  }
  if (prev && prev.payment_status !== payload.payment_status) {
    await logHistory({
      clientId,
      projectId,
      event: `Estado de pago: "${payload.payment_status}"`,
    });
  }

  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/clients/${clientId}`);
  redirect(`/projects/${projectId}`);
}

export async function updateProjectStatusAction(
  projectId: string,
  clientId: string,
  status: ProjectStatus
) {
  const supabase = await createClient();
  const { error } = await supabase.from("projects").update({ status }).eq("id", projectId);
  if (error) throw new Error(error.message);
  await logHistory({ clientId, projectId, event: `Estado del proyecto: "${status}"` });
  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/dashboard");
}

export async function deleteProjectAction(projectId: string, clientId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("projects").delete().eq("id", projectId);
  if (error) throw new Error(error.message);
  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/projects");
  redirect(`/clients/${clientId}`);
}
