"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logHistory } from "@/lib/history";
import type { RenewalKind, RenewalStatus } from "@/lib/types";

function str(fd: FormData, key: string): string | null {
  const v = fd.get(key);
  const s = typeof v === "string" ? v.trim() : "";
  return s.length ? s : null;
}
function num(fd: FormData, key: string): number | null {
  const v = fd.get(key);
  if (v === null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
function bool(fd: FormData, key: string): boolean {
  return fd.get(key) === "on" || fd.get(key) === "true";
}

export async function createRenewalAction(clientId: string, formData: FormData) {
  const supabase = await createClient();
  const payload = {
    client_id: clientId,
    project_id: str(formData, "project_id"),
    kind: (str(formData, "kind") ?? "otro") as RenewalKind,
    service_name: str(formData, "service_name") ?? "Servicio",
    due_date: str(formData, "due_date") ?? new Date().toISOString().slice(0, 10),
    price: num(formData, "price"),
    status: "vigente" as RenewalStatus,
    auto_renew: bool(formData, "auto_renew"),
    notes: str(formData, "notes"),
  };

  const { error } = await supabase.from("renewals").insert(payload);
  if (error) return { error: error.message };

  await logHistory({ clientId, event: `Renovación "${payload.service_name}" registrada` });
  revalidatePath("/renewals");
  revalidatePath(`/clients/${clientId}`);
}

export async function markRenewalRenewedAction(id: string, clientId: string, newDueDate: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("renewals")
    .update({
      status: "renovado",
      due_date: newDueDate,
      workflow_status: "renewed",
      renewed_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
  await logHistory({ clientId, event: "Renovación marcada como renovada" });
  revalidatePath("/renewals");
  revalidatePath(`/clients/${clientId}`);
}

export async function markRenewalNotifiedAction(id: string, clientId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("renewals")
    .update({ workflow_status: "client_notified", notified_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
  await logHistory({ clientId, event: "Cliente avisado de renovación próxima" });
  revalidatePath("/renewals");
  revalidatePath(`/clients/${clientId}`);
}

export async function confirmRenewalAction(id: string, clientId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("renewals")
    .update({ workflow_status: "confirmed", confirmed_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
  await logHistory({ clientId, event: "Renovación confirmada por el cliente" });
  revalidatePath("/renewals");
  revalidatePath(`/clients/${clientId}`);
}

export async function markRenewalNotRenewedAction(id: string, clientId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("renewals").update({ workflow_status: "not_renewed" }).eq("id", id);
  if (error) throw new Error(error.message);
  await logHistory({ clientId, event: "Renovación marcada como no renovada" });
  revalidatePath("/renewals");
  revalidatePath(`/clients/${clientId}`);
}

export async function deleteRenewalAction(id: string, clientId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("renewals").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/renewals");
  revalidatePath(`/clients/${clientId}`);
}
