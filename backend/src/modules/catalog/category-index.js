import prisma from "../../../db/db.js";

/**
 * In-memory index of the category tree.
 *
 * The tree is small (hundreds of rows) but read on almost every storefront
 * request (menus, listings, breadcrumbs, "is this product visible?"), so it is
 * loaded once and reused. Admin writes call invalidateCategoryIndex(); the TTL
 * is a safety net for setups with several API processes (PM2 cluster), where
 * another process may have changed the tree.
 *
 * Visibility rule: a category is visible on the storefront only when it AND all
 * of its ancestors are active — deactivating "Dental" hides every Dental
 * subcategory and every product filed under them.
 */

const TTL_MS = 60_000;
let cached = null; // { at, promise }

export function invalidateCategoryIndex() {
  cached = null;
}

export function getCategoryIndex() {
  if (cached && Date.now() - cached.at < TTL_MS) return cached.promise;
  const promise = load().catch((error) => {
    cached = null; // do not cache a failed load
    throw error;
  });
  cached = { at: Date.now(), promise };
  return promise;
}

async function load() {
  const rows = await prisma.category.findMany({
    where: { deleted_at: null },
    orderBy: [{ sort_order: "asc" }, { name: "asc" }, { id: "asc" }],
  });
  return buildIndex(rows);
}

/** Pure function (no DB) — easy to unit test. */
export function buildIndex(rows) {
  const byId = new Map(rows.map((r) => [String(r.id), r]));
  const childrenOf = new Map(); // "root" | parentId → rows (already sorted)
  for (const row of rows) {
    const key = row.parent_id ? String(row.parent_id) : "root";
    if (!childrenOf.has(key)) childrenOf.set(key, []);
    childrenOf.get(key).push(row);
  }

  // Visible = active + every ancestor active (walk from the roots down)
  const visible = new Set();
  const walk = (parentKey, parentVisible) => {
    for (const child of childrenOf.get(parentKey) || []) {
      const id = String(child.id);
      const isVisible = parentVisible && child.status === "active";
      if (isVisible) visible.add(id);
      walk(id, isVisible);
    }
  };
  walk("root", true);

  /** id plus all descendant ids (strings). */
  const subtreeIds = (id) => {
    const out = [];
    const stack = [String(id)];
    while (stack.length) {
      const current = stack.pop();
      if (!byId.has(current)) continue;
      out.push(current);
      for (const child of childrenOf.get(current) || []) stack.push(String(child.id));
    }
    return out;
  };

  /** Root → … → node rows. */
  const ancestry = (id) => {
    const chain = [];
    let node = byId.get(String(id));
    const guard = new Set();
    while (node && !guard.has(String(node.id))) {
      guard.add(String(node.id));
      chain.unshift(node);
      node = node.parent_id ? byId.get(String(node.parent_id)) : null;
    }
    return chain;
  };

  return {
    rows,
    byId,
    childrenOf,
    visible,
    subtreeIds,
    ancestry,
    /** "Respiratory Care > Oxygen Therapy > Concentrators" */
    pathLabel: (id) => ancestry(id).map((n) => n.name).join(" > "),
    /** Visible ids in the subtree (for storefront product queries) as BigInt. */
    visibleSubtree: (id) => subtreeIds(id).filter((x) => visible.has(x)).map((x) => BigInt(x)),
    allVisibleIds: () => [...visible].map((x) => BigInt(x)),
  };
}
