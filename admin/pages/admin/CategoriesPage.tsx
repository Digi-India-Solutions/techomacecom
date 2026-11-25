import React, { useEffect, useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Edit3,
  FolderPlus,
  GripVertical,
  Plus,
  Trash2,
} from 'lucide-react';
import type { CategoryNode, CategoryPayload, CategoryStatus } from '@/types/admin';
import {
  deleteCategory,
  listCategories,
  saveCategory,
  updateCategoryTree,
} from '@/lib/api/admin/categories';
import { slugify, uploadImages } from '@/lib/api/admin/client';
import { useToast } from '@/components/admin/ToastProvider';
import { useAuth } from '@/components/admin/AuthContext';
import { Drawer } from '@/components/admin/Drawer';
import { FormField, inputClass, selectClass, textareaClass } from '@/components/admin/FormField';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { CategoryTreeSelect } from '@/components/admin/CategoryTreeSelect';
import { SafeImage } from '@/components/admin/SafeImage';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';

type ImageField = 'iconUrl' | 'imageUrl' | 'desktopBannerUrl' | 'mobileBannerUrl';

const EMPTY_CATEGORY: CategoryPayload = {
  name: '',
  slug: '',
  parentId: null,
  iconUrl: '',
  imageUrl: '',
  desktopBannerUrl: '',
  mobileBannerUrl: '',
  description: '',
  seoTitle: '',
  seoDescription: '',
  showInMenu: true,
  showOnHomepage: false,
  status: 'active',
};

function getAllCategoryIds(nodes: CategoryNode[]): string[] {
  const ids: string[] = [];
  for (const n of nodes) {
    ids.push(n.id);
    if (n.children && n.children.length > 0) {
      ids.push(...getAllCategoryIds(n.children));
    }
  }
  return ids;
}

