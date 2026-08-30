"use client";

import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { uploadClientLogoAction } from "@/actions/clients";
import { Avatar } from "@/components/ui/Avatar";
import { Pencil } from "lucide-react";
import { ClientLogo } from "@/components/ui/ClientLogo";

/**
 * Avatar del cliente: muestra el logo si ya lo subieron, o las iniciales
 * como siempre. Tocar/clickear abre el selector de archivos y sube al
 * toque — sin diálogo intermedio, es una sola acción.
 */
export function ClientLogoUpload({
  clientId,
  businessName,
  logoUrl,
}: {
  clientId: string;
  businessName: string;
  logoUrl: string | null;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(logoUrl);
  const [pending, startTransition] = useTransition();

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    const formData = new FormData();
    formData.set("file", file);
    startTransition(async () => {
      const result = await uploadClientLogoAction(clientId, formData);
      if (result?.error) toast.error(result.error);
      else {
        toast.success("Logo actualizado.");
        if (result?.logo_url) setPreview(result.logo_url);
      }
    });
  }

  return (
    <button
      type="button"
      onClick={() => inputRef.current?.click()}
      disabled={pending}
      title="Cambiar logo"
      className="group relative shrink-0 rounded-full disabled:opacity-60"
    >
      {preview ? (
        <ClientLogo
          src={preview}
          size={56}
          className="h-14 w-14 border border-border"
        />
      ) : (
        <Avatar name={businessName} size="lg" />
      )}
      <span className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full border border-border bg-surface-2 text-muted-2 transition-colors group-hover:text-foreground">
        <Pencil size={10} />
      </span>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onChange} />
    </button>
  );
}
