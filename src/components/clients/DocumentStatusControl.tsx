"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Input";
import { updateDocumentStatusAction, toggleDocumentSignatureAction } from "@/actions/documents";
import { DOCUMENT_STATUSES, type DocumentStatus } from "@/lib/types";

const STATUS_TONE: Record<DocumentStatus, "muted" | "warning" | "success" | "accent"> = {
  draft: "muted",
  sent: "accent",
  signed: "success",
  archived: "muted",
};

export function DocumentStatusControl({
  documentId,
  clientId,
  status,
  isContract,
  signedByMr14,
  signedByClient,
}: {
  documentId: string;
  clientId: string;
  status: DocumentStatus;
  isContract: boolean;
  signedByMr14: boolean;
  signedByClient: boolean;
}) {
  const [pending, startTransition] = useTransition();

  function changeStatus(next: string) {
    startTransition(async () => {
      try {
        await updateDocumentStatusAction(documentId, clientId, next);
        toast.success("Documento actualizado.");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "No se pudo actualizar el estado.");
      }
    });
  }

  function toggleSignature(field: "signed_by_mr14" | "signed_by_client", value: boolean) {
    startTransition(async () => {
      try {
        await toggleDocumentSignatureAction(documentId, clientId, field, value);
        toast.success("Documento actualizado.");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "No se pudo actualizar la firma.");
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <Select
        value={status}
        disabled={pending}
        onChange={(e) => changeStatus(e.target.value)}
        className="h-8 w-auto py-0 text-xs"
      >
        {DOCUMENT_STATUSES.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </Select>
      {isContract && (
        <div className="flex gap-1.5">
          <button
            type="button"
            disabled={pending}
            onClick={() => toggleSignature("signed_by_mr14", !signedByMr14)}
            className="inline-block"
          >
            <Badge tone={signedByMr14 ? "success" : "muted"}>Firmado MR14</Badge>
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => toggleSignature("signed_by_client", !signedByClient)}
            className="inline-block"
          >
            <Badge tone={signedByClient ? "success" : "muted"}>Firmado cliente</Badge>
          </button>
        </div>
      )}
    </div>
  );
}

export { STATUS_TONE as DOCUMENT_STATUS_TONE };
