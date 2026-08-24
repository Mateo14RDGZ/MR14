import { Logo } from "@/components/ui/Logo";
import { CheckCircle2 } from "lucide-react";

export default function InvitationSubmittedPage() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-background px-4">
      <div className="w-full max-w-[360px] animate-fade-in text-center">
        <div className="mb-6 flex flex-col items-center gap-3">
          <Logo size="xl" />
        </div>
        <CheckCircle2 size={32} className="mx-auto mb-3 text-success" />
        <p className="text-card-title">Solicitud enviada</p>
        <p className="mt-2 text-sm text-muted">
          Tus datos y tu cuenta fueron creados. MR14 va a revisar la solicitud y aprobar tu acceso — te avisamos en
          cuanto puedas ingresar con el email y la contraseña que elegiste.
        </p>
      </div>
    </div>
  );
}
