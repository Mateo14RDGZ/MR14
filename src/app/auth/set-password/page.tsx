"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { Input, Label, Field } from "@/components/ui/Input";
import { activateMembershipAction } from "@/actions/members";

export default function SetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setReady(Boolean(data.session));
      if (!data.session) setError("El enlace de invitación no es válido o expiró.");
    });
  }, [supabase]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    const password = String(formData.get("password") || "");
    const confirm = String(formData.get("confirm") || "");

    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (password !== confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setPending(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setError(updateError.message);
      setPending(false);
      return;
    }

    await activateMembershipAction();

    const { data: userData } = await supabase.auth.getUser();
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userData.user?.id)
      .single();

    router.push(profile?.role === "admin" ? "/dashboard" : "/portal");
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm animate-fade-in">
        <div className="mb-8 flex flex-col items-center gap-3">
          <Logo />
          <p className="text-center text-sm text-muted">Activá tu acceso al portal de clientes</p>
        </div>

        <form onSubmit={onSubmit} className="rounded-xl border border-border bg-surface p-6">
          {error && (
            <div className="mb-4 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger">
              {error}
            </div>
          )}
          <Field>
            <Label>Nueva contraseña</Label>
            <Input type="password" name="password" required minLength={8} disabled={!ready} />
          </Field>
          <Field className="mb-6">
            <Label>Confirmar contraseña</Label>
            <Input type="password" name="confirm" required minLength={8} disabled={!ready} />
          </Field>
          <Button type="submit" className="w-full" size="lg" disabled={!ready || pending}>
            {pending ? "Guardando…" : "Activar cuenta"}
          </Button>
        </form>
      </div>
    </div>
  );
}
