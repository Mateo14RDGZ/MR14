import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/Empty";
import { UploadDocumentDialog } from "@/components/clients/UploadDocumentDialog";
import { DocumentDownloadButton } from "@/components/shared/DocumentDownloadButton";
import { DeleteDocumentButton } from "@/components/clients/DeleteDocumentButton";
import { DocumentStatusControl } from "@/components/clients/DocumentStatusControl";
import type { DocumentRow } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { FileText } from "lucide-react";

export function DocumentsTab({
  clientId,
  documents,
  projects,
}: {
  clientId: string;
  documents: DocumentRow[];
  projects: { id: string; name: string }[];
}) {
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <UploadDocumentDialog clientId={clientId} projects={projects} />
      </div>
      {documents.length === 0 ? (
        <EmptyState icon={FileText} title="Sin documentos subidos" />
      ) : (
        <div className="space-y-2">
          {documents.map((d) => (
            <Card key={d.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-muted">
                  <FileText size={18} />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{d.name}</p>
                  <p className="text-xs text-muted-2">
                    {d.category ?? "Documento"} · {formatDate(d.uploaded_at)}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Badge tone={d.visibility === "client" ? "success" : "muted"}>
                  {d.visibility === "client" ? "Cliente" : "Interno"}
                </Badge>
                <DocumentStatusControl
                  documentId={d.id}
                  clientId={clientId}
                  status={d.status}
                  isContract={d.category === "contrato"}
                  signedByMr14={d.signed_by_mr14}
                  signedByClient={d.signed_by_client}
                />
                <DocumentDownloadButton storagePath={d.storage_path} />
                <DeleteDocumentButton id={d.id} storagePath={d.storage_path} clientId={clientId} />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
