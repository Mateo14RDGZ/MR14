"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logHistory } from "@/lib/history";
import { slugify } from "@/lib/utils";

const BUCKET = "documents";

export async function uploadDocumentAction(
  clientId: string,
  projectId: string | null,
  formData: FormData
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const file = formData.get("file") as File | null;
  const category = String(formData.get("category") || "") || null;
  const visibility = (String(formData.get("visibility") || "internal")) as "internal" | "client";
  const tagsRaw = String(formData.get("tags") || "");
  const tags = tagsRaw
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  if (!file || file.size === 0) return { error: "Seleccioná un archivo." };

  const path = `${clientId}/${Date.now()}-${slugify(file.name)}`;
  const arrayBuffer = await file.arrayBuffer();

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, arrayBuffer, { contentType: file.type || "application/octet-stream" });

  if (uploadError) return { error: uploadError.message };

  const { error } = await supabase.from("documents").insert({
    client_id: clientId,
    project_id: projectId,
    name: file.name,
    storage_path: path,
    mime_type: file.type || null,
    size_bytes: file.size,
    tags,
    category,
    visibility,
    uploaded_by: user?.id ?? null,
  });

  if (error) return { error: error.message };

  await logHistory({ clientId, projectId, event: `Documento "${file.name}" subido` });
  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/documents");
}

export async function getDocumentUrlAction(storagePath: string): Promise<string> {
  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, 60 * 10);
  if (error || !data) throw new Error("No se pudo generar el enlace del documento.");
  return data.signedUrl;
}

export async function renameDocumentAction(id: string, clientId: string, newName: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("documents").update({ name: newName }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/documents");
}

export async function deleteDocumentAction(id: string, storagePath: string, clientId: string) {
  const supabase = await createClient();
  await supabase.storage.from(BUCKET).remove([storagePath]);
  const { error } = await supabase.from("documents").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/documents");
}
