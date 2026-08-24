"use client";

import { ConfirmButton } from "@/components/ui/ConfirmButton";
import { deletePaymentAction } from "@/actions/payments";
import { Trash2 } from "lucide-react";

export function DeletePaymentButton({
  id,
  clientId,
  projectId,
}: {
  id: string;
  clientId: string;
  projectId: string;
}) {
  return (
    <ConfirmButton
      action={() => deletePaymentAction(id, clientId, projectId)}
      label={<Trash2 size={14} />}
      variant="ghost"
      size="icon"
      confirmTitle="¿Eliminar pago?"
      confirmDescription="El saldo del proyecto se recalculará automáticamente."
    />
  );
}
