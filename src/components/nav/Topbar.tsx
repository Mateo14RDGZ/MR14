import { CommandPaletteTrigger } from "./CommandPalette";
import { Logo } from "@/components/ui/Logo";
import { signOut } from "@/actions/auth";
import { LogOut } from "lucide-react";

export function Topbar() {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-background/80 px-4 backdrop-blur lg:px-8">
      <div className="lg:hidden">
        <Logo />
      </div>
      <div className="flex-1">
        <CommandPaletteTrigger />
      </div>
      <form action={signOut} className="lg:hidden">
        <button type="submit" className="flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-surface-2">
          <LogOut size={18} />
        </button>
      </form>
    </header>
  );
}
