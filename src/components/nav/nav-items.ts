import {
  LayoutDashboard,
  Users,
  FolderKanban,
  RefreshCw,
  FileText,
  ScanSearch,
  Settings,
  LifeBuoy,
  MoreHorizontal,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/clients", label: "Clientes", icon: Users },
  { href: "/projects", label: "Proyectos", icon: FolderKanban },
  { href: "/support", label: "Tickets", icon: LifeBuoy },
  { href: "/renewals", label: "Renovaciones", icon: RefreshCw },
  { href: "/documents", label: "Documentos", icon: FileText },
  { href: "/audits", label: "Auditorías", icon: ScanSearch },
  { href: "/settings", label: "Configuración", icon: Settings },
];

// Bottom nav mobile: subset priorizado. El resto de las secciones
// (Renovaciones, Documentos, Auditorías, Configuración) vive en /mas
// para no saturar la barra — mismo patrón que el portal del cliente.
export const BOTTOM_NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Inicio", icon: LayoutDashboard },
  { href: "/clients", label: "Clientes", icon: Users },
  { href: "/projects", label: "Proyectos", icon: FolderKanban },
  { href: "/support", label: "Tickets", icon: LifeBuoy },
  { href: "/mas", label: "Más", icon: MoreHorizontal },
];

export const MAS_ROUTES = ["/mas", "/renewals", "/documents", "/audits", "/settings"];
