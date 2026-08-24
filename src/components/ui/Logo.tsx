import Image from "next/image";
import { cn } from "@/lib/utils";

export function Logo({
  className,
  mark = false,
  size = "md",
}: {
  className?: string;
  mark?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const markSize = { sm: 22, md: 28, lg: 40 }[size];
  const textSize = { sm: "text-sm", md: "text-lg", lg: "text-2xl" }[size];

  if (mark) {
    return (
      <Image
        src="/icons/mark-white.png"
        alt="MR14"
        width={markSize}
        height={markSize}
        className={cn("shrink-0 select-none", className)}
        priority
      />
    );
  }

  return (
    <div className={cn("flex items-center gap-2.5 select-none", className)}>
      <Image
        src="/icons/mark-white.png"
        alt=""
        width={markSize}
        height={markSize}
        className="shrink-0"
        priority
      />
      <span className={cn("font-semibold tracking-tight", textSize)}>MR14</span>
    </div>
  );
}
