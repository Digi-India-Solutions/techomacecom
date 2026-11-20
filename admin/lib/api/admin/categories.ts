import type { CategoryNode, CategoryPayload } from '@/types/admin';
import { adminDelete, adminGet, adminPost, adminPut } from './client';

// ---------------------------------------------------------------------------
// Live API — backend/src/modules/catalog/categories (/api/v1/admin/categories)
// ---------------------------------------------------------------------------

/** Tree → flat list with "Parent > Child" labels (used by every category picker). */
export function flattenCategories(nodes: CategoryNode[], prefix = ''): {
  node: CategoryNode;
  path: string;
}[] {
  const result: { node: CategoryNode; path: string }[] = [];
  for (const node of nodes) {
    const path = prefix ? `${prefix} > ${node.name}` : node.name;
    result.push({ node, path });
    if (node.children && node.children.length > 0) {
      result.push(...flattenCategories(node.children, path));
    }
  }
  return result;
}

/** Full admin tree (active + inactive) with product counts. */
export async function listCategories(): Promise<CategoryNode[]> {
  return adminGet<CategoryNode[]>('/admin/categories');
}

/** Only the fields the API accepts (no ids/counts/children). */
function toBody(payload: CategoryPayload) {
  return {
    name: payload.name,
    slug: payload.slug,
    parentId: payload.parentId || null,
    iconUrl: payload.iconUrl || '',
    imageUrl: payload.imageUrl || '',
    desktopBannerUrl: payload.desktopBannerUrl || '',
    mobileBannerUrl: payload.mobileBannerUrl || '',
    description: payload.description || '',
    seoTitle: payload.seoTitle || '',
    seoDescription: payload.seoDescription || '',
    showInMenu: payload.showInMenu,
    showOnHomepage: payload.showOnHomepage,
    status: payload.status,
  };
}

/** Creates or updates a category, then returns the refreshed tree. */
export async function saveCategory(payload: CategoryPayload): Promise<CategoryNode[]> {
  if (payload.id) await adminPut(`/admin/categories/${payload.id}`, toBody(payload));
  else await adminPost('/admin/categories', toBody(payload));
  return listCategories();
}

/** Saves drag-and-drop order / nesting. The server re-validates depth and returns the stored tree. */
export async function updateCategoryTree(nextTree: CategoryNode[]): Promise<CategoryNode[]> {
  const strip = (n: CategoryNode): { id: string; children: unknown[] } => ({
    id: n.id,
    children: (n.children || []).map(strip),
  });
  return adminPut<CategoryNode[]>('/admin/categories/tree', { tree: nextTree.map(strip) });
}

/** Soft delete. The API refuses (409) while the category or its subcategories have products. */
export async function deleteCategory(id: string): Promise<CategoryNode[]> {
  const res = await adminDelete<{ message: string; tree: CategoryNode[] }>(`/admin/categories/${id}`);
  return res.tree;
}
