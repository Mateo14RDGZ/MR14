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
          <h1 className="text-2xl font-semibold tracking-tight">Mis solicitudes</h1>
          <p className="mt-1 text-sm text-muted">Soporte, cambios y nuevas funcionalidades de tu proyecto.</p>
        </div>
        <Link href="/portal/solicitudes/nueva">
          <Button size="sm">
            <Plus size={14} /> Nueva
          </Button>
        </Link>
      </div>

      <TicketList tickets={tickets} basePath="/portal/solicitudes" />
    </div>
  );
}
