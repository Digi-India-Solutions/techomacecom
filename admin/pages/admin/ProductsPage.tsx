import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Copy,
  Edit3,
  ExternalLink,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import type { Brand, CategoryNode, Product, ProductStatus } from '@/types/admin';
import {
  bulkUpdateProducts,
  deleteProduct,
  duplicateProduct,
  listProducts,
  storefrontProductUrl,
} from '@/lib/api/admin/products';
import { listCategories } from '@/lib/api/admin/categories';
import { listBrands } from '@/lib/api/admin/brands';
import { formatINR } from '@/lib/api/admin/client';
import { useAuth } from '@/components/admin/AuthContext';
import { useToast } from '@/components/admin/ToastProvider';
import { DataTable, type BulkAction, type DataTableColumn } from '@/components/admin/DataTable';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { SafeImage } from '@/components/admin/SafeImage';
import { CategoryTreeSelect } from '@/components/admin/CategoryTreeSelect';

export function ProductsPage() {
  const { can } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<CategoryNode[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('all');
  const [brandId, setBrandId] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | ProductStatus>('all');
  const [stockFilter, setStockFilter] = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock'>('all');
  const [emiOnly, setEmiOnly] = useState(false);
  const [rentOnly, setRentOnly] = useState(false);
  const [codOnly, setCodOnly] = useState(false);

  // Modals
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [bulkDeleteIds, setBulkDeleteIds] = useState<string[] | null>(null);
  const [bulkCategoryModal, setBulkCategoryModal] = useState<{ ids: string[]; categoryId: string } | null>(null);
  const [previewProduct, setPreviewProduct] = useState<Product | null>(null);

  // Search runs on the server — wait until typing pauses (300 ms) before asking
  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Bumped after every write so the list reloads with the CURRENT filters
  const [reloadKey, setReloadKey] = useState(0);
  const reload = () => setReloadKey((k) => k + 1);
  // Only the newest request may update the table (filters can change while one is in flight)
  const latestRequest = useRef(0);

  // Category + brand pickers: loaded once
  useEffect(() => {
    Promise.all([listCategories(), listBrands()])
      .then(([cats, brds]) => {
        setCategories(cats);
        setBrands(brds);
      })
      .catch((err) =>
        showToast({
          title: 'Could not load filters',
          description: err instanceof Error ? err.message : 'Please try again',
          variant: 'error',
        })
      );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const requestId = ++latestRequest.current;
    setLoading(true);
    listProducts({
      search: debouncedSearch,
      categoryId,
      brandId,
      status: statusFilter,
      stockLevel: stockFilter,
      emiEnabled: emiOnly,
      rentEnabled: rentOnly,
      codEnabled: codOnly,
    })
      .then((prods) => {
        if (requestId === latestRequest.current) setProducts(prods);
      })
      .catch((err) => {
        if (requestId !== latestRequest.current) return;
        showToast({
          title: 'Could not load products',
          description: err instanceof Error ? err.message : 'Please try again',
          variant: 'error',
        });
      })
      .finally(() => {
        if (requestId === latestRequest.current) setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, categoryId, brandId, statusFilter, stockFilter, emiOnly, rentOnly, codOnly, reloadKey]);

  /** Runs an API action, shows its error (e.g. permission / conflict) and refreshes the list. */
  const runAction = async (action: () => Promise<void>) => {
    try {
      await action();
    } catch (err) {
      showToast({
        title: 'Action failed',
        description: err instanceof Error ? err.message : 'Please try again',
        variant: 'error',
      });
    } finally {
      reload();
    }
  };

  const handleDuplicate = (product: Product) =>
    runAction(async () => {
      const copy = await duplicateProduct(product.id);
      showToast({
        title: 'Product duplicated',
        description: `${copy.name} saved as draft.`,
        variant: 'success',
      });
    });

  const handleConfirmDelete = async () => {
    const single = deleteTarget;
    const many = bulkDeleteIds;
    setDeleteTarget(null);
    setBulkDeleteIds(null);
    if (single) {
      await runAction(async () => {
        await deleteProduct(single.id);
        showToast({ title: `Deleted ${single.name}`, variant: 'info' });
      });
    } else if (many) {
      await runAction(async () => {
        const res = await bulkUpdateProducts('delete', many);
        showToast({ title: res.message, variant: 'info' });
      });
    }
  };

  const canCreate = can('products.create');
  const canEdit = can('products.edit');
  const canDelete = can('products.delete');

  const columns: DataTableColumn<Product>[] = useMemo(
    () => [
      {
        key: 'product',
        header: 'Product',
        sortable: true,
        sortValue: (p) => p.name,
        csvValue: (p) => p.name,
        render: (p) => (
          <div className="flex items-center gap-3 min-w-[230px]">
            <div className="h-11 w-11 shrink-0 overflow-hidden rounded-lg border border-[#DCE6F2] bg-[#F6F9FD]">
              <SafeImage src={p.images[0]?.url} alt={p.name} />
            </div>
            <div className="min-w-0">
              <button
                type="button"
                onClick={() => navigate(`/admin/products/${p.id}`)}
                className="text-left text-sm font-semibold text-[#12263F] hover:text-[#1D5FAF] line-clamp-1"
              >
                {p.name}
              </button>
              <p className="mt-0.5 text-xs font-mono text-[#5B6B82]">{p.sku}</p>
            </div>
          </div>
        ),
      },
      {
        key: 'brand',
        header: 'Brand',
        sortable: true,
        sortValue: (p) => p.brandName,
        csvValue: (p) => p.brandName,
        render: (p) => (
          <span className="text-xs font-medium text-[#12263F] whitespace-nowrap">
            {p.brandName}
          </span>
        ),
      },
      {
        key: 'category',
        header: 'Category',
        sortable: true,
        sortValue: (p) => p.categoryPath,
        csvValue: (p) => p.categoryPath,
        render: (p) => (
          <span className="text-xs text-[#5B6B82] line-clamp-2 max-w-[200px]">
            {p.categoryPath}
          </span>
        ),
      },
      {
        key: 'price',
        header: 'Price / MRP',
        align: 'right',
        sortable: true,
        sortValue: (p) => p.price,
        csvValue: (p) => p.price,
        render: (p) => {
          const discount = p.mrp > p.price ? Math.round(((p.mrp - p.price) / p.mrp) * 100) : 0;
          return (
            <div className="text-right tabular-nums whitespace-nowrap">
              <p className="text-sm font-semibold text-[#12263F]">{formatINR(p.price)}</p>
              {p.mrp > p.price && (
                <p className="text-[11px] text-[#5B6B82]">
                  <span className="line-through mr-1">{formatINR(p.mrp)}</span>
                  <span className="text-emerald-600 font-medium">-{discount}%</span>
                </p>
              )}
            </div>
          );
        },
      },
      {
        key: 'stock',
        header: 'Stock',
        align: 'right',
        sortable: true,
        sortValue: (p) => p.stock,
        csvValue: (p) => p.stock,
        render: (p) => {
          const isLow = p.stock > 0 && p.stock <= p.lowStockThreshold;
          return (
            <div className="text-right tabular-nums whitespace-nowrap">
              <span
                className={`text-sm font-semibold ${
                  p.stock === 0
                    ? 'text-red-600'
                    : isLow
                      ? 'text-[#B85A0E]'
                      : 'text-[#12263F]'
                }`}
              >
                {p.stock}
              </span>
              {isLow && (
                <p className="text-[10px] font-medium text-[#B85A0E]">Low stock</p>
              )}
            </div>
          );
        },
      },
      {
        key: 'status',
        header: 'Status',
        sortable: true,
        sortValue: (p) => p.status,
        csvValue: (p) => p.status,
        render: (p) => <StatusBadge status={p.status} />,
      },
      {
        key: 'options',
        header: 'Options',
        csvValue: (p) =>
          [p.emiEnabled && 'EMI', p.showAvailableOnRent && 'Rent', p.codEnabled && 'COD']
            .filter(Boolean)
            .join('/'),
        render: (p) => (
          <div className="flex items-center gap-1 whitespace-nowrap">
            <span
              className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                p.emiEnabled
                  ? 'bg-[#EAF2FC] text-[#1D5FAF]'
                  : 'bg-slate-100 text-[#5B6B82]/50'
              }`}
            >
              EMI
            </span>
            <span
              className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                p.showAvailableOnRent || p.rental.enabled
                  ? 'bg-[#EAF2FC] text-[#1D5FAF]'
                  : 'bg-slate-100 text-[#5B6B82]/50'
              }`}
            >
              Rent
            </span>
            <span
              className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                p.codEnabled
                  ? 'bg-[#EAF2FC] text-[#1D5FAF]'
                  : 'bg-slate-100 text-[#5B6B82]/50'
              }`}
            >
              COD
            </span>
          </div>
        ),
      },
      {
        key: 'actions',
        header: 'Actions',
        align: 'right',
        render: (p) => (
          <div className="flex items-center justify-end gap-1">
            {canEdit && (
              <button
                type="button"
                onClick={() => navigate(`/admin/products/${p.id}`)}
                className="rounded-md p-1.5 text-[#5B6B82] hover:bg-[#EAF2FC] hover:text-[#1D5FAF]"
                title="Edit product"
              >
                <Edit3 className="h-4 w-4" />
              </button>
            )}
            {canCreate && (
              <button
                type="button"
                onClick={() => handleDuplicate(p)}
                className="rounded-md p-1.5 text-[#5B6B82] hover:bg-[#EAF2FC] hover:text-[#1D5FAF]"
                title="Duplicate product"
              >
                <Copy className="h-4 w-4" />
              </button>
            )}
            <button
              type="button"
              onClick={() => setPreviewProduct(p)}
              className="rounded-md p-1.5 text-[#5B6B82] hover:bg-[#EAF2FC] hover:text-[#1D5FAF]"
              title="Preview on site"
            >
              <ExternalLink className="h-4 w-4" />
            </button>
            {canDelete && (
              <button
                type="button"
                onClick={() => setDeleteTarget(p)}
                className="rounded-md p-1.5 text-[#5B6B82] hover:bg-red-50 hover:text-red-600"
                title="Delete product"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [canCreate, canEdit, canDelete]
  );

  const bulkActions: BulkAction<Product>[] = useMemo(() => {
    const acts: BulkAction<Product>[] = [];
    if (canEdit) {
      acts.push(
        {
          key: 'activate',
          label: 'Activate',
          onClick: (rows) =>
            runAction(async () => {
              const res = await bulkUpdateProducts('activate', rows.map((r) => r.id));
              showToast({ title: res.message, variant: 'success' });
            }),
        },
        {
          key: 'deactivate',
          label: 'Deactivate (hide from store)',
          onClick: (rows) =>
            runAction(async () => {
              const res = await bulkUpdateProducts('deactivate', rows.map((r) => r.id));
              showToast({ title: res.message, variant: 'info' });
            }),
        },
        {
          key: 'change_category',
          label: 'Change Category',
          onClick: (rows) => {
            setBulkCategoryModal({ ids: rows.map((r) => r.id), categoryId: '' });
          },
        }
      );
    }
    if (canDelete) {
      acts.push({
        key: 'delete',
        label: 'Delete Selected',
        variant: 'danger',
        onClick: (rows) => setBulkDeleteIds(rows.map((r) => r.id)),
      });
    }
    return acts;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canEdit, canDelete]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#12263F] tracking-tight">Products</h1>
          <p className="mt-0.5 text-sm text-[#5B6B82]">
            Manage Buy Denmed medical &amp; dental catalog, pricing, GST/HSN, and rental plans.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to="/admin/bulk-import"
            className="rounded-lg border border-[#DCE6F2] bg-white px-3.5 py-2 text-xs font-semibold text-[#12263F] hover:bg-[#EAF2FC] transition-colors whitespace-nowrap"
          >
            Bulk Import
          </Link>
          {canCreate && (
            <Link
              to="/admin/products/new"
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#1D5FAF] px-4 py-2 text-xs font-semibold text-white hover:bg-[#174D8F] transition-colors whitespace-nowrap"
            >
              <Plus className="h-4 w-4" />
              Add Product
            </Link>
          )}
        </div>
      </div>

      {/* Filters Row */}
      <div className="flex flex-wrap items-center gap-2.5 rounded-xl border border-[#DCE6F2] bg-white p-3.5">
        <div className="w-56">
          <CategoryTreeSelect
            categories={categories}
            value={categoryId === 'all' ? '' : categoryId}
            onChange={(val) => setCategoryId(val || 'all')}
            allowEmpty
            emptyLabel="All Categories"
            placeholder="All Categories"
          />
        </div>

        <select
          value={brandId}
          onChange={(e) => setBrandId(e.target.value)}
          className="rounded-lg border border-[#DCE6F2] bg-white px-3 py-2 text-xs font-medium text-[#12263F] focus:border-[#1D5FAF] focus:outline-none"
          aria-label="Filter by brand"
        >
          <option value="all">All Brands</option>
          {brands.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as 'all' | ProductStatus)}
          className="rounded-lg border border-[#DCE6F2] bg-white px-3 py-2 text-xs font-medium text-[#12263F] focus:border-[#1D5FAF] focus:outline-none"
          aria-label="Filter by status"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="draft">Draft</option>
          <option value="inactive">Inactive</option>
        </select>

        <select
          value={stockFilter}
          onChange={(e) =>
            setStockFilter(
              e.target.value as 'all' | 'in_stock' | 'low_stock' | 'out_of_stock'
            )
          }
          className="rounded-lg border border-[#DCE6F2] bg-white px-3 py-2 text-xs font-medium text-[#12263F] focus:border-[#1D5FAF] focus:outline-none"
          aria-label="Filter by stock level"
        >
          <option value="all">All Stock Levels</option>
          <option value="in_stock">Healthy Stock</option>
          <option value="low_stock">Low Stock</option>
          <option value="out_of_stock">Out of Stock</option>
        </select>

        <div className="flex items-center gap-1.5 ml-auto">
          {[
            { label: 'EMI', active: emiOnly, toggle: () => setEmiOnly((v) => !v) },
            { label: 'Rent', active: rentOnly, toggle: () => setRentOnly((v) => !v) },
            { label: 'COD', active: codOnly, toggle: () => setCodOnly((v) => !v) },
          ].map((chip) => (
            <button
              key={chip.label}
              type="button"
              onClick={chip.toggle}
              className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                chip.active
                  ? 'border-[#1D5FAF] bg-[#EAF2FC] text-[#1D5FAF]'
                  : 'border-[#DCE6F2] bg-white text-[#5B6B82] hover:bg-[#F6F9FD]'
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {/* Products Table */}
      <DataTable
        data={products}
        columns={columns}
        getRowId={(p) => p.id}
        loading={loading}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by product name, SKU, brand..."
        selectable={canEdit || canDelete}
        bulkActions={bulkActions}
        exportFilename="buydenmed-products.csv"
        emptyTitle="No products found"
        emptyDescription="Try clearing filters or add a new medical equipment listing."
        emptyAction={
          canCreate ? (
            <Link
              to="/admin/products/new"
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#1D5FAF] px-4 py-2 text-xs font-semibold text-white hover:bg-[#174D8F]"
            >
              <Plus className="h-4 w-4" />
              Add First Product
            </Link>
          ) : undefined
        }
      />

      {/* Delete Confirm */}
      <ConfirmDialog
        open={Boolean(deleteTarget || bulkDeleteIds)}
        title={deleteTarget ? `Delete "${deleteTarget.name}"?` : `Delete ${bulkDeleteIds?.length} products?`}
        description="This permanently removes the selected catalog entries. Existing historical orders will retain SKU snapshots."
        confirmLabel="Delete"
        onCancel={() => {
          setDeleteTarget(null);
          setBulkDeleteIds(null);
        }}
        onConfirm={handleConfirmDelete}
      />

      {/* Bulk Category Modal */}
      {bulkCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B2545]/45 p-4">
          <div className="w-full max-w-md rounded-xl border border-[#DCE6F2] bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-[#DCE6F2] px-5 py-4">
              <h3 className="text-base font-semibold text-[#12263F]">
                Change Category ({bulkCategoryModal.ids.length} products)
              </h3>
              <button
                type="button"
                onClick={() => setBulkCategoryModal(null)}
                className="rounded-lg p-1 text-[#5B6B82] hover:bg-[#EAF2FC]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <CategoryTreeSelect
                categories={categories}
                value={bulkCategoryModal.categoryId}
                onChange={(categoryId) =>
                  setBulkCategoryModal((prev) => (prev ? { ...prev, categoryId } : null))
                }
                placeholder="Choose destination category..."
              />
              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setBulkCategoryModal(null)}
                  className="rounded-lg border border-[#DCE6F2] px-4 py-2 text-sm font-medium text-[#12263F] hover:bg-[#EAF2FC]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!bulkCategoryModal.categoryId}
                  onClick={async () => {
                    if (!bulkCategoryModal.categoryId) return;
                    const { ids, categoryId: target } = bulkCategoryModal;
                    setBulkCategoryModal(null);
                    await runAction(async () => {
                      const res = await bulkUpdateProducts('change_category', ids, target);
                      showToast({ title: res.message, variant: 'success' });
                    });
                  }}
                  className="rounded-lg bg-[#1D5FAF] px-4 py-2 text-sm font-medium text-white hover:bg-[#174D8F] disabled:opacity-50"
                >
                  Apply Category
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preview on Site Modal */}
      {previewProduct && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B2545]/50 p-4"
          onClick={() => setPreviewProduct(null)}
        >
          <div
            className="w-full max-w-lg rounded-xl border border-[#DCE6F2] bg-white shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#DCE6F2] px-5 py-3.5 bg-[#F6F9FD]">
              <div>
                <p className="text-xs font-semibold text-[#1D5FAF]">Storefront Preview</p>
                {previewProduct.status === 'active' ? (
                  <a
                    href={storefrontProductUrl(previewProduct.slug)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] font-mono text-[#1D5FAF] hover:underline"
                  >
                    {storefrontProductUrl(previewProduct.slug)}
                  </a>
                ) : (
                  <p className="text-[11px] text-[#B85A0E]">
                    Not visible on the storefront until the status is Active
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setPreviewProduct(null)}
                className="rounded-lg p-1 text-[#5B6B82] hover:bg-[#EAF2FC]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-5 flex gap-4">
              <div className="h-32 w-32 shrink-0 overflow-hidden rounded-xl border border-[#DCE6F2] bg-[#F6F9FD]">
                <SafeImage src={previewProduct.images[0]?.url} alt={previewProduct.name} />
              </div>
              <div className="min-w-0 flex-1 space-y-2">
                <p className="text-xs font-medium text-[#5B6B82]">{previewProduct.brandName}</p>
                <h4 className="text-base font-bold text-[#12263F]">{previewProduct.name}</h4>
                <p className="text-xs text-[#5B6B82] line-clamp-2">
                  {previewProduct.shortDescription}
                </p>
                <div className="flex items-baseline gap-2 pt-1 tabular-nums">
                  <span className="text-lg font-bold text-[#12263F]">
                    {formatINR(previewProduct.price)}
                  </span>
                  {previewProduct.mrp > previewProduct.price && (
                    <span className="text-xs text-[#5B6B82] line-through">
                      {formatINR(previewProduct.mrp)}
                    </span>
                  )}
                  <span className="text-[11px] text-[#5B6B82]">
                    +{previewProduct.gstPercent}% GST
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {previewProduct.emiEnabled && <StatusBadge status="info" label="No-Cost EMI" tone="info" />}
                  {previewProduct.showAvailableOnRent && (
                    <StatusBadge status="success" label="Available on Rent" tone="success" />
                  )}
                  {previewProduct.codEnabled && <StatusBadge status="neutral" label="COD Eligible" tone="neutral" />}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
