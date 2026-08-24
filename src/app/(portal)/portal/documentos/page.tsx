import { getPortalContext } from "@/lib/portal";
import { getPortalDocuments } from "@/lib/queries";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/Empty";
import { FileText, CheckCircle2 } from "lucide-react";
import { DocumentDownloadButton } from "@/components/shared/DocumentDownloadButton";
import { DOCUMENT_STATUSES } from "@/lib/types";
import { formatDate } from "@/lib/utils";

const STATUS_TONE: Record<string, "muted" | "warning" | "success" | "accent"> = {
  draft: "muted",
  sent: "accent",
  signed: "success",
  archived: "muted",
};

export default async function PortalDocumentsPage() {
  const { activeClientId } = await getPortalContext();
  const documents = await getPortalDocuments(activeClientId);

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="text-page-title">Documentos</h1>
        <p className="mt-1 text-sm text-muted">Contratos, comprobantes y documentación compartida por MR14.</p>
      </div>

      {documents.length === 0 ? (
        <EmptyState icon={FileText} title="Todavía no hay documentos compartidos" />
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
                  <p className="text-xs text-muted-2">{d.category ?? "Documento"} · {formatDate(d.uploaded_at)}</p>
                  {d.category === "contrato" && (d.signed_by_mr14 || d.signed_by_client) && (
                    <p className="mt-1 flex items-center gap-1 text-xs text-success">
                      <CheckCircle2 size={12} />
                      {d.signed_by_mr14 && d.signed_by_client
                        ? "Firmado por MR14 y por vos"
                        : d.signed_by_mr14
                          ? "Firmado por MR14"
                          : "Firmado por vos"}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Badge tone={STATUS_TONE[d.status] ?? "muted"}>
                  {DOCUMENT_STATUSES.find((s) => s.value === d.status)?.label ?? d.status}
                </Badge>
                <DocumentDownloadButton storagePath={d.storage_path} />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
