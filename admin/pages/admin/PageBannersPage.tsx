import React, { useEffect, useMemo, useState } from 'react';
import { Edit3, Plus, Trash2, Upload } from 'lucide-react';
import type { Brand, CategoryNode, PageBanner, PageBannerType } from '@/types/admin';
import {
  deletePageBanner,
  listPageBanners,
  savePageBanner,
} from '@/lib/api/admin/marketing';
import { flattenCategories, listCategories } from '@/lib/api/admin/categories';
import { listBrands } from '@/lib/api/admin/brands';
import { PRODUCT_IMAGES } from '@/lib/api/admin/mockData';
import { formatShortDate, uploadImages } from '@/lib/api/admin/client';
import { useToast } from '@/components/admin/ToastProvider';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { SafeImage } from '@/components/admin/SafeImage';
import { Drawer } from '@/components/admin/Drawer';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { FormField, inputClass, selectClass } from '@/components/admin/FormField';

const PAGE_TYPES: PageBannerType[] = [
  'Category',
  'Brand',
  'Best Sellers',
  'New Arrivals',
  'Offers',
  'Hot Selling',
  'Deal of the Day',
  'Brands',
];

export function PageBannersPage() {
  const { showToast } = useToast();

  const [banners, setBanners] = useState<PageBanner[]>([]);
  const [categories, setCategories] = useState<CategoryNode[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [selectedPageType, setSelectedPageType] = useState<'all' | PageBannerType>('all');
  const [loading, setLoading] = useState(true);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<PageBanner | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingDesktop, setUploadingDesktop] = useState(false);
  const [uploadingMobile, setUploadingMobile] = useState(false);

  const handleDesktopFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingDesktop(true);
    try {
      const uploaded = await uploadImages([file], 'banners');
      if (uploaded[0]?.url) {
        setForm((f) => ({ ...f, desktopImageUrl: uploaded[0].url }));
        showToast({ title: 'Desktop banner uploaded as WebP', variant: 'success' });
        return;
      }
    } catch (err) {
      console.warn('Backend upload failed, using local preview:', err);
    } finally {
      setUploadingDesktop(false);
    }
    setForm((f) => ({ ...f, desktopImageUrl: URL.createObjectURL(file) }));
  };

  const handleMobileFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingMobile(true);
    try {
      const uploaded = await uploadImages([file], 'banners');
      if (uploaded[0]?.url) {
        setForm((f) => ({ ...f, mobileImageUrl: uploaded[0].url }));
        showToast({ title: 'Mobile banner uploaded as WebP', variant: 'success' });
        return;
      }
    } catch (err) {
      console.warn('Backend upload failed, using local preview:', err);
    } finally {
      setUploadingMobile(false);
    }
    setForm((f) => ({ ...f, mobileImageUrl: URL.createObjectURL(file) }));
  };

  const [form, setForm] = useState<Omit<PageBanner, 'id' | 'sortOrder'>>({
    pageType: 'Category',
    targetId: '',
    targetLabel: '',
    title: '',
    desktopImageUrl: PRODUCT_IMAGES.dentalChair,
    mobileImageUrl: PRODUCT_IMAGES.dentalChair,
    linkUrl: '/category/respiratory-care',
    startDate: '2026-11-17',
    endDate: '2026-12-31',
    active: true,
  });

  const load = async () => {
    setLoading(true);
    try {
      const [bRows, cTree, brRows] = await Promise.all([
        listPageBanners(),
        listCategories(),
        listBrands(),
      ]);
      setBanners(bRows);
      setCategories(cTree);
      setBrands(brRows);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const flatCategories = useMemo(() => flattenCategories(categories), [categories]);

  const filteredBanners = useMemo(
    () =>
      selectedPageType === 'all'
        ? banners
        : banners.filter((b) => b.pageType === selectedPageType),
    [banners, selectedPageType]
  );

  const openNew = () => {
    setEditingId(undefined);
    setForm({
      pageType: selectedPageType === 'all' ? 'Category' : selectedPageType,
      targetId: flatCategories[0]?.node.id || '',
      targetLabel: flatCategories[0]?.node.name || '',
      title: '',
      desktopImageUrl: PRODUCT_IMAGES.dentalChair,
      mobileImageUrl: PRODUCT_IMAGES.dentalChair,
      linkUrl: '/offers',
      startDate: '2026-11-17',
      endDate: '2026-12-31',
      active: true,
    });
    setDrawerOpen(true);
  };

  const openEdit = (b: PageBanner) => {
    setEditingId(b.id);
    setForm({
      pageType: b.pageType,
      targetId: b.targetId || '',
      targetLabel: b.targetLabel || '',
      title: b.title,
      desktopImageUrl: b.desktopImageUrl,
      mobileImageUrl: b.mobileImageUrl,
      linkUrl: b.linkUrl,
      startDate: b.startDate,
      endDate: b.endDate,
      active: b.active,
    });
    setDrawerOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const next = await savePageBanner({ ...form, id: editingId });
      setBanners(next);
      setDrawerOpen(false);
      showToast({
        title: editingId ? 'Page banner updated' : 'Page banner added',
        variant: 'success',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const next = await deletePageBanner(deleteTarget.id);
    setBanners(next);
    setDeleteTarget(null);
    showToast({ title: 'Page banner deleted', variant: 'success' });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#12263F] tracking-tight">Page Banners</h1>
          <p className="mt-0.5 text-sm text-[#5B6B82]">
            Manage category, brand, and storefront collection landing banners with multi-banner ordering.
          </p>
        </div>

        <button
          type="button"
          onClick={openNew}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#1D5FAF] px-4 py-2 text-xs font-semibold text-white hover:bg-[#174D8F]"
        >
          <Plus className="h-4 w-4" />
          Add Page Banner
        </button>
      </div>

      {/* Page Type Filter Chips */}
      <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-[#DCE6F2] bg-white p-2">
        <button
          type="button"
          onClick={() => setSelectedPageType('all')}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
            selectedPageType === 'all'
              ? 'bg-[#1D5FAF] text-white'
              : 'text-[#5B6B82] hover:bg-[#EAF2FC] hover:text-[#12263F]'
          }`}
        >
          All Pages ({banners.length})
        </button>
        {PAGE_TYPES.map((pt) => {
          const count = banners.filter((b) => b.pageType === pt).length;
          return (
            <button
              key={pt}
              type="button"
              onClick={() => setSelectedPageType(pt)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                selectedPageType === pt
                  ? 'bg-[#1D5FAF] text-white'
                  : 'text-[#5B6B82] hover:bg-[#EAF2FC] hover:text-[#12263F]'
              }`}
            >
              {pt} {count > 0 ? `(${count})` : ''}
            </button>
          );
        })}
      </div>

      {/* Banner Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
          <div className="h-44 rounded-xl bg-slate-200" />
          <div className="h-44 rounded-xl bg-slate-200" />
        </div>
      ) : filteredBanners.length === 0 ? (
        <div className="rounded-xl border border-[#DCE6F2] bg-white p-8 text-center">
          <p className="text-sm font-semibold text-[#12263F]">
            No banners configured for {selectedPageType}
          </p>
          <p className="mt-1 text-xs text-[#5B6B82]">
            Add a desktop and mobile banner to feature promotions on this page.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredBanners.map((b) => (
            <div
              key={b.id}
              className="rounded-xl border border-[#DCE6F2] bg-white overflow-hidden flex flex-col"
            >
              <div className="relative aspect-[16/5] w-full bg-[#F6F9FD] border-b border-[#DCE6F2]">
                <SafeImage src={b.desktopImageUrl} alt={b.title} />
                <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                  <span className="rounded-md bg-[#0B2545]/85 px-2 py-0.5 text-[11px] font-semibold text-white">
                    {b.pageType}
                    {b.targetLabel ? `: ${b.targetLabel}` : ''}
                  </span>
                </div>
                <div className="absolute top-2.5 right-2.5">
                  <StatusBadge status={b.active ? 'active' : 'inactive'} />
                </div>
              </div>
              <div className="p-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#12263F] truncate">{b.title}</p>
                  <p className="text-xs text-[#5B6B82] truncate">
                    {b.linkUrl} · {formatShortDate(b.startDate)} – {formatShortDate(b.endDate)}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => openEdit(b)}
                    className="inline-flex items-center gap-1 rounded-lg border border-[#DCE6F2] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#1D5FAF] hover:bg-[#EAF2FC]"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(b)}
                    className="rounded-lg border border-[#DCE6F2] bg-white p-1.5 text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={editingId ? 'Edit Page Banner' : 'Add Page Banner'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <FormField label="Page Type" required>
            <select
              value={form.pageType}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  pageType: e.target.value as PageBannerType,
                  targetId: '',
                  targetLabel: '',
                }))
              }
              className={selectClass}
            >
              {PAGE_TYPES.map((pt) => (
                <option key={pt} value={pt}>
                  {pt}
                </option>
              ))}
            </select>
          </FormField>

          {form.pageType === 'Category' && (
            <FormField label="Target Category" required>
              <select
                value={form.targetId || ''}
                onChange={(e) => {
                  const chosen = flatCategories.find((c) => c.node.id === e.target.value);
                  setForm((f) => ({
                    ...f,
                    targetId: e.target.value,
                    targetLabel: chosen?.node.name || '',
                  }));
                }}
                className={selectClass}
              >
                <option value="">Select category...</option>
                {flatCategories.map((c) => (
                  <option key={c.node.id} value={c.node.id}>
                    {c.path}
                  </option>
                ))}
              </select>
            </FormField>
          )}

          {form.pageType === 'Brand' && (
            <FormField label="Target Brand" required>
              <select
                value={form.targetId || ''}
                onChange={(e) => {
                  const chosen = brands.find((b) => b.id === e.target.value);
                  setForm((f) => ({
                    ...f,
                    targetId: e.target.value,
                    targetLabel: chosen?.name || '',
                  }));
                }}
                className={selectClass}
              >
                <option value="">Select brand...</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </FormField>
          )}

          <FormField label="Banner Title" required>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className={inputClass}
            />
          </FormField>

          <FormField label="Desktop Banner Image" required>
            <div className="space-y-2">
              <div className="aspect-[16/5] w-full overflow-hidden rounded-lg border border-[#DCE6F2] bg-[#F6F9FD]">
                <SafeImage src={form.desktopImageUrl} alt="Desktop preview" />
              </div>
              <label className="inline-flex items-center gap-1.5 rounded-lg border border-[#DCE6F2] bg-white px-3 py-1.5 text-xs font-semibold text-[#12263F] hover:bg-[#EAF2FC] cursor-pointer">
                <Upload className="h-3.5 w-3.5" />
                {uploadingDesktop ? 'Uploading...' : 'Upload Desktop Image'}
                <input
                  type="file"
                  accept="image/*"
                  disabled={uploadingDesktop}
                  className="hidden"
                  onChange={handleDesktopFile}
                />
              </label>
            </div>
          </FormField>

          <FormField label="Mobile Banner Image" required>
            <div className="space-y-2">
              <div className="aspect-[4/3] w-44 overflow-hidden rounded-lg border border-[#DCE6F2] bg-[#F6F9FD]">
                <SafeImage src={form.mobileImageUrl} alt="Mobile preview" />
              </div>
              <label className="inline-flex items-center gap-1.5 rounded-lg border border-[#DCE6F2] bg-white px-3 py-1.5 text-xs font-semibold text-[#12263F] hover:bg-[#EAF2FC] cursor-pointer">
                <Upload className="h-3.5 w-3.5" />
                {uploadingMobile ? 'Uploading...' : 'Upload Mobile Image'}
                <input
                  type="file"
                  accept="image/*"
                  disabled={uploadingMobile}
                  className="hidden"
                  onChange={handleMobileFile}
                />
              </label>
            </div>
          </FormField>

          <FormField label="Click Link URL" required>
            <input
              type="text"
              required
              value={form.linkUrl}
              onChange={(e) => setForm((f) => ({ ...f, linkUrl: e.target.value }))}
              className={inputClass}
            />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Start Date">
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                className={inputClass}
              />
            </FormField>
            <FormField label="End Date">
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                className={inputClass}
              />
            </FormField>
          </div>

          <label className="flex items-center gap-2 text-xs font-medium text-[#12263F] cursor-pointer">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
              className="rounded border-[#DCE6F2] text-[#1D5FAF]"
            />
            Active
          </label>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#DCE6F2]">
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              className="rounded-lg border border-[#DCE6F2] px-4 py-2 text-xs font-semibold text-[#12263F]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || uploadingDesktop || uploadingMobile}
              className="rounded-lg bg-[#1D5FAF] px-4 py-2 text-xs font-semibold text-white hover:bg-[#174D8F] disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Banner'}
            </button>
          </div>
        </form>
      </Drawer>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Page Banner"
        description={`Delete "${deleteTarget?.title}" from ${deleteTarget?.pageType} banners?`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
