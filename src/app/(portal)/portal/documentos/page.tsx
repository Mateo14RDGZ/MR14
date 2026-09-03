import { getPortalContext } from "@/lib/portal";
import { getPortalDocuments } from "@/lib/queries";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/Empty";
import { FileText, CheckCircle2 } from "lucide-react";
import { DocumentDownloadButton } from "@/components/shared/DocumentDownloadButton";
import { formatDate } from "@/lib/utils";

// El cliente no necesita ver el ciclo de vida administrativo del documento
// (draft/sent/archived) — solo le importa si ya está firmado o si puede
// descargarlo.
const CLIENT_DOC_LABEL: Record<string, { label: string; tone: "muted" | "success" }> = {
  draft: { label: "Disponible", tone: "muted" },
  sent: { label: "Disponible", tone: "muted" },
  signed: { label: "Firmado", tone: "success" },
  archived: { label: "Archivado", tone: "muted" },
};

// Mismo criterio: la categoría interna (snake_case, para filtros del admin)
// no tiene por qué mostrarse literal — "comprobante_anticipo" no dice nada.
const CLIENT_CATEGORY_LABEL: Record<string, string> = {
  contrato: "Contrato",
  comprobante_anticipo: "Comprobante de anticipo",
  comprobante_saldo: "Comprobante de saldo",
  guia_trabajo: "Guía de trabajo",
  factura: "Factura",
  doc_tecnica: "Documento técnico",
  credenciales: "Accesos",
  entrega_final: "Entrega final",
  otro: "Documento",
};

export default async function PortalDocumentsPage() {
  const { activeClientId } = await getPortalContext();
  const documents = await getPortalDocuments(activeClientId);

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="text-page-title">Documentos</h1>
        <p className="mt-1 text-base leading-relaxed text-muted">Tus contratos, comprobantes y otros archivos importantes están guardados acá.</p>
      </div>

      {documents.length === 0 ? (
        <EmptyState icon={FileText} title="Todavía no hay documentos disponibles." />
      ) : (
        <div className="space-y-2">
          {documents.map((d) => {
            const isSignedContract = d.category === "contrato" && (d.signed_by_mr14 || d.signed_by_client);
            const status = CLIENT_DOC_LABEL[d.status] ?? CLIENT_DOC_LABEL.sent;
            return (
              <Card key={d.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-muted">
                    <FileText size={18} />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{d.name}</p>
                    <p className="text-xs text-muted-2">
                      {(d.category && CLIENT_CATEGORY_LABEL[d.category]) || "Documento"} · {formatDate(d.uploaded_at)}
                    </p>
                    {isSignedContract && (
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
                  {!isSignedContract && <Badge tone={status.tone}>{status.label}</Badge>}
                  <DocumentDownloadButton storagePath={d.storage_path} />
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
