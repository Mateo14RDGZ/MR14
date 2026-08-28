import { PdfPage, PdfHeader, Section, InfoRow, styles, colors, getLogoDataUri } from "./shared";
import { Text, View, Image } from "@react-pdf/renderer";
import { formatCurrency, formatDate } from "@/lib/utils";
import { installmentsWithStatus } from "@/lib/installments";
import type {
  Client,
  Project,
  Payment,
  ProjectInstallment,
  DomainRow,
  HostingRow,
  RepositoryRow,
  DatabaseRow,
  CredentialRow,
} from "@/lib/types";

interface InfraBundle {
  domains: DomainRow[];
  hosting: HostingRow[];
  repositories: RepositoryRow[];
  databases: DatabaseRow[];
}

export function FichaTecnicaDoc({
  client,
  project,
  infra,
}: {
  client: Client;
  project: Project;
  infra: InfraBundle;
}) {
  const domain = infra.domains[0];
  const hosting = infra.hosting[0];
  const repo = infra.repositories[0];
  const db = infra.databases[0];

  return (
    <PdfPage>
      <PdfHeader docTitle="Ficha técnica del proyecto" subtitle={`${client.business_name} — ${project.name}`} />

      <Section title="Cliente">
        <InfoRow label="Nombre comercial" value={client.business_name} />
        <InfoRow label="Responsable" value={client.contact_name} />
        <InfoRow label="Email" value={client.email} />
        <InfoRow label="Teléfono / WhatsApp" value={client.whatsapp || client.phone} />
      </Section>

      <Section title="Proyecto">
        <InfoRow label="Nombre" value={project.name} />
        <InfoRow label="Tipo" value={project.type} />
        <InfoRow label="Descripción" value={project.description} />
        <InfoRow label="Fecha de inicio" value={formatDate(project.start_date)} />
        <InfoRow label="Fecha de entrega" value={formatDate(project.actual_delivery_date || project.estimated_delivery_date)} />
        <InfoRow label="Estado" value={project.status} />
        <InfoRow label="Precio" value={formatCurrency(project.price, project.currency)} />
      </Section>

      <Section title="Stack e infraestructura">
        <InfoRow label="Dominio" value={domain?.domain} />
        <InfoRow label="Hosting" value={hosting ? `${hosting.platform} — ${hosting.production_url ?? ""}` : null} />
        <InfoRow label="Repositorio" value={repo?.url ?? repo?.name} />
        <InfoRow label="Base de datos" value={db ? `${db.provider} — ${db.project_name ?? ""}` : null} />
      </Section>

      <Section title="URLs">
        <InfoRow label="Producción" value={hosting?.production_url} />
        <InfoRow label="Preview" value={hosting?.preview_url} />
        <InfoRow label="Sitio del cliente" value={client.website} />
      </Section>
    </PdfPage>
  );
}

export function EntregaDoc({
  client,
  project,
  infra,
  accessesDelivered,
  responsible,
}: {
  client: Client;
  project: Project;
  infra: InfraBundle;
  accessesDelivered: string[];
  responsible: string;
}) {
  const domain = infra.domains[0];
  const hosting = infra.hosting[0];
  const repo = infra.repositories[0];

  return (
    <PdfPage>
      <PdfHeader docTitle="Entrega del proyecto" subtitle={`${client.business_name} — ${project.name}`} />

      <Section title="Información del sitio">
        <InfoRow label="Cliente" value={client.business_name} />
        <InfoRow label="Proyecto" value={project.name} />
        <InfoRow label="Fecha de entrega" value={formatDate(project.actual_delivery_date || new Date().toISOString())} />
        <InfoRow label="Responsable de la entrega" value={responsible} />
      </Section>

      <Section title="URLs">
        <InfoRow label="Producción" value={hosting?.production_url} />
        <InfoRow label="Dominio" value={domain?.domain} />
      </Section>

      <Section title="Infraestructura entregada">
        <InfoRow label="Hosting" value={hosting?.platform} />
        <InfoRow label="Repositorio" value={repo?.url} />
      </Section>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Accesos entregados</Text>
        {accessesDelivered.length === 0 && <Text style={styles.value}>Información no disponible</Text>}
        {accessesDelivered.map((a, i) => (
          <Text key={i} style={{ ...styles.value, marginBottom: 4 }}>
            • {a}
          </Text>
        ))}
      </View>
    </PdfPage>
  );
}

