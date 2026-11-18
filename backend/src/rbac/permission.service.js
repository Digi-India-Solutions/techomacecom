import prisma from "../../db/db.js";
import { ALL_PERMISSION_CODES, SUPER_ADMIN_SLUG } from "./catalog.js";

/**
 * Permission codes per role, cached briefly so every admin request does not
 * re-read role_permissions. Changing a role calls invalidateRolePermissions().
 */
const CACHE_TTL_MS = 60 * 1000;
const cache = new Map(); // roleId(string) → { codes: Set<string>, at: number }

export async function getRolePermissions(role) {
  if (role.slug === SUPER_ADMIN_SLUG) return new Set(ALL_PERMISSION_CODES);

  const key = String(role.id);
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.codes;

  const rows = await prisma.rolePermission.findMany({
    where: { role_id: role.id },
    select: { permission: { select: { code: true } } },
  });
  const codes = new Set(rows.map((r) => r.permission.code));
  cache.set(key, { codes, at: Date.now() });
  return codes;
}

export function invalidateRolePermissions(roleId) {
  if (roleId === undefined) cache.clear();
  else cache.delete(String(roleId));
}

/** { products: { view: true, create: false, … }, … } for the admin matrix UI. */
export function codesToMatrix(codes, modules, actions) {
  const matrix = {};
  for (const m of modules) {
    matrix[m.key] = {};
    for (const a of actions) matrix[m.key][a] = codes.has(`${m.key}.${a}`);
  }
  return matrix;
}

export function matrixToCodes(matrix, modules, actions) {
  const codes = [];
  for (const m of modules) {
    for (const a of actions) if (matrix?.[m.key]?.[a]) codes.push(`${m.key}.${a}`);
  }
  return codes;
}
