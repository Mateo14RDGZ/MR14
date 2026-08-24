import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/Empty";
import { InviteMemberDialog } from "@/components/clients/InviteMemberDialog";
import { EditMemberDialog } from "@/components/clients/EditMemberDialog";
import { RemoveMemberButton } from "@/components/clients/RemoveMemberButton";
import type { ClientMember } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { Users } from "lucide-react";

export function MembersTab({
  clientId,
  members,
  businessName,
  defaultPhone,
}: {
  clientId: string;
  members: ClientMember[];
  businessName: string;
  defaultPhone?: string | null;
}) {
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <InviteMemberDialog clientId={clientId} businessName={businessName} defaultPhone={defaultPhone} />
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
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{m.name || m.email}</p>
                <p className="truncate text-xs text-muted-2">
                  {m.email} {m.phone ? `· ${m.phone}` : ""} · {m.role_in_client === "owner" ? "Titular" : "Colaborador"}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Badge tone={m.status === "active" ? "success" : "warning"}>
                  {m.status === "active" ? "Activo" : "Invitado"}
                </Badge>
                <span className="hidden text-xs text-muted-2 sm:inline">{formatDate(m.created_at)}</span>
                <EditMemberDialog clientId={clientId} member={m} />
                <RemoveMemberButton id={m.id} clientId={clientId} />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
