import Link from "next/link";
import { getPortalContext } from "@/lib/portal";
import { getPortalDeliveryChecklist } from "@/lib/queries";
import { signOut } from "@/actions/auth";
import { Wallet, RefreshCw, User, LogOut, ChevronRight, KeyRound, MessageCircle } from "lucide-react";

export default async function PortalMasPage() {
  const { activeClientId, activeClient } = await getPortalContext();
  // "Accesos" solo aparece si hay algo que mostrar — no tiene sentido un
  // link a una pantalla vacía.
  const { hasDeliveredCredentials } = await getPortalDeliveryChecklist(activeClientId);
  const whatsappHref =
    "https://wa.me/59899000000?text=" +
    encodeURIComponent(`Hola MR14, soy ${activeClient?.business_name}, necesito ayuda con mi proyecto.`);

  const links = [
    { href: "/portal/pagos", label: "Pagos", icon: Wallet },
    { href: "/portal/renovaciones", label: "Renovaciones", icon: RefreshCw },
    ...(hasDeliveredCredentials ? [{ href: "/portal/credenciales", label: "Accesos", icon: KeyRound }] : []),
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
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 px-4 py-3.5 text-sm transition-colors hover:bg-surface-2"
        >
          <MessageCircle size={17} className="shrink-0 text-muted-2" />
          <span className="flex-1">Contacto general</span>
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
