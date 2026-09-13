"use client";

import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { uploadClientLogoAction } from "@/actions/clients";
import { Avatar } from "@/components/ui/Avatar";
import { Pencil } from "lucide-react";
import { ClientLogo } from "@/components/ui/ClientLogo";
import { prepareClientLogo } from "@/lib/client-image";

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

    startTransition(async () => {
      try {
        const prepared = await prepareClientLogo(file);
        const formData = new FormData();
        formData.set("file", prepared);
        const result = await uploadClientLogoAction(clientId, formData);
        if (result?.error) toast.error(result.error);
        else {
          toast.success("Logo actualizado.");
          if (result?.logo_url) setPreview(result.logo_url);
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "No pudimos subir el logo. Intentá nuevamente.");
      }
    });
  }

  return (
    <button
      type="button"
      onClick={() => inputRef.current?.click()}
      disabled={pending}
      title={pending ? "Preparando logo" : "Cambiar logo"}
      aria-label={pending ? "Preparando logo" : `Cambiar logo de ${businessName}`}
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
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={onChange} />
    </button>
  );
}
