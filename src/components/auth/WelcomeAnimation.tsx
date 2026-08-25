"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Logo } from "@/components/ui/Logo";
import { X } from "lucide-react";

// Bastante más lenta que cualquier microinteracción del resto de la app a
// propósito: es un momento de marca puntual (una vez por sesión), no una
// transición de UI que se repite. Los logos entran desde los costados y se
// "encuentran" en el centro, donde aparece la X — simula la colaboración
// entre el cliente y MR14.
const HOLD_MS = 2600;
const EXIT_MS = 350;

export function WelcomeAnimation({ logo, name, dest }: { logo: string; name: string; dest: string }) {
  const router = useRouter();
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    router.prefetch(dest);
    const exitTimer = setTimeout(() => setExiting(true), HOLD_MS);
    const navTimer = setTimeout(() => router.replace(dest), HOLD_MS + EXIT_MS);
    return () => {
      clearTimeout(exitTimer);
      clearTimeout(navTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dest]);

  return (
    <div
      className="flex min-h-svh flex-col items-center justify-center gap-8 bg-background px-4 transition-opacity duration-300"
      style={{ opacity: exiting ? 0 : 1 }}
    >
      <div className="flex items-center gap-7">
        <Image
          src={logo}
          alt=""
          width={128}
          height={128}
          unoptimized
          className="h-32 w-32 shrink-0 animate-welcome-left rounded-full border border-border object-cover"
        />
        <X size={28} strokeWidth={2.5} className="shrink-0 animate-welcome-pop text-muted-2" />
        <Logo mark size="3xl" className="animate-welcome-right" />
      </div>
      <p className="animate-welcome-text text-center text-base text-muted">
        {name ? (
          <>
            Bienvenido, <span className="font-medium text-foreground">{name}</span>
          </>
        ) : (
          "Bienvenido"
        )}
      </p>
    </div>
  );
}
