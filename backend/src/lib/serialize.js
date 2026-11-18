/**
 * Prisma returns BIGINT columns (ids, *_paise) as JavaScript BigInt, which
 * JSON.stringify cannot handle. Send them as strings: ids stay exact, and the
 * clients already treat ids as strings. Money helpers convert paise explicitly.
 *
 * Imported once at startup (server.js).
 */
if (!BigInt.prototype.toJSON) {
  // eslint-disable-next-line no-extend-native
  BigInt.prototype.toJSON = function toJSON() {
    return this.toString();
  };
}

/** Route params arrive as strings; parse to BigInt or throw a 400-friendly error. */
export function toBigIntId(value) {
  if (typeof value === "bigint") return value;
  if (typeof value === "number" && Number.isSafeInteger(value) && value > 0) return BigInt(value);
  if (typeof value === "string" && /^[1-9][0-9]{0,18}$/.test(value)) return BigInt(value);
  return null;
}
