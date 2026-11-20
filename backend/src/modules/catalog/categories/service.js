import prisma from "../../../../db/db.js";
import { ApiError } from "../../../lib/http.js";
import { imageOut, slugify, tombstone, uniqueSlug } from "../shared.js";
import { getCategoryIndex, invalidateCategoryIndex } from "../category-index.js";

/**
 * Categories — a 3-level tree (document §11.3).
 *
 *   level  1 = top level (parent_id NULL), 2 = child, 3 = grandchild
 *   path   materialised path of ids incl. itself: "/3/17/42/" → subtree = path LIKE "/3/%"
 *
 * Products can be filed under any level. Deleting is soft (deleted_at) and is
 * blocked while the category or any subcategory still has products.
 */

const MAX_LEVEL = 3;
const SLUG_MAX = 140;

// ---------------------------------------------------------------------------
// DTO (matches admin/types CategoryNode)
// ---------------------------------------------------------------------------

function toDto(row, counts, childrenOf) {
  const id = String(row.id);
  const children = (childrenOf.get(id) || []).map((c) => toDto(c, counts, childrenOf));
  const own = counts.get(id) || 0;
  return {
    id,
    name: row.name,
    slug: row.slug,
    parentId: row.parent_id ? String(row.parent_id) : null,
    level: row.level,
    sortOrder: row.sort_order,
    iconUrl: imageOut(row.icon_url),
    imageUrl: imageOut(row.image_url),
    desktopBannerUrl: imageOut(row.banner_desktop_url),
    mobileBannerUrl: imageOut(row.banner_mobile_url),
    description: row.description || "",
    seoTitle: row.meta_title || "",
    seoDescription: row.meta_description || "",
    showInMenu: row.show_in_menu,
    showOnHomepage: row.show_on_home,
    status: row.status,
    // Products in this category AND its subcategories (what blocks a delete)
    productCount: own + children.reduce((sum, c) => sum + c.productCount, 0),
    directProductCount: own,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    children,
  };
}

