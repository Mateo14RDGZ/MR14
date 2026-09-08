"use client";

import { useId, useLayoutEffect, useRef } from "react";

const PREFIX = "portal-palette-arrival:";
const TRAVEL_MS = 1050;
const BLEND_MS = 260;

export function PortalPaletteArrival({ clientId }: { clientId: string }) {
  const wave = useRef<HTMLDivElement>(null);
  const entry = useRef<{ clientId: string; play: boolean } | null>(null);
  const gradientId = useId().replace(/:/g, "");

  useLayoutEffect(() => {
    if (entry.current?.clientId !== clientId) {
      let play = false;
      try {
        play = sessionStorage.getItem(`${PREFIX}${clientId}`) === "true";
        sessionStorage.removeItem(`${PREFIX}${clientId}`);
      } catch { /* The final palette remains available without storage. */ }
      entry.current = { clientId, play };
    }
    const layer = wave.current;
    const shell = layer?.closest(".portal-shell");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!entry.current.play || !layer || !shell || reducedMotion.matches ||
        !CSS.supports("color", "oklch(from red l 0 h)")) return;

    const height = window.innerHeight;
    const animations: Animation[] = [];
    // Read final colors and positions before starting any animation.
    const targets = [...shell.querySelectorAll<HTMLElement>('[class*="accent"]')].map((element) => {
      const bounds = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      const properties: Record<string, string> = {};
      for (const token of element.classList) {
        if (/^text-accent(?:\/|$)/.test(token)) properties.color = style.color;
        if (/^bg-accent(?:-soft|-hover)?(?:\/|$)/.test(token)) properties.backgroundColor = style.backgroundColor;
        if (/^border-accent(?:\/|$)/.test(token)) {
          properties.borderTopColor = style.borderTopColor;
          properties.borderRightColor = style.borderRightColor;
          properties.borderBottomColor = style.borderBottomColor;
          properties.borderLeftColor = style.borderLeftColor;
        }
      }
      return { element, bounds, properties };
    });
    for (const { element, bounds, properties } of targets) {
      if (!Object.keys(properties).length || bounds.bottom <= 0 || bounds.top >= height || !bounds.width) continue;
      const neutral = Object.fromEntries(Object.entries(properties).map(([property, color]) => [
        property, `oklch(from ${color} l 0 h)`,
      ]));
      // The midpoint of each blend follows the wave's leading edge.
      const crossing = ((bounds.top + bounds.height / 2 + 60) / (height + 120)) * TRAVEL_MS;
      animations.push(element.animate([neutral, properties], {
        duration: BLEND_MS, delay: Math.max(0, crossing - BLEND_MS / 2),
        easing: "cubic-bezier(0.22, 0.61, 0.36, 1)", fill: "backwards",
      }));
    }
    animations.push(layer.animate([
      { transform: "translateY(-100px)", opacity: 0 },
      { opacity: 1, offset: 0.12 },
      { opacity: 1, offset: 0.84 },
      { transform: `translateY(${height + 20}px)`, opacity: 0 },
    ], { duration: TRAVEL_MS, easing: "linear" }));

    const finish = () => animations.forEach(animation => animation.cancel());
    const timer = window.setTimeout(finish, TRAVEL_MS + BLEND_MS);
    window.addEventListener("pointerdown", finish, { once: true, passive: true });
    window.addEventListener("scroll", finish, { once: true, passive: true, capture: true });
    window.addEventListener("resize", finish, { once: true });
    reducedMotion.addEventListener("change", finish, { once: true });
    return () => {
      window.clearTimeout(timer);
      finish();
      window.removeEventListener("pointerdown", finish);
      window.removeEventListener("scroll", finish, true);
      window.removeEventListener("resize", finish);
      reducedMotion.removeEventListener("change", finish);
    };
  }, [clientId]);

  return (
    <div ref={wave} aria-hidden="true" className="palette-arrival-wave">
      <svg viewBox="0 0 1000 80" preserveAspectRatio="none">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="currentColor" stopOpacity="0" />
            <stop offset="1" stopColor="currentColor" stopOpacity="0.055" />
          </linearGradient>
        </defs>
        <path d="M0 0H1000V34Q500 60 0 34Z" fill={`url(#${gradientId})`} />
        <path d="M0 34Q500 60 1000 34" fill="none" stroke="currentColor" strokeOpacity="0.12" strokeWidth="0.8" vectorEffect="non-scaling-stroke" />
      </svg>
    </div>
  );
}
