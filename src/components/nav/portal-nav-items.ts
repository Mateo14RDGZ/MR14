import { Home, Globe, FileText, RefreshCw, LifeBuoy, Wallet, MoreHorizontal, type LucideIcon } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

/** Navegación completa: usada por el sidebar de escritorio. */
export const PORTAL_NAV_ITEMS: NavItem[] = [
  { href: "/portal", label: "Inicio", icon: Home },
  { href: "/portal/mi-web", label: "Mi Web", icon: Globe },
  { href: "/portal/pagos", label: "Pagos", icon: Wallet },
  { href: "/portal/documentos", label: "Documentos", icon: FileText },
  { href: "/portal/renovaciones", label: "Renov.", icon: RefreshCw },
  { href: "/portal/solicitudes", label: "Solicitudes", icon: LifeBuoy },
];

/**
 * Navegación reducida para la bottom bar mobile: 5 ítems como máximo, con
 * "Más" agrupando el resto (Pagos, Renovaciones, Perfil) para no saturar
 * la barra en pantallas chicas.
 */
export const MOBILE_BOTTOM_NAV_ITEMS: NavItem[] = [
  { href: "/portal", label: "Inicio", icon: Home },
  { href: "/portal/mi-web", label: "Mi Web", icon: Globe },
  { href: "/portal/solicitudes", label: "Solicitudes", icon: LifeBuoy },
  { href: "/portal/documentos", label: "Documentos", icon: FileText },
  { href: "/portal/mas", label: "Más", icon: MoreHorizontal },
];
