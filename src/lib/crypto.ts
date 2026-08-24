import "server-only";
import crypto from "node:crypto";

/**
 * Cifrado de credenciales. Usa AES-256-GCM con una clave de 32 bytes
 * (CREDENTIALS_ENCRYPTION_KEY, hex de 64 caracteres) que vive únicamente
 * en el entorno del servidor. Nunca se importa desde código de cliente
 * ("server-only" rompe el build si eso ocurre).
 *
 * Formato almacenado: base64(iv) + ":" + base64(authTag) + ":" + base64(ciphertext)
 */

function getKey(): Buffer {
  const hex = process.env.CREDENTIALS_ENCRYPTION_KEY;
  if (!hex || hex.length !== 64) {
    throw new Error(
      "CREDENTIALS_ENCRYPTION_KEY no configurada o inválida (debe ser hex de 64 caracteres / 32 bytes)."
    );
  }
  return Buffer.from(hex, "hex");
}

export function encryptSecret(plainText: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", getKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return [iv.toString("base64"), authTag.toString("base64"), ciphertext.toString("base64")].join(
    ":"
  );
}

export function decryptSecret(payload: string): string {
  const [ivB64, tagB64, dataB64] = payload.split(":");
  if (!ivB64 || !tagB64 || !dataB64) throw new Error("Payload cifrado inválido.");
  const iv = Buffer.from(ivB64, "base64");
  const authTag = Buffer.from(tagB64, "base64");
  const ciphertext = Buffer.from(dataB64, "base64");
  const decipher = crypto.createDecipheriv("aes-256-gcm", getKey(), iv);
  decipher.setAuthTag(authTag);
  const plain = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return plain.toString("utf8");
}

/** Enmascara un secreto para mostrarlo antes de que el usuario pida verlo. */
export function maskSecret(length = 12): string {
  return "•".repeat(Math.min(Math.max(length, 8), 20));
}
