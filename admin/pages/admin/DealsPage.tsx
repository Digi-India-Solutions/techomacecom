import React, { useEffect, useState } from 'react';
import { Clock, Edit3, Plus, Sparkles, Trash2 } from 'lucide-react';
import type { DealOfTheDayItem, Product } from '@/types/admin';
import { deleteDeal, listDeals, saveDeal } from '@/lib/api/admin/marketing';
import { listProducts } from '@/lib/api/admin/products';
import { formatINR } from '@/lib/api/admin/client';
import { useToast } from '@/components/admin/ToastProvider';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { SafeImage } from '@/components/admin/SafeImage';
import { Drawer } from '@/components/admin/Drawer';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { FormField, inputClass, selectClass } from '@/components/admin/FormField';

function defaultStartIso() {
  const d = new Date();
  d.setSeconds(0, 0);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

function defaultEndIso() {
  const d = new Date(Date.now() + 24 * 60 * 60 * 1000);
  d.setSeconds(0, 0);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

function CountdownText({ endTime }: { endTime: string }) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);

  const end = new Date(endTime).getTime();
  const diff = end - now;
  if (Number.isNaN(diff) || diff <= 0) return <span className="text-red-600">Ended</span>;
  const hrs = Math.floor(diff / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return (
    <span className="font-mono font-semibold text-[#1D5FAF] tabular-nums">
      {hrs}h {mins}m left
    </span>
  );
}

export function DealsPage() {
  const { showToast } = useToast();

  const [deals, setDeals] = useState<DealOfTheDayItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<DealOfTheDayItem | null>(null);

  const [productId, setProductId] = useState('');
  const [dealPrice, setDealPrice] = useState(0);
  const [startTime, setStartTime] = useState(defaultStartIso);
  const [endTime, setEndTime] = useState(defaultEndIso);
  const [active, setActive] = useState(true);

  const refreshProducts = () => {
    listProducts()
      .then((pRows) => {
        setProducts(pRows);
      })
      .catch((err) => console.warn('Could not refresh products for deals:', err));
  };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([listDeals(), listProducts()])
      .then(([dRows, pRows]) => {
        if (cancelled) return;
        setDeals(dRows);
        setProducts(pRows);
        if (pRows[0]) {
          setProductId(pRows[0].id);
          setDealPrice(Math.round(pRows[0].price * 0.9));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedProduct = products.find((p) => p.id === productId);

  const sortedProducts = React.useMemo(() => {
    return [...products].sort((a, b) => a.name.localeCompare(b.name));
  }, [products]);

  const openNew = () => {
    refreshProducts();
    setEditingId(undefined);
    if (products[0]) {
      setProductId(products[0].id);
      setDealPrice(Math.round(products[0].price * 0.9));
    }
    setStartTime(defaultStartIso());
    setEndTime(defaultEndIso());
    setActive(true);
    setDrawerOpen(true);
  };

  const openEdit = (d: DealOfTheDayItem) => {
    refreshProducts();
    setEditingId(d.id);
    setProductId(d.productId);
    setDealPrice(d.dealPrice);
    setStartTime(d.startTime);
    setEndTime(d.endTime);
    setActive(d.active);
    setDrawerOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    setSaving(true);
    try {
      const next = await saveDeal({
        id: editingId,
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        productImage: selectedProduct.images[0]?.url || '',
        regularPrice: selectedProduct.price,
        dealPrice,
        startTime,
        endTime,
        active,
      });
      setDeals(next);
      setDrawerOpen(false);
      showToast({
        title: editingId ? 'Deal of the Day updated' : 'Deal of the Day scheduled',
        variant: 'success',
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not save deal';
      showToast({ title: 'Failed to save deal', description: msg, variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const next = await deleteDeal(deleteTarget.id);
      setDeals(next);
      setDeleteTarget(null);
      showToast({ title: 'Deal deleted', variant: 'success' });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not delete deal';
      showToast({ title: 'Failed to delete deal', description: msg, variant: 'error' });
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#12263F] tracking-tight">
            Deal of the Day
          </h1>
          <p className="mt-0.5 text-sm text-[#5B6B82]">
            Schedule time-limited clinical flash deals with regular price comparison and countdown timers.
          </p>
        </div>

        <button
          type="button"
          onClick={openNew}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#1D5FAF] px-4 py-2 text-xs font-semibold text-white hover:bg-[#174D8F]"
        >
          <Plus className="h-4 w-4" />
          Schedule Deal
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
          <div className="h-40 rounded-xl bg-slate-200" />
          <div className="h-40 rounded-xl bg-slate-200" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {deals.map((d) => {
            const savings = d.regularPrice - d.dealPrice;
            const savingsPct = Math.round((savings / Math.max(d.regularPrice, 1)) * 100);
            return (
              <div
                key={d.id}
                className="rounded-xl border border-[#DCE6F2] bg-white p-5 flex gap-4"
              >
                <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-[#DCE6F2] bg-[#F6F9FD]">
                  <SafeImage src={d.productImage} alt={d.productName} />
                </div>

                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-[#12263F] line-clamp-2">
                      {d.productName}
                    </p>
                    <StatusBadge status={d.active ? 'active' : 'inactive'} />
                  </div>

                  <div className="flex flex-wrap items-baseline gap-2.5 tabular-nums">
                    <span className="text-xl font-bold text-[#12263F]">
                      {formatINR(d.dealPrice)}
                    </span>
                    <span className="text-xs text-[#5B6B82] line-through">
                      {formatINR(d.regularPrice)}
                    </span>
                    <span className="rounded bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                      Save {formatINR(savings)} ({savingsPct}% off)
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs text-[#5B6B82]">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-[#1D5FAF]" />
                      <CountdownText endTime={d.endTime} />
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => openEdit(d)}
                        className="inline-flex items-center gap-1 rounded-lg border border-[#DCE6F2] px-2.5 py-1 text-xs font-semibold text-[#1D5FAF] hover:bg-[#EAF2FC]"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(d)}
                        className="rounded-lg border border-[#DCE6F2] p-1.5 text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
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
        title={editingId ? 'Edit Deal of the Day' : 'Schedule Deal of the Day'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <FormField label="Select Product" required>
            <select
              value={productId}
              onChange={(e) => {
                const p = products.find((item) => item.id === e.target.value);
                setProductId(e.target.value);
                if (p) setDealPrice(Math.round(p.price * 0.9));
              }}
              className={selectClass}
            >
              {sortedProducts.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku}) — {formatINR(p.price)}
                </option>
              ))}
            </select>
          </FormField>

          {selectedProduct && (
            <div className="rounded-lg bg-[#F6F9FD] border border-[#DCE6F2] p-3 text-xs flex justify-between">
              <span className="text-[#5B6B82]">Regular Selling Price:</span>
              <span className="font-bold text-[#12263F] tabular-nums">
                {formatINR(selectedProduct.price)}
              </span>
            </div>
          )}

          <FormField
            label="Deal Price (₹)"
            required
            hint={
              selectedProduct && dealPrice > 0
                ? `Customer saves ${formatINR(selectedProduct.price - dealPrice)}`
                : undefined
            }
          >
            <input
              type="number"
              required
              min={1}
              value={dealPrice}
              onChange={(e) => setDealPrice(Number(e.target.value))}
              className={inputClass}
            />
          </FormField>

          <FormField label="Deal Start Date & Time" required>
            <input
              type="datetime-local"
              required
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className={inputClass}
            />
          </FormField>

          <FormField label="Deal End Date & Time" required>
            <input
              type="datetime-local"
              required
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className={inputClass}
            />
          </FormField>

          <label className="flex items-center gap-2 text-xs font-medium text-[#12263F] cursor-pointer">
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="rounded border-[#DCE6F2] text-[#1D5FAF]"
            />
            <Sparkles className="h-3.5 w-3.5 text-[#1D5FAF]" />
            Deal Active
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
              className="rounded-lg bg-[#1D5FAF] px-4 py-2 text-xs font-semibold text-white hover:bg-[#174D8F] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Deal'}
            </button>
          </div>
        </form>
      </Drawer>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Deal"
        description={`Remove Deal of the Day for "${deleteTarget?.productName}"?`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
