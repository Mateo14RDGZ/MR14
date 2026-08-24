import { getPortalContext } from "@/lib/portal";
import { getPortalRequests } from "@/lib/queries";
import { createRequestAction } from "@/actions/requests";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Select, Label, Field } from "@/components/ui/Input";
import { EmptyState } from "@/components/ui/Empty";
import { REQUEST_TYPES, REQUEST_STATUSES } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";
import { LifeBuoy } from "lucide-react";

const STATUS_TONE = {
  recibida: "muted",
  en_revision: "warning",
  en_proceso: "accent",
  resuelta: "success",
} as const;

export default async function PortalRequestsPage() {
  const { activeClientId } = await getPortalContext();
  const requests = await getPortalRequests(activeClientId);
  async function action(formData: FormData) {
    "use server";
    await createRequestAction(activeClientId, formData);
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Solicitudes</h1>
        <p className="mt-1 text-sm text-muted">Enviá pedidos simples a MR14 y seguí su estado.</p>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold">Nueva solicitud</h2>
        </CardHeader>
        <CardBody>
          <form action={action} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field className="mb-0">
                <Label>Tipo</Label>
                <Select name="type" defaultValue="otro">
                  {REQUEST_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field className="mb-0">
                <Label>Prioridad</Label>
                <Select name="priority" defaultValue="media">
                  <option value="baja">Baja</option>
                  <option value="media">Media</option>
                  <option value="alta">Alta</option>
                </Select>
              </Field>
            </div>
            <Field className="mb-0">
              <Label>Título</Label>
              <Input name="title" required placeholder="Ej: Cambiar horario de atención" />
            </Field>
            <Field className="mb-0">
              <Label>Descripción</Label>
              <Textarea name="description" rows={3} placeholder="Contanos con detalle qué necesitás" />
            </Field>
            <Button type="submit">Enviar solicitud</Button>
          </form>
        </CardBody>
      </Card>

      {requests.length === 0 ? (
        <EmptyState icon={LifeBuoy} title="Sin solicitudes enviadas" />
      ) : (
        <div className="space-y-2">
          {requests.map((r) => (
            <Card key={r.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{r.title}</p>
                  <p className="text-xs text-muted-2">
                    {REQUEST_TYPES.find((t) => t.value === r.type)?.label} · {formatDateTime(r.created_at)}
                  </p>
                </div>
                <Badge tone={STATUS_TONE[r.status as keyof typeof STATUS_TONE]}>
                  {REQUEST_STATUSES.find((s) => s.value === r.status)?.label}
                </Badge>
              </div>
              {r.description && <p className="mt-2 text-sm text-muted">{r.description}</p>}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
