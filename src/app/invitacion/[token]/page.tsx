import { getInvitationByToken, completeInvitationAction } from "@/actions/members";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { Input, Label, Field } from "@/components/ui/Input";
import { ShieldAlert, CheckCircle2 } from "lucide-react";

function InfoScreen({ icon: Icon, tone, title, description }: { icon: typeof ShieldAlert; tone: string; title: string; description: string }) {
  return (
    <div className="flex min-h-svh items-center justify-center bg-background px-4">
      <div className="w-full max-w-[340px] animate-fade-in text-center">
        <div className="mb-6 flex flex-col items-center gap-3">
          <Logo size="xl" />
        </div>
        <Icon size={28} className={`mx-auto mb-3 ${tone}`} />
        <p className="text-card-title">{title}</p>
        <p className="mt-2 text-sm text-muted">{description}</p>
      </div>
    </div>
  );
}

export default async function InvitationPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { token } = await params;
  const { error } = await searchParams;
  const invite = await getInvitationByToken(token);

  if (!invite) {
    return (
      <InfoScreen
        icon={ShieldAlert}
        tone="text-muted-2"
        title="Este link no existe"
        description="Puede que esté mal copiado. Pedile a MR14 que te genere uno nuevo."
      />
    );
  }

  if (invite.used_at) {
    return (
      <InfoScreen
        icon={CheckCircle2}
        tone="text-success"
        title="Ya te registraste"
        description="Tu cuenta ya fue creada con este link. Iniciá sesión normalmente — si todavía no te aprobaron el acceso, vas a ver un aviso al entrar."
      />
    );
  }

  if (new Date(invite.expires_at) < new Date()) {
    return (
      <InfoScreen
        icon={ShieldAlert}
        tone="text-muted-2"
        title="Este link venció"
        description="Pedile a MR14 que te genere uno nuevo."
      />
    );
  }

  const isNewClient = !invite.client_id;
  const businessName = (invite.clients as { business_name?: string } | null)?.business_name;

  async function action(formData: FormData) {
    "use server";
    const result = await completeInvitationAction(token, formData);
    if (result?.error) {
      const { redirect } = await import("next/navigation");
      redirect(`/invitacion/${token}?error=${encodeURIComponent(result.error)}`);
    }
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-[380px] animate-fade-in">
        <div className="mb-8 flex flex-col items-center gap-3">
          <Logo size="xl" />
          <p className="text-center text-sm text-muted">
            {isNewClient ? (
              "Registrate como cliente de MR14"
            ) : (
              <>
                Creá tu acceso al Portal MR14 de <span className="text-foreground">{businessName}</span>
              </>
            )}
          </p>
        </div>

        <form action={action} className="space-y-5">
          {error && (
            <div className="rounded-lg border border-danger/30 bg-danger-soft px-3 py-2 text-xs text-danger">
              {error}
            </div>
          )}
          {isNewClient && (
            <>
              <Field>
                <Label>Nombre de tu negocio *</Label>
                <Input name="business_name" required placeholder="Motocenter" autoFocus />
              </Field>
              <Field>
                <Label>Ciudad</Label>
                <Input name="city" placeholder="Montevideo" />
              </Field>
            </>
          )}
          <Field>
            <Label>Tu nombre *</Label>
            <Input name="name" required placeholder="Roberto Telechea" autoFocus={!isNewClient} />
          </Field>
          <Field>
            <Label>Email *</Label>
            <Input type="email" name="email" required placeholder="roberto@motocenter.com.uy" />
          </Field>
          <Field>
            <Label>Teléfono / WhatsApp</Label>
            <Input name="phone" placeholder="09XXXXXXXX" />
          </Field>
          <Field>
            <Label>Contraseña *</Label>
            <Input type="password" name="password" required minLength={8} placeholder="Mínimo 8 caracteres" />
          </Field>
          <Field>
            <Label>Confirmar contraseña *</Label>
            <Input type="password" name="confirm_password" required minLength={8} />
          </Field>
          <Button type="submit" className="w-full" size="lg">
            {isNewClient ? "Registrarme" : "Crear mi acceso"}
          </Button>
        </form>
      </div>
    </div>
  );
}
