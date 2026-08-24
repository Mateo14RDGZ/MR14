import { createClient } from "@/lib/supabase/server";
import { getQuickReplies } from "@/lib/queries";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { NotificationsToggle } from "@/components/shared/NotificationsToggle";
import { QuickRepliesManager } from "@/components/shared/QuickRepliesManager";

const ENV_CHECKS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "CREDENTIALS_ENCRYPTION_KEY",
  "NEXT_PUBLIC_APP_URL",
  "NEXT_PUBLIC_VAPID_PUBLIC_KEY",
  "VAPID_PRIVATE_KEY",
];

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user?.id).single();
  const quickReplies = await getQuickReplies();

  return (
    <div className="mx-auto max-w-2xl animate-fade-in space-y-6">
      <PageHeader title="Configuración" description="Información de la cuenta y del entorno." />

      <Card>
        <CardHeader>
          <h2 className="text-card-title">Sesión</h2>
        </CardHeader>
        <CardBody className="space-y-2 text-sm">
          <div className="flex items-center justify-between gap-3">
            <span className="shrink-0 text-muted">Email</span>
            <span className="truncate font-medium">{user?.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Rol</span>
            <Badge tone="accent">{profile?.role === "admin" ? "Administrador MR14" : "Cliente"}</Badge>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-card-title">Notificaciones</h2>
        </CardHeader>
        <CardBody>
          <NotificationsToggle />
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-card-title">Respuestas rápidas de tickets</h2>
        </CardHeader>
        <CardBody>
          <QuickRepliesManager replies={quickReplies} />
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-card-title">Estado del entorno</h2>
        </CardHeader>
        <CardBody className="space-y-2 text-sm">
          {ENV_CHECKS.map((key) => (
            <div key={key} className="flex items-center justify-between">
              <span className="font-mono text-xs text-muted">{key}</span>
              <Badge tone={process.env[key] ? "success" : "danger"}>
                {process.env[key] ? "Configurada" : "Falta"}
              </Badge>
            </div>
          ))}
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-card-title">Acerca de MR14</h2>
        </CardHeader>
        <CardBody className="text-sm text-muted">
          <p>MR14 · Panel interno de clientes, proyectos e infraestructura.</p>
          <p className="mt-1">Mateo Rodríguez · mateordgz.dev</p>
        </CardBody>
      </Card>
    </div>
  );
}
