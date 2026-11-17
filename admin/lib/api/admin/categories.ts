import type { CategoryNode, CategoryPayload } from '@/types/admin';
import { mockDelay, slugify } from './client';
import { INITIAL_CATEGORIES } from './mockData';

let categoriesTree: CategoryNode[] = structuredClone(INITIAL_CATEGORIES);

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

export function getCategoryPathById(id: string): string | null {
  const flat = flattenCategories(categoriesTree);
  return flat.find((item) => item.node.id === id)?.path || null;
}

function findNode(nodes: CategoryNode[], id: string): CategoryNode | null {
  for (const n of nodes) {
    if (n.id === id) return n;
    if (n.children) {
      const found = findNode(n.children, id);
      if (found) return found;
    }
  }
  return null;
}

function removeNode(nodes: CategoryNode[], id: string): { next: CategoryNode[]; removed: CategoryNode | null } {
  let removed: CategoryNode | null = null;
  const next: CategoryNode[] = [];
  for (const n of nodes) {
    if (n.id === id) {
      removed = n;
      continue;
    }
    if (n.children && n.children.length > 0) {
      const res = removeNode(n.children, id);
      if (res.removed) removed = res.removed;
      next.push({ ...n, children: res.next });
    } else {
      next.push(n);
    }
  }
  return { next, removed };
}

function normalizeLevels(nodes: CategoryNode[], level: 1 | 2 | 3, parentId: string | null): CategoryNode[] {
  return nodes.map((node, index) => ({
    ...node,
    parentId,
    level,
    sortOrder: index + 1,
    children:
      node.children && level < 3
        ? normalizeLevels(node.children, (level + 1) as 2 | 3, node.id)
        : [],
  }));
}

export async function listCategories(): Promise<CategoryNode[]> {
  await mockDelay(120);
  return structuredClone(categoriesTree);
}

export async function saveCategory(payload: CategoryPayload): Promise<CategoryNode[]> {
  await mockDelay(180);
  const targetParentId = payload.parentId || null;

  if (payload.id) {
    const existing = findNode(categoriesTree, payload.id);
    if (!existing) throw new Error('Category not found');

    const { next, removed } = removeNode(categoriesTree, payload.id);
    const updatedNode: CategoryNode = {
      ...existing,
      ...payload,
      id: payload.id,
      slug: payload.slug || slugify(payload.name),
      children: removed?.children || existing.children || [],
    };

    if (!targetParentId) {
      categoriesTree = normalizeLevels([...next, updatedNode], 1, null);
    } else {
      const insertIntoParent = (nodes: CategoryNode[]): CategoryNode[] =>
        nodes.map((n) => {
          if (n.id === targetParentId) {
            return { ...n, children: [...(n.children || []), updatedNode] };
          }
          return { ...n, children: n.children ? insertIntoParent(n.children) : [] };
        });
      categoriesTree = normalizeLevels(insertIntoParent(next), 1, null);
    }
  } else {
    const newNode: CategoryNode = {
      ...payload,
      id: `cat-${Date.now()}`,
      slug: payload.slug || slugify(payload.name),
      level: 1,
      sortOrder: 99,
      productCount: 0,
      children: [],
    };
    if (!targetParentId) {
      categoriesTree = normalizeLevels([...categoriesTree, newNode], 1, null);
    } else {
      const insertIntoParent = (nodes: CategoryNode[]): CategoryNode[] =>
        nodes.map((n) => {
          if (n.id === targetParentId) {
            return { ...n, children: [...(n.children || []), newNode] };
          }
          return { ...n, children: n.children ? insertIntoParent(n.children) : [] };
        });
      categoriesTree = normalizeLevels(insertIntoParent(categoriesTree), 1, null);
    }
  }

  return structuredClone(categoriesTree);
}

export async function updateCategoryTree(nextTree: CategoryNode[]): Promise<CategoryNode[]> {
  await mockDelay(120);
  categoriesTree = normalizeLevels(structuredClone(nextTree), 1, null);
  return structuredClone(categoriesTree);
}

export async function deleteCategory(id: string): Promise<CategoryNode[]> {
  await mockDelay(160);
  const target = findNode(categoriesTree, id);
  if (!target) throw new Error('Category not found');

  const countTotalProducts = (node: CategoryNode): number => {
    const childSum = (node.children || []).reduce((acc, c) => acc + countTotalProducts(c), 0);
    return node.productCount + childSum;
  };

  const totalProducts = countTotalProducts(target);
  if (totalProducts > 0) {
    throw new Error(
      `Cannot delete "${target.name}" because ${totalProducts} product${totalProducts === 1 ? ' is' : 's are'} assigned to it or its subcategories. Reassign products first.`
    );
  }

  const { next } = removeNode(categoriesTree, id);
  categoriesTree = normalizeLevels(next, 1, null);
  return structuredClone(categoriesTree);
}
