import Link from "next/link";
import { getPortalContext } from "@/lib/portal";
import { getPortalProjectsForSelect } from "@/lib/queries";
import { NewTicketForm } from "@/components/portal/NewTicketForm";
import { ArrowLeft } from "lucide-react";

export default async function NewTicketPage({
  searchParams,
}: {
  searchParams: Promise<{ motivo?: string }>;
}) {
  const params = await searchParams;
  const { activeClientId } = await getPortalContext();
  const projects = await getPortalProjectsForSelect(activeClientId);
  const isPaymentNotice = params.motivo === "pago";

  return (
    <div className="mx-auto max-w-lg animate-fade-in">
      <Link href="/portal/solicitudes" className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-foreground">
        <ArrowLeft size={14} /> Ayuda
      </Link>
      <h1 className="mb-1 text-page-title">¿En qué te ayudamos?</h1>
      <p className="mb-6 text-sm text-muted">Contanos qué necesitás. Vas a poder seguir la respuesta desde el portal.</p>
      <NewTicketForm
        clientId={activeClientId}
        projects={projects}
        initialCategory={isPaymentNotice ? "other" : undefined}
        initialSubject={isPaymentNotice ? "Comprobante de pago" : undefined}
        initialDescription={isPaymentNotice ? "Realicé una transferencia y quiero informar el pago. Adjunto el comprobante." : undefined}
      />
    </div>
  );
}
