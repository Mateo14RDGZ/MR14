import { getPortalContext } from "@/lib/portal";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { ProfileForm } from "@/components/portal/ProfileForm";
import { PasswordForm } from "@/components/portal/PasswordForm";

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
          <h2 className="text-card-title">Cambiar contraseña</h2>
        </CardHeader>
        <CardBody>
          <PasswordForm />
        </CardBody>
      </Card>
    </div>
  );
}
