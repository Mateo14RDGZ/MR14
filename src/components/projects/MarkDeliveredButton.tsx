"use client";

import { ConfirmButton } from "@/components/ui/ConfirmButton";
import { markProjectDeliveredAction } from "@/actions/checklist";
import { CheckCircle2 } from "lucide-react";

export function MarkDeliveredButton({ projectId, clientId }: { projectId: string; clientId: string }) {
  return (
    <ConfirmButton
      action={() => markProjectDeliveredAction(projectId, clientId)}
      variant="secondary"
      confirmVariant="primary"
      label={
        <>
          <CheckCircle2 size={14} /> Marcar entregado
        </>
      }
      confirmTitle="¿Marcar proyecto como entregado?"
      confirmDescription="El proyecto pasará al 100%, se registrará la fecha de entrega y el cliente verá el cambio en su portal."
    />
  );
}
