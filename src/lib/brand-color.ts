export const DEFAULT_BRAND_COLOR = "#486581";

export function validBrandColor(value: unknown): value is string {
  return typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value);
}

function rgb(hex: string) {
  return [1, 3, 5].map((offset) => parseInt(hex.slice(offset, offset + 2), 16));
}

function hex(channels: number[]) {
  return "#" + channels.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");
}

export function contrastOnWhite(color: string) {
  const channels = rgb(color).map((v) => {
    const s = v / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 1.05 / (channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722 + 0.05);
}

/** One hue, adjusted only in brightness. Extra margin covers the soft surface. */
export function brandTokens(input: unknown) {
  let accent = validBrandColor(input) ? input.toLowerCase() : DEFAULT_BRAND_COLOR;
  while (contrastOnWhite(accent) < 5) accent = hex(rgb(accent).map((v) => v * 0.96));
  return {
    "--accent": accent,
    "--accent-foreground": "#ffffff",
    "--accent-hover": hex(rgb(accent).map((v) => v * 0.85)),
    "--accent-soft": hex(rgb(accent).map((v) => v * 0.06 + 255 * 0.94)),
  };
}

/** Cluster nearby hues, ignoring transparent, near-white and neutral pixels. */
export function dominantLogoColor(pixels: Uint8Array): string | null {
  const buckets = new Map<number, { weight: number; sum: number[] }>();
  for (let i = 0; i + 3 < pixels.length; i += 4) {
    const channels = [pixels[i], pixels[i + 1], pixels[i + 2]];
    const max = Math.max(...channels), min = Math.min(...channels);
    if (pixels[i + 3] < 128 || max < 35 || max - min < 30) continue;
    const delta = max - min;
    let hue = max === channels[0] ? (channels[1] - channels[2]) / delta
      : max === channels[1] ? (channels[2] - channels[0]) / delta + 2
      : (channels[0] - channels[1]) / delta + 4;
    hue = (hue * 60 + 360) % 360;
    const key = Math.round(hue / 20) % 18;
    const weight = (pixels[i + 3] / 255) * (delta / max);
    const bucket = buckets.get(key) ?? { weight: 0, sum: [0, 0, 0] };
    bucket.weight += weight;
    channels.forEach((v, j) => { bucket.sum[j] += v * weight; });
    buckets.set(key, bucket);
  }
  const winner = [...buckets.values()].sort((a, b) => b.weight - a.weight)[0];
  return winner ? hex(winner.sum.map((v) => v / winner.weight)) : null;
}
