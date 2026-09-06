import "server-only";
import sharp from "sharp";
import { unstable_cache } from "next/cache";
import { brandTokens, dominantLogoColor, validBrandColor } from "./brand-color";

// Only our public logo bucket is allowed: never fetch arbitrary client URLs.
const detectLogoColor = unstable_cache(async (logoUrl: string, clientId: string) => {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return null;
  const url = new URL(logoUrl, base);
  const expected = `/storage/v1/object/public/client-logos/${clientId}/logo`;
  if (url.origin !== new URL(base).origin || url.pathname !== expected) return null;
  const response = await fetch(url, { redirect: "error", signal: AbortSignal.timeout(2500), cache: "no-store" });
  if (!response.ok || Number(response.headers.get("content-length")) > 5 * 1024 * 1024) throw new Error("Logo unavailable");
  const reader = response.body?.getReader();
  if (!reader) return null;
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > 5 * 1024 * 1024) { await reader.cancel(); throw new Error("Logo too large"); }
    chunks.push(value);
  }
  const pixels = await sharp(Buffer.concat(chunks), { limitInputPixels: 16_000_000 })
    .resize(64, 64, { fit: "inside" }).toColourspace("srgb").ensureAlpha().raw().toBuffer();
  return dominantLogoColor(pixels);
}, ["client-brand-color-v1"], { revalidate: 86400 });

export async function getClientBrandTokens(client: { id: string; logo_url?: string | null; brand_color?: string | null }) {
  if (validBrandColor(client.brand_color)) return brandTokens(client.brand_color);
  try {
    return brandTokens(client.logo_url ? await detectLogoColor(client.logo_url, client.id) : null);
  } catch {
    // A broken image or a storage outage must never prevent entering the portal.
    return brandTokens(null);
  }
}
