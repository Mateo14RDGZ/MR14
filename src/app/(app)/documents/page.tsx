import { getAllDocuments } from "@/lib/queries";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/Empty";
import { DocumentDirectory } from "@/components/documents/DocumentDirectory";
import { FileText } from "lucide-react";

export default async function DocumentsPage() {
  const documents = await getAllDocuments();
  const documentLabel = documents.length === 1 ? "1 documento" : `${documents.length} documentos`;

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Documentos" description={`${documentLabel} entre todos los clientes`} />

      {documents.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Sin documentos"
          description="Subí documentos desde la ficha de cada cliente."
        />
      ) : (
        <DocumentDirectory
          documents={documents.map((document) => ({
            id: document.id,
            name: document.name,
            client_id: document.client_id,
            clientName: (document.clients as { business_name?: string } | null)?.business_name ?? "Cliente",
            category: document.category,
            visibility: document.visibility,
            storage_path: document.storage_path,
            uploaded_at: document.uploaded_at,
          }))}
        />
      )}
    </div>
  );
}
