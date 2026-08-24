import {
  LayoutDashboard,
  Users,
  FolderKanban,
  RefreshCw,
  FileText,
  ScanSearch,
  Settings,
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
  { href: "/renewals", label: "Renovaciones", icon: RefreshCw },
  { href: "/documents", label: "Documentos", icon: FileText },
  { href: "/audits", label: "Auditorías", icon: ScanSearch },
  { href: "/settings", label: "Configuración", icon: Settings },
];

// Bottom nav mobile: subset priorizado
export const BOTTOM_NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Inicio", icon: LayoutDashboard },
  { href: "/clients", label: "Clientes", icon: Users },
  { href: "/projects", label: "Proyectos", icon: FolderKanban },
  { href: "/renewals", label: "Renov.", icon: RefreshCw },
  { href: "/settings", label: "Ajustes", icon: Settings },
];
