import { cn } from "@/lib/utils";
import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes } from "react";

const fieldBase =
  "w-full rounded-lg border border-border bg-surface-2 px-3 h-10 text-foreground placeholder:text-muted-2 outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent disabled:opacity-50";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input ref={ref} className={cn(fieldBase, className)} {...props} />
  )
);
Input.displayName = "Input";

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(fieldBase, "h-auto min-h-24 py-2 resize-y", className)}
    {...props}
  />
));
Textarea.displayName = "Textarea";

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <select ref={ref} className={cn(fieldBase, "appearance-none", className)} {...props}>
      {children}
    </select>
  )
);
Select.displayName = "Select";

export function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <label className={cn("mb-1.5 block text-xs font-medium text-muted", className)}>
      {children}
    </label>
  );
}

export function Field({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("mb-4", className)}>{children}</div>;
}
