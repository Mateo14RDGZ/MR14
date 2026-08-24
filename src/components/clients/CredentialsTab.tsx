import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/Empty";
import { NewCredentialDialog } from "@/components/clients/NewCredentialDialog";
import { SecretField } from "@/components/shared/SecretField";
import { DeleteCredentialButton } from "@/components/clients/DeleteCredentialButton";
import { CREDENTIAL_SERVICES, type CredentialRow } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { KeyRound, FileDown } from "lucide-react";
import { Button } from "@/components/ui/Button";

const VISIBILITY_LABEL = {
  internal: "Solo MR14",
  client: "Visible al cliente",
  temporary: "Temporal",
} as const;

export function CredentialsTab({
  clientId,
  credentials,
  projects,
}: {
  clientId: string;
  credentials: CredentialRow[];
  projects: { id: string; name: string }[];
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger">
        No compartas este documento sin autorización del cliente.
      </div>
      <div className="flex flex-wrap justify-end gap-2">
        {credentials.length > 0 && (
          <a href={`/api/pdf?type=credenciales&clientId=${clientId}`} target="_blank" rel="noopener noreferrer">
            <Button size="sm" variant="outline">
              <FileDown size={14} /> Exportar PDF
            </Button>
          </a>
        )}
        <NewCredentialDialog clientId={clientId} projects={projects} />
      </div>

      {credentials.length === 0 ? (
        <EmptyState icon={KeyRound} title="Sin credenciales guardadas" />
      ) : (
        <div className="space-y-3">
          {credentials.map((c) => (
            <Card key={c.id} className="p-4">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">
                    {c.service_label || CREDENTIAL_SERVICES.find((s) => s.value === c.service)?.label}
                  </p>
                  <p className="text-xs text-muted-2">{c.username || "Sin usuario"}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={c.visibility === "internal" ? "muted" : c.visibility === "client" ? "success" : "warning"}>
                    {VISIBILITY_LABEL[c.visibility]}
                  </Badge>
                  <DeleteCredentialButton id={c.id} clientId={clientId} />
                </div>
              </div>
              <SecretField credentialId={c.id} />
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-2">
                <span>{c.access_url || "Sin URL"}</span>
                <span>Actualizado {formatDate(c.last_updated)}</span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
