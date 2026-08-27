"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logHistory } from "@/lib/history";
import { notifyUsers, getClientMemberUserIds } from "@/lib/notifications";
import { PROJECT_STATUSES, type ProjectStatus, type ProjectType, type PaymentStatus } from "@/lib/types";

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

/**
 * Genera el plan de cuotas a partir del precio/anticipo/cantidad elegidos al
 * crear el proyecto. Si hay anticipo, la primera cuota es el anticipo y el
 * resto se reparte en partes iguales; si no, todo se reparte parejo.
 */
function buildInstallmentPlan(params: {
  price: number;
  deposit: number;
  count: number;
  startDate: string | null;
}): { number: number; label: string; amount: number; due_date: string }[] {
  const { price, deposit, count, startDate } = params;
  if (price <= 0) return [];

  const base = startDate ? new Date(startDate) : new Date();
  const plan: { number: number; label: string; amount: number; due_date: string }[] = [];
  let n = 1;

  const hasDeposit = deposit > 0 && deposit < price;
  if (hasDeposit) {
    plan.push({ number: n++, label: "Anticipo", amount: deposit, due_date: base.toISOString().slice(0, 10) });
  }

  const remaining = hasDeposit ? price - deposit : price;
  const remainingCount = Math.max(1, hasDeposit ? count - 1 : count);
  const perInstallment = Math.round((remaining / remainingCount) * 100) / 100;

  for (let i = 0; i < remainingCount; i++) {
    const due = new Date(base);
    due.setMonth(due.getMonth() + i + 1);
    const isLast = i === remainingCount - 1;
    // La última cuota absorbe el redondeo para que la suma cierre exacto.
    const amount = isLast ? Math.round((price - plan.reduce((s, p) => s + p.amount, 0)) * 100) / 100 : perInstallment;
    plan.push({
      number: n++,
      label: remainingCount === 1 ? "Saldo" : `Cuota ${i + 1}`,
      amount,
      due_date: due.toISOString().slice(0, 10),
    });
  }

  return plan;
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

  const installmentsCount = Math.max(1, Math.min(12, Number(formData.get("installments_count")) || 1));
  const installments = buildInstallmentPlan({
    price: payload.price,
    deposit: payload.deposit,
    count: installmentsCount,
    startDate: payload.start_date,
  });
  if (installments.length > 0) {
    await supabase.from("project_installments").insert(
      installments.map((i) => ({ ...i, project_id: data.id }))
    );
  }

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

/**
 * Reemplaza el plan de cuotas por uno nuevo (mismo precio/anticipo del
 * proyecto, otra cantidad de cuotas). No toca "payments" ni amount_paid —
 * eso sigue siendo lo realmente cobrado; esto es solo cómo se reparte el
 * saldo restante en cuotas.
 */
export async function regenerateInstallmentsAction(projectId: string, clientId: string, formData: FormData) {
  const supabase = await createClient();

  const { data: project } = await supabase
    .from("projects")
    .select("price,deposit,start_date")
    .eq("id", projectId)
    .single();
  if (!project) return { error: "Proyecto no encontrado." };

  const count = Math.max(1, Math.min(12, Number(formData.get("installments_count")) || 1));
  const deposit = num(formData, "deposit");

  const { error: depositError } = await supabase.from("projects").update({ deposit }).eq("id", projectId);
  if (depositError) return { error: depositError.message };

  const { error: deleteError } = await supabase.from("project_installments").delete().eq("project_id", projectId);
  if (deleteError) return { error: deleteError.message };

  const installments = buildInstallmentPlan({
    price: Number(project.price),
    deposit,
    count,
    startDate: project.start_date,
  });
  if (installments.length > 0) {
    const { error: insertError } = await supabase
      .from("project_installments")
      .insert(installments.map((i) => ({ ...i, project_id: projectId })));
    if (insertError) return { error: insertError.message };
  }

  await logHistory({ clientId, projectId, event: `Plan de cuotas actualizado (${count} cuota${count === 1 ? "" : "s"})` });
  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/clients/${clientId}`);
}

export async function updateProjectStatusAction(
  projectId: string,
  clientId: string,
  status: ProjectStatus
) {
  const supabase = await createClient();
  const { data: project, error } = await supabase
    .from("projects")
    .update({ status })
    .eq("id", projectId)
    .select("name")
    .single();
  if (error) throw new Error(error.message);
  await logHistory({ clientId, projectId, event: `Estado del proyecto: "${status}"` });

  const statusLabel = PROJECT_STATUSES.find((s) => s.value === status)?.label ?? status;
  const clientMemberIds = await getClientMemberUserIds(clientId);
  await notifyUsers({
    userIds: clientMemberIds,
    type: "project_updated",
    title: `Tu proyecto cambió de estado: ${statusLabel}`,
    body: project?.name ?? undefined,
    url: "/portal",
  });

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
