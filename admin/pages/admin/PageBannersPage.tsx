import React, { useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Edit3, HelpCircle, Plus, Trash2, Upload } from 'lucide-react';
import type { Brand, CategoryNode, PageBanner, PageBannerType } from '@/types/admin';
import {
  deletePageBanner,
  listPageBanners,
  reorderPageBanners,
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
  'Promo Banner 1',
  'Promo Banner 2',
];

export function PageBannersPage() {
  const { showToast } = useToast();

  const [banners, setBanners] = useState<PageBanner[]>([]);
  const [categories, setCategories] = useState<CategoryNode[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [selectedPageType, setSelectedPageType] = useState<PageBannerType>('Category');
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

    // Instant local preview
    const localPreview = URL.createObjectURL(file);
    setForm((f) => ({ ...f, desktopImageUrl: localPreview }));
    setUploadingDesktop(true);

    try {
      const uploaded = await uploadImages([file], 'banners');
      const url = Array.isArray(uploaded) ? uploaded[0]?.url : (uploaded as any)?.url;
      if (url) {
        setForm((f) => ({ ...f, desktopImageUrl: url }));
        showToast({ title: 'Desktop banner uploaded successfully (WebP)', variant: 'success' });
      }
    } catch (err) {
      console.warn('Backend upload failed, using local preview:', err);
      showToast({ title: 'Backend upload failed, showing local preview', variant: 'error' });
    } finally {
      setUploadingDesktop(false);
      e.target.value = '';
    }
  };

  const handleMobileFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Instant local preview
    const localPreview = URL.createObjectURL(file);
    setForm((f) => ({ ...f, mobileImageUrl: localPreview }));
    setUploadingMobile(true);

    try {
      const uploaded = await uploadImages([file], 'banners');
      const url = Array.isArray(uploaded) ? uploaded[0]?.url : (uploaded as any)?.url;
      if (url) {
        setForm((f) => ({ ...f, mobileImageUrl: url }));
        showToast({ title: 'Mobile banner uploaded successfully (WebP)', variant: 'success' });
      }
    } catch (err) {
      console.warn('Backend upload failed, using local preview:', err);
      showToast({ title: 'Backend upload failed, showing local preview', variant: 'error' });
    } finally {
      setUploadingMobile(false);
      e.target.value = '';
    }
  };

  const [form, setForm] = useState<Omit<PageBanner, 'id'>>({
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
    sortOrder: 1,
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

  const filteredBanners = useMemo(() => {
    const list = banners.filter((b) => {
      if (selectedPageType === 'Promo Banner 1') {
        return b.pageType === 'Promo Banner 1' || b.pageType === 'Promo 1' || b.pageType === 'Featured Categories';
      }
      if (selectedPageType === 'Promo Banner 2') {
        return b.pageType === 'Promo Banner 2' || b.pageType === 'Promo 2' || b.pageType === 'Promo Banners';
      }
      return b.pageType === selectedPageType;
    });
    return list.sort((a, b) => (a.sortOrder || 1) - (b.sortOrder || 1));
  }, [banners, selectedPageType]);

  const handleReorder = async (reorderedList: PageBanner[]) => {
    const updated = reorderedList.map((item, idx) => ({
      ...item,
      sortOrder: idx + 1,
    }));

    setBanners((prev) =>
      prev.map((b) => {
        const match = updated.find((u) => u.id === b.id);
        return match ? { ...b, sortOrder: match.sortOrder } : b;
      })
    );

    try {
      const next = await reorderPageBanners(updated);
      setBanners(next);
      showToast({ title: 'Banner position updated', variant: 'success' });
    } catch (err) {
      console.warn('Reorder failed:', err);
      showToast({ title: 'Failed to update banner order', variant: 'error' });
    }
  };

  const moveBanner = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= filteredBanners.length) return;
    const copy = [...filteredBanners];
    const [removed] = copy.splice(index, 1);
    copy.splice(targetIndex, 0, removed);
    handleReorder(copy);
  };

  const changeBannerPosition = (currentIndex: number, newPosition: number) => {
    const targetIndex = newPosition - 1;
    if (targetIndex < 0 || targetIndex >= filteredBanners.length || targetIndex === currentIndex) return;
    const copy = [...filteredBanners];
    const [removed] = copy.splice(currentIndex, 1);
    copy.splice(targetIndex, 0, removed);
    handleReorder(copy);
  };

  const openNew = () => {
    setEditingId(undefined);
    let defaultLink = '/offers';
    if (selectedPageType === 'Promo Banner 1' || selectedPageType === 'Promo 1' || selectedPageType === 'Featured Categories') defaultLink = '/category/bipap-cpap';
    if (selectedPageType === 'Promo Banner 2' || selectedPageType === 'Promo 2' || selectedPageType === 'Promo Banners') defaultLink = '/product/euronda-e8-class-b-vacuum-autoclave-24l';
    setForm({
      pageType: selectedPageType,
      targetId: flatCategories[0]?.node.id || '',
      targetLabel: flatCategories[0]?.node.name || '',
      title: '',
      desktopImageUrl: PRODUCT_IMAGES.dentalChair,
      mobileImageUrl: PRODUCT_IMAGES.dentalChair,
      linkUrl: defaultLink,
      startDate: '2026-11-17',
      endDate: '2026-12-31',
      active: true,
      sortOrder: filteredBanners.length + 1,
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
      sortOrder: b.sortOrder || 1,
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
        {PAGE_TYPES.map((pt) => {
          const count = banners.filter((b) => {
            if (pt === 'Promo Banner 1') return b.pageType === 'Promo Banner 1' || b.pageType === 'Promo 1' || b.pageType === 'Featured Categories';
            if (pt === 'Promo Banner 2') return b.pageType === 'Promo Banner 2' || b.pageType === 'Promo 2' || b.pageType === 'Promo Banners';
            return b.pageType === pt;
          }).length;
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

      {/* Position guide tip for Promo banners */}
      {(selectedPageType === 'Promo Banner 1' || selectedPageType === 'Promo Banner 2') && (
        <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-3.5 flex items-start gap-3">
          <div className="rounded-lg bg-[#1D5FAF] text-white p-1.5 shrink-0 mt-0.5">
            <HelpCircle className="h-4 w-4" />
          </div>
          <div className="text-xs text-[#0B2545] leading-relaxed">
            <span className="font-bold">Position & Layout Guide:</span> Storefront me pehle 4 banners (<span className="font-semibold font-mono bg-white px-1.5 py-0.5 rounded border border-blue-200">Pos #1, #2, #3, #4</span>) chhote 2×2 grid boxes me aate hain, aur 5-va banner (<span className="font-bold font-mono bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded border border-amber-300">⭐ Pos #5 (BADA / Hero)</span>) bada tall card banta hai. Aap kisi bhi banner ko neeche diye gaye <span className="font-bold">Pos Dropdown</span> ya <span className="font-bold">↑ / ↓</span> buttons se instant move/reorder kar sakte hain.
          </div>
        </div>
      )}

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
          {filteredBanners.map((b, index) => {
            const isPromo =
              selectedPageType === 'Promo Banner 1' ||
              selectedPageType === 'Promo Banner 2' ||
              b.pageType.includes('Promo') ||
              b.pageType === 'Featured Categories';
            const pos = index + 1;
            const isBig = isPromo && pos % 5 === 0;

            return (
              <div
                key={b.id}
                className={`rounded-xl border bg-white overflow-hidden flex flex-col transition-shadow hover:shadow-md ${
                  isBig ? 'border-amber-400 ring-2 ring-amber-400/20' : 'border-[#DCE6F2]'
                }`}
              >
                <div className="relative aspect-[16/5] w-full bg-[#F6F9FD] border-b border-[#DCE6F2]">
                  <SafeImage src={b.desktopImageUrl} alt={b.title} />
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 flex-wrap">
                    <span className="rounded-md bg-[#0B2545]/85 px-2 py-0.5 text-[11px] font-semibold text-white">
                      {b.pageType}
                      {b.targetLabel ? `: ${b.targetLabel}` : ''}
                    </span>
                    {isBig ? (
                      <span className="rounded-md bg-amber-500 text-white font-bold px-2 py-0.5 text-[11px] shadow-sm flex items-center gap-1">
                        ⭐ Pos #{pos} (BADA / Hero)
                      </span>
                    ) : isPromo ? (
                      <span className="rounded-md bg-[#1D5FAF] text-white font-semibold px-2 py-0.5 text-[11px] shadow-sm">
                        Pos #{pos} (Chhota)
                      </span>
                    ) : (
                      <span className="rounded-md bg-[#1D5FAF] text-white font-semibold px-2 py-0.5 text-[11px] shadow-sm">
                        Pos #{pos}
                      </span>
                    )}
                  </div>
                  <div className="absolute top-2.5 right-2.5">
                    <StatusBadge status={b.active ? 'active' : 'inactive'} />
                  </div>
                </div>

                <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-[#12263F] truncate">{b.title}</p>
                      {isBig && (
                        <span className="text-[10px] uppercase font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                          Bada Banner
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex items-center gap-2 flex-wrap">
                      <span
                        className="inline-flex items-center gap-1 text-[11px] font-mono text-[#1D5FAF] bg-[#EAF2FC] px-2 py-0.5 rounded-md max-w-[240px] truncate"
                        title={b.linkUrl}
                      >
                        <span>🔗</span>
                        <span className="truncate">{b.linkUrl || '/'}</span>
                      </span>
                      <span className="text-xs text-[#5B6B82] whitespace-nowrap">
                        {formatShortDate(b.startDate)} – {formatShortDate(b.endDate)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0">
                    {/* Position selector + Up/Down arrows */}
                    <div className="flex items-center gap-1 bg-[#F8FAFC] p-1 rounded-lg border border-[#DCE6F2]">
                      <span className="text-[11px] font-semibold text-[#5B6B82] pl-1">Pos:</span>
                      <select
                        value={pos}
                        onChange={(e) => changeBannerPosition(index, Number(e.target.value))}
                        className="bg-white border border-[#CBD5E1] rounded text-xs font-bold text-[#12263F] px-1.5 py-1 cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#1D5FAF]"
                        title="Position badlo"
                      >
                        {filteredBanners.map((_, pIdx) => {
                          const pNum = pIdx + 1;
                          const isTargetBig = isPromo && pNum % 5 === 0;
                          return (
                            <option key={pNum} value={pNum}>
                              #{pNum} {isTargetBig ? '⭐ (Bada)' : isPromo ? '(Chhota)' : ''}
                            </option>
                          );
                        })}
                      </select>
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => moveBanner(index, 'up')}
                        title="Move Up / Earlier"
                        className="p-1 rounded text-[#5B6B82] hover:bg-[#EAF2FC] hover:text-[#1D5FAF] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={index === filteredBanners.length - 1}
                        onClick={() => moveBanner(index, 'down')}
                        title="Move Down / Later"
                        className="p-1 rounded text-[#5B6B82] hover:bg-[#EAF2FC] hover:text-[#1D5FAF] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </button>
                    </div>

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
            );
          })}
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

          {(form.pageType === 'Promo Banner 1' || form.pageType === 'Promo 1' || form.pageType === 'Featured Categories') && (
            <FormField label="Link to Category (Optional Helper)">
              <select
                value={form.targetId || ''}
                onChange={(e) => {
                  const chosen = flatCategories.find((c) => c.node.id === e.target.value);
                  setForm((f) => ({
                    ...f,
                    targetId: e.target.value,
                    targetLabel: chosen?.node.name || '',
                    title: f.title || chosen?.node.name || '',
                    linkUrl: chosen ? `/category/${chosen.node.slug || chosen.node.id}` : f.linkUrl,
                  }));
                }}
                className={selectClass}
              >
                <option value="">Select category to auto-fill link...</option>
                {flatCategories.map((c) => (
                  <option key={c.node.id} value={c.node.id}>
                    {c.path}
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

          <FormField label="Desktop Image (1920×190 recommended)" required>
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

          <FormField label="Mobile Image (750×240 recommended)" required>
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

          <FormField label="Click Link URL (Navigate on Click)" required hint="Where visitors will navigate when they click this banner (e.g. /category/..., /product/..., or full URL)">
            <input
              type="text"
              required
              placeholder="/category/dental-chairs or /product/euronda-e8... or https://..."
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

          <FormField
            label="Display Position (Sort Order)"
            hint={
              form.pageType.includes('Promo') || form.pageType === 'Featured Categories'
                ? 'Position 1-4: Chhote grid boxes (2×2) | Position 5: Bada tall hero banner (Har 5-va banner bada dikhta hai)'
                : 'Banner display sequence (1, 2, 3...)'
            }
          >
            <input
              type="number"
              min={1}
              value={form.sortOrder || 1}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  sortOrder: Math.max(1, parseInt(e.target.value) || 1),
                }))
              }
              className={inputClass}
            />
          </FormField>

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
