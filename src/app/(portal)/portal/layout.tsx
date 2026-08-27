import { getPortalContext, checkPendingApproval } from "@/lib/portal";
import { PortalSidebar } from "@/components/nav/PortalSidebar";
import { PortalBottomNav } from "@/components/nav/PortalBottomNav";
import { OrgSwitcher } from "@/components/nav/OrgSwitcher";
import { InactivityGuard } from "@/components/nav/InactivityGuard";
import { InstallPrompt } from "@/components/shared/InstallPrompt";
import { PendingApprovalScreen } from "@/components/portal/PendingApprovalScreen";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const pending = await checkPendingApproval();
  if (pending) return <PendingApprovalScreen />;

  const { memberships, activeClient, activeClientId } = await getPortalContext();

  return (
    <div className="flex min-h-svh lg:h-svh lg:overflow-hidden">
      <PortalSidebar businessName={activeClient?.business_name ?? "Tu negocio"} />
      <div className="flex min-w-0 flex-1 flex-col lg:h-svh lg:overflow-y-auto">
        <OrgSwitcher memberships={memberships} activeClientId={activeClientId} />
        <main className="flex-1 px-4 pb-24 pt-6 lg:px-8 lg:pb-10">{children}</main>
      </div>
      <PortalBottomNav />
      <InactivityGuard />
      <InstallPrompt />
    </div>
  );
}
