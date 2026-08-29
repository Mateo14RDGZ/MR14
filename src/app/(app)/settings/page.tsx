import { createClient } from "@/lib/supabase/server";
import { getQuickReplies, getPaymentMethods } from "@/lib/queries";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { NotificationsToggle } from "@/components/shared/NotificationsToggle";
import { QuickRepliesManager } from "@/components/shared/QuickRepliesManager";
import { PaymentMethodsManager } from "@/components/shared/PaymentMethodsManager";

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
  const [quickReplies, paymentMethods] = await Promise.all([getQuickReplies(), getPaymentMethods()]);

  return (
    <div className="mx-auto max-w-2xl animate-fade-in space-y-6">
      <PageHeader title="Configuración" description="Administrá tu cuenta y las preferencias de trabajo." />

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
          <h2 className="text-card-title">Mis cuentas de banco</h2>
        </CardHeader>
        <CardBody>
          <PaymentMethodsManager methods={paymentMethods} />
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

      <details className="group rounded-lg border border-border bg-surface">
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 text-card-title marker:hidden">
          Diagnóstico técnico
          <span className="text-xs font-normal text-muted group-open:hidden">Mostrar</span>
          <span className="hidden text-xs font-normal text-muted group-open:inline">Ocultar</span>
        </summary>
        <div className="space-y-2 border-t border-border px-5 py-4 text-sm">
          <p className="mb-3 text-xs text-muted">
            Variables necesarias para que las integraciones y notificaciones funcionen correctamente.
          </p>
          {ENV_CHECKS.map((key) => (
            <div key={key} className="flex flex-wrap items-center justify-between gap-2">
              <span className="break-all font-mono text-xs text-muted">{key}</span>
              <Badge tone={process.env[key] ? "success" : "danger"}>
                {process.env[key] ? "Configurada" : "Falta"}
              </Badge>
            </div>
          ))}
        </div>
      </details>

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
