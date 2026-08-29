import Link from "next/link";
import { signOut } from "@/actions/auth";
import { Wallet, RefreshCw, User, LogOut, ChevronRight, KeyRound, LifeBuoy, Mail } from "lucide-react";

export default function PortalMasPage() {
  const links = [
    { href: "/portal/pagos", label: "Pagos", icon: Wallet },
    { href: "/portal/renovaciones", label: "Renovaciones", icon: RefreshCw },
    { href: "/portal/credenciales", label: "Accesos", icon: KeyRound },
    { href: "/portal/solicitudes/nueva", label: "Solicitar soporte", icon: LifeBuoy },
    { href: "/portal/perfil", label: "Mi perfil y notificaciones", icon: User },
  ];

  return (
    <div className="animate-fade-in space-y-6">
      <h1 className="text-page-title">Más</h1>

      <div className="divide-y divide-border rounded-lg border border-border bg-surface">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="flex items-center gap-3 px-4 py-3.5 text-sm transition-colors hover:bg-surface-2"
          >
            <l.icon size={17} className="shrink-0 text-muted-2" />
            <span className="flex-1">{l.label}</span>
            <ChevronRight size={16} className="shrink-0 text-muted-2" />
          </Link>
        ))}
        <a
          href="mailto:contacto@mateordgz.dev?subject=Consulta%20desde%20el%20portal%20MR14"
          className="flex items-center gap-3 px-4 py-3.5 text-sm transition-colors hover:bg-surface-2"
        >
          <Mail size={17} className="shrink-0 text-muted-2" />
          <span className="flex-1">Escribir por email</span>
          <ChevronRight size={16} className="shrink-0 text-muted-2" />
        </a>
      </div>

      <form action={signOut}>
        <button
          type="submit"
          className="flex w-full items-center gap-3 rounded-lg border border-border px-4 py-3.5 text-sm text-muted transition-colors hover:border-danger/30 hover:text-danger"
        >
          <LogOut size={17} className="shrink-0" />
          Cerrar sesión
        </button>
      </form>
    </div>
  );
}
