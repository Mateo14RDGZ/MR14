import Link from "next/link";
import { getPortalContext } from "@/lib/portal";
import { getPortalTickets } from "@/lib/queries";
import { TicketList } from "@/components/portal/TicketList";
import { Button } from "@/components/ui/Button";
import { Plus } from "lucide-react";

export default async function PortalRequestsPage() {
  const { activeClientId } = await getPortalContext();
  const tickets = await getPortalTickets(activeClientId);

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-page-title">Ayuda</h1>
          <p className="mt-1 max-w-md text-sm text-muted">Pedí un cambio, avisá un problema o hacenos una consulta.</p>
        </div>
        <Link href="/portal/solicitudes/nueva">
          <Button size="sm">
            <Plus size={14} /> Pedir ayuda
          </Button>
        </Link>
      </div>

      <TicketList tickets={tickets} basePath="/portal/solicitudes" clientView />
    </div>
  );
}
