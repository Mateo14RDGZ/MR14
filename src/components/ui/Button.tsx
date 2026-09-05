import { cn } from "@/lib/utils";
import { type ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "outline";
type Size = "sm" | "md" | "lg" | "icon";

const variants: Record<Variant, string> = {
  primary: "bg-accent text-accent-foreground shadow-sm shadow-accent/15 hover:bg-[#554bb7]",
  secondary: "bg-surface-2 text-foreground border border-border hover:bg-surface-3 hover:border-border-strong",
  ghost: "bg-transparent text-muted hover:bg-surface-2 hover:text-foreground",
  outline: "bg-transparent border border-border text-foreground hover:bg-surface-2 hover:border-border-strong",
  danger: "bg-danger-soft text-danger border border-danger/25 hover:bg-danger/20",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3 text-xs gap-1.5",
  md: "h-10 px-3.5 text-sm gap-2",
  lg: "h-11 px-5 text-sm gap-2",
  icon: "h-11 w-11",
};

export const Button = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }
>(({ className, variant = "primary", size = "md", ...props }, ref) => {
  return (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center rounded-lg font-medium transition-[color,background-color,border-color,transform,opacity] duration-150 active:scale-[0.97] disabled:opacity-40 disabled:pointer-events-none disabled:active:scale-100 whitespace-nowrap",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  );
});
Button.displayName = "Button";