export function InfraestructuraDoc({
  client,
  project,
  infra,
}: {
  client: Client;
  project: Project;
  infra: InfraBundle;
}) {
  return (
    <PdfPage>
      <PdfHeader docTitle="Documentación de infraestructura" subtitle={`${client.business_name} — ${project.name}`} />

      {infra.domains.map((d) => (
        <Section key={d.id} title={`Dominio — ${d.domain}`}>
          <InfoRow label="Registrador" value={d.registrar} />
          <InfoRow label="Titular" value={d.owner_name} />
          <InfoRow label="Fecha de compra" value={formatDate(d.purchase_date)} />
          <InfoRow label="Vencimiento" value={formatDate(d.expiry_date)} />
          <InfoRow label="Renovación automática" value={d.auto_renew ? "Sí" : "No"} />
          <InfoRow label="Nameservers" value={d.nameservers} />
          <InfoRow label="DNS" value={d.dns_notes} />
        </Section>
      ))}

      {infra.hosting.map((h) => (
        <Section key={h.id} title={`Hosting — ${h.platform}`}>
          <InfoRow label="Proyecto" value={h.project_name} />
          <InfoRow label="URL producción" value={h.production_url} />
          <InfoRow label="URL preview" value={h.preview_url} />
          <InfoRow label="Cuenta" value={h.account} />
          <InfoRow label="Team" value={h.team} />
          <InfoRow label="Plan" value={h.plan} />
        </Section>
      ))}

      {infra.repositories.map((r) => (
        <Section key={r.id} title={`GitHub — ${r.name ?? "repositorio"}`}>
          <InfoRow label="Organización" value={r.organization} />
          <InfoRow label="Rama principal" value={r.main_branch} />
          <InfoRow label="URL" value={r.url} />
          <InfoRow label="Visibilidad" value={r.is_private ? "Privado" : "Público"} />
        </Section>
      ))}

      {infra.databases.map((db) => (
        <Section key={db.id} title={`Base de datos — ${db.provider}`}>
          <InfoRow label="Proyecto" value={db.project_name} />
          <InfoRow label="URL" value={db.url} />
          <InfoRow label="Región" value={db.region} />
          <InfoRow label="Notas" value={db.notes} />
        </Section>
      ))}

      {infra.domains.length + infra.hosting.length + infra.repositories.length + infra.databases.length === 0 && (
        <Text style={styles.value}>Información no disponible: no hay infraestructura registrada para este proyecto.</Text>
      )}
    </PdfPage>
  );
}

export function CredencialesDoc({
  client,
  credentials,
}: {
  client: Client;
  credentials: (CredentialRow & { plainSecret: string })[];
}) {
  return (
    <PdfPage>
      <PdfHeader docTitle="Credenciales del cliente" subtitle={client.business_name} />

      <View style={styles.confidentialBanner}>
        <Text style={styles.confidentialText}>
          DOCUMENTO CONFIDENCIAL — No compartas este documento sin autorización del cliente.
        </Text>
      </View>

      {credentials.map((c) => (
        <Section key={c.id} title={c.service_label || c.service}>
          <InfoRow label="Usuario / email" value={c.username} />
          <InfoRow label="Contraseña" value={c.plainSecret} />
          <InfoRow label="URL de acceso" value={c.access_url} />
          <InfoRow label="Última actualización" value={formatDate(c.last_updated)} />
          <InfoRow label="Notas" value={c.notes} />
        </Section>
      ))}

      {credentials.length === 0 && <Text style={styles.value}>No se seleccionaron credenciales.</Text>}
    </PdfPage>
  );
}

