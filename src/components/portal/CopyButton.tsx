"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

export function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <button
      type="button"
      onClick={copy}
      title="Copiar"
      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-2 transition-colors hover:bg-surface-2 hover:text-foreground"
    >
      {copied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
    </button>
  );
}
