import { getPortalContext, checkPendingApproval } from "@/lib/portal";
import { PortalSidebar } from "@/components/nav/PortalSidebar";
import { PortalBottomNav } from "@/components/nav/PortalBottomNav";
import { OrgSwitcher } from "@/components/nav/OrgSwitcher";
import { InactivityGuard } from "@/components/nav/InactivityGuard";
import { InstallPrompt } from "@/components/shared/InstallPrompt";
import { PendingApprovalScreen } from "@/components/portal/PendingApprovalScreen";
import { getClientBrandTokens } from "@/lib/brand-color-server";
import { BrandTheme } from "@/components/branding/BrandTheme";
import { PortalPaletteArrival } from "@/components/branding/PortalPaletteArrival";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const pending = await checkPendingApproval();
  if (pending) return <PendingApprovalScreen />;

  const { memberships, activeClient, activeClientId } = await getPortalContext();
  const theme = await getClientBrandTokens({ ...activeClient, id: activeClientId });
  const portalTheme = {
    ...theme,
    "--brand-accent": theme["--accent"],
    "--brand-accent-hover": theme["--accent-hover"],
    "--brand-accent-soft": theme["--accent-soft"],
  } as React.CSSProperties;

  return (
    <BrandTheme theme={theme}>
    <div style={portalTheme} className="portal-shell flex min-h-svh lg:h-svh lg:overflow-hidden">
      <PortalPaletteArrival clientId={activeClientId} />
      <PortalSidebar businessName={activeClient?.business_name ?? "Tu negocio"} />
      <div className="flex min-w-0 flex-1 flex-col lg:h-svh lg:overflow-y-auto">
        <OrgSwitcher
          memberships={memberships}
          activeClientId={activeClientId}
          businessName={activeClient?.business_name ?? "Tu negocio"}
          clientLogo={activeClient?.logo_url}
        />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-24 pt-5 sm:px-6 lg:px-10 lg:pb-12 lg:pt-8">
          {children}
        </main>
      </div>
      <PortalBottomNav />
      <InactivityGuard />
      <InstallPrompt />
    </div>
    </BrandTheme>
  );
}
