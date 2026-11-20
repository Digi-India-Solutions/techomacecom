'use client';

import { useEffect, useState } from 'react';
import type { Category } from '@/types';
import { getCategories } from '@/lib/api/catalog';

/**
 * Live category tree for client components (header mega menu, mobile drawer, footer).
 * One request per page load is shared by every component that uses the hook.
 */
let shared: Promise<Category[]> | null = null;

function loadCategories(): Promise<Category[]> {
  shared ??= getCategories().then((list) => {
    // getCategories() returns [] on failure — retry on the next mount instead of caching that
    if (list.length === 0) shared = null;
    return list;
  });
  return shared;
}

/** @param menuOnly true → only categories the admin marked "Show in navigation menu" */
export function useCatalogCategories({ menuOnly = false }: { menuOnly?: boolean } = {}): Category[] {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    let alive = true;
    loadCategories().then((list) => {
      if (alive) setCategories(list);
    });
    return () => {
      alive = false;
    };
  }, []);

  if (!menuOnly) return categories;
  return categories
    .filter((c) => c.showInMenu !== false)
    .map((c) => ({ ...c, subCategories: c.subCategories.filter((s) => s.showInMenu !== false) }));
}
