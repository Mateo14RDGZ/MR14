"use client";

import { useTransition } from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { getDocumentUrlAction } from "@/actions/documents";

export function DocumentDownloadButton({ storagePath }: { storagePath: string }) {
  const [pending, startTransition] = useTransition();

  function onClick() {
    startTransition(async () => {
      try {
        const url = await getDocumentUrlAction(storagePath);
        window.open(url, "_blank", "noopener,noreferrer");
      } catch {
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
