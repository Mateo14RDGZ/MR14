"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logHistory } from "@/lib/history";
import type { HostingPlatform, DbProvider } from "@/lib/types";

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

async function revalidateProject(projectId: string, clientId: string) {
  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/renewals");
  revalidatePath("/dashboard");
}

// ---------------- DOMAINS ----------------
export async function upsertDomainAction(
  projectId: string,
  clientId: string,
  formData: FormData,
  id?: string
) {
  const supabase = await createClient();
  const payload = {
    project_id: projectId,
    domain: str(formData, "domain") ?? "",
    registrar: str(formData, "registrar"),
    owner_name: str(formData, "owner_name"),
    purchase_date: str(formData, "purchase_date"),
    expiry_date: str(formData, "expiry_date"),
    renewal_price: num(formData, "renewal_price"),
    auto_renew: bool(formData, "auto_renew"),
    nameservers: str(formData, "nameservers"),
    dns_notes: str(formData, "dns_notes"),
    status: str(formData, "status") ?? "activo",
  };

  const { error } = id
    ? await supabase.from("domains").update(payload).eq("id", id)
    : await supabase.from("domains").insert(payload);

  if (error) return { error: error.message };

  if (!id && payload.expiry_date) {
    await supabase.from("renewals").insert({
      client_id: clientId,
      project_id: projectId,
      kind: "dominio",
      service_name: `Dominio ${payload.domain}`,
      due_date: payload.expiry_date,
      price: payload.renewal_price,
      auto_renew: payload.auto_renew,
      status: "vigente",
    });
  }

  await logHistory({
    clientId,
    projectId,
    event: id ? `Dominio ${payload.domain} actualizado` : `Dominio ${payload.domain} registrado`,
  });
  await revalidateProject(projectId, clientId);
}

export async function deleteDomainAction(id: string, projectId: string, clientId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("domains").delete().eq("id", id);
  if (error) throw new Error(error.message);
  await revalidateProject(projectId, clientId);
}

// ---------------- HOSTING ----------------
export async function upsertHostingAction(
  projectId: string,
  clientId: string,
  formData: FormData,
  id?: string
) {
  const supabase = await createClient();
  const payload = {
    project_id: projectId,
    platform: (str(formData, "platform") ?? "vercel") as HostingPlatform,
    project_name: str(formData, "project_name"),
    production_url: str(formData, "production_url"),
    preview_url: str(formData, "preview_url"),
    account: str(formData, "account"),
    team: str(formData, "team"),
    created_date: str(formData, "created_date"),
    plan: str(formData, "plan"),
    notes: str(formData, "notes"),
  };

  const { error } = id
    ? await supabase.from("hosting").update(payload).eq("id", id)
    : await supabase.from("hosting").insert(payload);

  if (error) return { error: error.message };
  await logHistory({ clientId, projectId, event: "Hosting / deploy actualizado" });
  await revalidateProject(projectId, clientId);
}

export async function deleteHostingAction(id: string, projectId: string, clientId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("hosting").delete().eq("id", id);
  if (error) throw new Error(error.message);
  await revalidateProject(projectId, clientId);
}

// ---------------- REPOSITORIES ----------------
export async function upsertRepositoryAction(
  projectId: string,
  clientId: string,
  formData: FormData,
  id?: string
) {
  const supabase = await createClient();
  const payload = {
    project_id: projectId,
    name: str(formData, "name"),
    organization: str(formData, "organization"),
    main_branch: str(formData, "main_branch") ?? "main",
    url: str(formData, "url"),
    is_private: bool(formData, "is_private"),
    created_date: str(formData, "created_date"),
  };

  const { error } = id
    ? await supabase.from("repositories").update(payload).eq("id", id)
    : await supabase.from("repositories").insert(payload);

  if (error) return { error: error.message };
  await logHistory({ clientId, projectId, event: "Repositorio actualizado" });
  await revalidateProject(projectId, clientId);
}

export async function deleteRepositoryAction(id: string, projectId: string, clientId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("repositories").delete().eq("id", id);
  if (error) throw new Error(error.message);
  await revalidateProject(projectId, clientId);
}

// ---------------- DATABASES ----------------
export async function upsertDatabaseAction(
  projectId: string,
  clientId: string,
  formData: FormData,
  id?: string
) {
  const supabase = await createClient();
  const payload = {
    project_id: projectId,
    provider: (str(formData, "provider") ?? "supabase") as DbProvider,
    project_name: str(formData, "project_name"),
    url: str(formData, "url"),
    region: str(formData, "region"),
    notes: str(formData, "notes"),
  };

  const { error } = id
    ? await supabase.from("project_databases").update(payload).eq("id", id)
    : await supabase.from("project_databases").insert(payload);

  if (error) return { error: error.message };
  await logHistory({ clientId, projectId, event: "Base de datos actualizada" });
  await revalidateProject(projectId, clientId);
}

export async function deleteDatabaseAction(id: string, projectId: string, clientId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("project_databases").delete().eq("id", id);
  if (error) throw new Error(error.message);
  await revalidateProject(projectId, clientId);
}
