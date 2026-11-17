import React, { useEffect, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Edit3,
  GripVertical,
  Monitor,
  Plus,
  Smartphone,
  Trash2,
  Upload,
} from 'lucide-react';
import type { HeroBanner } from '@/types/admin';
import {
  deleteHeroBanner,
  listHeroBanners,
  reorderHeroBanners,
  saveHeroBanner,
} from '@/lib/api/admin/marketing';
import { PRODUCT_IMAGES } from '@/lib/api/admin/mockData';
import { formatShortDate } from '@/lib/api/admin/client';
import { useToast } from '@/components/admin/ToastProvider';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { SafeImage } from '@/components/admin/SafeImage';
import { Drawer } from '@/components/admin/Drawer';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { FormField, inputClass } from '@/components/admin/FormField';

const EMPTY_FORM: Omit<HeroBanner, 'id' | 'sortOrder'> = {
  title: '',
  desktopImageUrl: PRODUCT_IMAGES.oxygenConcentrator,
  mobileImageUrl: PRODUCT_IMAGES.oxygenConcentrator,
  linkUrl: '/category/respiratory-care',
  altText: '',
  startDate: '2026-11-17',
  endDate: '2026-12-31',
  active: true,
};

export function HeroBannersPage() {
  const { showToast } = useToast();
  const [banners, setBanners] = useState<HeroBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | undefined>(undefined);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<HeroBanner | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      setBanners(await listHeroBanners());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openNew = () => {
    setEditingId(undefined);
    setForm(EMPTY_FORM);
    setDrawerOpen(true);
  };

  const openEdit = (b: HeroBanner) => {
    setEditingId(b.id);
    setForm({
      title: b.title,
      desktopImageUrl: b.desktopImageUrl,
      mobileImageUrl: b.mobileImageUrl,
      linkUrl: b.linkUrl,
      altText: b.altText,
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
      const next = await saveHeroBanner({ ...form, id: editingId });
      setBanners(next);
      setDrawerOpen(false);
      showToast({
        title: editingId ? 'Hero banner updated' : 'Hero banner created',
        variant: 'success',
      });
    } finally {
      setSaving(false);
    }
  };

  const moveBanner = async (from: number, to: number) => {
    if (to < 0 || to >= banners.length || from === to) return;
    const copy = [...banners];
    const [moved] = copy.splice(from, 1);
    copy.splice(to, 0, moved);
    setBanners(copy);
    const saved = await reorderHeroBanners(copy);
    setBanners(saved);
    showToast({ title: 'Hero carousel order updated', variant: 'success' });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const next = await deleteHeroBanner(deleteTarget.id);
    setBanners(next);
    setDeleteTarget(null);
    showToast({ title: 'Hero banner deleted', variant: 'success' });
  };

  const activeBanners = banners.filter((b) => b.active);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#12263F] tracking-tight">Hero Banners</h1>
          <p className="mt-0.5 text-sm text-[#5B6B82]">
            Schedule desktop (1920×500) &amp; mobile (800×600) homepage slides and drag to set carousel order.
          </p>
        </div>

        <button
          type="button"
          onClick={openNew}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#1D5FAF] px-4 py-2 text-xs font-semibold text-white hover:bg-[#174D8F]"
        >
          <Plus className="h-4 w-4" />
          Add Hero Banner
        </button>
      </div>

      {/* Live Storefront Preview */}
      <div className="rounded-xl border border-[#DCE6F2] bg-white p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-[#12263F]">
              Live Hero Carousel Preview ({activeBanners.length} active slide
              {activeBanners.length === 1 ? '' : 's'})
            </h2>
            <p className="text-xs text-[#5B6B82]">
              Toggle between Desktop 1920×500 and Mobile 800×600 viewport aspect ratios.
            </p>
          </div>
          <div className="inline-flex rounded-lg border border-[#DCE6F2] bg-[#F6F9FD] p-1">
            <button
              type="button"
              onClick={() => setPreviewDevice('desktop')}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold ${
                previewDevice === 'desktop'
                  ? 'bg-[#1D5FAF] text-white'
                  : 'text-[#5B6B82] hover:text-[#12263F]'
              }`}
            >
              <Monitor className="h-3.5 w-3.5" />
              Desktop (1920×500)
            </button>
            <button
              type="button"
              onClick={() => setPreviewDevice('mobile')}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold ${
                previewDevice === 'mobile'
                  ? 'bg-[#1D5FAF] text-white'
                  : 'text-[#5B6B82] hover:text-[#12263F]'
              }`}
            >
              <Smartphone className="h-3.5 w-3.5" />
              Mobile (800×600)
            </button>
          </div>
        </div>

        {activeBanners[0] ? (
          <div className="flex justify-center rounded-xl bg-[#F6F9FD] border border-[#DCE6F2] p-4">
            <div
              className={`relative overflow-hidden rounded-xl border border-[#DCE6F2] bg-[#0B2545] shadow-sm ${
                previewDevice === 'desktop'
                  ? 'w-full aspect-[1920/500] max-h-[260px]'
                  : 'w-[280px] aspect-[4/3]'
              }`}
            >
              <SafeImage
                src={
                  previewDevice === 'desktop'
                    ? activeBanners[0].desktopImageUrl
                    : activeBanners[0].mobileImageUrl
                }
                alt={activeBanners[0].altText || activeBanners[0].title}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#0B2545]/85 via-[#0B2545]/40 to-transparent flex flex-col justify-center px-6 text-white">
                <span className="text-[10px] uppercase tracking-wider text-white/75 font-semibold">
                  Slide #1 · {activeBanners[0].linkUrl}
                </span>
                <p className="mt-1 text-lg sm:text-xl font-bold max-w-md leading-snug">
                  {activeBanners[0].title}
                </p>
                <p className="mt-1 text-xs text-white/80 max-w-sm line-clamp-2">
                  {activeBanners[0].altText}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <p className="rounded-lg bg-[#F6F9FD] px-4 py-6 text-center text-xs text-[#5B6B82]">
            No active hero banners. Activate or create a slide below.
          </p>
        )}
      </div>

      {/* Ordered Banner List */}
      <div className="rounded-xl border border-[#DCE6F2] bg-white overflow-hidden">
        <div className="border-b border-[#DCE6F2] px-5 py-3.5">
          <h2 className="text-sm font-semibold text-[#12263F]">
            Hero Slides (Drag rows or use arrows to reorder)
          </h2>
        </div>

        {loading ? (
          <div className="p-6 space-y-3 animate-pulse">
            <div className="h-20 rounded-lg bg-slate-200" />
            <div className="h-20 rounded-lg bg-slate-200" />
          </div>
        ) : (
          <div className="divide-y divide-[#DCE6F2]">
            {banners.map((b, idx) => (
              <div
                key={b.id}
                draggable
                onDragStart={() => setDragIdx(idx)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (dragIdx !== null && dragIdx !== idx) moveBanner(dragIdx, idx);
                  setDragIdx(null);
                }}
                onDragEnd={() => setDragIdx(null)}
                className={`flex flex-wrap items-center justify-between gap-4 p-4 transition-colors ${
                  dragIdx === idx ? 'bg-[#EAF2FC]' : 'hover:bg-[#F6F9FD]'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="flex items-center gap-1 text-[#5B6B82] cursor-grab">
                    <GripVertical className="h-4 w-4" />
                    <span className="font-mono text-xs font-bold text-[#12263F] w-5">
                      #{idx + 1}
                    </span>
                  </div>

                  <div className="h-14 w-28 shrink-0 overflow-hidden rounded-lg border border-[#DCE6F2] bg-[#F6F9FD]">
                    <SafeImage src={b.desktopImageUrl} alt={b.title} />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-[#12263F] truncate">
                        {b.title}
                      </p>
                      <StatusBadge status={b.active ? 'active' : 'inactive'} />
                    </div>
                    <p className="text-xs text-[#5B6B82] truncate">
                      Link: <span className="font-mono">{b.linkUrl}</span> · Schedule:{' '}
                      {formatShortDate(b.startDate)} – {formatShortDate(b.endDate)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => moveBanner(idx, idx - 1)}
                    className="rounded-lg border border-[#DCE6F2] p-1.5 text-[#5B6B82] hover:bg-[#EAF2FC] disabled:opacity-35"
                    title="Move up"
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={idx === banners.length - 1}
                    onClick={() => moveBanner(idx, idx + 1)}
                    className="rounded-lg border border-[#DCE6F2] p-1.5 text-[#5B6B82] hover:bg-[#EAF2FC] disabled:opacity-35"
                    title="Move down"
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </button>
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
                    title="Delete banner"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Drawer */}
      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={editingId ? 'Edit Hero Banner' : 'Add Hero Banner'}
        subtitle="Configure desktop (1920×500) & mobile (800×600) creative assets and schedule"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <FormField label="Banner Headline / Title" required>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="e.g. Turnkey Dental Clinic Chairs — 0% EMI Available"
              className={inputClass}
            />
          </FormField>

          <FormField label="Desktop Image (1920×500 recommended)" required>
            <div className="space-y-2">
              <div className="aspect-[1920/500] w-full overflow-hidden rounded-lg border border-[#DCE6F2] bg-[#F6F9FD]">
                <SafeImage src={form.desktopImageUrl} alt="Desktop banner" />
              </div>
              <label className="inline-flex items-center gap-1.5 rounded-lg border border-[#DCE6F2] bg-white px-3 py-1.5 text-xs font-semibold text-[#12263F] hover:bg-[#EAF2FC] cursor-pointer">
                <Upload className="h-3.5 w-3.5" />
                Upload Desktop Image
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setForm((f) => ({ ...f, desktopImageUrl: URL.createObjectURL(file) }));
                    }
                  }}
                />
              </label>
            </div>
          </FormField>

          <FormField label="Mobile Image (800×600 recommended)" required>
            <div className="space-y-2">
              <div className="aspect-[4/3] w-48 overflow-hidden rounded-lg border border-[#DCE6F2] bg-[#F6F9FD]">
                <SafeImage src={form.mobileImageUrl} alt="Mobile banner" />
              </div>
              <label className="inline-flex items-center gap-1.5 rounded-lg border border-[#DCE6F2] bg-white px-3 py-1.5 text-xs font-semibold text-[#12263F] hover:bg-[#EAF2FC] cursor-pointer">
                <Upload className="h-3.5 w-3.5" />
                Upload Mobile Image
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setForm((f) => ({ ...f, mobileImageUrl: URL.createObjectURL(file) }));
                    }
                  }}
                />
              </label>
            </div>
          </FormField>

          <FormField label="Destination Link URL" required>
            <input
              type="text"
              required
              value={form.linkUrl}
              onChange={(e) => setForm((f) => ({ ...f, linkUrl: e.target.value }))}
              placeholder="/category/respiratory-care"
              className={inputClass}
            />
          </FormField>

          <FormField label="SEO Alt Text" required>
            <input
              type="text"
              required
              value={form.altText}
              onChange={(e) => setForm((f) => ({ ...f, altText: e.target.value }))}
              placeholder="Descriptive banner text for screen readers & SEO"
              className={inputClass}
            />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Start Date" required>
              <input
                type="date"
                required
                value={form.startDate}
                onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                className={inputClass}
              />
            </FormField>
            <FormField label="End Date" required>
              <input
                type="date"
                required
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
            Banner active on storefront
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
              disabled={saving}
              className="rounded-lg bg-[#1D5FAF] px-4 py-2 text-xs font-semibold text-white hover:bg-[#174D8F]"
            >
              {saving ? 'Saving...' : 'Save Hero Banner'}
            </button>
          </div>
        </form>
      </Drawer>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Hero Banner"
        description={`Remove "${deleteTarget?.title}" from the homepage hero carousel?`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
