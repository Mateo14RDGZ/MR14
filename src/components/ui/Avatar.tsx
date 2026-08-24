import { cn } from "@/lib/utils";
import { initials } from "@/lib/utils";

export function Avatar({
  name,
  size = "md",
  className,
}: {
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const dims = { sm: "h-8 w-8 text-xs", md: "h-10 w-10 text-sm", lg: "h-14 w-14 text-lg" }[size];
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
