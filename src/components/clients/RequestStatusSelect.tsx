"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Select } from "@/components/ui/Input";
import { updateRequestStatusAction } from "@/actions/requests";
import { REQUEST_STATUSES, type RequestStatus } from "@/lib/types";

export function RequestStatusSelect({
  requestId,
  clientId,
  currentStatus,
}: {
  requestId: string;
  clientId: string;
  currentStatus: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <Select
      defaultValue={currentStatus}
      disabled={pending}
      className="h-8 w-40 text-xs"
      onChange={(e) => {
        const value = e.target.value as RequestStatus;
        startTransition(async () => {
          try {
            await updateRequestStatusAction(requestId, clientId, value);
            toast.success("Estado actualizado.");
          } catch {
            toast.error("No se pudo actualizar.");
          }
        });
      }}
    >
      {REQUEST_STATUSES.map((s) => (
        <option key={s.value} value={s.value}>
          {s.label}
        </option>
      ))}
    </Select>
  );
}
