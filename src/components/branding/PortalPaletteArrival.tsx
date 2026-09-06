"use client";

import { useEffect, useRef, useState } from "react";

const PALETTE_ARRIVAL_PREFIX = "portal-palette-arrival:";

export function PortalPaletteArrival({ clientId }: { clientId: string }) {
  const [active, setActive] = useState(false);
  const shouldAnimate = useRef<boolean | null>(null);

  useEffect(() => {
    if (shouldAnimate.current === null) {
      const key = `${PALETTE_ARRIVAL_PREFIX}${clientId}`;
      try {
        shouldAnimate.current = sessionStorage.getItem(key) === "true";
        sessionStorage.removeItem(key);
      } catch {
        shouldAnimate.current = false;
      }
    }
    if (!shouldAnimate.current) return;

    setActive(true);
    const timer = window.setTimeout(() => {
      setActive(false);
    }, 900);
    return () => window.clearTimeout(timer);
  }, [clientId]);

  return <div aria-hidden="true" className="palette-arrival-wave" data-active={active ? "true" : "false"} />;
}
