import { cn } from "@/lib/utils";
import { initials } from "@/lib/utils";
import { ClientLogo } from "@/components/ui/ClientLogo";

const PX = { sm: 32, md: 40, lg: 56 };

export function Avatar({
  name,
  logoUrl,
  size = "md",
  className,
}: {
  name: string;
  logoUrl?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const dims = { sm: "h-8 w-8 text-xs", md: "h-10 w-10 text-sm", lg: "h-14 w-14 text-lg" }[size];

  if (logoUrl) {
    return (
      <ClientLogo
        src={logoUrl}
        size={PX[size]}
        className={cn("bg-surface-2", dims, className)}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-surface-2 font-medium text-muted",
        dims,
        className
      )}
    >
      {initials(name)}
    </div>
  );
}
