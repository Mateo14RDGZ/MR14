import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { signOut } from "@/actions/auth";
import { Clock } from "lucide-react";

export function PendingApprovalScreen() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-background px-4">
      <div className="w-full max-w-[360px] animate-fade-in text-center">
        <div className="mb-6 flex flex-col items-center gap-3">
          <Logo mark size="2xl" />
        </div>
        <Clock size={32} className="mx-auto mb-3 text-warning" />
        <p className="text-card-title">Esperando confirmación de MR14</p>
        <p className="mt-2 text-sm text-muted">
          Tu cuenta ya está creada. Un administrador de MR14 tiene que aprobar tu acceso — en cuanto lo haga, vas a
          poder ver tu proyecto acá mismo. No hace falta que hagas nada más.
        </p>
        <form action={signOut} className="mt-6">
          <Button type="submit" variant="secondary" className="w-full">
            Cerrar sesión
          </Button>
        </form>
      </div>
    </div>
  );
}
