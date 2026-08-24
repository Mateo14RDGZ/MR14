"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { markProjectDeliveredAction } from "@/actions/checklist";
import { CheckCircle2 } from "lucide-react";

export function MarkDeliveredButton({ projectId, clientId }: { projectId: string; clientId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      size="sm"
      variant="secondary"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          try {
            await markProjectDeliveredAction(projectId, clientId);
            toast.success("Proyecto marcado como entregado.");
          } catch {
            toast.error("No se pudo actualizar el proyecto.");
          }
        })
      }
    >
      <CheckCircle2 size={14} /> Marcar entregado
    </Button>
  );
}
