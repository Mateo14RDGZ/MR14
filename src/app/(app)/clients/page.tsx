import Link from "next/link";
import { getClients } from "@/lib/queries";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge, statusTone } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/Empty";
import { CLIENT_STATUSES } from "@/lib/types";
import { initials } from "@/lib/utils";
import { Plus, Users } from "lucide-react";

export default async function ClientsPage() {
  const clients = await getClients();

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Clientes</h1>
          <p className="mt-1 text-sm text-muted">{clients.length} clientes registrados</p>
        </div>
        <Link href="/clients/new">
          <Button>
            <Plus size={16} /> Nuevo cliente
          </Button>
        </Link>
      </div>

      {clients.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Todavía no hay clientes"
          description="Creá tu primer cliente para empezar a gestionar proyectos e infraestructura."
          action={
            <Link href="/clients/new">
              <Button>
                <Plus size={16} /> Nuevo cliente
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {clients.map((c) => {
            const statusLabel = CLIENT_STATUSES.find((s) => s.value === c.status)?.label ?? c.status;
            return (
              <Link key={c.id} href={`/clients/${c.id}`}>
                <Card className="h-full p-5 transition-colors hover:border-muted-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-2 text-sm font-semibold text-muted">
                        {initials(c.business_name)}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-medium">{c.business_name}</p>
                        <p className="truncate text-xs text-muted-2">{c.contact_name ?? "-"}</p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <Badge tone={statusTone(c.status, "client")}>{statusLabel}</Badge>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
