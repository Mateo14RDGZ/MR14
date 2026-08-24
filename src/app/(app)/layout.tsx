import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/nav/Sidebar";
import { BottomNav } from "@/components/nav/BottomNav";
import { Topbar } from "@/components/nav/Topbar";
import { CommandPalette } from "@/components/nav/CommandPalette";
import { InactivityGuard } from "@/components/nav/InactivityGuard";
import { InstallPrompt } from "@/components/shared/InstallPrompt";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/portal");

  return (
    <div className="flex min-h-svh">
      <Sidebar userEmail={user.email} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 px-4 pb-24 pt-6 lg:px-8 lg:pb-10">{children}</main>
      </div>
      <BottomNav />
      <CommandPalette />
      <InactivityGuard />
      <InstallPrompt />
    </div>
  );
}
