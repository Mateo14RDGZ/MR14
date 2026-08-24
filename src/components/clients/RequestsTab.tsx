import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/Empty";
import { RequestStatusSelect } from "@/components/clients/RequestStatusSelect";
import { REQUEST_TYPES, type Request } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";
import { LifeBuoy } from "lucide-react";

export function RequestsTab({ clientId, requests }: { clientId: string; requests: Request[] }) {
  if (requests.length === 0) {
    return <EmptyState icon={LifeBuoy} title="Sin solicitudes del cliente" />;
  }

  return (
    <div className="space-y-2">
      {requests.map((r) => (
        <Card key={r.id} className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-medium">{r.title}</p>
              <p className="text-xs text-muted-2">
                {REQUEST_TYPES.find((t) => t.value === r.type)?.label} · Prioridad {r.priority} ·{" "}
                {formatDateTime(r.created_at)}
              </p>
            </div>
            <RequestStatusSelect requestId={r.id} clientId={clientId} currentStatus={r.status} />
          </div>
          {r.description && <p className="mt-2 text-sm text-muted">{r.description}</p>}
        </Card>
      ))}
    </div>
  );
}
