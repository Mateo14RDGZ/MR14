"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logHistory } from "@/lib/history";
import type { ClientStatus } from "@/lib/types";

function str(fd: FormData, key: string): string | null {
  const v = fd.get(key);
  const s = typeof v === "string" ? v.trim() : "";
  return s.length ? s : null;
}

function buildClientPayload(formData: FormData) {
  const social_links: Record<string, string> = {};
  for (const key of ["instagram", "facebook", "tiktok", "linkedin", "x"]) {
    const v = str(formData, `social_${key}`);
    if (v) social_links[key] = v;
  }

  return {
    business_name: str(formData, "business_name") ?? "Sin nombre",
    contact_name: str(formData, "contact_name"),
    ci: str(formData, "ci"),
    rut: str(formData, "rut"),
    phone: str(formData, "phone"),
    whatsapp: str(formData, "whatsapp"),
    email: str(formData, "email"),
    address: str(formData, "address"),
    city: str(formData, "city"),
    state: str(formData, "state"),
    country: str(formData, "country") ?? "Uruguay",
    social_links,
    website: str(formData, "website"),
    notes: str(formData, "notes"),
    status: (str(formData, "status") ?? "prospecto") as ClientStatus,
    start_date: str(formData, "start_date"),
    delivery_date: str(formData, "delivery_date"),
  };
}

export async function createClientAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const payload = buildClientPayload(formData);
  const { data, error } = await supabase
    .from("clients")
    .insert({ ...payload, created_by: user?.id ?? null })
    .select("id")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "No se pudo crear el cliente." };
  }

  await logHistory({ clientId: data.id, event: "Cliente creado" });
  revalidatePath("/clients");
  redirect(`/clients/${data.id}`);
}

export async function updateClientAction(clientId: string, formData: FormData) {
  const supabase = await createClient();
  const payload = buildClientPayload(formData);

  const { data: prev } = await supabase
    .from("clients")
    .select("status")
    .eq("id", clientId)
    .single();

  const { error } = await supabase.from("clients").update(payload).eq("id", clientId);
  if (error) return { error: error.message };

  if (prev && prev.status !== payload.status) {
    await logHistory({
      clientId,
      event: `Estado cambiado a "${payload.status}"`,
    });
  } else {
    await logHistory({ clientId, event: "Ficha del cliente actualizada" });
  }

  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/clients");
  redirect(`/clients/${clientId}`);
}

export async function updateClientStatusAction(clientId: string, status: ClientStatus) {
  const supabase = await createClient();
  const { error } = await supabase.from("clients").update({ status }).eq("id", clientId);
  if (error) throw new Error(error.message);
  await logHistory({ clientId, event: `Estado cambiado a "${status}"` });
  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/clients");
  revalidatePath("/dashboard");
}

export async function deleteClientAction(clientId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("clients").delete().eq("id", clientId);
  if (error) throw new Error(error.message);
  revalidatePath("/clients");
  redirect("/clients");
}