export function CategoriesPage() {
  const { showToast } = useToast();
  // Buttons follow the role's permissions (the API enforces them too)
  const { can } = useAuth();
  const canCreate = can('categories.create');
  const canEdit = can('categories.edit');
  const canDelete = can('categories.delete');
  const [tree, setTree] = useState<CategoryNode[]>([]);
  const [loading, setLoading] = useState(true);
  // Level-1 categories start expanded (filled in after the first load)
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  // Image fields currently uploading (Save waits for them)
  const [uploadingFields, setUploadingFields] = useState<Set<ImageField>>(new Set());

  // Drag state
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<{ id: string; mode: 'before' | 'inside' } | null>(null);

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [form, setForm] = useState<CategoryPayload>(EMPTY_CATEGORY);
  const [slugTouched, setSlugTouched] = useState(false);
  const [saving, setSaving] = useState(false);

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<CategoryNode | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await listCategories();
      setTree(data);
      setExpanded((prev) => (prev.size ? prev : new Set(getAllCategoryIds(data))));
    } catch (err) {
      showToast({
        title: 'Could not load categories',
        description: err instanceof Error ? err.message : 'Please try again',
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const openCreateDrawer = (parentId: string | null = null) => {
    if (parentId) {
      setExpanded((prev) => new Set(prev).add(parentId));
    }
    setForm({ ...EMPTY_CATEGORY, parentId });
    setSlugTouched(false);
    setDrawerOpen(true);
  };

  const openEditDrawer = (node: CategoryNode) => {
    setForm({
      id: node.id,
      name: node.name,
      slug: node.slug,
      parentId: node.parentId,
      iconUrl: node.iconUrl,
      imageUrl: node.imageUrl || '',
      desktopBannerUrl: node.desktopBannerUrl,
      mobileBannerUrl: node.mobileBannerUrl,
      description: node.description,
      seoTitle: node.seoTitle,
      seoDescription: node.seoDescription,
      showInMenu: node.showInMenu,
      showOnHomepage: node.showOnHomepage,
      status: node.status,
    });
    setSlugTouched(true);
    setDrawerOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    if (uploadingFields.size > 0) {
      showToast({ title: 'Please wait', description: 'An image is still uploading.', variant: 'warning' });
      return;
    }
    setSaving(true);
    try {
      const next = await saveCategory(form);
      setTree(next);
      setExpanded((prev) => {
        const nextSet = new Set(prev);
        if (form.parentId) nextSet.add(form.parentId);
        getAllCategoryIds(next).forEach((id) => nextSet.add(id));
        return nextSet;
      });
      setDrawerOpen(false);
      showToast({
        title: form.id ? 'Category updated' : 'Category created',
        description: form.name,
        variant: 'success',
      });
    } catch (err) {
      showToast({
        title: 'Save failed',
        description: err instanceof Error ? err.message : 'Unable to save category',
        variant: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const next = await deleteCategory(deleteTarget.id);
      setTree(next);
      showToast({ title: `Deleted "${deleteTarget.name}"`, variant: 'info' });
    } catch (err) {
      showToast({
        title: 'Cannot delete category',
        description: err instanceof Error ? err.message : 'Category has products',
        variant: 'warning',
      });
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleDropOnNode = async (targetId: string, mode: 'before' | 'inside') => {
    if (!draggedId || draggedId === targetId) return;

    const clone = structuredClone(tree) as CategoryNode[];
    let extracted: CategoryNode | null = null;

    const removeFrom = (nodes: CategoryNode[]): CategoryNode[] =>
      nodes.filter((n) => {
        if (n.id === draggedId) {
          extracted = n;
          return false;
        }
        if (n.children) n.children = removeFrom(n.children);
        return true;
      });

    const withoutDragged = removeFrom(clone);
    if (!extracted) return;

    const containsTarget = (node: CategoryNode, id: string): boolean => {
      if (node.id === id) return true;
      return (node.children || []).some((c) => containsTarget(c, id));
    };
    if (containsTarget(extracted, targetId)) return;

    const insertInto = (nodes: CategoryNode[], currentLevel: number): boolean => {
      for (let i = 0; i < nodes.length; i++) {
        if (nodes[i].id === targetId) {
          if (mode === 'inside') {
            if (currentLevel >= 3) {
              showToast({
                title: 'Maximum 3 levels allowed',
                description: 'Categories support up to Level 3 depth.',
                variant: 'warning',
              });
              return true;
            }
            nodes[i].children = [...(nodes[i].children || []), extracted!];
            setExpanded((prev) => new Set(prev).add(nodes[i].id));
          } else {
            nodes.splice(i, 0, extracted!);
          }
          return true;
        }
        if (nodes[i].children && insertInto(nodes[i].children!, currentLevel + 1)) {
          return true;
        }
      }
      return false;
    };

    insertInto(withoutDragged, 1);
    setDraggedId(null);
    setDropTarget(null);
    try {
      // The server re-checks the 3-level limit and returns the stored tree
      const updated = await updateCategoryTree(withoutDragged);
      setTree(updated);
      showToast({ title: 'Category order updated', variant: 'success' });
    } catch (err) {
      showToast({
        title: 'Could not save the new order',
        description: err instanceof Error ? err.message : 'Please try again',
        variant: 'error',
      });
      load();
    }
  };

  /** Uploads the picked image to the API (stored as WebP) and keeps its server URL in the form. */
  const handleFilePreview = async (file: File | undefined, field: ImageField) => {
    if (!file) return;
    setUploadingFields((prev) => new Set(prev).add(field));
    try {
      const [uploaded] = await uploadImages([file], 'categories');
      setForm((prev) => ({ ...prev, [field]: uploaded.url }));
    } catch (err) {
      showToast({
        title: 'Image upload failed',
        description: err instanceof Error ? err.message : 'Please try again',
        variant: 'error',
      });
    } finally {
      setUploadingFields((prev) => {
        const next = new Set(prev);
        next.delete(field);
        return next;
      });
    }
  };

  /** Small preview + remove link under an image input. */
  const renderImagePreview = (field: ImageField, label: string) => {
    if (uploadingFields.has(field)) {
      return <p className="mt-1.5 text-[11px] text-[#5B6B82]">Uploading…</p>;
    }
    const value = form[field];
    if (!value) return null;
    return (
      <div className="mt-1.5 flex items-center gap-2">
        <div className="h-10 w-16 overflow-hidden rounded border border-[#DCE6F2] bg-[#F6F9FD]">
          <SafeImage src={value} alt={label} />
        </div>
        <button
          type="button"
          onClick={() => setForm((prev) => ({ ...prev, [field]: '' }))}
          className="text-[11px] font-semibold text-red-600 hover:underline"
        >
          Remove
        </button>
      </div>
    );
  };

  const renderNode = (node: CategoryNode) => {
    const hasChildren = Boolean(node.children && node.children.length > 0);
    const isExpanded = expanded.has(node.id);
    const isDropBefore = dropTarget?.id === node.id && dropTarget.mode === 'before';
    const isDropInside = dropTarget?.id === node.id && dropTarget.mode === 'inside';

    return (
      <div key={node.id} className="select-none">
        <div
          draggable={canEdit}
          onDragStart={(e) => {
            e.stopPropagation();
            setDraggedId(node.id);
          }}
          onDragOver={(e) => {
            if (!canEdit || !draggedId) return;
            e.preventDefault();
            e.stopPropagation();
            const rect = e.currentTarget.getBoundingClientRect();
            const offsetY = e.clientY - rect.top;
            const mode = offsetY < rect.height * 0.35 ? 'before' : 'inside';
            setDropTarget({ id: node.id, mode });
          }}
          onDragLeave={() => setDropTarget(null)}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (dropTarget) handleDropOnNode(node.id, dropTarget.mode);
          }}
          onDragEnd={() => {
            setDraggedId(null);
            setDropTarget(null);
          }}
          style={{ marginLeft: `${(node.level - 1) * 24}px` }}
          className={`group flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-white px-3.5 py-2.5 mb-2 transition-colors ${
            isDropBefore
              ? 'border-t-2 border-t-[#1D5FAF] border-[#DCE6F2]'
              : isDropInside
                ? 'border-[#1D5FAF] bg-[#EAF2FC]/50'
                : 'border-[#DCE6F2] hover:border-[#1D5FAF]/40'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            {canEdit ? (
              <GripVertical className="h-4 w-4 text-[#5B6B82]/60 cursor-grab shrink-0" />
            ) : (
              <span className="w-4 shrink-0" />
            )}

            {hasChildren ? (
              <button
                type="button"
                onClick={() => toggleExpand(node.id)}
                className="rounded p-1 text-[#5B6B82] hover:bg-[#EAF2FC]"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>
            ) : (
              <span className="w-6 shrink-0" />
            )}

            <div className="h-9 w-9 shrink-0 overflow-hidden rounded-lg border border-[#DCE6F2] bg-[#F6F9FD]">
              <SafeImage src={node.iconUrl} alt={node.name} />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-[#12263F] truncate">
                  {node.name}
                </span>
                <span className="rounded bg-[#F6F9FD] border border-[#DCE6F2] px-1.5 py-0.5 text-[10px] font-semibold text-[#5B6B82]">
                  Level {node.level}
                </span>
              </div>
              <p className="text-xs text-[#5B6B82] truncate">
                /{node.slug} · {node.showInMenu ? 'In Menu' : 'Hidden from Menu'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span className="rounded-md bg-[#EAF2FC] px-2.5 py-1 text-xs font-semibold text-[#1D5FAF] tabular-nums">
              {node.productCount} {node.productCount === 1 ? 'product' : 'products'}
            </span>
            <StatusBadge status={node.status} />

            <div className="flex items-center gap-1">
              {canCreate && node.level < 3 && (
                <button
                  type="button"
                  onClick={() => openCreateDrawer(node.id)}
                  title="Add subcategory"
                  className="rounded-md p-1.5 text-[#5B6B82] hover:bg-[#EAF2FC] hover:text-[#1D5FAF]"
                >
                  <FolderPlus className="h-4 w-4" />
                </button>
              )}
              {canEdit && (
                <button
                  type="button"
                  onClick={() => openEditDrawer(node)}
                  title="Edit category"
                  className="rounded-md p-1.5 text-[#5B6B82] hover:bg-[#EAF2FC] hover:text-[#1D5FAF]"
                >
                  <Edit3 className="h-4 w-4" />
                </button>
              )}
              {canDelete && (
                <button
                  type="button"
                  onClick={() => setDeleteTarget(node)}
                  title="Delete category"
                  className="rounded-md p-1.5 text-[#5B6B82] hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div>{node.children!.map((child) => renderNode(child))}</div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#12263F] tracking-tight">Categories</h1>
          <p className="mt-0.5 text-sm text-[#5B6B82]">
            Organize the 3-level medical catalog taxonomy. Drag rows to reorder or nest under a parent category.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {tree.length > 0 && (
            <button
              type="button"
              onClick={() => {
                if (expanded.size > 0) {
                  setExpanded(new Set());
                } else {
                  setExpanded(new Set(getAllCategoryIds(tree)));
                }
              }}
              className="rounded-lg border border-[#DCE6F2] bg-white px-3 py-2 text-xs font-semibold text-[#12263F] hover:bg-[#F6F9FD] cursor-pointer"
            >
              {expanded.size > 0 ? 'Collapse All' : 'Expand All'}
            </button>
          )}
          {canCreate && (
            <button
              type="button"
              onClick={() => openCreateDrawer(null)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#1D5FAF] px-4 py-2 text-xs font-semibold text-white hover:bg-[#174D8F] cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              Add Category
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="rounded-xl border border-[#DCE6F2] bg-white p-8 text-sm text-[#5B6B82]">
          Loading category tree...
        </div>
      ) : (
        <div className="rounded-xl border border-[#DCE6F2] bg-[#F6F9FD] p-4">
          {tree.length === 0 ? (
            <p className="py-6 text-center text-sm text-[#5B6B82]">
              No categories yet. Click &ldquo;Add Category&rdquo; to create the first one.
            </p>
          ) : (
            tree.map((node) => renderNode(node))
          )}
        </div>
      )}

      {/* Side Drawer for Add / Edit Category */}
      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={form.id ? `Edit Category: ${form.name}` : 'Create Category'}
        subtitle="Configure hierarchy, menu visibility, and SEO metadata"
        footer={
          <>
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              className="rounded-lg border border-[#DCE6F2] bg-white px-4 py-2 text-xs font-semibold text-[#12263F] hover:bg-[#EAF2FC]"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="category-drawer-form"
              disabled={saving || uploadingFields.size > 0}
              className="rounded-lg bg-[#1D5FAF] px-4 py-2 text-xs font-semibold text-white hover:bg-[#174D8F] disabled:opacity-60"
            >
              {saving
                ? 'Saving...'
                : uploadingFields.size > 0
                  ? 'Uploading image...'
                  : form.id
                    ? 'Save Category'
                    : 'Create Category'}
            </button>
          </>
        }
      >
        <form id="category-drawer-form" onSubmit={handleSave} className="space-y-4">
          <FormField label="Category Name" required>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => {
                const name = e.target.value;
                setForm((prev) => ({
                  ...prev,
                  name,
                  slug: slugTouched ? prev.slug : slugify(name),
                }));
              }}
              className={inputClass}
            />
          </FormField>

          <FormField label="URL Slug" required>
            <input
              type="text"
              required
              value={form.slug}
              onChange={(e) => {
                setSlugTouched(true);
                setForm((prev) => ({ ...prev, slug: slugify(e.target.value) }));
              }}
              className={`${inputClass} font-mono text-xs`}
            />
          </FormField>

          <FormField label="Parent Category (up to Level 2 as parent)">
            <CategoryTreeSelect
              categories={tree}
              value={form.parentId || ''}
              onChange={(val) => setForm((prev) => ({ ...prev, parentId: val || null }))}
              allowEmpty
              emptyLabel="None (Top-level Level 1 category)"
              maxLevel={2}
            />
          </FormField>

          <FormField label="Icon / Thumbnail Image">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-[#DCE6F2] bg-[#F6F9FD]">
                <SafeImage src={form.iconUrl} alt={form.name || 'Category icon'} />
              </div>
              <div className="flex-1 space-y-1.5">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFilePreview(e.target.files?.[0], 'iconUrl')}
                  className="block w-full text-xs text-[#5B6B82] file:mr-3 file:rounded-md file:border file:border-[#DCE6F2] file:bg-[#F6F9FD] file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-[#12263F]"
                />
              </div>
            </div>
          </FormField>

          <FormField label="Card Image (storefront category tile)">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleFilePreview(e.target.files?.[0], 'imageUrl')}
              className="block w-full text-xs text-[#5B6B82] file:mr-2 file:rounded-md file:border file:border-[#DCE6F2] file:bg-[#F6F9FD] file:px-2.5 file:py-1 file:text-xs"
            />
            {renderImagePreview('imageUrl', 'Card image')}
          </FormField>

          <FormField label="Description">
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, description: e.target.value }))
              }
              className={textareaClass}
            />
          </FormField>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Status">
              <select
                value={form.status}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    status: e.target.value as CategoryStatus,
                  }))
                }
                className={selectClass}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </FormField>

            <div className="pt-5">
              <label className="flex items-center gap-2 text-xs font-medium text-[#12263F] cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.showInMenu}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, showInMenu: e.target.checked }))
                  }
                  className="rounded border-[#DCE6F2] text-[#1D5FAF]"
                />
                Show in navigation menu
              </label>
            </div>
          </div>

          <div className="border-t border-[#DCE6F2] pt-4 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#5B6B82]">
              SEO Metadata
            </p>
            <FormField label="SEO Title">
              <input
                type="text"
                value={form.seoTitle}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, seoTitle: e.target.value }))
                }
                className={inputClass}
              />
            </FormField>
            <FormField label="SEO Description">
              <textarea
                value={form.seoDescription}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    seoDescription: e.target.value,
                  }))
                }
                className={textareaClass}
              />
            </FormField>
          </div>
        </form>
      </Drawer>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title={`Delete category "${deleteTarget?.name}"?`}
        description={
          deleteTarget && deleteTarget.productCount > 0
            ? `This category currently contains ${deleteTarget.productCount} assigned products. Attempting deletion will be blocked until products are reassigned.`
            : 'This permanently removes the empty category from the catalog tree.'
        }
        confirmLabel="Delete Category"
        variant={deleteTarget && deleteTarget.productCount > 0 ? 'warning' : 'danger'}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
