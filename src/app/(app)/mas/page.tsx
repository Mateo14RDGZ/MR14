import Link from "next/link";
import { signOut } from "@/actions/auth";
import { RefreshCw, FileText, ScanSearch, Settings, LogOut, ChevronRight } from "lucide-react";

const LINKS = [
  { href: "/renewals", label: "Renovaciones", icon: RefreshCw },
  { href: "/documents", label: "Documentos", icon: FileText },
  { href: "/audits", label: "Auditorías", icon: ScanSearch },
  { href: "/settings", label: "Configuración", icon: Settings },
];

export default function AdminMasPage() {
  return (
    <div className="animate-fade-in space-y-6">
      <h1 className="text-page-title">Más</h1>

      <div className="divide-y divide-border rounded-lg border border-border bg-surface">
        {LINKS.map((l) => (
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
