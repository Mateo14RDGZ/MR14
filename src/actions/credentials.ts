"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { encryptSecret, decryptSecret } from "@/lib/crypto";
import { logHistory } from "@/lib/history";
import { notifyUsers, getClientMemberUserIds } from "@/lib/notifications";
import type { CredentialService, CredentialVisibility } from "@/lib/types";

function str(fd: FormData, key: string): string | null {
  const v = fd.get(key);
  const s = typeof v === "string" ? v.trim() : "";
  return s.length ? s : null;
}

export async function createCredentialAction(
  clientId: string,
  projectId: string | null,
  formData: FormData
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const secret = String(formData.get("secret") || "");
  if (!secret) return { error: "La contraseña / secreto es obligatorio." };

  const visibility = (str(formData, "visibility") ?? "internal") as CredentialVisibility;
  const visibleUntilRaw = str(formData, "visible_until");

  const payload = {
    client_id: clientId,
    project_id: projectId,
    service: (str(formData, "service") ?? "otro") as CredentialService,
    service_label: str(formData, "service_label"),
    username: str(formData, "username"),
    secret_encrypted: encryptSecret(secret),
    access_url: str(formData, "access_url"),
    notes: str(formData, "notes"),
    visibility,
    visible_until: visibility === "temporary" && visibleUntilRaw ? new Date(visibleUntilRaw).toISOString() : null,
    created_by: user?.id ?? null,
  };

  const { error } = await supabase.from("credentials").insert(payload);
  if (error) return { error: error.message };

  await logHistory({
    clientId,
    projectId,
    event: `Credencial de ${payload.service_label || payload.service} agregada`,
  });
  revalidatePath(`/clients/${clientId}`);
}

export async function updateCredentialAction(id: string, clientId: string, formData: FormData) {
  const supabase = await createClient();
  const secret = String(formData.get("secret") || "");

  const visibility = (str(formData, "visibility") ?? "internal") as CredentialVisibility;
  const visibleUntilRaw = str(formData, "visible_until");

  const payload: Record<string, unknown> = {
    service: (str(formData, "service") ?? "otro") as CredentialService,
    service_label: str(formData, "service_label"),
    username: str(formData, "username"),
    access_url: str(formData, "access_url"),
    notes: str(formData, "notes"),
    visibility,
    visible_until: visibility === "temporary" && visibleUntilRaw ? new Date(visibleUntilRaw).toISOString() : null,
    last_updated: new Date().toISOString(),
  };
  if (secret) payload.secret_encrypted = encryptSecret(secret);

  const { error } = await supabase.from("credentials").update(payload).eq("id", id);
  if (error) return { error: error.message };

  await logHistory({ clientId, event: "Credencial actualizada" });
  revalidatePath(`/clients/${clientId}`);
}

export async function deleteCredentialAction(id: string, clientId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("credentials").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/clients/${clientId}`);
}

/** Descifra un secreto puntual bajo demanda (click en "Mostrar contraseña"). */
export async function revealCredentialAction(id: string): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("credentials")
    .select("secret_encrypted")
    .eq("id", id)
    .single();

  if (error || !data) throw new Error("Credencial no encontrada.");

  await supabase
    .from("credential_access_log")
    .insert({ credential_id: id, user_id: user?.id ?? null, action: "view" });

  return decryptSecret(data.secret_encrypted);
}

/** Marca la credencial como entregada al cliente: la hace visible y deja registro de quién y cuándo. */
export async function deliverCredentialAction(id: string, clientId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("credentials")
    .update({ visibility: "delivered", delivered_at: new Date().toISOString(), delivered_by: user?.id ?? null })
    .eq("id", id)
    .select("service_label,service,project_id")
    .single();
  if (error) return { error: error.message };

  const label = data?.service_label || data?.service || "un acceso";
  await logHistory({
    clientId,
    projectId: data?.project_id ?? null,
    event: `Acceso de ${label} entregado al cliente`,
  });

  const clientMemberIds = await getClientMemberUserIds(clientId);
  await notifyUsers({
    userIds: clientMemberIds,
    type: "credential_delivered",
    title: "Nuevo acceso disponible",
    body: `${label} está guardado de forma segura en Mis accesos.`,
    url: "/portal/credenciales",
  });

  revalidatePath(`/clients/${clientId}`);
}

/** Registra que un usuario copió (sin ver) una credencial ya descifrada en pantalla. */
export async function logCredentialCopyAction(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  await supabase
    .from("credential_access_log")
    .insert({ credential_id: id, user_id: user?.id ?? null, action: "copy" });
}
