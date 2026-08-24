"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
import { Input } from "@/components/ui/Input";
import {
  markRenewalRenewedAction,
  markRenewalNotifiedAction,
  confirmRenewalAction,
  markRenewalNotRenewedAction,
  deleteRenewalAction,
} from "@/actions/renewals";
import type { RenewalWorkflowStatus } from "@/lib/types";
import { Trash2, RefreshCw, BellRing, CheckCheck, XCircle } from "lucide-react";

export function RenewalActions({
  id,
  clientId,
  workflowStatus,
}: {
  id: string;
  clientId: string;
  workflowStatus: RenewalWorkflowStatus;
}) {
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();

  if (editing) {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const date = new FormData(e.currentTarget).get("date") as string;
          if (!date) return;
          startTransition(async () => {
            await markRenewalRenewedAction(id, clientId, date);
            toast.success("Renovación registrada.");
            setEditing(false);
          });
        }}
        className="flex items-center gap-2"
      >
        <Input type="date" name="date" required className="h-8 w-36 text-xs" />
        <Button type="submit" size="sm" disabled={pending}>
          OK
        </Button>
      </form>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {workflowStatus === "pending" && (
        <Button
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={() => startTransition(async () => { await markRenewalNotifiedAction(id, clientId); toast.success("Cliente avisado."); })}
        >
          <BellRing size={13} /> Avisar cliente
        </Button>
      )}
      {workflowStatus === "client_notified" && (
        <Button
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={() => startTransition(async () => { await confirmRenewalAction(id, clientId); toast.success("Renovación confirmada."); })}
        >
          <CheckCheck size={13} /> Confirmar
        </Button>
      )}
      <Button size="sm" variant="secondary" onClick={() => setEditing(true)}>
        <RefreshCw size={13} /> Renovar
      </Button>
      {workflowStatus !== "renewed" && workflowStatus !== "not_renewed" && (
        <Button
          size="sm"
          variant="ghost"
          disabled={pending}
          onClick={() => startTransition(async () => { await markRenewalNotRenewedAction(id, clientId); toast.success("Marcada como no renovada."); })}
        >
          <XCircle size={13} /> No renovar
        </Button>
      )}
      <ConfirmButton
        action={() => deleteRenewalAction(id, clientId)}
        label={<Trash2 size={14} />}
        variant="ghost"
        size="icon"
        confirmTitle="¿Eliminar renovación?"
      />
    </div>
  );
}