/** Non-deleted products per category id (any status — a draft still blocks a delete). */
async function productCountsByCategory() {
  const groups = await prisma.product.groupBy({
    by: ["category_id"],
    where: { deleted_at: null },
    _count: { _all: true },
  });
  return new Map(groups.map((g) => [String(g.category_id), g._count._all]));
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

/** Full admin tree (active + inactive), sorted, with product counts. */
export async function listTree() {
  const [index, counts] = await Promise.all([getCategoryIndex(), productCountsByCategory()]);
  return (index.childrenOf.get("root") || []).map((row) => toDto(row, counts, index.childrenOf));
}

export async function getById(id) {
  const index = await getCategoryIndex();
  const row = index.byId.get(String(id));
  if (!row) throw ApiError.notFound("Category not found");
  const counts = await productCountsByCategory();
  return { ...toDto(row, counts, index.childrenOf), pathLabel: index.pathLabel(id) };
}

// ---------------------------------------------------------------------------
// Writes
// ---------------------------------------------------------------------------

async function slugTaken(slug, exceptId) {
  const row = await prisma.category.findUnique({ where: { slug }, select: { id: true } });
  return Boolean(row && row.id !== exceptId);
}

/** Resolves the slug: explicit → must be free; blank → generated from the name. */
async function resolveSlug(data, exceptId) {
  if (data.slug) {
    if (await slugTaken(data.slug, exceptId)) {
      throw ApiError.conflict(`The URL slug "${data.slug}" is already used by another category`, "SLUG_TAKEN", {
        slug: "Already in use",
      });
    }
    return data.slug;
  }
  return uniqueSlug(slugify(data.name), (s) => slugTaken(s, exceptId), SLUG_MAX);
}

function columns(data) {
  return {
    name: data.name,
    icon_url: data.iconUrl,
    image_url: data.imageUrl,
    banner_desktop_url: data.desktopBannerUrl,
    banner_mobile_url: data.mobileBannerUrl,
    description: data.description,
    meta_title: data.seoTitle,
    meta_description: data.seoDescription,
    show_in_menu: data.showInMenu,
    show_on_home: data.showOnHomepage,
    status: data.status,
  };
}

/** Height of a subtree: a leaf = 1, a node with children = 2, … */
function subtreeHeight(index, id) {
  const kids = index.childrenOf.get(String(id)) || [];
  return 1 + (kids.length ? Math.max(...kids.map((k) => subtreeHeight(index, k.id))) : 0);
}

function loadParent(index, parentId) {
  if (!parentId) return null;
  const parent = index.byId.get(String(parentId));
  if (!parent) throw ApiError.badRequest("Parent category not found", "PARENT_NOT_FOUND", { parentId: "Not found" });
  return parent;
}

export async function create(data) {
  const index = await getCategoryIndex();
  const parent = loadParent(index, data.parentId);
  const level = parent ? parent.level + 1 : 1;
  if (level > MAX_LEVEL) {
    throw ApiError.badRequest("Categories support at most 3 levels — choose a Level 1 or Level 2 parent.", "MAX_DEPTH", {
      parentId: "Too deep",
    });
  }

  const slug = await resolveSlug(data);
  const siblings = index.childrenOf.get(parent ? String(parent.id) : "root") || [];
  const sortOrder = siblings.length ? Math.max(...siblings.map((s) => s.sort_order)) + 1 : 0;

  const row = await prisma.$transaction(async (tx) => {
    const created = await tx.category.create({
      data: { ...columns(data), slug, parent_id: parent?.id ?? null, level, sort_order: sortOrder },
    });
    // path includes the row's own id, so it can only be written after the insert
    return tx.category.update({
      where: { id: created.id },
      data: { path: `${parent?.path || "/"}${created.id}/` },
    });
  });
  invalidateCategoryIndex();
  return getById(row.id);
}

export async function update(id, data) {
  const index = await getCategoryIndex();
  const current = index.byId.get(String(id));
  if (!current) throw ApiError.notFound("Category not found");

  const parent = loadParent(index, data.parentId);
  const moved = String(parent?.id ?? "") !== String(current.parent_id ?? "");

  if (moved && parent) {
    // Cannot move a category inside itself or one of its own subcategories
    if (index.subtreeIds(id).includes(String(parent.id))) {
      throw ApiError.badRequest("A category cannot be moved inside itself or its own subcategory.", "INVALID_PARENT", {
        parentId: "Invalid parent",
      });
    }
    // The whole subtree moves with it — the deepest grandchild must still be ≤ level 3
    if (parent.level + subtreeHeight(index, id) > MAX_LEVEL) {
      throw ApiError.badRequest(
        "Moving this category there would create more than 3 levels. Move or flatten its subcategories first.",
        "MAX_DEPTH",
        { parentId: "Too deep" }
      );
    }
  }

  const slug = await resolveSlug(data, current.id);

  await prisma.$transaction(async (tx) => {
    const extra = {};
    if (moved) {
      const siblings = index.childrenOf.get(parent ? String(parent.id) : "root") || [];
      extra.parent_id = parent?.id ?? null;
      extra.sort_order = siblings.length ? Math.max(...siblings.map((s) => s.sort_order)) + 1 : 0;
    }
    await tx.category.update({ where: { id: current.id }, data: { ...columns(data), slug, ...extra } });
    if (moved) await rebuildSubtree(tx, index, current.id, parent);
  });

  invalidateCategoryIndex();
  return getById(current.id);
}

/** Rewrites level + path for a moved category and all of its descendants. */
async function rebuildSubtree(tx, index, rootId, newParent) {
  const visit = async (id, parentPath, level) => {
    const path = `${parentPath}${id}/`;
    await tx.category.update({ where: { id: BigInt(id) }, data: { level, path } });
    for (const child of index.childrenOf.get(String(id)) || []) {
      await visit(String(child.id), path, level + 1);
    }
  };
  await visit(String(rootId), newParent?.path || "/", (newParent?.level || 0) + 1);
}

/**
 * Saves the order / nesting after drag-and-drop. The client sends the WHOLE tree,
 * so the server can verify nothing was lost or duplicated, then recompute
 * parent, level, path and sort order. Only rows that actually changed are written.
 */
export async function reorder(tree) {
  const index = await getCategoryIndex();
  const seen = new Set();
  const planned = []; // { id, parent_id, level, path, sort_order }

  const visit = (nodes, parent, level, parentPath) => {
    nodes.forEach((node, position) => {
      if (level > MAX_LEVEL) throw ApiError.badRequest("Categories support at most 3 levels.", "MAX_DEPTH");
      if (seen.has(node.id)) throw ApiError.badRequest(`Category ${node.id} appears twice in the tree.`, "INVALID_TREE");
      if (!index.byId.has(node.id)) throw ApiError.badRequest(`Category ${node.id} does not exist.`, "INVALID_TREE");
      seen.add(node.id);
      const path = `${parentPath}${node.id}/`;
      planned.push({ id: node.id, parent_id: parent ? BigInt(parent) : null, level, path, sort_order: position });
      visit(node.children || [], node.id, level + 1, path);
    });
  };
  visit(tree, null, 1, "/");

  if (seen.size !== index.byId.size) {
    throw ApiError.conflict(
      "The category list changed while you were editing. Reload the page and try again.",
      "STALE_TREE"
    );
  }

  const changes = planned.filter((p) => {
    const row = index.byId.get(p.id);
    return (
      String(row.parent_id ?? "") !== String(p.parent_id ?? "") ||
      row.level !== p.level ||
      row.path !== p.path ||
      row.sort_order !== p.sort_order
    );
  });

  if (changes.length) {
    await prisma.$transaction(
      changes.map(({ id, ...data }) => prisma.category.update({ where: { id: BigInt(id) }, data }))
    );
    invalidateCategoryIndex();
  }
  return { changed: changes.length, tree: await listTree() };
}

/**
 * Soft-deletes a category together with its (empty) subcategories.
 * Blocked while any of them still has products — reassign them first.
 */
export async function remove(id) {
  const index = await getCategoryIndex();
  const row = index.byId.get(String(id));
  if (!row) throw ApiError.notFound("Category not found");

  const ids = index.subtreeIds(id).map((x) => BigInt(x));
  const productCount = await prisma.product.count({ where: { category_id: { in: ids }, deleted_at: null } });
  if (productCount > 0) {
    throw ApiError.conflict(
      `Cannot delete "${row.name}" because ${productCount} product${productCount === 1 ? " is" : "s are"} assigned to it or its subcategories. Reassign products first.`,
      "CATEGORY_IN_USE"
    );
  }

  const now = new Date();
  await prisma.$transaction(
    ids.map((catId) =>
      prisma.category.update({
        where: { id: catId },
        data: {
          deleted_at: now,
          status: "inactive",
          // frees the slug so a new category can use it
          slug: tombstone(index.byId.get(String(catId)).slug, catId, SLUG_MAX),
        },
      })
    )
  );
  invalidateCategoryIndex();
  return { row, removedCount: ids.length };
}
