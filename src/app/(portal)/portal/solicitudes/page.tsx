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
      <div className="space-y-4 sm:flex sm:items-center sm:justify-between sm:gap-3 sm:space-y-0">
        <div>
          <h1 className="text-page-title">Ayuda</h1>
          <p className="mt-1 max-w-md text-base leading-relaxed text-muted">Escribile a Mateo para pedir un cambio, avisar un problema o hacer una consulta.</p>
        </div>
        <Link href="/portal/solicitudes/nueva">
          <Button size="lg" className="w-full sm:w-auto">
            <Plus size={17} /> Escribirle a Mateo
          </Button>
        </Link>
      </div>

      <TicketList tickets={tickets} basePath="/portal/solicitudes" clientView />
    </div>
  );
}
