"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    function handler(e: Event) {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    }
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!deferred || dismissed) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-40 flex items-center gap-3 rounded-xl border border-border bg-surface p-3 shadow-2xl animate-fade-in lg:bottom-4 lg:left-auto lg:right-4 lg:w-80">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground font-bold text-sm">
        M
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">Instalar MR14</p>
        <p className="text-xs text-muted-2">Accedé más rápido desde tu pantalla de inicio.</p>
      </div>
      <button
        onClick={async () => {
          await deferred.prompt();
          setDeferred(null);
        }}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground"
      >
        <Download size={15} />
      </button>
      <button
        onClick={() => setDismissed(true)}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-2 hover:bg-surface-2"
      >
        <X size={15} />
      </button>
    </div>
  );
}
