import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/Empty";
import { InviteMemberDialog } from "@/components/clients/InviteMemberDialog";
import { RemoveMemberButton } from "@/components/clients/RemoveMemberButton";
import type { ClientMember } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { Users } from "lucide-react";

export function MembersTab({ clientId, members }: { clientId: string; members: ClientMember[] }) {
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <InviteMemberDialog clientId={clientId} />
      </div>
      {members.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Sin usuarios invitados al portal"
          description="Invitá al responsable del cliente para que acceda a su información desde el Portal MR14."
        />
      ) : (
        <div className="space-y-2">
          {members.map((m) => (
            <Card key={m.id} className="flex items-center justify-between gap-3 p-4">
              <div>
                <p className="text-sm font-medium">{m.name || m.email}</p>
                <p className="text-xs text-muted-2">
                  {m.email} · {m.role_in_client === "owner" ? "Titular" : "Colaborador"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge tone={m.status === "active" ? "success" : "warning"}>
                  {m.status === "active" ? "Activo" : "Invitado"}
                </Badge>
                <span className="hidden text-xs text-muted-2 sm:inline">{formatDate(m.created_at)}</span>
                <RemoveMemberButton id={m.id} clientId={clientId} />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
