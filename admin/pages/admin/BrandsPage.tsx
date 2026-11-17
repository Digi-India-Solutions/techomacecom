import React, { useEffect, useMemo, useState } from 'react';
import {
  Edit3,
  LayoutGrid,
  List,
  Plus,
  Search,
  Star,
  Trash2,
} from 'lucide-react';
import type { Brand, BrandPayload, BrandStatus } from '@/types/admin';
import { deleteBrand, listBrands, saveBrand } from '@/lib/api/admin/brands';
import { slugify } from '@/lib/api/admin/client';
import { PRODUCT_IMAGES } from '@/lib/api/admin/mockData';
import { useToast } from '@/components/admin/ToastProvider';
import { Drawer } from '@/components/admin/Drawer';
import { FormField, inputClass, selectClass, textareaClass } from '@/components/admin/FormField';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { SafeImage } from '@/components/admin/SafeImage';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';

const EMPTY_BRAND: BrandPayload = {
  name: '',
  slug: '',
  logoUrl: PRODUCT_IMAGES.oxygenConcentrator,
  desktopBannerUrl: '',
  mobileBannerUrl: '',
  description: '',
  featuredOnHomepage: false,
  status: 'active',
  seoTitle: '',
  seoDescription: '',
};

export function BrandsPage() {
  const { showToast } = useToast();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [search, setSearch] = useState('');

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [form, setForm] = useState<BrandPayload>(EMPTY_BRAND);
  const [slugTouched, setSlugTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Brand | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      setBrands(await listBrands());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return brands;
    const q = search.toLowerCase();
    return brands.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        b.description.toLowerCase().includes(q)
    );
  }, [brands, search]);

  const openCreate = () => {
    setForm(EMPTY_BRAND);
    setSlugTouched(false);
    setDrawerOpen(true);
  };

  const openEdit = (brand: Brand) => {
    setForm({
      id: brand.id,
      name: brand.name,
      slug: brand.slug,
      logoUrl: brand.logoUrl,
      desktopBannerUrl: brand.desktopBannerUrl,
      mobileBannerUrl: brand.mobileBannerUrl,
      description: brand.description,
      featuredOnHomepage: brand.featuredOnHomepage,
      status: brand.status,
      seoTitle: brand.seoTitle,
      seoDescription: brand.seoDescription,
    });
    setSlugTouched(true);
    setDrawerOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      await saveBrand(form);
      showToast({
        title: form.id ? 'Brand updated' : 'Brand created',
        description: form.name,
        variant: 'success',
      });
      setDrawerOpen(false);
      load();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteBrand(deleteTarget.id);
      showToast({ title: `Deleted "${deleteTarget.name}"`, variant: 'info' });
      load();
    } catch (err) {
      showToast({
        title: 'Cannot delete brand',
        description: err instanceof Error ? err.message : 'Brand has linked products',
        variant: 'warning',
      });
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleFile = (
    file: File | undefined,
    field: 'logoUrl' | 'desktopBannerUrl' | 'mobileBannerUrl'
  ) => {
    if (!file) return;
    setForm((prev) => ({ ...prev, [field]: URL.createObjectURL(file) }));
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#12263F] tracking-tight">Brands</h1>
          <p className="mt-0.5 text-sm text-[#5B6B82]">
            Authorized medical &amp; dental equipment manufacturers listed on Buy Denmed.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#1D5FAF] px-4 py-2 text-xs font-semibold text-white hover:bg-[#174D8F]"
        >
          <Plus className="h-4 w-4" />
          Add Brand
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#DCE6F2] bg-white p-3.5">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5B6B82]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search brands..."
            className="w-full rounded-lg border border-[#DCE6F2] bg-[#F6F9FD] pl-9 pr-3 py-2 text-sm text-[#12263F] focus:border-[#1D5FAF] focus:bg-white focus:outline-none"
          />
        </div>

        <div className="inline-flex items-center rounded-lg border border-[#DCE6F2] bg-[#F6F9FD] p-1">
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium ${
              viewMode === 'grid'
                ? 'bg-white text-[#12263F] shadow-sm'
                : 'text-[#5B6B82] hover:text-[#12263F]'
            }`}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            Grid
          </button>
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium ${
              viewMode === 'list'
                ? 'bg-white text-[#12263F] shadow-sm'
                : 'text-[#5B6B82] hover:text-[#12263F]'
            }`}
          >
            <List className="h-3.5 w-3.5" />
            List
          </button>
        </div>
      </div>

      {loading ? (
        <div className="rounded-xl border border-[#DCE6F2] bg-white p-8 text-sm text-[#5B6B82]">
          Loading brands...
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((brand) => (
            <div
              key={brand.id}
              className="rounded-xl border border-[#DCE6F2] bg-white p-5 flex flex-col justify-between gap-4 hover:border-[#1D5FAF]/40 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-[#DCE6F2] bg-[#F6F9FD]">
                    <SafeImage src={brand.logoUrl} alt={brand.name} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-base font-semibold text-[#12263F] truncate">
                        {brand.name}
                      </h3>
                      {brand.featuredOnHomepage && (
                        <Star className="h-3.5 w-3.5 fill-[#F28C38] text-[#F28C38] shrink-0" />
                      )}
                    </div>
                    <p className="text-xs font-mono text-[#5B6B82] truncate">/{brand.slug}</p>
                  </div>
                </div>
                <StatusBadge status={brand.status} />
              </div>

              <p className="text-xs text-[#5B6B82] line-clamp-2 leading-relaxed">
                {brand.description}
              </p>

              <div className="flex items-center justify-between border-t border-[#DCE6F2] pt-3">
                <span className="rounded-md bg-[#EAF2FC] px-2.5 py-1 text-xs font-semibold text-[#1D5FAF] tabular-nums">
                  {brand.productCount} products
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => openEdit(brand)}
                    className="rounded-md p-1.5 text-[#5B6B82] hover:bg-[#EAF2FC] hover:text-[#1D5FAF]"
                    title="Edit brand"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(brand)}
                    className="rounded-md p-1.5 text-[#5B6B82] hover:bg-red-50 hover:text-red-600"
                    title="Delete brand"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-[#DCE6F2] bg-white overflow-hidden">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-[#DCE6F2] bg-[#F6F9FD] text-xs font-semibold text-[#5B6B82]">
                <th className="px-4 py-3">Brand</th>
                <th className="px-4 py-3">Slug</th>
                <th className="px-4 py-3">Homepage</th>
                <th className="px-4 py-3 text-right">Products</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DCE6F2]">
              {filtered.map((brand) => (
                <tr key={brand.id} className="hover:bg-[#F6F9FD]">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 shrink-0 overflow-hidden rounded-lg border border-[#DCE6F2]">
                        <SafeImage src={brand.logoUrl} alt={brand.name} />
                      </div>
                      <span className="font-semibold text-[#12263F]">{brand.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-[#5B6B82]">/{brand.slug}</td>
                  <td className="px-4 py-3 text-xs text-[#5B6B82]">
                    {brand.featuredOnHomepage ? 'Featured' : 'Standard'}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums">
                    {brand.productCount}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={brand.status} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openEdit(brand)}
                        className="rounded-md p-1.5 text-[#5B6B82] hover:bg-[#EAF2FC] hover:text-[#1D5FAF]"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(brand)}
                        className="rounded-md p-1.5 text-[#5B6B82] hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Brand Add/Edit Drawer */}
      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={form.id ? `Edit Brand: ${form.name}` : 'Add Brand'}
        subtitle="Configure brand identity, storefront banners, and SEO"
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
              form="brand-drawer-form"
              disabled={saving}
              className="rounded-lg bg-[#1D5FAF] px-4 py-2 text-xs font-semibold text-white hover:bg-[#174D8F]"
            >
              {saving ? 'Saving...' : form.id ? 'Save Brand' : 'Create Brand'}
            </button>
          </>
        }
      >
        <form id="brand-drawer-form" onSubmit={handleSave} className="space-y-4">
          <FormField label="Brand Name" required>
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

          <FormField label="Brand Logo">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-[#DCE6F2]">
                <SafeImage src={form.logoUrl} alt={form.name || 'Logo'} />
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFile(e.target.files?.[0], 'logoUrl')}
                className="block w-full text-xs text-[#5B6B82] file:mr-3 file:rounded-md file:border file:border-[#DCE6F2] file:bg-[#F6F9FD] file:px-3 file:py-1.5 file:text-xs file:font-semibold"
              />
            </div>
          </FormField>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Desktop Banner">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFile(e.target.files?.[0], 'desktopBannerUrl')}
                className="block w-full text-xs text-[#5B6B82] file:mr-2 file:rounded-md file:border file:border-[#DCE6F2] file:bg-[#F6F9FD] file:px-2.5 file:py-1 file:text-xs"
              />
            </FormField>
            <FormField label="Mobile Banner">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFile(e.target.files?.[0], 'mobileBannerUrl')}
                className="block w-full text-xs text-[#5B6B82] file:mr-2 file:rounded-md file:border file:border-[#DCE6F2] file:bg-[#F6F9FD] file:px-2.5 file:py-1 file:text-xs"
              />
            </FormField>
          </div>

          <FormField label="Description">
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, description: e.target.value }))
              }
              className={textareaClass}
            />
          </FormField>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
            <FormField label="Status">
              <select
                value={form.status}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    status: e.target.value as BrandStatus,
                  }))
                }
                className={selectClass}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </FormField>

            <label className="flex items-center gap-2 pt-5 text-xs font-medium text-[#12263F] cursor-pointer">
              <input
                type="checkbox"
                checked={form.featuredOnHomepage}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    featuredOnHomepage: e.target.checked,
                  }))
                }
                className="rounded border-[#DCE6F2] text-[#1D5FAF]"
              />
              Featured on homepage
            </label>
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
        title={`Delete brand "${deleteTarget?.name}"?`}
        description="Brands with linked products cannot be deleted until products are reassigned."
        confirmLabel="Delete Brand"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
