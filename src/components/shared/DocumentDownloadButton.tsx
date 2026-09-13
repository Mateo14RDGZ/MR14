"use client";

import { useTransition } from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { getDocumentUrlAction } from "@/actions/documents";

export function DocumentDownloadButton({ storagePath }: { storagePath: string }) {
  const [pending, startTransition] = useTransition();

  function onClick() {
    const viewer = window.open("about:blank", "_blank");
    if (viewer) viewer.opener = null;
    startTransition(async () => {
      try {
        const url = await getDocumentUrlAction(storagePath);
        if (viewer) viewer.location.replace(url);
        else window.location.assign(url);
      } catch {
        viewer?.close();
        toast.error("No se pudo abrir el documento.");
      }
    });
  }

  return (
    <Button size="sm" variant="secondary" onClick={onClick} disabled={pending}>
      <Download size={14} /> {pending ? "Abriendo…" : "Descargar"}
    </Button>
  );
}
