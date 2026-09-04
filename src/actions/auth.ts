"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { firstName } from "@/lib/utils";

export async function signIn(formData: FormData) {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const requestedNext = String(formData.get("next") || "");

  if (!email || !password) {
    return { error: "Ingresá tu email y contraseña." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
    return { error: "Credenciales inválidas." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .single();

  const defaultNext = profile?.role === "admin" ? "/dashboard" : "/portal";
  const dest = requestedNext || defaultNext;

  // Solo el cliente tiene animación de bienvenida (es su logo, no tiene
  // sentido para el login del admin). Si todavía no cargó un logo, se salta
  // directo al destino — no hay nada que animar con un solo isotipo.
  if (profile?.role !== "admin") {
    const { data: membership } = await supabase
      .from("client_members")
      .select("name, client_id, clients(logo_url)")
      .eq("user_id", data.user.id)
      .eq("status", "active")
      .limit(1)
      .maybeSingle();

    const client = (membership?.clients ?? null) as unknown as { logo_url: string | null } | null;
    if (client?.logo_url && membership?.client_id) {
      const params = new URLSearchParams({
        dest,
        logo: client.logo_url,
        clientId: membership.client_id,
        // Nombre real de la persona que inició sesión (solo el primer
        // nombre, no el apellido), no el del negocio.
        name: membership?.name ? firstName(membership.name) : "",
      });
      redirect(`/bienvenida?${params.toString()}`);
    }
  }

  redirect(dest);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
