"use client";

const ACCEPTED_LOGO_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_SOURCE_BYTES = 12 * 1024 * 1024;
const MAX_OUTPUT_BYTES = 700 * 1024;

function canvasBlob(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error("No pudimos preparar la imagen.")), "image/webp", quality);
  });
}

/** Reduces phone photos before they cross the Server Action request limit. */
export async function prepareClientLogo(file: File): Promise<File> {
  if (!ACCEPTED_LOGO_TYPES.has(file.type)) throw new Error("Usá una imagen JPG, PNG o WEBP.");
  if (file.size > MAX_SOURCE_BYTES) throw new Error("La imagen es demasiado pesada. Elegí una de hasta 12 MB.");

  let source: CanvasImageSource;
  let width: number;
  let height: number;
  let release = () => {};
  try {
    if (typeof createImageBitmap === "function") {
      const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
      source = bitmap; width = bitmap.width; height = bitmap.height; release = () => bitmap.close();
    } else {
      const url = URL.createObjectURL(file);
      release = () => URL.revokeObjectURL(url);
      const image = new Image();
      image.src = url;
      await image.decode();
      source = image; width = image.naturalWidth; height = image.naturalHeight;
    }
  } catch { release(); throw new Error("No pudimos leer esa imagen. Probá con otra foto JPG, PNG o WEBP."); }

  try {
    const scale = Math.min(1, 900 / Math.max(width, height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(width * scale));
    canvas.height = Math.max(1, Math.round(height * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("No pudimos preparar la imagen.");
    context.drawImage(source, 0, 0, canvas.width, canvas.height);
    let output = await canvasBlob(canvas, 0.84);
    if (output.size > MAX_OUTPUT_BYTES) output = await canvasBlob(canvas, 0.68);
    if (output.size > MAX_OUTPUT_BYTES) throw new Error("La imagen tiene demasiado detalle. Probá con otra más simple.");
    return new File([output], "logo.webp", { type: "image/webp", lastModified: Date.now() });
  } finally { release(); }
}
