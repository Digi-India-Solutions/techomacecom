import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Edit3,
  Eye,
  EyeOff,
  GripVertical,
  Megaphone,
  Save,
} from 'lucide-react';
import type { CategoryNode, HomepageSection, Product } from '@/types/admin';
import { getHomepageConfig, saveHomepageConfig } from '@/lib/api/admin/marketing';
import { flattenCategories, listCategories } from '@/lib/api/admin/categories';
import { listProducts } from '@/lib/api/admin/products';
import { useToast } from '@/components/admin/ToastProvider';
import { Drawer } from '@/components/admin/Drawer';
import { FormField, inputClass } from '@/components/admin/FormField';

export function HomepageSectionsPage() {
  const { showToast } = useToast();

  const [announcementStrip, setAnnouncementStrip] = useState('');
  const [sections, setSections] = useState<HomepageSection[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<CategoryNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  // Edit section drawer
  const [editingSection, setEditingSection] = useState<HomepageSection | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editSelectedIds, setEditSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([getHomepageConfig(), listProducts(), listCategories()])
      .then(([cfg, prods, cats]) => {
        if (cancelled) return;
        const validProdIds = new Set(prods.map((p) => String(p.id)));
        const flatCats = flattenCategories(cats);
        const validCatIds = new Set(flatCats.map((c) => String(c.node.id)));

        const sanitizedSections = (cfg.sections || []).map((sec) => {
          if (sec.configurableType === 'products') {
            return {
              ...sec,
              selectedIds: (sec.selectedIds || []).filter((id) => validProdIds.has(String(id))),
            };
          }
          if (sec.configurableType === 'categories') {
            return {
              ...sec,
              selectedIds: (sec.selectedIds || []).filter((id) => validCatIds.has(String(id))),
            };
          }
          return sec;
        });

        setAnnouncementStrip(cfg.announcementStrip);
        setSections(sanitizedSections);
        setProducts(prods);
        setCategories(cats);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const flatCategories = useMemo(() => flattenCategories(categories), [categories]);

  const getSelectedCount = (sec: HomepageSection) => {
    if (sec.configurableType === 'products') {
      const validProductIds = new Set(products.map((p) => String(p.id)));
      return sec.selectedIds.filter((id) => validProductIds.has(String(id))).length;
    }
    if (sec.configurableType === 'categories') {
      const validCategoryIds = new Set(flatCategories.map((c) => String(c.node.id)));
      return sec.selectedIds.filter((id) => validCategoryIds.has(String(id))).length;
    }
    return sec.selectedIds.length;
  };

  const moveSection = (from: number, to: number) => {
    if (to < 0 || to >= sections.length || from === to) return;
    const copy = [...sections];
    const [moved] = copy.splice(from, 1);
    copy.splice(to, 0, moved);
    setSections(copy.map((s, idx) => ({ ...s, sortOrder: idx + 1 })));
  };

  const toggleVisibility = (id: string) => {
    setSections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, visible: !s.visible } : s))
    );
  };

  const openEditSection = (sec: HomepageSection) => {
    setEditingSection(sec);
    setEditTitle(sec.title);
    if (sec.configurableType === 'categories') {
      const validCategoryIds = new Set(flatCategories.map((c) => String(c.node.id)));
      const cleaned = sec.selectedIds.filter((id) => validCategoryIds.has(String(id)));
      setEditSelectedIds(cleaned);
    } else if (sec.configurableType === 'products') {
      const validProductIds = new Set(products.map((p) => String(p.id)));
      const cleaned = sec.selectedIds.filter((id) => validProductIds.has(String(id)));
      setEditSelectedIds(cleaned);
    } else {
      setEditSelectedIds(sec.selectedIds);
    }
  };

  const saveEditDrawer = async () => {
    if (!editingSection) return;
    const targetKey = editingSection.key;
    const targetId = editingSection.id;
    const updatedSections = sections.map((s) =>
      (s.key === targetKey || s.id === targetId)
        ? { ...s, title: editTitle, selectedIds: editSelectedIds }
        : s
    );
    setSections(updatedSections);
    setEditingSection(null);
    setSaving(true);

    try {
      await saveHomepageConfig({ announcementStrip, sections: updatedSections });
      showToast({
        title: 'Section heading updated & live!',
        description: `"${editTitle}" is now published on the homepage.`,
        variant: 'success',
      });
    } catch (err: any) {
      showToast({
        title: 'Section updated locally',
        description: 'Click "Save Homepage Layout" at the top to publish changes.',
        variant: 'warning',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      await saveHomepageConfig({ announcementStrip, sections });
      showToast({
        title: 'Homepage sections & announcement saved',
        variant: 'success',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#12263F] tracking-tight">
            Homepage Sections
          </h1>
          <p className="mt-0.5 text-sm text-[#5B6B82]">
            Control top announcement text, show/hide sections, drag-drop section order, and curate featured items.
          </p>
        </div>

        <button
          type="button"
          disabled={saving || loading}
          onClick={handleSaveAll}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#1D5FAF] px-4 py-2 text-xs font-semibold text-white hover:bg-[#174D8F] disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {saving ? 'Saving...' : 'Save Homepage Layout'}
        </button>
      </div>

      {/* Announcement Strip */}
      <div className="rounded-xl border border-[#DCE6F2] bg-white p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Megaphone className="h-4 w-4 text-[#1D5FAF]" />
          <h2 className="text-sm font-semibold text-[#12263F]">Top Announcement Strip</h2>
        </div>
        <FormField
          label="Storefront Top Bar Copy"
          hint="Displayed above the customer site header across desktop and mobile."
        >
          <input
            type="text"
            value={announcementStrip}
            onChange={(e) => setAnnouncementStrip(e.target.value)}
            className={inputClass}
          />
        </FormField>
      </div>

      {/* 14 Homepage Sections */}
      <div className="rounded-xl border border-[#DCE6F2] bg-white overflow-hidden">
        <div className="border-b border-[#DCE6F2] px-5 py-3.5 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[#12263F]">
            Homepage Blocks ({sections.filter((s) => s.visible).length}/{sections.length} visible)
          </h2>
          <span className="text-xs text-[#5B6B82]">Drag or use arrows to reorder</span>
        </div>

        {loading ? (
          <div className="p-6 space-y-2.5 animate-pulse">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 rounded-lg bg-slate-200" />
            ))}
          </div>
        ) : (
          <div className="divide-y divide-[#DCE6F2]">
            {sections.map((sec, idx) => (
              <div
                key={sec.id}
                draggable
                onDragStart={() => setDragIdx(idx)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (dragIdx !== null && dragIdx !== idx) moveSection(dragIdx, idx);
                  setDragIdx(null);
                }}
                onDragEnd={() => setDragIdx(null)}
                className={`flex flex-wrap items-center justify-between gap-3 px-4 py-3 transition-colors ${
                  dragIdx === idx
                    ? 'bg-[#EAF2FC]'
                    : !sec.visible
                      ? 'bg-[#F6F9FD]/70 opacity-75'
                      : 'hover:bg-[#F6F9FD]'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <GripVertical className="h-4 w-4 text-[#5B6B82] cursor-grab shrink-0" />
                  <span className="font-mono text-xs font-bold text-[#5B6B82] w-6">
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-[#12263F]">{sec.defaultName}</p>
                      <span className="text-xs text-[#5B6B82]">→ &ldquo;{sec.title}&rdquo;</span>
                    </div>
                    {sec.configurableType !== 'none' && (
                      <p className="text-[11px] text-[#1D5FAF] font-medium">
                        {getSelectedCount(sec)} {sec.configurableType} selected
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => toggleVisibility(sec.id)}
                    className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-semibold ${
                      sec.visible
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                        : 'border-[#DCE6F2] bg-white text-[#5B6B82]'
                    }`}
                  >
                    {sec.visible ? (
                      <>
                        <Eye className="h-3.5 w-3.5" />
                        Visible
                      </>
                    ) : (
                      <>
                        <EyeOff className="h-3.5 w-3.5" />
                        Hidden
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => moveSection(idx, idx - 1)}
                    className="rounded-lg border border-[#DCE6F2] bg-white p-1.5 text-[#5B6B82] hover:bg-[#EAF2FC] disabled:opacity-35"
                    title="Move up"
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={idx === sections.length - 1}
                    onClick={() => moveSection(idx, idx + 1)}
                    className="rounded-lg border border-[#DCE6F2] bg-white p-1.5 text-[#5B6B82] hover:bg-[#EAF2FC] disabled:opacity-35"
                    title="Move down"
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => openEditSection(sec)}
                    className="inline-flex items-center gap-1 rounded-lg border border-[#DCE6F2] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#1D5FAF] hover:bg-[#EAF2FC]"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    Configure
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Section Drawer */}
      <Drawer
        open={Boolean(editingSection)}
        onClose={() => setEditingSection(null)}
        title={`Configure ${editingSection?.defaultName || ''}`}
      >
        {editingSection && (
          <div className="space-y-4">
            <FormField label="Section Heading Displayed on Homepage" required>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className={inputClass}
              />
            </FormField>

            {editingSection.key === 'featured_categories' && (
              <div className="rounded-lg border border-[#B6D4F8] bg-[#EAF2FC]/60 p-3 text-xs text-[#5B6B82] space-y-1">
                <p className="font-semibold text-[#12263F]">🏷️ Featured Categories Showcase</p>
                <p>
                  Select categories below to showcase as curated category cards on the homepage. Customers can click to explore these departments.
                </p>
              </div>
            )}

            {(editingSection.key === 'promo_banner_1' || editingSection.key === 'promo_1') && (
              <div className="rounded-lg border border-[#B6D4F8] bg-[#EAF2FC]/60 p-3 text-xs text-[#5B6B82] space-y-1">
                <p className="font-semibold text-[#12263F]">🖼️ Promo Banner 1 Creatives &amp; Links</p>
                <p>
                  Banner images and click navigation URLs are managed under{' '}
                  <a
                    href="/admin/banners/pages"
                    className="font-semibold text-[#1D5FAF] hover:underline"
                  >
                    Marketing ➔ Page Banners ➔ Promo Banner 1
                  </a>.
                </p>
              </div>
            )}

            {(editingSection.key === 'promo_banner_2' || editingSection.key === 'promo_banners') && (
              <div className="rounded-lg border border-[#B6D4F8] bg-[#EAF2FC]/60 p-3 text-xs text-[#5B6B82] space-y-1">
                <p className="font-semibold text-[#12263F]">🖼️ Promo Banner 2 Creatives &amp; Links</p>
                <p>
                  Promotional offer cards, images, and click navigation URLs are managed under{' '}
                  <a
                    href="/admin/banners/pages"
                    className="font-semibold text-[#1D5FAF] hover:underline"
                  >
                    Marketing ➔ Page Banners ➔ Promo Banner 2
                  </a>.
                </p>
              </div>
            )}

            {editingSection.configurableType === 'products' && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-[#12263F]">
                  Select Featured Products ({products.filter((p) => editSelectedIds.includes(p.id)).length} selected)
                </p>
                <div className="max-h-72 overflow-y-auto rounded-lg border border-[#DCE6F2] divide-y divide-[#DCE6F2]">
                  {products.map((p) => {
                    const checked = editSelectedIds.includes(p.id);
                    return (
                      <label
                        key={p.id}
                        className="flex items-center gap-3 px-3 py-2.5 text-xs hover:bg-[#F6F9FD] cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() =>
                            setEditSelectedIds((prev) =>
                              checked ? prev.filter((id) => id !== p.id) : [...prev, p.id]
                            )
                          }
                          className="rounded border-[#DCE6F2] text-[#1D5FAF]"
                        />
                        <div className="min-w-0">
                          <p className="font-semibold text-[#12263F] truncate">{p.name}</p>
                          <p className="text-[11px] text-[#5B6B82] font-mono">{p.sku}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {editingSection.configurableType === 'categories' && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-[#12263F]">
                  Select Categories ({flatCategories.filter((c) => editSelectedIds.includes(c.node.id)).length} selected)
                </p>
                <div className="max-h-72 overflow-y-auto rounded-lg border border-[#DCE6F2] divide-y divide-[#DCE6F2]">
                  {flatCategories.map(({ node, path }) => {
                    const checked = editSelectedIds.includes(node.id);
                    return (
                      <label
                        key={node.id}
                        className="flex items-center gap-3 px-3 py-2.5 text-xs hover:bg-[#F6F9FD] cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() =>
                            setEditSelectedIds((prev) =>
                              checked
                                ? prev.filter((id) => id !== node.id)
                                : [...prev, node.id]
                            )
                          }
                          className="rounded border-[#DCE6F2] text-[#1D5FAF]"
                        />
                        <span className="font-medium text-[#12263F]">{path}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t border-[#DCE6F2]">
              <button
                type="button"
                onClick={() => setEditingSection(null)}
                className="rounded-lg border border-[#DCE6F2] px-4 py-2 text-xs font-semibold text-[#12263F]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveEditDrawer}
                className="rounded-lg bg-[#1D5FAF] px-4 py-2 text-xs font-semibold text-white hover:bg-[#174D8F]"
              >
                Apply Section Config
              </button>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
