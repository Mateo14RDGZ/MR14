"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/ui/Logo";
import { ClientLogo } from "@/components/ui/ClientLogo";
import { ArrowRight } from "lucide-react";

// Bastante más lenta que cualquier microinteracción del resto de la app a
// propósito: es un momento de marca puntual (una vez por sesión), no una
// transición de UI que se repite. Los logos entran desde los costados y se
// "encuentran" en el centro, donde aparece la X — simula la colaboración
// entre el cliente y MR14.
const HOLD_MS = 2500;
const EXIT_MS = 320;

export function WelcomeAnimation({ logo, name, dest }: { logo: string; name: string; dest: string }) {
  const router = useRouter();
  const [exiting, setExiting] = useState(false);

  const finish = useCallback(() => {
    setExiting(true);
    setTimeout(() => router.replace(dest), EXIT_MS);
  }, [dest, router]);

  useEffect(() => {
    router.prefetch(dest);
    const exitTimer = setTimeout(finish, HOLD_MS);
    return () => clearTimeout(exitTimer);
  }, [dest, finish, router]);

  return (
    <div
      className="welcome-stage relative flex min-h-svh items-center justify-center overflow-hidden bg-background px-5 transition-[opacity,filter,transform] duration-300"
      data-exiting={exiting || undefined}
    >
      <div aria-hidden="true" className="welcome-glow" />
      <button
        type="button"
        onClick={finish}
        className="portal-press absolute right-5 top-[calc(1.25rem+env(safe-area-inset-top))] z-10 flex min-h-10 items-center gap-1.5 rounded-xl px-3 text-xs font-medium text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
      >
        Omitir <ArrowRight size={14} />
      </button>

      <div className="welcome-content relative z-[1] w-full max-w-xl text-center">
        <p className="welcome-kicker text-xs font-semibold uppercase tracking-[0.22em] text-accent">Tu espacio digital</p>

        <div className="welcome-brands mt-8 flex items-center justify-center">
          <div className="welcome-brand welcome-brand-client">
            <ClientLogo
              src={logo}
              alt="Logo de tu negocio"
              size={120}
              className="h-full w-full"
            />
          </div>

          <div aria-hidden="true" className="welcome-connection">
            <span />
            <b>+</b>
            <span />
          </div>

          <div className="welcome-brand welcome-brand-mr14">
            <Logo mark size="2xl" className="h-full w-full object-contain" />
          </div>
        </div>

        <div className="welcome-copy mt-9">
          <h1 className="text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">
            {name ? `Hola, ${name}` : "Bienvenido"}
          </h1>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-muted">
            Tu proyecto y MR14, conectados en un mismo lugar.
          </p>
        </div>

        <div aria-hidden="true" className="welcome-progress mx-auto mt-9 h-0.5 w-28 overflow-hidden rounded-full bg-surface-3">
          <span className="block h-full rounded-full bg-accent" />
        </div>
      </div>
    </div>
  );
}
