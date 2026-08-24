import Link from "next/link";
import { Card, CardBody } from "@/components/ui/Card";
import { StatusSelect } from "@/components/clients/StatusSelect";
import { CLIENT_STATUSES, type Client } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { Pencil, Mail, Phone, MapPin, Globe } from "lucide-react";

export function OverviewTab({ client }: { client: Client }) {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardBody className="space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-2">Responsable</p>
              <p className="font-medium">{client.contact_name || "-"}</p>
            </div>
            <Link href={`/clients/${client.id}/edit`}>
              <span className="flex items-center gap-1 text-xs text-accent hover:underline">
                <Pencil size={13} /> Editar
              </span>
            </Link>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <InfoItem icon={Mail} label="Email" value={client.email} />
            <InfoItem icon={Phone} label="Teléfono / WhatsApp" value={client.whatsapp || client.phone} />
            <InfoItem icon={MapPin} label="Ubicación" value={[client.city, client.state, client.country].filter(Boolean).join(", ")} />
            <InfoItem icon={Globe} label="Sitio web" value={client.website} />
          </div>

          <div className="grid gap-3 sm:grid-cols-2 border-t border-border pt-4">
            <InfoItem label="C.I." value={client.ci} />
            <InfoItem label="RUT" value={client.rut} />
            <InfoItem label="Fecha de inicio" value={formatDate(client.start_date)} />
            <InfoItem label="Fecha de entrega" value={formatDate(client.delivery_date)} />
          </div>

          {client.social_links && Object.keys(client.social_links).length > 0 && (
            <div className="border-t border-border pt-4">
              <p className="mb-2 text-xs uppercase tracking-wide text-muted-2">Redes sociales</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(client.social_links).map(([k, v]) => (
                  <a
                    key={k}
                    href={v}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full border border-border px-3 py-1 text-xs capitalize text-muted hover:border-accent hover:text-accent"
                  >
                    {k}
                  </a>
                ))}
              </div>
            </div>
          )}

          {client.notes && (
            <div className="border-t border-border pt-4">
              <p className="mb-1 text-xs uppercase tracking-wide text-muted-2">Notas internas</p>
              <p className="whitespace-pre-line text-sm text-muted">{client.notes}</p>
            </div>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <p className="mb-3 text-xs uppercase tracking-wide text-muted-2">Estado del cliente</p>
          <StatusSelect clientId={client.id} currentStatus={client.status} options={CLIENT_STATUSES} />
        </CardBody>
      </Card>
    </div>
  );
}

function InfoItem({ icon: Icon, label, value }: { icon?: React.ElementType; label: string; value?: string | null }) {
  return (
    <div>
      <p className="mb-0.5 flex items-center gap-1.5 text-xs text-muted-2">
        {Icon && <Icon size={12} />} {label}
      </p>
      <p className="break-words text-sm font-medium">{value || "-"}</p>
    </div>
  );
}
