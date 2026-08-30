import { getPortalContext } from "@/lib/portal";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { ProfileForm } from "@/components/portal/ProfileForm";
import { PasswordForm } from "@/components/portal/PasswordForm";
import { NotificationsToggle } from "@/components/shared/NotificationsToggle";
import { signOut } from "@/actions/auth";
import { Button } from "@/components/ui/Button";
import { LogOut } from "lucide-react";

export default async function PortalProfilePage() {
  const { user, profile } = await getPortalContext();

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="text-page-title">Mi perfil</h1>
        <p className="mt-1 text-sm text-muted">{user.email}</p>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-card-title">Datos personales</h2>
        </CardHeader>
        <CardBody>
          <ProfileForm defaultName={profile?.full_name ?? ""} defaultPhone={profile?.phone ?? ""} />
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-card-title">Sesión</h2>
        </CardHeader>
        <CardBody>
          <p className="mb-4 text-sm text-muted">¿Terminaste por hoy? Podés cerrar tu sesión de forma segura.</p>
          <form action={signOut}>
            <Button type="submit" variant="danger" className="w-full sm:w-auto">
              <LogOut size={16} />
              Cerrar sesión
            </Button>
          </form>
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
          <h2 className="text-card-title">Cambiar contraseña</h2>
        </CardHeader>
        <CardBody>
          <PasswordForm />
        </CardBody>
      </Card>
    </div>
  );
}
