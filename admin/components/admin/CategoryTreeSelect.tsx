import React, { useMemo, useState } from 'react';
import { ChevronDown, FolderTree, Search } from 'lucide-react';
import type { CategoryNode } from '@/types/admin';
import { flattenCategories } from '@/lib/api/admin/categories';

interface CategoryTreeSelectProps {
  categories: CategoryNode[];
  value: string;
  onChange: (categoryId: string) => void;
  placeholder?: string;
  allowEmpty?: boolean;
  emptyLabel?: string;
  maxLevel?: 1 | 2 | 3;
}

export function CategoryTreeSelect({
  categories,
  value,
  onChange,
  placeholder = 'Select category...',
  allowEmpty = false,
  emptyLabel = 'None (Top-level root category)',
  maxLevel = 3,
}: CategoryTreeSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const flat = useMemo(() => {
    return flattenCategories(categories).filter((item) => item.node.level <= maxLevel);
  }, [categories, maxLevel]);

  const filtered = useMemo(() => {
    if (!search.trim()) return flat;
    const q = search.trim().toLowerCase();
    return flat.filter(
      (item) =>
        item.node.name.toLowerCase().includes(q) ||
        item.path.toLowerCase().includes(q)
    );
  }, [flat, search]);

  const selectedLabel = useMemo(() => {
    if (!value) return allowEmpty ? emptyLabel : placeholder;
    return flat.find((f) => f.node.id === value)?.path || placeholder;
  }, [value, flat, allowEmpty, emptyLabel, placeholder]);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 rounded-lg border border-[#DCE6F2] bg-white px-3 py-2 text-left text-sm text-[#12263F] hover:border-[#1D5FAF] focus:border-[#1D5FAF] focus:outline-none focus:ring-2 focus:ring-[#1D5FAF]/20"
      >
        <span className="flex items-center gap-2 truncate">
          <FolderTree className="h-4 w-4 shrink-0 text-[#5B6B82]" />
          <span className={`truncate ${!value && !allowEmpty ? 'text-[#5B6B82]/70' : ''}`}>
            {selectedLabel}
          </span>
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-[#5B6B82]" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute left-0 right-0 z-40 mt-1.5 rounded-xl border border-[#DCE6F2] bg-white shadow-xl">
            <div className="border-b border-[#DCE6F2] p-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#5B6B82]" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Filter categories..."
                  className="w-full rounded-lg border border-[#DCE6F2] bg-[#F6F9FD] pl-8 pr-3 py-1.5 text-xs text-[#12263F] focus:border-[#1D5FAF] focus:bg-white focus:outline-none"
                />
              </div>
            </div>
            <div className="max-h-64 overflow-y-auto p-1.5 space-y-0.5">
              {allowEmpty && (
                <button
                  type="button"
                  onClick={() => {
                    onChange('');
                    setOpen(false);
                  }}
                  className={`flex w-full items-center rounded-lg px-2.5 py-2 text-left text-xs font-medium transition-colors ${
                    !value
                      ? 'bg-[#EAF2FC] text-[#1D5FAF]'
                      : 'text-[#5B6B82] hover:bg-[#F6F9FD] hover:text-[#12263F]'
                  }`}
                >
                  {emptyLabel}
                </button>
              )}
              {filtered.map(({ node, path }) => {
                const indent = (node.level - 1) * 14;
                const selected = value === node.id;
                return (
                  <button
                    key={node.id}
                    type="button"
                    onClick={() => {
                      onChange(node.id);
                      setOpen(false);
                    }}
                    style={{ paddingLeft: `${10 + indent}px` }}
                    className={`flex w-full items-center justify-between gap-2 rounded-lg pr-2.5 py-2 text-left text-xs transition-colors ${
                      selected
                        ? 'bg-[#EAF2FC] font-semibold text-[#1D5FAF]'
                        : 'text-[#12263F] hover:bg-[#F6F9FD]'
                    }`}
                  >
                    <span className="truncate">
                      {node.level > 1 && <span className="mr-1.5 text-[#5B6B82]">└</span>}
                      {node.name}
                    </span>
                    <span className="text-[11px] text-[#5B6B82] shrink-0">
                      L{node.level}
                    </span>
                  </button>
                );
              })}
              {filtered.length === 0 && (
                <p className="px-3 py-4 text-center text-xs text-[#5B6B82]">
                  No categories match &ldquo;{search}&rdquo;
                </p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
