"use client";

import { useState } from "react";
import { Select, Input, Label, Field } from "@/components/ui/Input";
import type { PaymentMethod } from "@/lib/types";

/**
 * Selector de "a qué cuenta transferiste / si fue efectivo", en vez de un
 * texto libre — las opciones salen de las cuentas cargadas en
 * Configuración. "Otro" deja un texto libre para casos que no encajan
 * (ej. una plataforma que no está cargada como cuenta).
 */
export function PaymentMethodField({
  paymentMethods,
  defaultValue,
}: {
  paymentMethods: PaymentMethod[];
  defaultValue?: string | null;
}) {
  const options = ["Efectivo", ...paymentMethods.map((m) => m.label)];
  const isKnown = !defaultValue || options.includes(defaultValue);
  const [choice, setChoice] = useState(isKnown ? defaultValue || "" : "otro");

  return (
    <Field className="mb-0">
      <Label>Método</Label>
      <Select
        name={choice === "otro" ? "method_choice" : "method"}
        value={choice}
        onChange={(e) => setChoice(e.target.value)}
      >
        <option value="" disabled>
          Elegí una opción
        </option>
        <option value="Efectivo">Efectivo</option>
        {paymentMethods.map((m) => (
          <option key={m.id} value={m.label}>
            {m.label}
          </option>
        ))}
        <option value="otro">Otro…</option>
      </Select>
      {choice === "otro" && (
        <Input
          name="method"
          className="mt-2"
          placeholder="Especificar método"
          defaultValue={isKnown ? "" : (defaultValue ?? "")}
        />
      )}
    </Field>
  );
}
