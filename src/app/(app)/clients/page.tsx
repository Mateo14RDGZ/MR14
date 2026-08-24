import Link from "next/link";
import { getClients, getClientIdsWithPendingApproval } from "@/lib/queries";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { Avatar } from "@/components/ui/Avatar";
import { Badge, statusTone } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/Empty";
import { NewClientInviteDialog } from "@/components/clients/NewClientInviteDialog";
import { CLIENT_STATUSES } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { Plus, Users, ChevronRight, UserCheck } from "lucide-react";

export default async function ClientsPage() {
  const [clients, pendingApprovalIds] = await Promise.all([getClients(), getClientIdsWithPendingApproval()]);
  const sortedClients = [...clients].sort((a, b) => {
    const aPending = pendingApprovalIds.has(a.id) ? 1 : 0;
    const bPending = pendingApprovalIds.has(b.id) ? 1 : 0;
    return bPending - aPending;
  });

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Clientes"
        description={
          pendingApprovalIds.size > 0
            ? `${clients.length} cliente${clients.length === 1 ? "" : "s"} registrados · ${pendingApprovalIds.size} solicitud${pendingApprovalIds.size === 1 ? "" : "es"} de acceso pendiente${pendingApprovalIds.size === 1 ? "" : "s"}`
            : `${clients.length} cliente${clients.length === 1 ? "" : "s"} registrados`
        }
        action={
          <div className="flex items-center gap-2">
            <Link href="/clients/new">
              <Button variant="secondary">
                <Plus size={16} /> Cargar manualmente
              </Button>
            </Link>
            <NewClientInviteDialog />
          </div>
        }
      />

      {clients.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Todavía no hay clientes"
          description="Invitá a tu primer cliente para que se registre solo, o cargalo vos manualmente."
          action={<NewClientInviteDialog />}
        />
      ) : (
        <>
          {/* Desktop table */}
          <Card className="hidden overflow-hidden sm:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-label">
                  <th className="px-5 py-3 font-medium">Cliente</th>
                  <th className="px-5 py-3 font-medium">Contacto</th>
                  <th className="px-5 py-3 font-medium">Ciudad</th>
                  <th className="px-5 py-3 font-medium">Estado</th>
                  <th className="px-5 py-3 font-medium">Alta</th>
                  <th className="w-8 px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {sortedClients.map((c) => {
                  const statusLabel = CLIENT_STATUSES.find((s) => s.value === c.status)?.label ?? c.status;
                  const pending = pendingApprovalIds.has(c.id);
                  const href = pending ? `/clients/${c.id}?tab=members` : `/clients/${c.id}`;
                  return (
                    <tr key={c.id} className="group border-b border-border last:border-0">
                      <td className="p-0">
                        <Link href={href} className="flex items-center gap-3 px-5 py-3.5">
                          <Avatar name={c.business_name} size="sm" />
                          <span className="truncate font-medium">{c.business_name}</span>
                        </Link>
                      </td>
                      <td className="px-5 py-3.5 text-muted">{c.contact_name ?? "—"}</td>
                      <td className="px-5 py-3.5 text-muted">{c.city ?? "—"}</td>
                      <td className="px-5 py-3.5">
                        {pending ? (
                          <Badge tone="warning">
                            <UserCheck size={12} /> Solicitud pendiente
                          </Badge>
                        ) : (
                          <Badge tone={statusTone(c.status, "client")}>{statusLabel}</Badge>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-muted-2">{formatDate(c.created_at)}</td>
                      <td className="px-5 py-3.5 text-right">
                        <Link href={href}>
                          <ChevronRight size={16} className="text-muted-2 transition-colors group-hover:text-foreground" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>

          {/* Mobile cards */}
          <div className="space-y-2.5 sm:hidden">
            {sortedClients.map((c) => {
              const statusLabel = CLIENT_STATUSES.find((s) => s.value === c.status)?.label ?? c.status;
              const pending = pendingApprovalIds.has(c.id);
              const href = pending ? `/clients/${c.id}?tab=members` : `/clients/${c.id}`;
              return (
                <Link key={c.id} href={href}>
                  <Card className="flex items-center gap-3 p-4">
                    <Avatar name={c.business_name} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{c.business_name}</p>
                      <p className="truncate text-xs text-muted-2">{c.contact_name ?? "Sin contacto"}</p>
                    </div>
                    {pending ? (
                      <Badge tone="warning">
                        <UserCheck size={12} /> Pendiente
                      </Badge>
                    ) : (
                      <Badge tone={statusTone(c.status, "client")}>{statusLabel}</Badge>
                    )}
                  </Card>
                </Link>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
