import Link from "next/link";
import { getClients, getClientIdsWithPendingApproval, getClientHealthMap } from "@/lib/queries";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/Empty";
import { ClientDirectory } from "@/components/clients/ClientDirectory";
import { Plus, Users } from "lucide-react";

export default async function ClientsPage() {
  const [clients, pendingApprovalIds, healthMap] = await Promise.all([
    getClients(),
    getClientIdsWithPendingApproval(),
    getClientHealthMap(),
  ]);
  const clientLabel = clients.length === 1 ? "1 cliente registrado" : `${clients.length} clientes registrados`;
  const pendingLabel =
    pendingApprovalIds.size === 1
      ? "1 solicitud de acceso pendiente"
      : `${pendingApprovalIds.size} solicitudes de acceso pendientes`;

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Clientes"
        description={pendingApprovalIds.size > 0 ? `${clientLabel} · ${pendingLabel}` : clientLabel}
        action={
          <Link href="/clients/new">
            <Button>
              <Plus size={16} /> Agregar cliente
            </Button>
          </Link>
        }
      />

      {clients.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Todavía no hay clientes"
          description="Cargá tu primer cliente para empezar."
          action={
            <Link href="/clients/new">
              <Button>
                <Plus size={16} /> Agregar cliente
              </Button>
            </Link>
          }
        />
      ) : (
        <ClientDirectory
          clients={clients.map((client) => ({
            ...client,
            pendingApproval: pendingApprovalIds.has(client.id),
            health: healthMap.get(client.id) ?? "bien",
          }))}
        />
      )}
    </div>
  );
}
