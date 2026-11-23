'use client';

import { useEffect, useState } from 'react';
import type { Category } from '@/types';
import { getCategories } from '@/lib/api/catalog';
import { MOCK_CATEGORIES } from '@/lib/mock/data';

/**
 * Live category tree for client components (header mega menu, mobile drawer, footer).
 * One request per page load is shared by every component that uses the hook.
 */
let shared: Promise<Category[]> | null = null;

function loadCategories(): Promise<Category[]> {
  shared ??= getCategories()
    .then((list) => {
      // If list is empty (e.g. network issue or initial fetch), fallback to MOCK_CATEGORIES
      if (!list || list.length === 0) {
        shared = null;
        return MOCK_CATEGORIES;
      }
      return list;
    })
    .catch((err) => {
      console.warn('[useCatalogCategories] getCategories failed, using fallback:', err);
      shared = null;
      return MOCK_CATEGORIES;
    });
  return shared;
}

/** @param menuOnly true → only categories the admin marked "Show in navigation menu" */
export function useCatalogCategories({ menuOnly = false }: { menuOnly?: boolean } = {}): Category[] {
  const [categories, setCategories] = useState<Category[]>(() => MOCK_CATEGORIES);

  useEffect(() => {
    let alive = true;
    loadCategories().then((list) => {
      if (alive && list && list.length > 0) setCategories(list);
    });
    return () => {
      alive = false;
    };
  }, []);

  if (!menuOnly) return categories;
  return categories
    .filter((c) => c.showInMenu !== false)
    .map((c) => ({ ...c, subCategories: (c.subCategories || []).filter((s) => s.showInMenu !== false) }));
}
