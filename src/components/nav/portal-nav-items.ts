import { Home, Globe, FileText, RefreshCw, LifeBuoy, type LucideIcon } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const PORTAL_NAV_ITEMS: NavItem[] = [
  { href: "/portal", label: "Inicio", icon: Home },
  { href: "/portal/mi-web", label: "Mi Web", icon: Globe },
  { href: "/portal/documentos", label: "Documentos", icon: FileText },
  { href: "/portal/renovaciones", label: "Renov.", icon: RefreshCw },
  { href: "/portal/solicitudes", label: "Soporte", icon: LifeBuoy },
];