export function ComprobantePagoDoc({
  client,
  project,
  payment,
  allPayments,
  installments,
}: {
  client: Client;
  project: Project;
  payment: Payment;
  /** Historial completo de pagos del proyecto (incluye este mismo pago). */
  allPayments: Payment[];
  installments: ProjectInstallment[];
}) {
  const receiptNumber = `MR14-${payment.id.slice(0, 8).toUpperCase()}`;
  const balance = Math.max(0, project.price - project.amount_paid);
  const logo = getLogoDataUri("white");
  const concept = payment.notes || `Pago — ${project.name}`;
  const priorPayments = allPayments
    .filter((p) => p.id !== payment.id)
    .sort((a, b) => (a.paid_at < b.paid_at ? 1 : -1));
  const cuotas = installmentsWithStatus(installments, project.amount_paid);

  return (
    <PdfPage>
      {/* Banda superior a todo el ancho: logo grande + identidad de MR14 a la
          izquierda, número/fecha de comprobante a la derecha — el objetivo
          es que se lea como una factura real, no como una ficha interna. */}
      <View
        style={{
          marginTop: -40,
          marginHorizontal: -40,
          marginBottom: 24,
          paddingHorizontal: 40,
          paddingVertical: 22,
          backgroundColor: colors.ink,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          {logo && (
            // eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf/renderer's Image, no alt prop
            <Image src={logo} style={{ width: 44, height: 44 }} />
          )}
          <View>
            <Text style={{ fontSize: 18, fontFamily: "Helvetica-Bold", color: "#fff" }}>MR14</Text>
            <Text style={{ fontSize: 8, color: colors.accent }}>mateordgz.dev</Text>
          </View>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={{ fontSize: 13, fontFamily: "Helvetica-Bold", color: "#fff" }}>COMPROBANTE DE PAGO</Text>
          <Text style={{ fontSize: 9, color: colors.accent, marginTop: 3 }}>{receiptNumber}</Text>
          <Text style={{ fontSize: 8, color: "#c9c9cc", marginTop: 2 }}>{formatDate(payment.paid_at)}</Text>
        </View>
      </View>

      {/* Emisor / Facturado a, lado a lado — como en una factura real, que
          siempre identifica a las dos partes de la operación. */}
      <View style={{ flexDirection: "row", marginBottom: 20, gap: 24 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ ...styles.label, marginBottom: 4 }}>Emisor</Text>
          <Text style={{ fontSize: 12, fontFamily: "Helvetica-Bold", color: colors.ink, marginBottom: 3 }}>
            Mateo Rodríguez — MR14
          </Text>
          <Text style={{ fontSize: 9, color: colors.muted }}>Montevideo, Uruguay</Text>
          <Text style={{ fontSize: 9, color: colors.muted }}>contacto@mateordgz.dev</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ ...styles.label, marginBottom: 4 }}>Facturado a</Text>
          <Text style={{ fontSize: 12, fontFamily: "Helvetica-Bold", color: colors.ink, marginBottom: 3 }}>
            {client.business_name}
          </Text>
          <Text style={{ fontSize: 9, color: colors.muted }}>{client.contact_name || "-"}</Text>
          <Text style={{ fontSize: 9, color: colors.muted }}>
            {[client.rut || client.ci, client.email].filter(Boolean).join("  ·  ")}
          </Text>
          {(client.whatsapp || client.phone || client.address) && (
            <Text style={{ fontSize: 9, color: colors.muted }}>
              {[client.whatsapp || client.phone, client.address].filter(Boolean).join("  ·  ")}
            </Text>
          )}
        </View>
      </View>

      {/* Detalle, con look de tabla de factura (encabezado con fondo de color). */}
      <View style={{ ...styles.table, marginBottom: 20 }}>
        <View style={{ flexDirection: "row", backgroundColor: colors.accent }}>
          <Text style={{ flex: 2.6, padding: 8, fontSize: 8, color: "#fff", textTransform: "uppercase" }}>Concepto</Text>
          <Text style={{ flex: 1.2, padding: 8, fontSize: 8, color: "#fff", textTransform: "uppercase" }}>Proyecto</Text>
          <Text style={{ flex: 1.8, padding: 8, fontSize: 8, color: "#fff", textTransform: "uppercase" }}>Método</Text>
          <Text
            style={{ flex: 1.2, padding: 8, fontSize: 8, color: "#fff", textTransform: "uppercase", textAlign: "right" }}
          >
            Monto
          </Text>
        </View>
        <View style={styles.tableRowLast}>
          <Text style={{ flex: 2.6, padding: 8, fontSize: 10 }}>{concept}</Text>
          <Text style={{ flex: 1.2, padding: 8, fontSize: 10 }}>{project.name}</Text>
          <Text style={{ flex: 1.8, padding: 8, fontSize: 10 }}>{payment.method || "-"}</Text>
          <Text style={{ flex: 1.2, padding: 8, fontSize: 10, textAlign: "right", fontFamily: "Helvetica-Bold" }}>
            {formatCurrency(payment.amount, project.currency)}
          </Text>
        </View>
      </View>

      {/* Total pagado, destacado — es el número que más importa acá. */}
      <View
        style={{
          alignSelf: "flex-end",
          width: 220,
          backgroundColor: colors.ink,
          borderRadius: 4,
          padding: 14,
          marginBottom: 20,
          alignItems: "flex-end",
        }}
      >
        <Text style={{ fontSize: 8, color: colors.accent, textTransform: "uppercase", marginBottom: 2 }}>
          Total pagado
        </Text>
        <Text style={{ fontSize: 20, fontFamily: "Helvetica-Bold", color: "#fff" }}>
          {formatCurrency(payment.amount, project.currency)}
        </Text>
      </View>

      {/* Contexto del proyecto: dónde queda esto dentro del total — secundario, más chico. */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 4,
          padding: 12,
        }}
      >
        <View>
          <Text style={styles.label}>Precio del proyecto</Text>
          <Text style={styles.value}>{formatCurrency(project.price, project.currency)}</Text>
        </View>
        <View>
          <Text style={styles.label}>Pagado a la fecha</Text>
          <Text style={styles.value}>{formatCurrency(project.amount_paid, project.currency)}</Text>
        </View>
        <View>
          <Text style={styles.label}>Saldo pendiente</Text>
          <Text style={{ ...styles.value, fontFamily: "Helvetica-Bold" }}>
            {balance > 0 ? formatCurrency(balance, project.currency) : "Al día"}
          </Text>
        </View>
      </View>

      {cuotas.length > 0 && (
        <View style={{ marginTop: 20 }}>
          <Text style={styles.sectionTitle}>Plan de cuotas</Text>
          <View style={styles.table}>
            {cuotas.map((c, i) => (
              <View key={c.id} style={i === cuotas.length - 1 ? styles.tableRowLast : styles.tableRow}>
                <Text style={{ flex: 2, padding: 7, fontSize: 9 }}>{c.label || `Cuota ${c.number}`}</Text>
                <Text style={{ flex: 1, padding: 7, fontSize: 9, textAlign: "right" }}>
                  {formatCurrency(c.amount, project.currency)}
                </Text>
                <Text
                  style={{
                    flex: 1,
                    padding: 7,
                    fontSize: 9,
                    textAlign: "right",
                    color: c.paid ? "#2f7d4f" : colors.muted,
                    fontFamily: c.paid ? "Helvetica-Bold" : "Helvetica",
                  }}
                >
                  {c.paid ? "Paga" : c.isNext ? "Próxima" : "Pendiente"}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {priorPayments.length > 0 && (
        <View style={{ marginTop: 20 }}>
          <Text style={styles.sectionTitle}>Historial de pagos anteriores</Text>
          <View style={styles.table}>
            {priorPayments.map((p, i) => (
              <View key={p.id} style={i === priorPayments.length - 1 ? styles.tableRowLast : styles.tableRow}>
                <Text style={{ flex: 1.4, padding: 7, fontSize: 9 }}>{formatDate(p.paid_at)}</Text>
                <Text style={{ flex: 2, padding: 7, fontSize: 9 }}>{p.method || "-"}</Text>
                <Text style={{ flex: 1, padding: 7, fontSize: 9, textAlign: "right" }}>
                  {formatCurrency(p.amount, project.currency)}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      <View
        style={{
          marginTop: 28,
          paddingTop: 12,
          borderTopWidth: 1,
          borderTopColor: colors.border,
        }}
      >
        <Text style={{ fontSize: 8, color: colors.muted }}>
          Este comprobante certifica la recepción del pago indicado arriba, sujeto a la acreditación del medio de
          pago utilizado. Conservalo como constancia.
        </Text>
        <Text style={{ fontSize: 8, color: colors.muted, marginTop: 4 }}>
          Gracias por confiar en MR14. Ante cualquier consulta sobre este comprobante, escribinos a
          contacto@mateordgz.dev.
        </Text>
      </View>
    </PdfPage>
  );
}
