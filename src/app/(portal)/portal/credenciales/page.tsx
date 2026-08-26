import { getPortalContext } from "@/lib/portal";
import { getPortalCredentials } from "@/lib/queries";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/Empty";
import { SecretField } from "@/components/shared/SecretField";
import { CREDENTIAL_SERVICES } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { KeyRound } from "lucide-react";

export default async function PortalCredentialsPage() {
  const { activeClientId } = await getPortalContext();
  const credentials = await getPortalCredentials(activeClientId);

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="text-page-title">Accesos</h1>
        <p className="mt-1 text-sm text-muted">Usuarios y contraseñas que MR14 te entregó.</p>
      </div>

      {credentials.length === 0 ? (
        <EmptyState icon={KeyRound} title="Todavía no tenés accesos entregados" />
      ) : (
        <div className="space-y-3">
          {credentials.map((c) => (
            <Card key={c.id} className="p-4">
              <div className="mb-3">
                <p className="font-medium">
                  {c.service_label || CREDENTIAL_SERVICES.find((s) => s.value === c.service)?.label}
                </p>
                <p className="text-xs text-muted-2">{c.username || "Sin usuario"}</p>
              </div>
              <SecretField credentialId={c.id} />
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-2">
                <span className="break-all">{c.access_url || "Sin URL"}</span>
                <span className="shrink-0">Entregada {formatDate(c.delivered_at)}</span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
