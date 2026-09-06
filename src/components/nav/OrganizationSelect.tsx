"use client";

export function OrganizationSelect({ activeClientId, clients }: {
  activeClientId: string;
  clients: { id: string; name: string }[];
}) {
  return (
    <select name="client_id" aria-label="Elegir negocio" defaultValue={activeClientId}
      onChange={(event) => event.currentTarget.form?.requestSubmit()}
      className="h-11 max-w-40 rounded-lg border border-border bg-surface-2 px-2 text-sm outline-none focus:border-accent">
      {clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
    </select>
  );
}
