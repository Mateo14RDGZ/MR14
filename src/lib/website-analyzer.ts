import "server-only";
import * as cheerio from "cheerio";

const NA = "Información no disponible";

export interface AuditResult {
  url: string;
  finalUrl: string;
  https: boolean;
  statusCode: number | null;
  title: string;
  metaDescription: string;
  canonical: string | null;
  openGraph: Record<string, string>;
  favicon: string | null;
  headers: Record<string, string>;
  technologies: string[];
  framework: string | null;
  hostingHint: string | null;
  images: { total: number; withoutAlt: number };
  links: { total: number; internal: number; external: number };
  forms: number;
  hasWhatsApp: boolean;
  socialLinks: string[];
  hasViewportMeta: boolean;
  robotsTxt: { exists: boolean; content: string | null };
  sitemap: { exists: boolean; url: string | null };
  structure: string[];
  errors: string[];
  recommendations: string[];
}

function absoluteUrl(base: string, href?: string | null) {
  if (!href) return null;
  try {
    return new URL(href, base).toString();
  } catch {
    return null;
  }
}

export async function analyzeWebsite(rawUrl: string): Promise<AuditResult> {
  let url = rawUrl.trim();
  if (!/^https?:\/\//i.test(url)) url = `https://${url}`;

  const errors: string[] = [];
  const recommendations: string[] = [];
  let statusCode: number | null = null;
  let finalUrl = url;
  let html = "";
  let headers: Record<string, string> = {};

  try {
    const res = await fetch(url, {
      redirect: "follow",
      signal: AbortSignal.timeout(15000),
      headers: { "User-Agent": "Mozilla/5.0 (compatible; MR14-Auditor/1.0)" },
    });
    statusCode = res.status;
    finalUrl = res.url || url;
    headers = Object.fromEntries(res.headers.entries());
    html = await res.text();
    if (!res.ok) errors.push(`El sitio respondió con estado HTTP ${res.status}.`);
  } catch (e) {
    errors.push(`No se pudo acceder al sitio: ${e instanceof Error ? e.message : "error desconocido"}.`);
    return {
      url,
      finalUrl,
      https: url.startsWith("https://"),
      statusCode,
      title: NA,
      metaDescription: NA,
      canonical: null,
      openGraph: {},
      favicon: null,
      headers,
      technologies: [],
      framework: null,
      hostingHint: null,
      images: { total: 0, withoutAlt: 0 },
      links: { total: 0, internal: 0, external: 0 },
      forms: 0,
      hasWhatsApp: false,
      socialLinks: [],
      hasViewportMeta: false,
      robotsTxt: { exists: false, content: null },
      sitemap: { exists: false, url: null },
      structure: [],
      errors,
      recommendations: ["No se pudo completar la auditoría automática. Verificá la URL manualmente."],
    };
  }

  const $ = cheerio.load(html);
  const title = $("title").first().text().trim() || NA;
  const metaDescription = $('meta[name="description"]').attr("content")?.trim() || NA;
  const canonical = absoluteUrl(finalUrl, $('link[rel="canonical"]').attr("href"));
  const hasViewportMeta = $('meta[name="viewport"]').length > 0;

  const openGraph: Record<string, string> = {};
  $('meta[property^="og:"]').each((_, el) => {
    const prop = $(el).attr("property");
    const content = $(el).attr("content");
    if (prop && content) openGraph[prop] = content;
  });

  const faviconHref =
    $('link[rel="icon"]').attr("href") ||
    $('link[rel="shortcut icon"]').attr("href") ||
    $('link[rel="apple-touch-icon"]').attr("href");
  const favicon = absoluteUrl(finalUrl, faviconHref) ?? absoluteUrl(finalUrl, "/favicon.ico");

  // Imágenes
  const imgs = $("img");
  const imagesWithoutAlt = imgs.filter((_, el) => !$(el).attr("alt")?.trim()).length;

  // Links
  const allLinks = $("a[href]");
  let internal = 0;
  let external = 0;
  const origin = (() => {
    try {
      return new URL(finalUrl).origin;
    } catch {
      return null;
    }
  })();
  const socialPatterns = ["instagram.com", "facebook.com", "twitter.com", "x.com", "tiktok.com", "linkedin.com", "youtube.com"];
  const socialLinks = new Set<string>();
  let hasWhatsApp = false;

  allLinks.each((_, el) => {
    const href = $(el).attr("href") || "";
    if (href.includes("wa.me") || href.includes("api.whatsapp.com")) hasWhatsApp = true;
    for (const pattern of socialPatterns) {
      if (href.includes(pattern)) socialLinks.add(absoluteUrl(finalUrl, href) ?? href);
    }
    const abs = absoluteUrl(finalUrl, href);
    if (abs && origin) {
      if (abs.startsWith(origin)) internal++;
      else external++;
    }
  });

  const forms = $("form").length;

  // Estructura básica: headings + nav links
  const structure: string[] = [];
  $("h1, h2").slice(0, 15).each((_, el) => {
    const tag = (el as { tagName?: string; name?: string }).tagName || (el as { name?: string }).name || "h";
    const text = $(el).text().trim();
    if (text) structure.push(`${tag.toUpperCase()}: ${text}`);
  });

  // Tecnologías
  const technologies: string[] = [];
  let framework: string | null = null;
  const generator = $('meta[name="generator"]').attr("content");
  if (generator) technologies.push(generator);
  if (html.includes("__NEXT_DATA__") || html.includes("/_next/")) {
    framework = "Next.js";
    technologies.push("Next.js");
  } else if (html.includes("data-reactroot") || html.includes("react-dom")) {
    framework = "React";
    technologies.push("React");
  } else if (html.includes("wp-content") || html.includes("wp-includes")) {
    framework = "WordPress";
    technologies.push("WordPress");
  } else if (html.includes("cdn.shopify.com")) {
    framework = "Shopify";
    technologies.push("Shopify");
  } else if (html.includes("static.wixstatic.com")) {
    framework = "Wix";
    technologies.push("Wix");
  } else if (html.includes("squarespace")) {
    framework = "Squarespace";
    technologies.push("Squarespace");
  }
  if (html.includes("gtag(") || html.includes("googletagmanager.com")) technologies.push("Google Analytics / Tag Manager");
  if (html.includes("google-site-verification")) technologies.push("Google Search Console");
  if (html.includes("maps.google") || html.includes("maps.googleapis")) technologies.push("Google Maps");
  if (html.includes("cloudflare")) technologies.push("Cloudflare");

  const server = headers["server"];
  const poweredBy = headers["x-powered-by"];
  let hostingHint: string | null = null;
  if (headers["x-vercel-id"] || (server && server.toLowerCase().includes("vercel"))) hostingHint = "Vercel";
  else if (headers["x-nf-request-id"]) hostingHint = "Netlify";
  else if (server) hostingHint = server;
  if (poweredBy) technologies.push(poweredBy);

  // robots.txt y sitemap
  let robotsTxt = { exists: false, content: null as string | null };
  let sitemap = { exists: false, url: null as string | null };
  try {
    const robotsUrl = absoluteUrl(finalUrl, "/robots.txt")!;
    const r = await fetch(robotsUrl, { signal: AbortSignal.timeout(8000) });
    if (r.ok) {
      const text = await r.text();
      robotsTxt = { exists: true, content: text.slice(0, 2000) };
      const sitemapLine = text.split("\n").find((l) => l.toLowerCase().startsWith("sitemap:"));
      if (sitemapLine) sitemap = { exists: true, url: sitemapLine.split(":").slice(1).join(":").trim() };
    }
  } catch {
    // robots.txt no accesible, se omite
  }
  if (!sitemap.exists) {
    try {
      const sitemapUrl = absoluteUrl(finalUrl, "/sitemap.xml")!;
      const s = await fetch(sitemapUrl, { method: "HEAD", signal: AbortSignal.timeout(8000) });
      if (s.ok) sitemap = { exists: true, url: sitemapUrl };
    } catch {
      // sitemap.xml no accesible, se omite
    }
  }

  // Errores / recomendaciones (solo lo detectado, nunca inventado)
  if (!finalUrl.startsWith("https://")) {
    errors.push("El sitio no usa HTTPS.");
    recommendations.push("Migrar a HTTPS con un certificado SSL válido.");
  }
  if (title === NA) {
    errors.push("No se encontró la etiqueta <title>.");
    recommendations.push("Agregar un título descriptivo y único por página.");
  }
  if (metaDescription === NA) {
    errors.push("No se encontró meta description.");
    recommendations.push("Agregar meta description de 120-160 caracteres.");
  }
  if (!canonical) recommendations.push("Definir una URL canónica para evitar contenido duplicado.");
  if (Object.keys(openGraph).length === 0) recommendations.push("Agregar etiquetas Open Graph para mejorar el preview al compartir.");
  if (imagesWithoutAlt > 0) {
    errors.push(`${imagesWithoutAlt} imagen(es) sin atributo alt.`);
    recommendations.push("Agregar texto alternativo (alt) a todas las imágenes.");
  }
  if (!hasViewportMeta) {
    errors.push("Falta la etiqueta meta viewport (afecta la experiencia responsive).");
    recommendations.push("Agregar <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">.");
  }
  if (!favicon) recommendations.push("Agregar un favicon.");
  if (!robotsTxt.exists) recommendations.push("Agregar un archivo robots.txt.");
  if (!sitemap.exists) recommendations.push("Agregar un sitemap.xml y referenciarlo en robots.txt.");
  if (!hasWhatsApp) recommendations.push("Si aplica al negocio, agregar un botón/enlace directo de WhatsApp.");

  return {
    url,
    finalUrl,
    https: finalUrl.startsWith("https://"),
    statusCode,
    title,
    metaDescription,
    canonical,
    openGraph,
    favicon,
    headers,
    technologies: Array.from(new Set(technologies)),
    framework,
    hostingHint,
    images: { total: imgs.length, withoutAlt: imagesWithoutAlt },
    links: { total: allLinks.length, internal, external },
    forms,
    hasWhatsApp,
    socialLinks: Array.from(socialLinks),
    hasViewportMeta,
    robotsTxt,
    sitemap,
    structure,
    errors,
    recommendations,
  };
}

export function estimateScores(audit: AuditResult) {
  let seo = 100;
  if (audit.title === NA) seo -= 20;
  if (audit.metaDescription === NA) seo -= 15;
  if (!audit.canonical) seo -= 10;
  if (Object.keys(audit.openGraph).length === 0) seo -= 10;
  if (!audit.robotsTxt.exists) seo -= 10;
  if (!audit.sitemap.exists) seo -= 10;
  if (!audit.https) seo -= 15;
  seo = Math.max(0, seo);

  let accessibility = 100;
  if (audit.images.withoutAlt > 0) {
    accessibility -= Math.min(40, audit.images.withoutAlt * 5);
  }
  if (!audit.hasViewportMeta) accessibility -= 20;
  accessibility = Math.max(0, accessibility);

  // Performance real requeriría Lighthouse; se marca como estimación básica.
  let performance = 70;
  if (audit.statusCode && audit.statusCode >= 400) performance -= 40;
  if (audit.technologies.includes("Next.js")) performance += 10;
  performance = Math.max(0, Math.min(100, performance));

  return { seo, accessibility, performance };
}
