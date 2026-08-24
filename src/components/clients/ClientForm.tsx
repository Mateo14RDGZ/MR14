"use client";

import { useActionState } from "react";
import { Input, Textarea, Select, Label, Field } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { CLIENT_STATUSES, type Client } from "@/lib/types";

type ActionResult = { error?: string } | undefined;

export function ClientForm({
  client,
  action,
}: {
  client?: Client;
  action: (prevState: ActionResult, formData: FormData) => Promise<ActionResult>;
}) {
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(action, undefined);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <form action={formAction} className="animate-fade-in space-y-8">
      {state?.error && (
        <div className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
          {state.error}
        </div>
      )}

      <section>
        <h2 className="mb-4 text-sm font-semibold text-accent">Información esencial</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <Label>Nombre comercial *</Label>
            <Input name="business_name" defaultValue={client?.business_name} required />
          </Field>
          <Field>
            <Label>Responsable</Label>
            <Input name="contact_name" defaultValue={client?.contact_name ?? ""} />
          </Field>
          <Field>
            <Label>Teléfono / WhatsApp</Label>
            <Input name="whatsapp" defaultValue={client?.whatsapp ?? ""} />
          </Field>
          <Field>
            <Label>Email</Label>
            <Input type="email" name="email" defaultValue={client?.email ?? ""} />
          </Field>
        </div>
      </section>

      {/* El resto se puede completar después — no hace falta para dar de alta al cliente. */}
      <details className="group rounded-lg border border-border" open={Boolean(client)}>
        <summary className="cursor-pointer list-none px-5 py-3.5 text-sm font-medium text-muted marker:content-none group-open:border-b group-open:border-border">
          Información adicional (opcional)
        </summary>
        <div className="space-y-8 p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <Label>Teléfono (si es distinto del WhatsApp)</Label>
              <Input name="phone" defaultValue={client?.phone ?? ""} />
            </Field>
            <Field>
              <Label>Sitio web</Label>
              <Input name="website" defaultValue={client?.website ?? ""} placeholder="https://" />
            </Field>
            <Field>
              <Label>C.I.</Label>
              <Input name="ci" defaultValue={client?.ci ?? ""} />
            </Field>
            <Field>
              <Label>RUT</Label>
              <Input name="rut" defaultValue={client?.rut ?? ""} />
            </Field>
          </div>

          <div>
            <h3 className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-2">Ubicación</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field className="sm:col-span-2">
                <Label>Dirección</Label>
                <Input name="address" defaultValue={client?.address ?? ""} />
              </Field>
              <Field>
                <Label>Ciudad</Label>
                <Input name="city" defaultValue={client?.city ?? ""} />
              </Field>
              <Field>
                <Label>Departamento</Label>
                <Input name="state" defaultValue={client?.state ?? ""} />
              </Field>
              <Field>
                <Label>País</Label>
                <Input name="country" defaultValue={client?.country ?? "Uruguay"} />
              </Field>
            </div>
          </div>

          {client && (
            <div>
              <h3 className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-2">Redes sociales</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                {["instagram", "facebook", "tiktok", "linkedin", "x"].map((s) => (
                  <Field key={s}>
                    <Label className="capitalize">{s}</Label>
                    <Input
                      name={`social_${s}`}
                      defaultValue={client?.social_links?.[s] ?? ""}
                      placeholder={`https://${s}.com/...`}
                    />
                  </Field>
                ))}
              </div>
            </div>
          )}

          <div>
            <h3 className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-2">Estado y fechas</h3>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field>
                <Label>Estado</Label>
                <Select name="status" defaultValue={client?.status ?? "prospecto"}>
                  {CLIENT_STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field>
                <Label>Fecha de inicio</Label>
                <Input type="date" name="start_date" defaultValue={client?.start_date ?? (client ? "" : today)} />
              </Field>
              <Field>
                <Label>Fecha de entrega</Label>
                <Input type="date" name="delivery_date" defaultValue={client?.delivery_date ?? ""} />
              </Field>
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-2">Notas internas</h3>
            <Field className="mb-0">
              <Textarea name="notes" defaultValue={client?.notes ?? ""} rows={4} />
            </Field>
          </div>
        </div>
      </details>

      <div className="flex justify-end gap-3 border-t border-border pt-6">
        <Button type="submit" disabled={pending} size="lg">
          {client ? (pending ? "Guardando…" : "Guardar cambios") : pending ? "Creando…" : "Crear cliente"}
        </Button>
      </div>
    </form>
  );
}
