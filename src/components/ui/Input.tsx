"use client";

import { cn } from "@/lib/utils";
import {
  createContext,
  forwardRef,
  useContext,
  useId,
  type InputHTMLAttributes,
  type LabelHTMLAttributes,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";

const FieldIdContext = createContext<string | undefined>(undefined);

const fieldBase =
  "w-full rounded-lg border border-border bg-surface-2 px-3 h-10 text-foreground placeholder:text-muted-2 outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent disabled:opacity-50";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, id, ...props }, ref) => {
    const fieldId = useContext(FieldIdContext);
    return <input ref={ref} id={id ?? fieldId} className={cn(fieldBase, className)} {...props} />;
  }
);
Input.displayName = "Input";

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, id, ...props }, ref) => {
  const fieldId = useContext(FieldIdContext);
  return (
    <textarea
      ref={ref}
      id={id ?? fieldId}
      className={cn(fieldBase, "h-auto min-h-24 py-2 resize-y", className)}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, id, ...props }, ref) => {
    const fieldId = useContext(FieldIdContext);
    return (
      <select ref={ref} id={id ?? fieldId} className={cn(fieldBase, className)} {...props}>
        {children}
      </select>
    );
  }
);
Select.displayName = "Select";

export function Label({ children, className, htmlFor, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  const fieldId = useContext(FieldIdContext);
  return (
    <label htmlFor={htmlFor ?? fieldId} className={cn("mb-1.5 block text-xs font-medium text-muted", className)} {...props}>
      {children}
    </label>
  );
}

export function Field({ children, className, id }: { children: React.ReactNode; className?: string; id?: string }) {
  const generatedId = useId();
  return (
    <FieldIdContext.Provider value={id ?? generatedId}>
      <div className={cn("mb-4", className)}>{children}</div>
    </FieldIdContext.Provider>
  );
}
