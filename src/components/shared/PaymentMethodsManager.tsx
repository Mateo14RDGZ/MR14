"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea, Label, Field } from "@/components/ui/Input";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
import { EmptyState } from "@/components/ui/Empty";
import { Badge } from "@/components/ui/Badge";
import {
  createPaymentMethodAction,
  updatePaymentMethodAction,
  togglePaymentMethodActiveAction,
  deletePaymentMethodAction,
} from "@/actions/paymentMethods";
import type { PaymentMethod } from "@/lib/types";
import { Landmark, Pencil, Trash2 } from "lucide-react";

function MethodForm({
  method,
  onSubmit,
  onCancel,
  pending,
}: {
  method?: PaymentMethod;
  onSubmit: (formData: FormData) => void;
  onCancel?: () => void;
  pending: boolean;
}) {
  return (
    <form action={onSubmit} className="space-y-3 rounded-lg border border-border p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field className="mb-0">
          <Label>Etiqueta *</Label>
          <Input name="label" required defaultValue={method?.label} placeholder="Ej: Cuenta pesos BROU" />
        </Field>
        <Field className="mb-0">
          <Label>Banco</Label>
          <Input name="bank" defaultValue={method?.bank ?? ""} />
        </Field>
        <Field className="mb-0">
          <Label>Titular</Label>
          <Input name="account_holder" defaultValue={method?.account_holder ?? ""} />
        </Field>
        <Field className="mb-0">
          <Label>Número de cuenta / alias</Label>
          <Input name="account_number" defaultValue={method?.account_number ?? ""} />
        </Field>
        <Field className="mb-0">
          <Label>Tipo de cuenta</Label>
          <Input name="account_type" defaultValue={method?.account_type ?? ""} placeholder="Caja de ahorro, corriente…" />
        </Field>
        <Field className="mb-0">
          <Label>Moneda</Label>
          <Select name="currency" defaultValue={method?.currency ?? "UYU"}>
            <option value="UYU">UYU</option>
            <option value="USD">USD</option>
          </Select>
        </Field>
      </div>
      <Field className="mb-0">
        <Label>Notas</Label>
        <Textarea name="notes" rows={2} defaultValue={method?.notes ?? ""} placeholder="Ej: enviar comprobante por WhatsApp" />
      </Field>
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Guardando…" : method ? "Guardar cambios" : "Agregar cuenta"}
        </Button>
        {onCancel && (
          <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
            Cancelar
          </Button>
        )}
      </div>
    </form>
  );
}

export function PaymentMethodsManager({ methods }: { methods: PaymentMethod[] }) {
  const [pending, startTransition] = useTransition();
  const [showNew, setShowNew] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  function submitNew(formData: FormData) {
    startTransition(async () => {
      const result = await createPaymentMethodAction(formData);
      if (result?.error) toast.error(result.error);
      else {
        toast.success("Cuenta agregada.");
        setShowNew(false);
      }
    });
  }

  function submitEdit(id: string, formData: FormData) {
    startTransition(async () => {
      const result = await updatePaymentMethodAction(id, formData);
      if (result?.error) toast.error(result.error);
      else {
        toast.success("Cuenta actualizada.");
        setEditingId(null);
      }
    });
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-2">
        Estas cuentas las ve el cliente en su portal (Pagos) cuando tiene saldo pendiente, para saber adónde transferir.
      </p>

      {methods.length === 0 ? (
        <EmptyState icon={Landmark} title="Sin cuentas cargadas" />
      ) : (
        <ul className="space-y-2">
          {methods.map((m) =>
            editingId === m.id ? (
              <li key={m.id}>
                <MethodForm
                  method={m}
                  pending={pending}
                  onSubmit={(fd) => submitEdit(m.id, fd)}
                  onCancel={() => setEditingId(null)}
                />
              </li>
            ) : (
              <li key={m.id} className="rounded-lg border border-border p-4 text-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{m.label}</p>
                      <Badge tone={m.is_active ? "success" : "muted"}>{m.is_active ? "Activa" : "Oculta"}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-2">
                      {[m.bank, m.account_type, m.currency].filter(Boolean).join(" · ")}
                    </p>
                    {m.account_holder && <p className="text-xs text-muted-2">Titular: {m.account_holder}</p>}
                    {m.account_number && <p className="text-xs text-muted-2">{m.account_number}</p>}
                    {m.notes && <p className="mt-1 text-xs text-muted-2">{m.notes}</p>}
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={pending}
                      onClick={() =>
                        startTransition(async () => {
                          try {
                            await togglePaymentMethodActiveAction(m.id, !m.is_active);
                          } catch (e) {
                            toast.error(e instanceof Error ? e.message : "No se pudo cambiar.");
                          }
                        })
                      }
                    >
                      {m.is_active ? "Ocultar" : "Mostrar"}
                    </Button>
                    <button
                      type="button"
                      onClick={() => setEditingId(m.id)}
                      className="flex h-8 w-8 items-center justify-center rounded-md text-muted-2 hover:bg-surface-2 hover:text-foreground"
                    >
                      <Pencil size={14} />
                    </button>
                    <ConfirmButton
                      action={() => deletePaymentMethodAction(m.id)}
                      label={<Trash2 size={14} />}
                      variant="ghost"
                      size="icon"
                      confirmTitle="¿Eliminar esta cuenta?"
                    />
                  </div>
                </div>
              </li>
            )
          )}
        </ul>
      )}

      {showNew ? (
        <MethodForm pending={pending} onSubmit={submitNew} onCancel={() => setShowNew(false)} />
      ) : (
        <Button size="sm" variant="secondary" onClick={() => setShowNew(true)}>
          Agregar cuenta
        </Button>
      )}
    </div>
  );
}
