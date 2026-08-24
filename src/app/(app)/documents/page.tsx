import Link from "next/link";
import { getAllDocuments } from "@/lib/queries";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/Empty";
import { DocumentDownloadButton } from "@/components/shared/DocumentDownloadButton";
import { formatDate } from "@/lib/utils";
import { FileText } from "lucide-react";

export default async function DocumentsPage() {
  const documents = await getAllDocuments();

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Documentos" description={`${documents.length} documentos en todos los clientes`} />

      {documents.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Sin documentos"
          description="Subí documentos desde la ficha de cada cliente."
        />
      ) : (
        <div className="space-y-2">
          {documents.map((d) => (
            <Card key={d.id} className="flex items-center justify-between gap-3 p-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-muted">
                  <FileText size={18} />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{d.name}</p>
                  <Link href={`/clients/${d.client_id}`} className="text-xs text-accent hover:underline">
                    {(d.clients as { business_name?: string } | null)?.business_name}
                  </Link>
                  <p className="text-xs text-muted-2">
                    {d.category ?? "Documento"} · {formatDate(d.uploaded_at)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge tone={d.visibility === "client" ? "success" : "muted"}>
                  {d.visibility === "client" ? "Cliente" : "Interno"}
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
