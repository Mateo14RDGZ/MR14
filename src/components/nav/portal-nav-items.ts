import { Home, Globe, FileText, RefreshCw, LifeBuoy, Wallet, KeyRound, type LucideIcon } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

/** Navegación completa: usada por el sidebar de escritorio. */
export const PORTAL_PRIMARY_NAV_ITEMS: NavItem[] = [
  { href: "/portal", label: "Inicio", icon: Home },
  { href: "/portal/mi-web", label: "Mi web", icon: Globe },
  { href: "/portal/pagos", label: "Pagos", icon: Wallet },
  { href: "/portal/solicitudes", label: "Ayuda", icon: LifeBuoy },
];

export const PORTAL_RESOURCE_NAV_ITEMS: NavItem[] = [
  { href: "/portal/documentos", label: "Documentos", icon: FileText },
  { href: "/portal/credenciales", label: "Accesos", icon: KeyRound },
  { href: "/portal/renovaciones", label: "Renovaciones", icon: RefreshCw },
];

/**
 * Navegación reducida para la bottom bar mobile: 5 ítems como máximo, con
 * "Más" agrupando el resto (Pagos, Renovaciones, Perfil) para no saturar
 * la barra en pantallas chicas.
 */
export const MOBILE_BOTTOM_NAV_ITEMS: NavItem[] = [
  { href: "/portal", label: "Inicio", icon: Home },
  { href: "/portal/mi-web", label: "Mi web", icon: Globe },
  { href: "/portal/pagos", label: "Pagos", icon: Wallet },
  { href: "/portal/solicitudes", label: "Ayuda", icon: LifeBuoy },
];
