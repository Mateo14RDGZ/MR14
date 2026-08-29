"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { FileText, Search } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/Empty";
import { Input, Select } from "@/components/ui/Input";
import { DocumentDownloadButton } from "@/components/shared/DocumentDownloadButton";
import { formatDate } from "@/lib/utils";

export interface DocumentDirectoryItem {
  id: string;
  name: string;
  client_id: string;
  clientName: string;
  category: string | null;
  visibility: string;
  storage_path: string;
  uploaded_at: string;
}

export function DocumentDirectory({ documents }: { documents: DocumentDirectoryItem[] }) {
  const [query, setQuery] = useState("");
  const [visibility, setVisibility] = useState("all");

  const filteredDocuments = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("es");
    return documents.filter((document) => {
      const matchesQuery =
        !normalized ||
        [document.name, document.clientName, document.category]
          .filter(Boolean)
          .some((value) => value!.toLocaleLowerCase("es").includes(normalized));
      const matchesVisibility = visibility === "all" || document.visibility === visibility;
      return matchesQuery && matchesVisibility;
    });
  }, [documents, query, visibility]);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_12rem]">
        <div className="relative">
          <Search aria-hidden="true" size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-2" />
          <Input
            aria-label="Buscar documentos"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por archivo, cliente o categoría"
            className="pl-9"
          />
        </div>
        <Select aria-label="Filtrar documentos por visibilidad" value={visibility} onChange={(event) => setVisibility(event.target.value)}>
          <option value="all">Todos</option>
          <option value="client">Visibles al cliente</option>
          <option value="internal">Internos</option>
        </Select>
      </div>

      {filteredDocuments.length === 0 ? (
        <EmptyState icon={FileText} title="No encontramos documentos" description="Probá con otra búsqueda o visibilidad." />
      ) : (
        <div className="space-y-2">
          {filteredDocuments.map((document) => (
            <Card key={document.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-muted">
                  <FileText size={18} />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{document.name}</p>
                  <Link href={`/clients/${document.client_id}`} className="text-xs text-accent hover:underline">
                    {document.clientName}
                  </Link>
                  <p className="text-xs text-muted-2">
                    {document.category ?? "Documento"} · {formatDate(document.uploaded_at)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge tone={document.visibility === "client" ? "success" : "muted"}>
                  {document.visibility === "client" ? "Cliente" : "Interno"}
                </Badge>
                <DocumentDownloadButton storagePath={document.storage_path} />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
