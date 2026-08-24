"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Input, Select, Label, Field } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import type { AuditResult } from "@/lib/website-analyzer";
import { ScanSearch, CheckCircle2, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";

export function AnalyzeForm({ clients }: { clients: { id: string; business_name: string }[] }) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<AuditResult | null>(null);
  const [score, setScore] = useState<{ seo: number; accessibility: number; performance: number } | null>(null);
  const router = useRouter();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const url = String(formData.get("url") || "");
    const clientId = String(formData.get("client_id") || "") || undefined;
    if (!url) return;

    startTransition(async () => {
      try {
        const res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url, clientId }),
        });
        const data = await res.json();
        if (data.error) {
          toast.error(data.error);
          return;
        }
        setResult(data.result);
        setScore(data.score);
        if (clientId) router.refresh();
      } catch {
        toast.error("No se pudo analizar el sitio.");
      }
    });
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardBody>
          <form onSubmit={onSubmit} className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <Field className="mb-0 flex-1">
              <Label>URL del sitio</Label>
              <Input name="url" placeholder="https://motocenter.com.uy" required />
            </Field>
            {clients.length > 0 && (
              <Field className="mb-0 sm:w-56">
                <Label>Cliente (opcional)</Label>
                <Select name="client_id" defaultValue="">
                  <option value="">Sin asociar</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.business_name}
                    </option>
                  ))}
                </Select>
              </Field>
            )}
            <Button type="submit" disabled={pending}>
              <ScanSearch size={16} /> {pending ? "Analizando…" : "Analizar sitio"}
            </Button>
          </form>
        </CardBody>
      </Card>

      {result && score && <AuditReport result={result} score={score} />}
    </div>
  );
}

function ScoreBadge({ value }: { value: number }) {
  return <Badge tone={value >= 70 ? "success" : value >= 40 ? "warning" : "danger"}>{value}/100</Badge>;
}

function AuditReport({
  result,
  score,
}: {
  result: AuditResult;
  score: { seo: number; accessibility: number; performance: number };
}) {
  return (
    <div className="animate-fade-in space-y-6">
      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold">Auditoría del sitio — Resumen</h2>
        </CardHeader>
        <CardBody className="grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-xs text-muted-2">SEO</p>
            <ScoreBadge value={score.seo} />
          </div>
          <div>
            <p className="text-xs text-muted-2">Accesibilidad básica</p>
            <ScoreBadge value={score.accessibility} />
          </div>
          <div>
            <p className="text-xs text-muted-2">Performance estimada</p>
            <ScoreBadge value={score.performance} />
          </div>
        </CardBody>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold">Tecnología</h2>
          </CardHeader>
          <CardBody className="space-y-2 text-sm">
            <Row label="Framework" value={result.framework} />
            <Row label="Hosting" value={result.hostingHint} />
            <Row label="Tecnologías detectadas" value={result.technologies.join(", ") || null} />
            <Row label="HTTPS" value={result.https ? "Sí" : "No"} />
            <Row label="Favicon" value={result.favicon} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold">SEO</h2>
          </CardHeader>
          <CardBody className="space-y-2 text-sm">
            <Row label="Title" value={result.title} />
            <Row label="Meta description" value={result.metaDescription} />
            <Row label="Canonical" value={result.canonical} />
            <Row label="Open Graph" value={Object.keys(result.openGraph).length ? Object.keys(result.openGraph).join(", ") : null} />
            <Row label="robots.txt" value={result.robotsTxt.exists ? "Encontrado" : "No encontrado"} />
            <Row label="Sitemap" value={result.sitemap.exists ? result.sitemap.url : "No encontrado"} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold">Estructura y contenido</h2>
          </CardHeader>
          <CardBody className="space-y-2 text-sm">
            <Row label="Imágenes" value={`${result.images.total} (${result.images.withoutAlt} sin alt)`} />
            <Row label="Links" value={`${result.links.total} totales (${result.links.internal} internos, ${result.links.external} externos)`} />
            <Row label="Formularios" value={String(result.forms)} />
            <Row label="WhatsApp detectado" value={result.hasWhatsApp ? "Sí" : "No"} />
            <Row label="Redes sociales" value={result.socialLinks.join(", ") || null} />
            <Row label="Viewport (responsive)" value={result.hasViewportMeta ? "Sí" : "No"} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold">Errores y recomendaciones</h2>
          </CardHeader>
          <CardBody className="space-y-3 text-sm">
            {result.errors.length > 0 && (
              <div>
                <p className="mb-1 text-xs font-medium text-danger">Errores encontrados</p>
                <ul className="space-y-1">
                  {result.errors.map((e, i) => (
                    <li key={i} className="flex items-start gap-2 text-muted">
                      <XCircle size={14} className="mt-0.5 shrink-0 text-danger" /> {e}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {result.recommendations.length > 0 && (
              <div>
                <p className="mb-1 text-xs font-medium text-accent">Recomendaciones</p>
                <ul className="space-y-1">
                  {result.recommendations.map((r, i) => (
                    <li key={i} className="flex items-start gap-2 text-muted">
                      <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-accent" /> {r}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      {result.structure.length > 0 && (
        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold">Estructura detectada</h2>
          </CardHeader>
          <CardBody>
            <ul className="space-y-1 text-sm text-muted">
              {result.structure.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </CardBody>
        </Card>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="shrink-0 text-muted-2">{label}</span>
      <span className="text-right font-medium">{value || "Información no disponible"}</span>
    </div>
  );
}
