import React, { useEffect, useMemo, useState } from 'react';
import { BarChart3, Edit3, Plus, Trash2 } from 'lucide-react';
import type { Brand, CategoryNode, Coupon, Product } from '@/types/admin';
import { deleteCoupon, listCoupons, saveCoupon } from '@/lib/api/admin/marketing';
import { flattenCategories, listCategories } from '@/lib/api/admin/categories';
import { listBrands } from '@/lib/api/admin/brands';
import { listProducts } from '@/lib/api/admin/products';
import { formatINR, formatShortDate } from '@/lib/api/admin/client';
import { useToast } from '@/components/admin/ToastProvider';
import { DataTable, type DataTableColumn } from '@/components/admin/DataTable';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { Drawer } from '@/components/admin/Drawer';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { FormField, inputClass, selectClass } from '@/components/admin/FormField';

export function CouponsPage() {
  const { showToast } = useToast();

  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [categories, setCategories] = useState<CategoryNode[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [targetSearch, setTargetSearch] = useState('');

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | undefined>(undefined);
  const [usageModalCoupon, setUsageModalCoupon] = useState<Coupon | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Coupon | null>(null);

  const [form, setForm] = useState<Omit<Coupon, 'id' | 'usedCount' | 'totalDiscountGiven'>>({
    code: '',
    type: 'percentage',
    value: 10,
    maxDiscount: 2500,
    minOrderValue: 5000,
    applicableTo: 'all',
    applicableTargetIds: [],
    usageLimitTotal: 100,
    usageLimitPerCustomer: 1,
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
    active: true,
    firstOrderOnly: false,
  });

  const refreshCatalog = () => {
    Promise.all([listCategories(), listBrands(), listProducts()])
      .then(([cats, brs, prods]) => {
        setCategories(cats);
        setBrands(brs);
        setProducts(prods);
      })
      .catch((err) => console.warn('Could not refresh catalog data:', err));
  };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([listCoupons(), listCategories(), listBrands(), listProducts()])
      .then(([cpns, cats, brs, prods]) => {
        if (cancelled) return;
        setCoupons(cpns);
        setCategories(cats);
        setBrands(brs);
        setProducts(prods);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const flatCategories = useMemo(() => flattenCategories(categories), [categories]);

  const openNew = () => {
    refreshCatalog();
    setEditingId(undefined);
    setTargetSearch('');
    setForm({
      code: '',
      type: 'percentage',
      value: 10,
      maxDiscount: 2500,
      minOrderValue: 5000,
      applicableTo: 'all',
      applicableTargetIds: [],
      usageLimitTotal: 100,
      usageLimitPerCustomer: 1,
      startDate: new Date().toISOString().slice(0, 10),
      endDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
      active: true,
      firstOrderOnly: false,
    });
    setDrawerOpen(true);
  };

  const openEdit = (c: Coupon) => {
    refreshCatalog();
    setEditingId(c.id);
    setTargetSearch('');
    setForm({
      code: c.code,
      type: c.type,
      value: c.value,
      maxDiscount: c.maxDiscount,
      minOrderValue: c.minOrderValue,
      applicableTo: c.applicableTo,
      applicableTargetIds: c.applicableTargetIds || [],
      usageLimitTotal: c.usageLimitTotal,
      usageLimitPerCustomer: c.usageLimitPerCustomer,
      startDate: c.startDate,
      endDate: c.endDate,
      active: c.active,
      firstOrderOnly: c.firstOrderOnly,
    });
    setDrawerOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const next = await saveCoupon({
        ...form,
        code: form.code.trim().toUpperCase(),
        id: editingId,
      });
      setCoupons(next);
      setDrawerOpen(false);
      showToast({
        title: editingId ? 'Coupon updated' : 'Coupon created',
        variant: 'success',
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Check coupon fields and try again';
      showToast({
        title: 'Failed to save coupon',
        description: msg,
        variant: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const next = await deleteCoupon(deleteTarget.id);
      setCoupons(next);
      setDeleteTarget(null);
      showToast({ title: 'Coupon deleted', variant: 'success' });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not delete coupon';
      showToast({
        title: 'Failed to delete coupon',
        description: msg,
        variant: 'error',
      });
    }
  };

  const targetChoices = useMemo(() => {
    if (form.applicableTo === 'categories') {
      return flatCategories
        .map((c) => ({ id: c.node.id, label: c.path }))
        .sort((a, b) => a.label.localeCompare(b.label));
    }
    if (form.applicableTo === 'brands') {
      return brands
        .map((b) => ({ id: b.id, label: b.name }))
        .sort((a, b) => a.label.localeCompare(b.label));
    }
    if (form.applicableTo === 'products') {
      return products
        .map((p) => ({ id: p.id, label: `${p.name} (${p.sku})` }))
        .sort((a, b) => a.label.localeCompare(b.label));
    }
    return [];
  }, [form.applicableTo, flatCategories, brands, products]);

  const filteredTargetChoices = useMemo(() => {
    const q = targetSearch.trim().toLowerCase();
    if (!q) return targetChoices;
    return targetChoices.filter((opt) => opt.label.toLowerCase().includes(q));
  }, [targetChoices, targetSearch]);

  const columns: DataTableColumn<Coupon>[] = useMemo(
    () => [
      {
        key: 'code',
        header: 'Coupon Code',
        sortable: true,
        sortValue: (c) => c.code,
        render: (c) => (
          <div>
            <span className="font-mono text-sm font-bold text-[#1D5FAF]">{c.code}</span>
            {c.firstOrderOnly && (
              <span className="ml-2 rounded bg-[#EAF2FC] px-1.5 py-0.5 text-[10px] font-semibold text-[#1D5FAF]">
                1st Order
              </span>
            )}
          </div>
        ),
      },
      {
        key: 'discount',
        header: 'Discount & Rules',
        render: (c) => {
          let scopeText = 'All Products & Categories';
          if (c.applicableTo === 'products') {
            const matched = products.filter((p) => c.applicableTargetIds?.includes(p.id));
            if (matched.length === 1) {
              scopeText = `${matched[0].name} (${matched[0].sku})`;
            } else if (matched.length > 1) {
              scopeText = `${matched.length} Products (${matched.map((p) => p.name).slice(0, 2).join(', ')}${matched.length > 2 ? '...' : ''})`;
            } else if (c.applicableTargetIds?.length) {
              scopeText = `${c.applicableTargetIds.length} Products`;
            } else {
              scopeText = 'Specific Products (None selected)';
            }
          } else if (c.applicableTo === 'categories') {
            const matched = flatCategories.filter((cat) => c.applicableTargetIds?.includes(cat.node.id));
            if (matched.length === 1) {
              scopeText = matched[0].node.name;
            } else if (matched.length > 1) {
              scopeText = `${matched.length} Categories (${matched.map((m) => m.node.name).slice(0, 2).join(', ')}${matched.length > 2 ? '...' : ''})`;
            } else if (c.applicableTargetIds?.length) {
              scopeText = `${c.applicableTargetIds.length} Categories`;
            } else {
              scopeText = 'Specific Categories (None selected)';
            }
          } else if (c.applicableTo === 'brands') {
            const matched = brands.filter((b) => c.applicableTargetIds?.includes(b.id));
            if (matched.length === 1) {
              scopeText = matched[0].name;
            } else if (matched.length > 1) {
              scopeText = `${matched.length} Brands (${matched.map((b) => b.name).slice(0, 2).join(', ')}${matched.length > 2 ? '...' : ''})`;
            } else if (c.applicableTargetIds?.length) {
              scopeText = `${c.applicableTargetIds.length} Brands`;
            } else {
              scopeText = 'Specific Brands (None selected)';
            }
          }

          return (
            <div className="text-xs">
              <p className="font-semibold text-[#12263F]">
                {c.type === 'percentage' ? `${c.value}% OFF` : `${formatINR(c.value)} FLAT`}
                {c.maxDiscount ? ` (Up to ${formatINR(c.maxDiscount)})` : ''}
              </p>
              <p className="text-[#5B6B82]" title={scopeText}>
                Min order {formatINR(c.minOrderValue)} · <span className="font-medium text-[#1D5FAF]">{scopeText}</span>
              </p>
            </div>
          );
        },
      },
      {
        key: 'usage',
        header: 'Usage & Discount Given',
        align: 'right',
        sortable: true,
        sortValue: (c) => c.usedCount,
        render: (c) => (
          <div className="text-right text-xs tabular-nums">
            <p className="font-semibold text-[#12263F]">
              {c.usedCount} / {c.usageLimitTotal} used
            </p>
            <p className="text-[#5B6B82]">{formatINR(c.totalDiscountGiven)} given</p>
          </div>
        ),
      },
      {
        key: 'validity',
        header: 'Validity',
        render: (c) => (
          <span className="text-xs text-[#5B6B82] tabular-nums whitespace-nowrap">
            {formatShortDate(c.startDate)} – {formatShortDate(c.endDate)}
          </span>
        ),
      },
      {
        key: 'active',
        header: 'Status',
        render: (c) => <StatusBadge status={c.active ? 'active' : 'inactive'} />,
      },
      {
        key: 'actions',
        header: 'Actions',
        align: 'right',
        render: (c) => (
          <div className="flex items-center justify-end gap-1.5">
            <button
              type="button"
              onClick={() => setUsageModalCoupon(c)}
              className="inline-flex items-center gap-1 rounded-lg border border-[#DCE6F2] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#12263F] hover:bg-[#EAF2FC]"
              title="View usage report"
            >
              <BarChart3 className="h-3.5 w-3.5 text-[#1D5FAF]" />
              Report
            </button>
            <button
              type="button"
              onClick={() => openEdit(c)}
              className="rounded-lg border border-[#DCE6F2] bg-white p-1.5 text-[#1D5FAF] hover:bg-[#EAF2FC]"
              title="Edit coupon"
            >
              <Edit3 className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setDeleteTarget(c)}
              className="rounded-lg border border-[#DCE6F2] bg-white p-1.5 text-red-600 hover:bg-red-50"
              title="Delete coupon"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ),
      },
    ],
    []
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#12263F] tracking-tight">Coupons</h1>
          <p className="mt-0.5 text-sm text-[#5B6B82]">
            Create percentage or flat discount codes with scope limits, first-order rules, and usage reporting.
          </p>
        </div>

        <button
          type="button"
          onClick={openNew}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#1D5FAF] px-4 py-2 text-xs font-semibold text-white hover:bg-[#174D8F]"
        >
          <Plus className="h-4 w-4" />
          Create Coupon
        </button>
      </div>

      <DataTable
        data={coupons}
        columns={columns}
        getRowId={(c) => c.id}
        loading={loading}
        searchKeys={(c) => c.code}
        searchPlaceholder="Search coupon code..."
      />

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={editingId ? `Edit Coupon ${form.code}` : 'Create Discount Coupon'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <FormField label="Coupon Code" required>
            <input
              type="text"
              required
              value={form.code}
              onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
              placeholder="e.g. CLINIC2000"
              className={`${inputClass} font-mono uppercase`}
            />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Discount Type">
              <select
                value={form.type}
                onChange={(e) =>
                  setForm((f) => ({ ...f, type: e.target.value as 'percentage' | 'flat' }))
                }
                className={selectClass}
              >
                <option value="percentage">Percentage (%)</option>
                <option value="flat">Flat Amount (₹)</option>
              </select>
            </FormField>

            <FormField label={form.type === 'percentage' ? 'Discount %' : 'Flat Amount (₹)'} required>
              <input
                type="number"
                min={1}
                required
                value={form.value}
                onChange={(e) => setForm((f) => ({ ...f, value: Number(e.target.value) }))}
                className={inputClass}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {form.type === 'percentage' && (
              <FormField label="Max Discount Cap (₹)">
                <input
                  type="number"
                  min={0}
                  value={form.maxDiscount || ''}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      maxDiscount: e.target.value ? Number(e.target.value) : undefined,
                    }))
                  }
                  className={inputClass}
                />
              </FormField>
            )}
            <FormField label="Min Order Value (₹)" required>
              <input
                type="number"
                min={0}
                required
                value={form.minOrderValue}
                onChange={(e) =>
                  setForm((f) => ({ ...f, minOrderValue: Number(e.target.value) }))
                }
                className={inputClass}
              />
            </FormField>
          </div>

          <FormField label="Applicable To">
            <select
              value={form.applicableTo}
              onChange={(e) => {
                setTargetSearch('');
                setForm((f) => ({
                  ...f,
                  applicableTo: e.target.value as Coupon['applicableTo'],
                  applicableTargetIds: [],
                }));
              }}
              className={selectClass}
            >
              <option value="all">All Products &amp; Categories</option>
              <option value="categories">Specific Categories</option>
              <option value="products">Specific Products</option>
              <option value="brands">Specific Brands</option>
            </select>
          </FormField>

          {form.applicableTo !== 'all' && (
            <div className="space-y-2.5 rounded-lg border border-[#DCE6F2] bg-[#FAFCFF] p-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[#12263F]">
                  Select {form.applicableTo === 'products' ? 'Products' : form.applicableTo === 'categories' ? 'Categories' : 'Brands'} from Catalog
                  <span className="ml-1.5 rounded-full bg-[#EAF2FC] px-2 py-0.5 text-[10px] font-semibold text-[#1D5FAF]">
                    {targetChoices.length} in database
                  </span>
                </span>
                <span className="text-[11px] font-medium text-[#5B6B82]">
                  {form.applicableTargetIds.length} selected
                </span>
              </div>

              {/* Search input */}
              <div className="relative">
                <input
                  type="text"
                  placeholder={`Search ${form.applicableTo} by name or SKU...`}
                  value={targetSearch}
                  onChange={(e) => setTargetSearch(e.target.value)}
                  className="w-full rounded-md border border-[#DCE6F2] bg-white px-2.5 py-1.5 text-xs text-[#12263F] placeholder-[#8A9BA8] focus:border-[#1D5FAF] focus:outline-none"
                />
                {targetSearch && (
                  <button
                    type="button"
                    onClick={() => setTargetSearch('')}
                    className="absolute right-2 top-1.5 text-xs font-bold text-[#8A9BA8] hover:text-[#12263F]"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Quick actions: Select visible / Clear all */}
              <div className="flex items-center justify-between text-[11px]">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const allIds = Array.from(new Set([...form.applicableTargetIds, ...filteredTargetChoices.map((c) => c.id)]));
                      setForm((f) => ({ ...f, applicableTargetIds: allIds }));
                    }}
                    className="text-[#1D5FAF] hover:underline font-medium"
                  >
                    Select visible ({filteredTargetChoices.length})
                  </button>
                  <span className="text-[#DCE6F2]">|</span>
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, applicableTargetIds: [] }))}
                    className="text-[#E02424] hover:underline font-medium"
                  >
                    Clear selection
                  </button>
                </div>
              </div>

              {/* Scrollable list */}
              <div className="max-h-56 overflow-y-auto rounded-md border border-[#DCE6F2] bg-white p-1.5 space-y-0.5">
                {filteredTargetChoices.length === 0 ? (
                  <p className="py-4 text-center text-xs text-[#8A9BA8]">
                    {targetSearch ? `No items match "${targetSearch}"` : 'No items found in Catalog database'}
                  </p>
                ) : (
                  filteredTargetChoices.map((opt) => {
                    const checked = form.applicableTargetIds.includes(opt.id);
                    return (
                      <label
                        key={opt.id}
                        className={`flex items-center gap-2 rounded px-2.5 py-1.5 text-xs cursor-pointer transition-colors ${
                          checked
                            ? 'bg-[#EAF2FC] font-semibold text-[#1D5FAF]'
                            : 'hover:bg-[#F6F9FD] text-[#12263F]'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() =>
                            setForm((f) => ({
                              ...f,
                              applicableTargetIds: checked
                                ? f.applicableTargetIds.filter((id) => id !== opt.id)
                                : [...f.applicableTargetIds, opt.id],
                            }))
                          }
                          className="rounded border-[#DCE6F2] text-[#1D5FAF] focus:ring-0"
                        />
                        <span className="truncate">{opt.label}</span>
                      </label>
                    );
                  })
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Total Usage Limit">
              <input
                type="number"
                min={1}
                value={form.usageLimitTotal}
                onChange={(e) =>
                  setForm((f) => ({ ...f, usageLimitTotal: Number(e.target.value) }))
                }
                className={inputClass}
              />
            </FormField>
            <FormField label="Per Customer Limit">
              <input
                type="number"
                min={1}
                value={form.usageLimitPerCustomer}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    usageLimitPerCustomer: Number(e.target.value),
                  }))
                }
                className={inputClass}
              />
            </FormField>
          </div>

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

          <div className="flex flex-wrap gap-5 pt-1">
            <label className="flex items-center gap-2 text-xs font-medium text-[#12263F] cursor-pointer">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
                className="rounded border-[#DCE6F2] text-[#1D5FAF]"
              />
              Active
            </label>
            <label className="flex items-center gap-2 text-xs font-medium text-[#12263F] cursor-pointer">
              <input
                type="checkbox"
                checked={form.firstOrderOnly}
                onChange={(e) =>
                  setForm((f) => ({ ...f, firstOrderOnly: e.target.checked }))
                }
                className="rounded border-[#DCE6F2] text-[#1D5FAF]"
              />
              First Order Only
            </label>
          </div>

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
              className="rounded-lg bg-[#1D5FAF] px-4 py-2 text-xs font-semibold text-white hover:bg-[#174D8F] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Coupon'}
            </button>
          </div>
        </form>
      </Drawer>

      {/* Usage Report Modal */}
      {usageModalCoupon && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B2545]/50 p-4"
          onClick={() => setUsageModalCoupon(null)}
        >
          <div
            className="w-full max-w-md rounded-xl border border-[#DCE6F2] bg-white p-5 space-y-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-[#12263F]">
                Usage Report: <span className="font-mono text-[#1D5FAF]">{usageModalCoupon.code}</span>
              </h3>
              <StatusBadge status={usageModalCoupon.active ? 'active' : 'inactive'} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-[#F6F9FD] p-3">
                <p className="text-xs text-[#5B6B82]">Times Redeemed</p>
                <p className="mt-1 text-xl font-bold text-[#12263F] tabular-nums">
                  {usageModalCoupon.usedCount} / {usageModalCoupon.usageLimitTotal}
                </p>
              </div>
              <div className="rounded-lg bg-[#F6F9FD] p-3">
                <p className="text-xs text-[#5B6B82]">Total Discount Given</p>
                <p className="mt-1 text-xl font-bold text-[#1D5FAF] tabular-nums">
                  {formatINR(usageModalCoupon.totalDiscountGiven)}
                </p>
              </div>
            </div>

            <p className="text-xs text-[#5B6B82]">
              Average discount per redemption:{' '}
              <span className="font-semibold text-[#12263F] tabular-nums">
                {usageModalCoupon.usedCount > 0
                  ? formatINR(
                      Math.round(
                        usageModalCoupon.totalDiscountGiven / usageModalCoupon.usedCount
                      )
                    )
                  : '₹0'}
              </span>
            </p>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setUsageModalCoupon(null)}
                className="rounded-lg bg-[#1D5FAF] px-4 py-2 text-xs font-semibold text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Coupon"
        description={`Delete coupon code "${deleteTarget?.code}"?`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
