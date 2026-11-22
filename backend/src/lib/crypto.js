import crypto from "node:crypto";
import env from "../../config/env.js";

/**
 * Field-level encryption for sensitive values kept in the database
 * (e.g. a customer's bank account for a COD refund — document §11: "bank_details … encrypted").
 *
 * AES-256-GCM, stored as "v1:<iv>:<tag>:<ciphertext>" (base64url parts).
 * Key: DATA_ENCRYPTION_KEY, or one derived from JWT_SECRET_KEY when that is not set.
 * Set DATA_ENCRYPTION_KEY in production and never change it — rows encrypted with the old key
 * can no longer be read.
 */

const KEY = crypto
  .createHash("sha256")
  .update(env.dataEncryptionKey || `${env.jwt.accessSecret}:buydenmed-data-encryption`)
  .digest();

const b64 = (buf) => buf.toString("base64url");

export function encryptJson(value) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", KEY, iv);
  const data = Buffer.concat([cipher.update(JSON.stringify(value), "utf8"), cipher.final()]);
  return `v1:${b64(iv)}:${b64(cipher.getAuthTag())}:${b64(data)}`;
}

/** Returns null (never throws) when the value is empty, tampered with, or encrypted with another key. */
export function decryptJson(text) {
  if (!text) return null;
  try {
    const [version, iv, tag, data] = String(text).split(":");
    if (version !== "v1") return null;
    const decipher = crypto.createDecipheriv("aes-256-gcm", KEY, Buffer.from(iv, "base64url"));
    decipher.setAuthTag(Buffer.from(tag, "base64url"));
    const plain = Buffer.concat([decipher.update(Buffer.from(data, "base64url")), decipher.final()]);
    return JSON.parse(plain.toString("utf8"));
  } catch {
    return null;
  }
}
