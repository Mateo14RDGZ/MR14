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

  return (
    <form action={formAction} className="animate-fade-in space-y-8">
      {state?.error && (
        <div className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
          {state.error}
        </div>
      )}

      <section>
        <h2 className="mb-4 text-sm font-semibold text-accent">Información general</h2>
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
            <Label>C.I.</Label>
            <Input name="ci" defaultValue={client?.ci ?? ""} />
          </Field>
          <Field>
            <Label>RUT</Label>
            <Input name="rut" defaultValue={client?.rut ?? ""} />
          </Field>
          <Field>
            <Label>Teléfono</Label>
            <Input name="phone" defaultValue={client?.phone ?? ""} />
          </Field>
          <Field>
            <Label>WhatsApp</Label>
            <Input name="whatsapp" defaultValue={client?.whatsapp ?? ""} />
          </Field>
          <Field>
            <Label>Email</Label>
            <Input type="email" name="email" defaultValue={client?.email ?? ""} />
          </Field>
          <Field>
            <Label>Sitio web</Label>
            <Input name="website" defaultValue={client?.website ?? ""} placeholder="https://" />
          </Field>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-sm font-semibold text-accent">Ubicación</h2>
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
      </section>

      {client && (
        <section>
          <h2 className="mb-4 text-sm font-semibold text-accent">Redes sociales</h2>
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
        </section>
      )}

      <section>
        <h2 className="mb-4 text-sm font-semibold text-accent">Estado y fechas</h2>
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
            <Input type="date" name="start_date" defaultValue={client?.start_date ?? ""} />
          </Field>
          <Field>
            <Label>Fecha de entrega</Label>
            <Input type="date" name="delivery_date" defaultValue={client?.delivery_date ?? ""} />
          </Field>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-sm font-semibold text-accent">Notas internas</h2>
        <Field>
          <Textarea name="notes" defaultValue={client?.notes ?? ""} rows={4} />
        </Field>
      </section>

      <div className="flex justify-end gap-3 border-t border-border pt-6">
        <Button type="submit" disabled={pending} size="lg">
          {pending ? "Guardando…" : client ? "Guardar cambios" : "Crear cliente"}
        </Button>
      </div>
    </form>
  );
}
