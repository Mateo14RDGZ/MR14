import { cn } from "@/lib/utils";

export function Logo({ className, mark = false }: { className?: string; mark?: boolean }) {
  if (mark) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-lg bg-accent text-accent-foreground font-bold",
          className
        )}
      >
        M
      </div>
    );
  }
  return (
    <div className={cn("flex items-center gap-2 select-none", className)}>
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-accent-foreground font-bold text-sm">
        M
      </div>
      <span className="text-lg font-semibold tracking-tight">MR14</span>
    </div>
  );
}
