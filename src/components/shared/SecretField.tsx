"use client";

import { useState, useTransition } from "react";
import { Eye, EyeOff, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { revealCredentialAction, logCredentialCopyAction } from "@/actions/credentials";

export function SecretField({ credentialId }: { credentialId: string }) {
  const [value, setValue] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();

  function reveal() {
    if (value !== null) {
      setVisible((v) => !v);
      return;
    }
    startTransition(async () => {
      try {
        const secret = await revealCredentialAction(credentialId);
        setValue(secret);
        setVisible(true);
      } catch {
        toast.error("No se pudo descifrar la credencial.");
      }
    });
  }

  async function copy() {
    let secret = value;
    if (secret === null) {
      try {
        secret = await revealCredentialAction(credentialId);
        setValue(secret);
      } catch {
        toast.error("No se pudo obtener la credencial.");
        return;
      }
    } else {
      await logCredentialCopyAction(credentialId);
    }
    await navigator.clipboard.writeText(secret);
    setCopied(true);
    toast.success("Copiado al portapapeles.");
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="flex items-center gap-2">
      <code className="flex-1 truncate rounded-lg border border-border bg-background px-3 py-2 text-sm">
        {visible && value !== null ? value : "•".repeat(12)}
      </code>
      <button
        type="button"
        onClick={reveal}
        disabled={pending}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border text-muted hover:bg-surface-2"
        title={visible ? "Ocultar" : "Mostrar contraseña"}
      >
        {visible ? <EyeOff size={15} /> : <Eye size={15} />}
      </button>
      <button
        type="button"
        onClick={copy}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border text-muted hover:bg-surface-2"
        title="Copiar"
      >
        {copied ? <Check size={15} className="text-success" /> : <Copy size={15} />}
      </button>
    </div>
  );
}
