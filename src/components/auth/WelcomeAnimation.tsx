"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { ClientLogo } from "@/components/ui/ClientLogo";
import { MR14AnimatedLogo } from "@/components/branding/MR14AnimatedLogo";
import { ArrowRight } from "lucide-react";

type WelcomePhase = "entering" | "drawing" | "settled" | "exiting" | "completed";

const SETTLED_MS = 260;
const EXIT_MS = 300;
const PALETTE_ARRIVAL_PREFIX = "portal-palette-arrival:";

export function WelcomeAnimation({ clientId, logo, name, dest, variant = "client", accent, accentSoft }: {
  clientId: string;
  logo?: string;
  name: string;
  dest: string;
  variant?: "client" | "admin";
  accent?: string;
  accentSoft?: string;
}) {
  const router = useRouter();
  const [phase, setPhase] = useState<WelcomePhase>("entering");
  const navigationStarted = useRef(false);
  const exitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const storageKey = `welcome-animation-shown:${clientId}`;
  const stageStyle = {
    "--welcome-accent": accent ?? "#6257c8",
    "--welcome-accent-soft": accentSoft ?? "#f1effb",
  } as CSSProperties;

  const navigateOnce = useCallback(() => {
    if (navigationStarted.current) return;
    navigationStarted.current = true;
    setPhase("exiting");
    if (variant === "client") {
      try { sessionStorage.setItem(`${PALETTE_ARRIVAL_PREFIX}${clientId}`, "true"); } catch { /* continue without motion */ }
    }
    exitTimer.current = setTimeout(() => {
      setPhase("completed");
      router.replace(dest);
    }, EXIT_MS);
  }, [clientId, dest, router, variant]);

  const handleLogoComplete = useCallback(() => {
    if (navigationStarted.current) return;
    setPhase("settled");
    exitTimer.current = setTimeout(navigateOnce, SETTLED_MS);
  }, [navigateOnce]);

  useEffect(() => {
    router.prefetch(dest);
    let alreadyShown = false;
    try { alreadyShown = sessionStorage.getItem(storageKey) === "true"; } catch { /* storage can be unavailable */ }
    if (alreadyShown) {
      navigationStarted.current = true;
      router.replace(dest);
      return;
    }

    try { sessionStorage.setItem(storageKey, "true"); } catch { /* animation still works */ }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const frame = requestAnimationFrame(() => setPhase("drawing"));

    return () => {
      cancelAnimationFrame(frame);
      document.body.style.overflow = previousOverflow;
      if (exitTimer.current) clearTimeout(exitTimer.current);
    };
  }, [dest, router, storageKey]);

  return (
    <main
      aria-label="Pantalla de bienvenida"
      style={stageStyle}
      className="welcome-stage fixed inset-0 z-[100] flex min-h-dvh w-full items-center justify-center overflow-hidden px-5"
      data-phase={phase}
    >
      <div aria-hidden="true" className="welcome-glow" />
      <button
        type="button"
        onClick={navigateOnce}
        aria-label="Omitir bienvenida e ingresar al portal"
        className="portal-press absolute right-5 top-[calc(1.25rem+env(safe-area-inset-top))] z-10 flex min-h-11 items-center gap-1.5 rounded-xl px-3 text-xs font-medium text-[#59545b] transition-colors hover:bg-black/5 hover:text-[#171218]"
      >
        Omitir <ArrowRight aria-hidden="true" size={14} />
      </button>

      <div className="welcome-content relative z-[1] w-full max-w-xl text-center">
        <p className="welcome-kicker text-xs font-semibold uppercase tracking-[0.22em] text-[var(--welcome-accent)]">
          {variant === "admin" ? "Panel MR14" : "Tu espacio digital"}
        </p>

        <div className="welcome-orbit mt-5">
          <div aria-hidden="true" className="welcome-orbit-ring"><span /></div>
          <div className="welcome-brands flex items-center justify-center" data-variant={variant}>
            {variant === "client" && logo ? (
              <>
                <div className="welcome-brand welcome-brand-client">
                  <ClientLogo src={logo} alt="Logo de tu negocio" size={120} className="h-full w-full" priority />
                </div>

                <div aria-hidden="true" className="welcome-connection">
                  <span />
                  <b>+</b>
                  <span />
                </div>
              </>
            ) : null}

            <div className="welcome-brand welcome-brand-mr14">
              <MR14AnimatedLogo className="h-[115%] w-[115%] max-w-none" animate durationMs={2100} onComplete={handleLogoComplete} />
            </div>
          </div>
        </div>

        <div className="welcome-copy mt-9">
          <h1 className="text-3xl font-semibold tracking-[-0.035em] text-[#171218] sm:text-4xl">
            {name ? `Hola, ${name}` : "Bienvenido"}
          </h1>
        </div>

        <div aria-hidden="true" className="welcome-progress mx-auto mt-9 h-0.5 w-28 overflow-hidden rounded-full bg-black/10">
          <span className="block h-full origin-left rounded-full bg-[var(--welcome-accent)]" />
        </div>
      </div>
    </main>
  );
}
