import { NextResponse, type NextRequest } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createClient } from "@/lib/supabase/server";
import { decryptSecret } from "@/lib/crypto";
import {
  FichaTecnicaDoc,
  EntregaDoc,
  InfraestructuraDoc,
  CredencialesDoc,
  ComprobantePagoDoc,
  CuentasBancoDoc,
} from "@/lib/pdf/templates";
import type { Client, Project, Payment } from "@/lib/types";

function formatFilenameDate(iso: string) {
  return iso.slice(0, 10);
}

async function loadInfra(supabase: Awaited<ReturnType<typeof createClient>>, projectId: string) {
  const [domains, hosting, repositories, databases] = await Promise.all([
    supabase.from("domains").select("*").eq("project_id", projectId),
    supabase.from("hosting").select("*").eq("project_id", projectId),
    supabase.from("repositories").select("*").eq("project_id", projectId),
    supabase.from("project_databases").select("*").eq("project_id", projectId),
  ]);
  return {
    domains: domains.data ?? [],
    hosting: hosting.data ?? [],
    repositories: repositories.data ?? [],
    databases: databases.data ?? [],
  };
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  const { searchParams } = request.nextUrl;
  const type = searchParams.get("type");
  let clientId = searchParams.get("clientId");
  let projectId = searchParams.get("projectId");

  if (!type) {
    return NextResponse.json({ error: "Falta el parámetro type." }, { status: 400 });
  }

  // Cuentas bancarias: no está atado a un cliente/proyecto, es la lista
  // completa de cuentas activas para compartir con quien haga falta.
  if (type === "cuentas-banco") {
    const { data: methods } = await supabase
      .from("payment_methods")
      .select("*")
      .eq("is_active", true)
      .order("position", { ascending: true });
    const pdfBuffer = await renderToBuffer(<CuentasBancoDoc methods={methods ?? []} />);
    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="MR14-cuentas-bancarias.pdf"`,
      },
    });
  }

  // El comprobante de pago se pide por paymentId — de ahí se saca solo
  // el cliente y el proyecto, no hace falta pasarlos aparte.
  let payment: Payment | null = null;
  if (type === "comprobante") {
    const paymentId = searchParams.get("paymentId");
    if (!paymentId) return NextResponse.json({ error: "Falta paymentId." }, { status: 400 });
    const { data } = await supabase.from("payments").select("*").eq("id", paymentId).single();
    if (!data) return NextResponse.json({ error: "Pago no encontrado." }, { status: 404 });
    payment = data;
    clientId = data.client_id;
    projectId = data.project_id;
  }

  if (!clientId) {
    return NextResponse.json({ error: "Falta el parámetro clientId." }, { status: 400 });
  }

  const { data: client } = await supabase.from("clients").select("*").eq("id", clientId).single();
  if (!client) return NextResponse.json({ error: "Cliente no encontrado." }, { status: 404 });

  let pdfBuffer: Buffer;
  let filename = "documento-mr14.pdf";

  if (type === "comprobante") {
    if (!projectId || !payment) {
      return NextResponse.json({ error: "Falta projectId." }, { status: 400 });
    }
    const { data: project } = await supabase.from("projects").select("*").eq("id", projectId).single();
    if (!project) return NextResponse.json({ error: "Proyecto no encontrado." }, { status: 404 });

    const [allPayments, installments] = await Promise.all([
      supabase.from("payments").select("*").eq("project_id", projectId).order("paid_at", { ascending: false }),
      supabase.from("project_installments").select("*").eq("project_id", projectId).order("number", { ascending: true }),
    ]);

    pdfBuffer = await renderToBuffer(
      <ComprobantePagoDoc
        client={client as Client}
        project={project as Project}
        payment={payment}
        allPayments={allPayments.data ?? []}
        installments={installments.data ?? []}
      />
    );
    filename = `MR14-comprobante-${client.business_name}-${formatFilenameDate(payment.paid_at)}.pdf`;
  } else if (type === "credenciales") {
    const ids = searchParams.get("ids")?.split(",").filter(Boolean) ?? [];
    let query = supabase.from("credentials").select("*").eq("client_id", clientId);
    if (ids.length > 0) query = query.in("id", ids);
    const { data: creds } = await query;

    const withPlain = (creds ?? []).map((c) => ({
      ...c,
      plainSecret: (() => {
        try {
          return decryptSecret(c.secret_encrypted);
        } catch {
          return "(no se pudo descifrar)";
        }
      })(),
    }));

    pdfBuffer = await renderToBuffer(
      <CredencialesDoc client={client as Client} credentials={withPlain} />
    );
    filename = `MR14-credenciales-${client.business_name}.pdf`;
  } else {
    if (!projectId) {
      return NextResponse.json({ error: "Falta projectId." }, { status: 400 });
    }
    const { data: project } = await supabase.from("projects").select("*").eq("id", projectId).single();
    if (!project) return NextResponse.json({ error: "Proyecto no encontrado." }, { status: 404 });
    const infra = await loadInfra(supabase, projectId);

    if (type === "ficha-tecnica") {
      pdfBuffer = await renderToBuffer(
        <FichaTecnicaDoc client={client as Client} project={project as Project} infra={infra} />
      );
      filename = `MR14-ficha-tecnica-${project.name}.pdf`;
    } else if (type === "entrega") {
      const accesses: string[] = [];
      if (infra.hosting[0]?.production_url) accesses.push(`Acceso al hosting (${infra.hosting[0].platform})`);
      if (infra.repositories[0]?.url) accesses.push(`Acceso al repositorio (${infra.repositories[0].url})`);
      if (infra.domains[0]?.domain) accesses.push(`Gestión del dominio ${infra.domains[0].domain}`);
      pdfBuffer = await renderToBuffer(
        <EntregaDoc
          client={client as Client}
          project={project as Project}
          infra={infra}
          accessesDelivered={accesses}
          responsible="Mateo Rodríguez · MR14"
        />
      );
      filename = `MR14-entrega-${project.name}.pdf`;
    } else if (type === "infraestructura") {
      pdfBuffer = await renderToBuffer(
        <InfraestructuraDoc client={client as Client} project={project as Project} infra={infra} />
      );
      filename = `MR14-infraestructura-${project.name}.pdf`;
    } else {
      return NextResponse.json({ error: "Tipo de documento inválido." }, { status: 400 });
    }
  }

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${filename.replace(/[^\w.\- ]/g, "")}"`,
    },
  });
}
