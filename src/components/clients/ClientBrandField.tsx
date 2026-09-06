"use client";

import { useId, useState } from "react";
import { brandTokens, DEFAULT_BRAND_COLOR } from "@/lib/brand-color";

export function ClientBrandField({ value }: { value?: string | null }) {
  const id = useId();
  const [manual, setManual] = useState(Boolean(value));
  const [color, setColor] = useState(value || DEFAULT_BRAND_COLOR);
  const tokens = brandTokens(color);
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold text-accent">Color del panel del cliente</h2>
      <p id={`${id}-help`} className="text-sm text-muted">
        Usamos un solo color del logo para los detalles. El fondo siempre es blanco.
        Los tonos claros se ajustan para facilitar la lectura.
      </p>
      <label className="flex min-h-11 items-center gap-3 text-sm">
        <input type="checkbox" checked={manual} onChange={(e) => setManual(e.target.checked)}
          aria-describedby={`${id}-help`} className="h-5 w-5 accent-accent" />
        Elegir el color manualmente
      </label>
      <input type="hidden" name="brand_color" value={manual ? color : ""} />
      {manual ? (
        <div className="flex flex-wrap items-center gap-3">
          <label htmlFor={id} className="text-sm">Color de marca</label>
          <input id={id} type="color" value={color} onChange={(e) => setColor(e.target.value)}
            className="h-11 w-14 cursor-pointer rounded-lg border border-border bg-white p-1" />
          <span className="text-sm text-muted">{color.toUpperCase()}</span>
          <span className="rounded-lg px-4 py-3 text-sm font-medium"
            style={{ background: tokens["--accent"], color: tokens["--accent-foreground"] }}>
            Así se verán los detalles
          </span>
        </div>
      ) : <p className="text-sm text-muted">Automático: se adapta al logo actual y a sus cambios. Sin un color identificable, usamos azul pizarra.</p>}
    </section>
  );
}
