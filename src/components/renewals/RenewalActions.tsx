"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
import { Input } from "@/components/ui/Input";
import { markRenewalRenewedAction, deleteRenewalAction } from "@/actions/renewals";
import { Trash2, RefreshCw } from "lucide-react";

export function RenewalActions({ id, clientId }: { id: string; clientId: string }) {
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
    <div className="flex items-center gap-2">
      <Button size="sm" variant="secondary" onClick={() => setEditing(true)}>
        <RefreshCw size={13} /> Renovar
      </Button>
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
