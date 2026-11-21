import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Copy,
  ExternalLink,
  GripVertical,
  Plus,
  Save,
  Trash2,
  X,
} from 'lucide-react';
import type {
  Brand,
  CategoryNode,
  GstRate,
  ProductFormPayload,
  ProductRentalPlan,
  ProductSpecification,
  ProductStatus,
  ProductVariant,
  RentalPlanDuration,
  VariantOptionType,
} from '@/types/admin';
import {
  createProduct,
  duplicateProduct,
  getProductById,
  storefrontProductUrl,
  updateProduct,
} from '@/lib/api/admin/products';
import { listCategories } from '@/lib/api/admin/categories';
import { listBrands } from '@/lib/api/admin/brands';
import { AdminApiError, formatINR, slugify } from '@/lib/api/admin/client';
import { useToast } from '@/components/admin/ToastProvider';
import { useAuth } from '@/components/admin/AuthContext';
import { FormField, inputClass, selectClass, textareaClass } from '@/components/admin/FormField';
import { CategoryTreeSelect } from '@/components/admin/CategoryTreeSelect';
import { RichTextEditor } from '@/components/admin/RichTextEditor';
import { ImageUploader } from '@/components/admin/ImageUploader';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { SafeImage } from '@/components/admin/SafeImage';
import { VariantImagePicker } from '@/components/admin/VariantImagePicker';

type TabKey =
  | 'basic'
  | 'pricing'
  | 'variants'
  | 'images'
  | 'specs'
  | 'shipping'
  | 'toggles'
  | 'rental'
  | 'seo';

const EMPTY_FORM: ProductFormPayload = {
  name: '',
  slug: '',
  sku: '',
  brandId: '',
  categoryId: '',
  shortDescription: '',
  fullDescription: '',
  status: 'draft',
  price: 0,
  mrp: 0,
  gstPercent: 12,
  hsnCode: '',
  buyTwoPlusPrice: null,
  stock: 0,
  reservedStock: 0,
  lowStockThreshold: 5,
  emiEnabled: false,
  codEnabled: true,
  featured: false,
  bestSeller: false,
  dealOfTheDay: false,
  newArrival: true,
  showAvailableOnRent: false,
  variants: [],
  images: [],
  specifications: [],
  weightKg: 1,
  lengthCm: 30,
  widthCm: 25,
  heightCm: 20,
  rental: {
    enabled: false,
    plans: [],
    securityDeposit: 0,
    deliveryPickupCharge: 0,
    prescriptionRequired: false,
  },
  seoTitle: '',
  seoDescription: '',
  features: [],
  warranty: '',
  certifications: [],
};

/** Which tab holds the field an API validation error points at (e.g. "variants.2.sku"). */
function tabForField(field: string): TabKey {
  const root = field.split('.')[0];
  if (root === 'variants') return 'variants';
  if (root === 'images') return 'images';
  if (root === 'specifications') return 'specs';
  if (root === 'rental') return 'rental';
  if (['price', 'mrp', 'gstPercent', 'hsnCode', 'buyTwoPlusPrice'].includes(root)) return 'pricing';
  if (['weightKg', 'lengthCm', 'widthCm', 'heightCm'].includes(root)) return 'shipping';
  if (['seoTitle', 'seoDescription'].includes(root)) return 'seo';
  return 'basic';
}

export function ProductFormPage() {
  const { id } = useParams<{ id: string }>();
  const isNew = !id || id === 'new';
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { can } = useAuth();

  const [activeTab, setActiveTab] = useState<TabKey>('basic');
  const [form, setForm] = useState<ProductFormPayload>(EMPTY_FORM);
  const [categories, setCategories] = useState<CategoryNode[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [brandSearch, setBrandSearch] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [variantValidationAttempted, setVariantValidationAttempted] = useState(false);
  const [touchedVariantFields, setTouchedVariantFields] = useState<Record<string, boolean>>({});
  const [dragVariantIdx, setDragVariantIdx] = useState<number | null>(null);
  const [dragReadyVariantId, setDragReadyVariantId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      listCategories(),
      listBrands(),
      !isNew && id ? getProductById(id) : Promise.resolve(null),
    ])
      .then(([cats, brds, prod]) => {
        if (cancelled) return;
        setCategories(cats);
        setBrands(brds);
        if (prod) {
          const {
            id: _id,
            createdAt: _c,
            updatedAt: _u,
            brandName: _bn,
            categoryPath: _cp,
            publishedAt: _p,
            ...rest
          } = prod;
          const normalizedVariants = [...(rest.variants || [])]
            .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
            .map((v, idx, arr) => ({
              ...v,
              isDefault: arr.some((item) => item.isDefault) ? Boolean(v.isDefault) : idx === 0,
              isActive: v.isActive ?? true,
              sortOrder: idx,
            }));
          setForm({
            ...rest,
            features: rest.features || [],
            warranty: rest.warranty || '',
            certifications: rest.certifications || [],
            variants: normalizedVariants,
          });
          setSlugTouched(true);
        } else if (!isNew) {
          showToast({ title: 'Product not found', description: 'It may have been deleted.', variant: 'error' });
          navigate('/admin/products', { replace: true });
        } else if (brds.length > 0) {
          setForm((prev) => ({ ...prev, brandId: brds[0].id }));
        }
      })
      .catch((err) => {
        if (cancelled) return;
        showToast({
          title: 'Could not load the product editor',
          description: err instanceof Error ? err.message : 'Please try again',
          variant: 'error',
        });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id, isNew]);

  // Warn on browser tab close / reload when dirty
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (!isDirty) return;
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  const updateField = <K extends keyof ProductFormPayload>(
    key: K,
    value: ProductFormPayload[K]
  ) => {
    setIsDirty(true);
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === 'name' && !slugTouched) {
        next.slug = slugify(String(value));
      }
      return next;
    });
  };

  const hasVariants = form.variants.length > 0;
  const defaultVariant = useMemo(
    () => form.variants.find((v) => v.isDefault) || form.variants[0] || null,
    [form.variants]
  );

  const effectivePrice = hasVariants && defaultVariant ? defaultVariant.price : form.price;
  const effectiveMrp = hasVariants && defaultVariant ? defaultVariant.mrp : form.mrp;
  const totalVariantStock = form.variants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0);
  const effectiveStock = hasVariants ? totalVariantStock : form.stock;

  const discountPercent = useMemo(() => {
    if (effectiveMrp <= 0 || effectivePrice <= 0 || effectiveMrp <= effectivePrice) return 0;
    return Math.round(((effectiveMrp - effectivePrice) / effectiveMrp) * 100);
  }, [effectivePrice, effectiveMrp]);

  // SKUs used by OTHER products are checked by the API on save (409 with the exact
  // variant field); this set only feeds the in-form duplicate + auto-SKU helpers.
  const externalSkus = useMemo(() => new Set<string>(), []);

  const variantValidation = useMemo(() => {
    const skuCounts = new Map<string, number>();
    for (const v of form.variants) {
      const normalized = v.sku.trim().toUpperCase();
      if (normalized) {
        skuCounts.set(normalized, (skuCounts.get(normalized) || 0) + 1);
      }
    }

    const byId: Record<
      string,
      {
        name?: string;
        sku?: string;
        price?: string;
        mrp?: string;
        stock?: string;
      }
    > = {};
    const summary: string[] = [];

    form.variants.forEach((v, idx) => {
      const rowLabel = v.name.trim() ? `"${v.name.trim()}"` : `Row ${idx + 1}`;
      const rowErrors: {
        name?: string;
        sku?: string;
        price?: string;
        mrp?: string;
        stock?: string;
      } = {};

      const nameTouched = variantValidationAttempted || touchedVariantFields[`${v.id}:name`];
      const skuTouched = variantValidationAttempted || touchedVariantFields[`${v.id}:sku`];

      if (!v.name.trim()) {
        if (nameTouched) {
          rowErrors.name = 'Variant name is required';
          summary.push(`${rowLabel}: Variant name is required`);
        }
      }

      const normalizedSku = v.sku.trim().toUpperCase();
      if (!normalizedSku) {
        if (skuTouched) {
          rowErrors.sku = 'SKU is required';
          summary.push(`${rowLabel}: SKU is required`);
        }
      } else if ((skuCounts.get(normalizedSku) || 0) > 1) {
        rowErrors.sku = 'Duplicate SKU within this product';
        summary.push(`${rowLabel}: Duplicate SKU "${v.sku.trim()}"`);
      } else if (externalSkus.has(normalizedSku)) {
        rowErrors.sku = 'SKU already exists in another product/variant';
        summary.push(`${rowLabel}: SKU "${v.sku.trim()}" already exists in catalog`);
      }

      if (!Number.isFinite(v.price) || v.price <= 0) {
        rowErrors.price = 'Price must be > 0';
        summary.push(`${rowLabel}: Price must be greater than 0`);
      }

      if (!Number.isFinite(v.mrp) || v.mrp < v.price) {
        rowErrors.mrp = 'MRP must be ≥ Price';
        if (!rowErrors.price && v.price > v.mrp) {
          rowErrors.price = 'Price must be ≤ MRP';
        }
        summary.push(`${rowLabel}: Price cannot exceed MRP`);
      }

      if (!Number.isFinite(v.stock) || v.stock < 0) {
        rowErrors.stock = 'Stock must be ≥ 0';
        summary.push(`${rowLabel}: Stock must be 0 or greater`);
      }

      byId[v.id] = rowErrors;
    });

    const hasBlockingErrors = form.variants.some((v) => {
      const normalizedSku = v.sku.trim().toUpperCase();
      return (
        !v.name.trim() ||
        !normalizedSku ||
        (skuCounts.get(normalizedSku) || 0) > 1 ||
        externalSkus.has(normalizedSku) ||
        !Number.isFinite(v.price) ||
        v.price <= 0 ||
        !Number.isFinite(v.mrp) ||
        v.mrp < v.price ||
        !Number.isFinite(v.stock) ||
        v.stock < 0
      );
    });

    return { byId, summary, hasBlockingErrors };
  }, [form.variants, externalSkus, variantValidationAttempted, touchedVariantFields]);

  const filteredBrands = useMemo(() => {
    if (!brandSearch.trim()) return brands;
    const q = brandSearch.toLowerCase();
    return brands.filter((b) => b.name.toLowerCase().includes(q));
  }, [brands, brandSearch]);

  const tabs: { key: TabKey; label: string; hidden?: boolean }[] = [
    { key: 'basic', label: 'Basic' },
    { key: 'pricing', label: 'Pricing & Tax' },
    { key: 'variants', label: `Variants (${form.variants.length})` },
    { key: 'images', label: `Images (${form.images.length})` },
    { key: 'specs', label: `Specifications (${form.specifications.length})` },
    { key: 'shipping', label: 'Shipping' },
    { key: 'toggles', label: 'Toggles' },
    { key: 'rental', label: 'Rental', hidden: !form.rental.enabled && !form.showAvailableOnRent },
    { key: 'seo', label: 'SEO' },
  ];

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.sku.trim()) {
      showToast({
        title: 'Missing required fields',
        description: 'Product name and SKU are required.',
        variant: 'error',
      });
      setActiveTab('basic');
      return;
    }

    if (hasVariants && variantValidation.hasBlockingErrors) {
      setVariantValidationAttempted(true);
      setActiveTab('variants');
      showToast({
        title: 'Fix variant errors before saving',
        description: 'Check highlighted variant fields for missing or invalid values.',
        variant: 'error',
      });
      return;
    }

    const hasRentalPlans = (form.rental.plans || []).length > 0;
    const rentOn = Boolean(form.rental.enabled || form.showAvailableOnRent) && hasRentalPlans;

    const basePayload: ProductFormPayload = {
      ...form,
      showAvailableOnRent: rentOn,
      rental: {
        ...form.rental,
        enabled: rentOn,
      },
    };

    const payloadToSave: ProductFormPayload =
      hasVariants && defaultVariant
        ? {
            ...basePayload,
            price: defaultVariant.price,
            mrp: defaultVariant.mrp,
            stock: defaultVariant.stock,
            variants: form.variants.map((v, idx) => ({ ...v, sortOrder: idx })),
          }
        : basePayload;

    setSaving(true);
    try {
      if (isNew) {
        const created = await createProduct(payloadToSave);
        setIsDirty(false);
        showToast({ title: 'Product created', description: created.name, variant: 'success' });
        navigate(`/admin/products/${created.id}`, { replace: true });
      } else if (id) {
        const updated = await updateProduct(id, payloadToSave);
        setIsDirty(false);
        showToast({ title: 'Product saved', description: updated.name, variant: 'success' });
      }
    } catch (err) {
      // Jump to the tab that holds the first invalid field the API reported
      const firstField = err instanceof AdminApiError && err.fields ? Object.keys(err.fields)[0] : null;
      if (firstField) setActiveTab(tabForField(firstField));
      showToast({
        title: 'Save failed',
        description: err instanceof Error ? err.message : 'Unable to save product',
        variant: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (isDirty) setLeaveConfirmOpen(true);
    else navigate('/admin/products');
  };

  const handleDuplicate = async () => {
    if (!id || isNew) return;
    try {
      const copy = await duplicateProduct(id);
      showToast({ title: 'Product duplicated as draft', variant: 'success' });
      navigate(`/admin/products/${copy.id}`);
    } catch (err) {
      showToast({
        title: 'Duplicate failed',
        description: err instanceof Error ? err.message : 'Please try again',
        variant: 'error',
      });
    }
  };

  // Variants helpers
  const markVariantFieldTouched = (variantId: string, field: string) => {
    setTouchedVariantFields((prev) => {
      const key = `${variantId}:${field}`;
      if (prev[key]) return prev;
      return { ...prev, [key]: true };
    });
  };

  const addVariant = () => {
    const baseSkuPrefix = (form.sku || 'BDM').trim().toUpperCase();
    let suffixNum = form.variants.length + 1;
    const usedSkus = new Set([
      ...externalSkus,
      ...form.variants.map((v) => v.sku.trim().toUpperCase()),
    ]);
    while (usedSkus.has(`${baseSkuPrefix}-V${suffixNum}`)) {
      suffixNum += 1;
    }

    const seedPrice = hasVariants && defaultVariant ? defaultVariant.price : form.price;
    const seedMrp = hasVariants && defaultVariant ? defaultVariant.mrp : form.mrp;

    const next: ProductVariant = {
      id: `var-${Date.now()}`,
      optionType: 'Model',
      name: '',
      sku: `${baseSkuPrefix}-V${suffixNum}`,
      price: seedPrice > 0 ? seedPrice : 0,
      mrp: seedMrp >= seedPrice ? seedMrp : seedPrice,
      stock: 0,
      imageUrl: form.images[0]?.url || '',
      isDefault: form.variants.length === 0,
      isActive: true,
      sortOrder: form.variants.length,
    };
    updateField('variants', [...form.variants, next]);
  };

  const updateVariant = (idx: number, patch: Partial<ProductVariant>) => {
    const next = form.variants.map((item, i) => (i === idx ? { ...item, ...patch } : item));
    updateField('variants', next);
  };

  const setDefaultVariant = (variantId: string) => {
    updateField(
      'variants',
      form.variants.map((v) => ({ ...v, isDefault: v.id === variantId }))
    );
  };

  const removeVariant = (variantId: string) => {
    const remaining = form.variants.filter((item) => item.id !== variantId);
    const hasDefault = remaining.some((v) => v.isDefault);
    const normalized = remaining.map((v, idx) => ({
      ...v,
      sortOrder: idx,
      isDefault: hasDefault ? v.isDefault : idx === 0,
    }));
    updateField('variants', normalized);
  };

  const moveVariant = (from: number, to: number) => {
    if (to < 0 || to >= form.variants.length || from === to) return;
    const copy = [...form.variants];
    const [moved] = copy.splice(from, 1);
    copy.splice(to, 0, moved);
    updateField(
      'variants',
      copy.map((v, idx) => ({ ...v, sortOrder: idx }))
    );
  };

  // Specs helpers
  const addSpec = () => {
    const next: ProductSpecification = {
      id: `spec-${Date.now()}`,
      key: '',
      value: '',
      sortOrder: form.specifications.length,
    };
    updateField('specifications', [...form.specifications, next]);
  };

  const moveSpec = (from: number, to: number) => {
    if (to < 0 || to >= form.specifications.length) return;
    const copy = [...form.specifications];
    const [moved] = copy.splice(from, 1);
    copy.splice(to, 0, moved);
    updateField(
      'specifications',
      copy.map((s, idx) => ({ ...s, sortOrder: idx }))
    );
  };

  // Rental plan helpers
  const addRentalPlan = () => {
    const next: ProductRentalPlan = {
      id: `rp-${Date.now()}`,
      durationType: 'monthly',
      price: 2500,
      minDuration: 1,
      maxDuration: 12,
    };
    updateField('rental', {
      ...form.rental,
      plans: [...form.rental.plans, next],
    });
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-[#DCE6F2] bg-white p-8 text-sm text-[#5B6B82]">
        Loading product editor...
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="pb-24 space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={handleCancel}
            className="rounded-lg border border-[#DCE6F2] bg-white p-2 text-[#12263F] hover:bg-[#EAF2FC]"
            aria-label="Back to products"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-[#12263F] truncate">
              {isNew ? 'Add New Product' : form.name || 'Edit Product'}
            </h1>
            <p className="text-xs text-[#5B6B82]">
              {isNew ? 'Create a new medical or dental listing' : `SKU: ${form.sku}`}
              {isDirty && (
                <span className="ml-2 font-semibold text-[#B85A0E]">
                  · Unsaved changes
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isNew && (
            <>
              {/* Duplicating creates a product → needs products.create */}
              {can('products.create') && (
                <button
                  type="button"
                  onClick={handleDuplicate}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#DCE6F2] bg-white px-3 py-2 text-xs font-semibold text-[#12263F] hover:bg-[#EAF2FC]"
                >
                  <Copy className="h-3.5 w-3.5" />
                  Duplicate
                </button>
              )}
              <button
                type="button"
                onClick={() => setPreviewOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#DCE6F2] bg-white px-3 py-2 text-xs font-semibold text-[#12263F] hover:bg-[#EAF2FC]"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Preview on site
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tab Bar */}
      <div className="flex items-center gap-1 overflow-x-auto rounded-xl border border-[#DCE6F2] bg-white p-1.5">
        {tabs
          .filter((t) => !t.hidden)
          .map((tab) => {
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                  active
                    ? 'bg-[#1D5FAF] text-white'
                    : 'text-[#5B6B82] hover:bg-[#EAF2FC] hover:text-[#12263F]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
      </div>

      {/* Tab Panels */}
      <div className="rounded-xl border border-[#DCE6F2] bg-white p-6">
        {activeTab === 'basic' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <FormField label="Product Name" required className="lg:col-span-2">
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder="e.g. MedixPulse 5L Stationary Oxygen Concentrator"
                className={inputClass}
              />
            </FormField>

            <FormField
              label="URL Slug"
              required
              hint={`Storefront URL: /products/${form.slug || 'product-slug'}`}
            >
              <input
                type="text"
                required
                value={form.slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  updateField('slug', slugify(e.target.value));
                }}
                className={`${inputClass} font-mono text-xs`}
              />
            </FormField>

            <FormField label="Primary SKU" required>
              <input
                type="text"
                required
                value={form.sku}
                onChange={(e) => updateField('sku', e.target.value.toUpperCase())}
                placeholder="BDM-OXY-5L-01"
                className={`${inputClass} font-mono`}
              />
            </FormField>

            <FormField label="Brand (Searchable Select)" required>
              <div className="space-y-1.5">
                <input
                  type="text"
                  value={brandSearch}
                  onChange={(e) => setBrandSearch(e.target.value)}
                  placeholder="Type to filter brands..."
                  className={`${inputClass} text-xs py-1.5`}
                />
                <select
                  value={form.brandId}
                  onChange={(e) => updateField('brandId', e.target.value)}
                  className={selectClass}
                >
                  <option value="">Select Brand</option>
                  {filteredBrands.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            </FormField>

            <FormField label="Category (3-Level Tree)" required>
              <CategoryTreeSelect
                categories={categories}
                value={form.categoryId}
                onChange={(categoryId) => updateField('categoryId', categoryId)}
              />
            </FormField>

            <FormField label="Listing Status" required>
              <select
                value={form.status}
                onChange={(e) => updateField('status', e.target.value as ProductStatus)}
                className={selectClass}
              >
                <option value="active">Active (Visible on storefront)</option>
                <option value="draft">Draft (Hidden from storefront)</option>
                <option value="inactive">Inactive (Hidden from storefront)</option>
              </select>
            </FormField>

            <FormField
              label="Available Stock"
              hint={
                hasVariants
                  ? `Total stock across variants (${totalVariantStock} units in ${form.variants.length} variants)`
                  : undefined
              }
            >
              <input
                type="number"
                min={0}
                value={effectiveStock}
                readOnly={hasVariants}
                disabled={hasVariants}
                onChange={(e) => updateField('stock', Number(e.target.value))}
                className={`${inputClass} tabular-nums ${
                  hasVariants ? 'bg-[#F6F9FD] text-[#5B6B82] cursor-not-allowed' : ''
                }`}
              />
            </FormField>

            <FormField label="Short Description" className="lg:col-span-2">
              <textarea
                value={form.shortDescription}
                onChange={(e) => updateField('shortDescription', e.target.value)}
                placeholder="Concise 1–2 line summary displayed below the product title..."
                className={textareaClass}
              />
            </FormField>

            <FormField label="Full Description (Rich Text)" className="lg:col-span-2">
              <RichTextEditor
                value={form.fullDescription}
                onChange={(html) => updateField('fullDescription', html)}
              />
            </FormField>

            <FormField
              label="Key Features"
              hint="One feature per line — shown as bullet points on the product page (max 30)"
              className="lg:col-span-2"
            >
              <textarea
                value={(form.features || []).join('\n')}
                onChange={(e) => updateField('features', e.target.value.split('\n'))}
                onBlur={() =>
                  updateField(
                    'features',
                    (form.features || []).map((f) => f.trim()).filter(Boolean)
                  )
                }
                placeholder={'93% ± 3% oxygen purity\nLow noise (< 40 dB)\n2-year manufacturer warranty'}
                className={textareaClass}
              />
            </FormField>

            <FormField label="Warranty" hint="e.g. 2 years manufacturer warranty">
              <input
                type="text"
                maxLength={200}
                value={form.warranty || ''}
                onChange={(e) => updateField('warranty', e.target.value)}
                className={inputClass}
              />
            </FormField>

            <FormField label="Certifications" hint="Comma separated, e.g. CE, ISO 13485, CDSCO">
              <input
                type="text"
                value={(form.certifications || []).join(', ')}
                onChange={(e) =>
                  updateField(
                    'certifications',
                    e.target.value.split(',').map((c) => c.trimStart())
                  )
                }
                onBlur={() =>
                  updateField(
                    'certifications',
                    (form.certifications || []).map((c) => c.trim()).filter(Boolean)
                  )
                }
                className={inputClass}
              />
            </FormField>
          </div>
        )}

        {activeTab === 'pricing' && (
          <div className="space-y-5">
            {hasVariants && defaultVariant && (
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#DCE6F2] bg-[#EAF2FC]/60 px-4 py-3 text-xs text-[#12263F]">
                <div>
                  <span className="font-semibold text-[#1D5FAF]">Managed by variants:</span>{' '}
                  Base Price, MRP, and Stock mirror the default variant (
                  <span className="font-semibold">
                    {defaultVariant.name || defaultVariant.sku || 'Default'}
                  </span>
                  ).
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('variants')}
                  className="font-semibold text-[#1D5FAF] hover:underline"
                >
                  Edit in Variants tab →
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              <FormField
                label="Selling Price (INR)"
                required
                hint={hasVariants ? 'Managed by variants' : undefined}
              >
                <input
                  type="number"
                  min={0}
                  value={effectivePrice}
                  readOnly={hasVariants}
                  disabled={hasVariants}
                  onChange={(e) => updateField('price', Number(e.target.value))}
                  className={`${inputClass} tabular-nums ${
                    hasVariants ? 'bg-[#F6F9FD] text-[#5B6B82] cursor-not-allowed' : ''
                  }`}
                />
              </FormField>

              <FormField
                label="MRP (INR)"
                hint={
                  hasVariants
                    ? 'Managed by variants'
                    : discountPercent > 0
                    ? `Auto discount calculated: ${discountPercent}% OFF`
                    : 'Set MRP higher than selling price to show discount %'
                }
              >
                <input
                  type="number"
                  min={0}
                  value={effectiveMrp}
                  readOnly={hasVariants}
                  disabled={hasVariants}
                  onChange={(e) => updateField('mrp', Number(e.target.value))}
                  className={`${inputClass} tabular-nums ${
                    hasVariants ? 'bg-[#F6F9FD] text-[#5B6B82] cursor-not-allowed' : ''
                  }`}
                />
              </FormField>

              <FormField
                label="Base Stock"
                hint={hasVariants ? 'Managed by variants' : 'Available inventory units'}
              >
                <input
                  type="number"
                  min={0}
                  value={effectiveStock}
                  readOnly={hasVariants}
                  disabled={hasVariants}
                  onChange={(e) => updateField('stock', Number(e.target.value))}
                  className={`${inputClass} tabular-nums ${
                    hasVariants ? 'bg-[#F6F9FD] text-[#5B6B82] cursor-not-allowed' : ''
                  }`}
                />
              </FormField>

              <div className="rounded-xl border border-[#DCE6F2] bg-[#EAF2FC]/50 p-4 flex flex-col justify-center">
                <span className="text-xs font-medium text-[#5B6B82]">Discount Preview</span>
                <span className="mt-1 text-2xl font-bold text-[#1D5FAF] tabular-nums">
                  {discountPercent}% OFF
                </span>
                <span className="text-xs text-[#5B6B82] tabular-nums">
                  Savings: {formatINR(Math.max(0, effectiveMrp - effectivePrice))}
                </span>
              </div>

              <FormField label="GST Rate (%)" required>
                <select
                  value={form.gstPercent}
                  onChange={(e) => updateField('gstPercent', Number(e.target.value) as GstRate)}
                  className={selectClass}
                >
                  {[0, 5, 12, 18, 28].map((rate) => (
                    <option key={rate} value={rate}>
                      {rate}% GST
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="HSN Code" hint="8-digit medical device HSN for GST invoicing">
                <input
                  type="text"
                  value={form.hsnCode}
                  onChange={(e) => updateField('hsnCode', e.target.value)}
                  placeholder="90192010"
                  className={`${inputClass} font-mono`}
                />
              </FormField>

              <FormField
                label="Buy 2+ Price (Optional)"
                hint="Clinic bulk discount price per unit when qty ≥ 2"
              >
                <input
                  type="number"
                  min={0}
                  value={form.buyTwoPlusPrice ?? ''}
                  onChange={(e) =>
                    updateField(
                      'buyTwoPlusPrice',
                      e.target.value ? Number(e.target.value) : null
                    )
                  }
                  placeholder="Optional tiered price"
                  className={`${inputClass} tabular-nums`}
                />
              </FormField>
            </div>
          </div>
        )}

        {activeTab === 'variants' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-[#12263F]">Product Variants</h3>
                <p className="text-xs text-[#5B6B82]">
                  Add Size, Pack, or Model options with independent SKUs, pricing, stock, and images. Drag rows to reorder.
                </p>
              </div>
              <button
                type="button"
                onClick={addVariant}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#1D5FAF] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#174D8F]"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Variant Row
              </button>
            </div>

            {variantValidation.summary.length > 0 && (
              <div
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-800"
              >
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-semibold text-red-900">
                      Please resolve {variantValidation.summary.length} variant{' '}
                      {variantValidation.summary.length === 1 ? 'issue' : 'issues'} before saving:
                    </p>
                    <ul className="list-disc pl-4 space-y-0.5 text-red-700">
                      {variantValidation.summary.map((msg, i) => (
                        <li key={i}>{msg}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {form.variants.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[#DCE6F2] bg-[#F6F9FD] p-8 text-center text-xs text-[#5B6B82]">
                No variants added yet. Single-SKU product pricing will be used unless you add variant rows.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-[#DCE6F2]">
                <table className="w-full min-w-[1140px] text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[#DCE6F2] bg-[#F6F9FD] text-[#5B6B82] font-semibold">
                      <th className="w-[40px] min-w-[40px] px-2 py-2.5 text-center" title="Reorder">
                        <span className="sr-only">Reorder</span>
                      </th>
                      <th className="w-[68px] min-w-[68px] px-2 py-2.5 text-center">Default</th>
                      <th className="w-[68px] min-w-[68px] px-2 py-2.5 text-center">Active</th>
                      <th className="w-[140px] min-w-[140px] px-3 py-2.5">Option Type</th>
                      <th className="min-w-[200px] px-3 py-2.5">Variant Name</th>
                      <th className="w-[140px] min-w-[140px] px-3 py-2.5">SKU</th>
                      <th className="w-[110px] min-w-[110px] px-3 py-2.5">Price (₹)</th>
                      <th className="w-[110px] min-w-[110px] px-3 py-2.5">MRP (₹)</th>
                      <th className="w-[90px] min-w-[90px] px-3 py-2.5">Stock</th>
                      <th className="w-[90px] min-w-[90px] px-3 py-2.5">Image</th>
                      <th className="w-[60px] min-w-[60px] px-2 py-2.5 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#DCE6F2]">
                    {form.variants.map((v, idx) => {
                      const errs = variantValidation.byId[v.id] || {};
                      const rowDiscount =
                        v.mrp > 0 && v.price > 0 && v.mrp > v.price
                          ? Math.round(((v.mrp - v.price) / v.mrp) * 100)
                          : 0;
                      const invalidInputClass =
                        'border-red-500 bg-red-50/40 focus:border-red-500 focus:ring-red-200';

                      return (
                        <tr
                          key={v.id}
                          draggable={dragReadyVariantId === v.id}
                          onDragStart={(e) => {
                            if (dragReadyVariantId !== v.id) {
                              e.preventDefault();
                              return;
                            }
                            setDragVariantIdx(idx);
                            e.dataTransfer.effectAllowed = 'move';
                            e.dataTransfer.setData('text/plain', v.id);
                          }}
                          onDragOver={(e) => {
                            if (dragVariantIdx !== null) {
                              e.preventDefault();
                            }
                          }}
                          onDrop={(e) => {
                            if (dragVariantIdx !== null && dragVariantIdx !== idx) {
                              e.preventDefault();
                              moveVariant(dragVariantIdx, idx);
                            }
                            setDragVariantIdx(null);
                            setDragReadyVariantId(null);
                          }}
                          onDragEnd={() => {
                            setDragVariantIdx(null);
                            setDragReadyVariantId(null);
                          }}
                          className={`align-top transition-colors ${
                            dragVariantIdx === idx
                              ? 'bg-[#EAF2FC]/60 opacity-70'
                              : !v.isActive
                              ? 'bg-[#F6F9FD]/60'
                              : 'bg-white'
                          }`}
                        >
                          <td className="w-[40px] min-w-[40px] px-2 py-3 text-center">
                            <button
                              type="button"
                              onMouseEnter={() => setDragReadyVariantId(v.id)}
                              onMouseLeave={() => {
                                if (dragVariantIdx === null) setDragReadyVariantId(null);
                              }}
                              onMouseDown={() => setDragReadyVariantId(v.id)}
                              className="cursor-grab rounded p-1 text-[#5B6B82] hover:bg-[#EAF2FC] hover:text-[#1D5FAF] active:cursor-grabbing"
                              title="Drag to reorder variant"
                              aria-label="Drag to reorder variant"
                            >
                              <GripVertical className="h-4 w-4" />
                            </button>
                          </td>

                          <td className="w-[68px] min-w-[68px] px-2 py-3.5 text-center">
                            <input
                              type="radio"
                              name="default-product-variant"
                              checked={Boolean(v.isDefault)}
                              onChange={() => setDefaultVariant(v.id)}
                              aria-label={`Set ${v.name || `variant ${idx + 1}`} as default`}
                              className="h-4 w-4 cursor-pointer accent-[#1D5FAF]"
                            />
                          </td>

                          <td className="w-[68px] min-w-[68px] px-2 py-3 text-center">
                            <button
                              type="button"
                              role="switch"
                              aria-checked={Boolean(v.isActive)}
                              aria-label={`Toggle ${v.name || `variant ${idx + 1}`} active`}
                              onClick={() => updateVariant(idx, { isActive: !v.isActive })}
                              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors ${
                                v.isActive ? 'bg-[#1D5FAF]' : 'bg-[#DCE6F2]'
                              }`}
                            >
                              <span
                                className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                                  v.isActive ? 'translate-x-4.5' : 'translate-x-1'
                                }`}
                              />
                            </button>
                          </td>

                          <td className="w-[140px] min-w-[140px] px-3 py-2.5">
                            <select
                              value={v.optionType}
                              onChange={(e) =>
                                updateVariant(idx, {
                                  optionType: e.target.value as VariantOptionType,
                                })
                              }
                              className={selectClass}
                            >
                              <option value="Size">Size</option>
                              <option value="Pack">Pack</option>
                              <option value="Model">Model</option>
                            </select>
                          </td>

                          <td className="min-w-[200px] px-3 py-2.5">
                            <input
                              type="text"
                              value={v.name}
                              onBlur={() => markVariantFieldTouched(v.id, 'name')}
                              onChange={(e) => updateVariant(idx, { name: e.target.value })}
                              placeholder="e.g. 5L + Nebulizer"
                              className={`${inputClass} ${errs.name ? invalidInputClass : ''}`}
                            />
                            {errs.name && (
                              <p className="mt-1 text-[11px] text-red-600">{errs.name}</p>
                            )}
                          </td>

                          <td className="w-[140px] min-w-[140px] px-3 py-2.5">
                            <input
                              type="text"
                              value={v.sku}
                              onBlur={() => markVariantFieldTouched(v.id, 'sku')}
                              onChange={(e) =>
                                updateVariant(idx, { sku: e.target.value.toUpperCase() })
                              }
                              placeholder="BDM-SKU-V1"
                              className={`${inputClass} font-mono ${
                                errs.sku ? invalidInputClass : ''
                              }`}
                            />
                            {errs.sku && (
                              <p className="mt-1 text-[11px] leading-tight text-red-600">
                                {errs.sku}
                              </p>
                            )}
                          </td>

                          <td className="w-[110px] min-w-[110px] px-3 py-2.5">
                            <input
                              type="number"
                              min={0}
                              value={v.price}
                              onChange={(e) =>
                                updateVariant(idx, { price: Number(e.target.value) })
                              }
                              className={`${inputClass} tabular-nums ${
                                errs.price ? invalidInputClass : ''
                              }`}
                            />
                            {errs.price ? (
                              <p className="mt-1 text-[11px] leading-tight text-red-600">
                                {errs.price}
                              </p>
                            ) : (
                              <p className="mt-1 text-[11px] font-medium tabular-nums text-[#1D5FAF]">
                                {rowDiscount > 0 ? `${rowDiscount}% off` : '0% off'}
                              </p>
                            )}
                          </td>

                          <td className="w-[110px] min-w-[110px] px-3 py-2.5">
                            <input
                              type="number"
                              min={0}
                              value={v.mrp}
                              onChange={(e) =>
                                updateVariant(idx, { mrp: Number(e.target.value) })
                              }
                              className={`${inputClass} tabular-nums ${
                                errs.mrp ? invalidInputClass : ''
                              }`}
                            />
                            {errs.mrp && (
                              <p className="mt-1 text-[11px] leading-tight text-red-600">
                                {errs.mrp}
                              </p>
                            )}
                          </td>

                          <td className="w-[90px] min-w-[90px] px-3 py-2.5">
                            <input
                              type="number"
                              min={0}
                              value={v.stock}
                              onChange={(e) =>
                                updateVariant(idx, { stock: Number(e.target.value) })
                              }
                              className={`${inputClass} tabular-nums ${
                                errs.stock ? invalidInputClass : ''
                              }`}
                            />
                            {errs.stock && (
                              <p className="mt-1 text-[11px] leading-tight text-red-600">
                                {errs.stock}
                              </p>
                            )}
                          </td>

                          <td className="w-[90px] min-w-[90px] px-3 py-2.5">
                            <VariantImagePicker
                              imageUrl={v.imageUrl}
                              productImages={form.images}
                              variantLabel={v.name || `Variant ${idx + 1}`}
                              onChange={(url) => updateVariant(idx, { imageUrl: url })}
                            />
                          </td>

                          <td className="w-[60px] min-w-[60px] px-2 py-3 text-center">
                            <button
                              type="button"
                              onClick={() => removeVariant(v.id)}
                              title="Delete variant"
                              aria-label={`Delete ${v.name || `variant ${idx + 1}`}`}
                              className="rounded p-1.5 text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'images' && (
          <ImageUploader
            images={form.images}
            onChange={(imgs) => updateField('images', imgs)}
            maxImages={6}
          />
        )}

        {activeTab === 'specs' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-[#12263F]">Technical Specifications</h3>
                <p className="text-xs text-[#5B6B82]">
                  Clinical parameters, power ratings, dimensions, and warranty key–value pairs.
                </p>
              </div>
              <button
                type="button"
                onClick={addSpec}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#1D5FAF] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#174D8F]"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Specification
              </button>
            </div>

            {form.specifications.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[#DCE6F2] bg-[#F6F9FD] p-8 text-center text-xs text-[#5B6B82]">
                No technical specifications added yet.
              </div>
            ) : (
              <div className="space-y-2.5">
                {form.specifications.map((spec, idx) => (
                  <div
                    key={spec.id}
                    className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 rounded-lg border border-[#DCE6F2] bg-[#F6F9FD] p-2.5"
                  >
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => moveSpec(idx, idx - 1)}
                        className="rounded border border-[#DCE6F2] bg-white p-1.5 text-[#5B6B82] hover:bg-[#EAF2FC] disabled:opacity-35"
                        aria-label="Move up"
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === form.specifications.length - 1}
                        onClick={() => moveSpec(idx, idx + 1)}
                        className="rounded border border-[#DCE6F2] bg-white p-1.5 text-[#5B6B82] hover:bg-[#EAF2FC] disabled:opacity-35"
                        aria-label="Move down"
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <input
                      type="text"
                      value={spec.key}
                      onChange={(e) => {
                        const next = [...form.specifications];
                        next[idx] = { ...spec, key: e.target.value };
                        updateField('specifications', next);
                      }}
                      placeholder="Attribute (e.g. Flow Rate)"
                      className={`${inputClass} sm:w-64`}
                    />
                    <input
                      type="text"
                      value={spec.value}
                      onChange={(e) => {
                        const next = [...form.specifications];
                        next[idx] = { ...spec, value: e.target.value };
                        updateField('specifications', next);
                      }}
                      placeholder="Value (e.g. 0.5 – 5.0 L/min)"
                      className={inputClass}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        updateField(
                          'specifications',
                          form.specifications.filter((s) => s.id !== spec.id)
                        )
                      }
                      className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                      aria-label="Delete specification"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'shipping' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <FormField label="Dead Weight (kg)" required>
              <input
                type="number"
                step="0.1"
                min={0}
                value={form.weightKg}
                onChange={(e) => updateField('weightKg', Number(e.target.value))}
                className={`${inputClass} tabular-nums`}
              />
            </FormField>
            <FormField label="Length (cm)">
              <input
                type="number"
                min={0}
                value={form.lengthCm}
                onChange={(e) => updateField('lengthCm', Number(e.target.value))}
                className={`${inputClass} tabular-nums`}
              />
            </FormField>
            <FormField label="Width (cm)">
              <input
                type="number"
                min={0}
                value={form.widthCm}
                onChange={(e) => updateField('widthCm', Number(e.target.value))}
                className={`${inputClass} tabular-nums`}
              />
            </FormField>
            <FormField label="Height (cm)">
              <input
                type="number"
                min={0}
                value={form.heightCm}
                onChange={(e) => updateField('heightCm', Number(e.target.value))}
                className={`${inputClass} tabular-nums`}
              />
            </FormField>
            <div className="sm:col-span-2 lg:col-span-4 rounded-xl border border-[#DCE6F2] bg-[#F6F9FD] p-4 text-xs text-[#5B6B82]">
              Volumetric Weight (L×W×H / 5000):{' '}
              <strong className="text-[#12263F] tabular-nums">
                {((form.lengthCm * form.widthCm * form.heightCm) / 5000).toFixed(2)} kg
              </strong>
            </div>
          </div>
        )}

        {activeTab === 'toggles' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(
              [
                {
                  key: 'emiEnabled',
                  title: 'Enable EMI',
                  desc: 'Allow 3/6/12-month EMI options on product checkout',
                },
                {
                  key: 'codEnabled',
                  title: 'Enable COD',
                  desc: 'Allow Cash on Delivery for eligible pin codes',
                },
                {
                  key: 'featured',
                  title: 'Featured Product',
                  desc: 'Highlight in storefront featured equipment carousel',
                },
                {
                  key: 'bestSeller',
                  title: 'Best Seller',
                  desc: 'Show Best Seller merchandising marker on product cards',
                },
                {
                  key: 'dealOfTheDay',
                  title: 'Deal of the Day',
                  desc: 'Include in Deal of the Day promotional strip',
                },
                {
                  key: 'newArrival',
                  title: 'New Arrival',
                  desc: 'Show under newly added clinic & homecare catalog',
                },
              ] as const
            ).map((item) => (
              <label
                key={item.key}
                className="flex items-start justify-between gap-4 rounded-xl border border-[#DCE6F2] p-4 hover:bg-[#F6F9FD] cursor-pointer"
              >
                <div>
                  <p className="text-sm font-semibold text-[#12263F]">{item.title}</p>
                  <p className="mt-0.5 text-xs text-[#5B6B82]">{item.desc}</p>
                </div>
                <input
                  type="checkbox"
                  checked={Boolean(form[item.key])}
                  onChange={(e) => updateField(item.key, e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-[#DCE6F2] text-[#1D5FAF] focus:ring-[#1D5FAF]"
                />
              </label>
            ))}

            {/* Rental Master Switch */}
            <label className="md:col-span-2 flex items-start justify-between gap-4 rounded-xl border border-[#1D5FAF]/30 bg-[#EAF2FC]/60 p-4 cursor-pointer">
              <div>
                <p className="text-sm font-semibold text-[#12263F]">
                  Enable Rent &amp; Show &ldquo;Available on Rent&rdquo;
                </p>
                <p className="mt-0.5 text-xs text-[#5B6B82]">
                  Activates the Rental configuration tab for daily/weekly/monthly plans and the security deposit.
                </p>
              </div>
              <input
                type="checkbox"
                checked={form.rental.enabled || form.showAvailableOnRent}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setIsDirty(true);
                  setForm((prev) => ({
                    ...prev,
                    showAvailableOnRent: checked,
                    rental: { ...prev.rental, enabled: checked },
                  }));
                }}
                className="mt-1 h-4 w-4 rounded border-[#DCE6F2] text-[#1D5FAF] focus:ring-[#1D5FAF]"
              />
            </label>
          </div>
        )}

        {activeTab === 'rental' && (
          <div className="space-y-6">
            {/* Master Switch on Rental Tab */}
            <div className="flex items-center justify-between gap-4 rounded-xl border border-[#1D5FAF]/30 bg-[#EAF2FC]/60 p-4">
              <div>
                <p className="text-sm font-semibold text-[#12263F]">Enable Rental for this Product</p>
                <p className="mt-0.5 text-xs text-[#5B6B82]">
                  Allows customers to rent this equipment on daily, weekly, or monthly plans. If no plans are added, rental will stay off.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.rental.enabled || form.showAvailableOnRent}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setIsDirty(true);
                    setForm((prev) => ({
                      ...prev,
                      showAvailableOnRent: checked,
                      rental: { ...prev.rental, enabled: checked },
                    }));
                  }}
                  className="h-4 w-4 rounded border-[#DCE6F2] text-[#1D5FAF] focus:ring-[#1D5FAF]"
                />
              </label>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-[#12263F]">Rental Plans &amp; Terms</h3>
                <p className="text-xs text-[#5B6B82]">
                  Configure rental pricing tiers, refundable deposit, and clinical compliance checks.
                </p>
              </div>
              <button
                type="button"
                onClick={addRentalPlan}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#1D5FAF] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#174D8F] cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Rental Plan
              </button>
            </div>

            {form.rental.plans.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[#DCE6F2] bg-[#F6F9FD] p-6 text-center space-y-3">
                <p className="text-xs text-[#5B6B82]">
                  No rental plans configured yet. Click below to add a rental plan (e.g. Monthly rate), or turn off rental.
                </p>
                <div className="flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={addRentalPlan}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#1D5FAF] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#174D8F] cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add Rental Plan
                  </button>
                  {(form.rental.enabled || form.showAvailableOnRent) && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsDirty(true);
                        setForm((prev) => ({
                          ...prev,
                          showAvailableOnRent: false,
                          rental: { ...prev.rental, enabled: false },
                        }));
                      }}
                      className="rounded-lg border border-[#DCE6F2] bg-white px-3.5 py-2 text-xs font-semibold text-[#12263F] hover:bg-[#F6F9FD] cursor-pointer"
                    >
                      Turn Off Rental
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-2.5">
                {form.rental.plans.map((plan, idx) => (
                  <div
                    key={plan.id}
                    className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-end rounded-xl border border-[#DCE6F2] bg-[#F6F9FD] p-3"
                  >
                    <FormField label="Duration Cadence">
                      <select
                        value={plan.durationType}
                        onChange={(e) => {
                          const next = [...form.rental.plans];
                          next[idx] = {
                            ...plan,
                            durationType: e.target.value as RentalPlanDuration,
                          };
                          updateField('rental', { ...form.rental, plans: next });
                        }}
                        className={selectClass}
                      >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                      </select>
                    </FormField>
                    <FormField label="Price (₹)">
                      <input
                        type="number"
                        min={0}
                        value={plan.price}
                        onChange={(e) => {
                          const next = [...form.rental.plans];
                          next[idx] = { ...plan, price: Number(e.target.value) };
                          updateField('rental', { ...form.rental, plans: next });
                        }}
                        className={`${inputClass} tabular-nums`}
                      />
                    </FormField>
                    <FormField label="Min Duration">
                      <input
                        type="number"
                        min={1}
                        value={plan.minDuration}
                        onChange={(e) => {
                          const next = [...form.rental.plans];
                          next[idx] = { ...plan, minDuration: Number(e.target.value) };
                          updateField('rental', { ...form.rental, plans: next });
                        }}
                        className={`${inputClass} tabular-nums`}
                      />
                    </FormField>
                    <FormField label="Max Duration">
                      <input
                        type="number"
                        min={1}
                        value={plan.maxDuration}
                        onChange={(e) => {
                          const next = [...form.rental.plans];
                          next[idx] = { ...plan, maxDuration: Number(e.target.value) };
                          updateField('rental', { ...form.rental, plans: next });
                        }}
                        className={`${inputClass} tabular-nums`}
                      />
                    </FormField>
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() =>
                          updateField('rental', {
                            ...form.rental,
                            plans: form.rental.plans.filter((p) => p.id !== plan.id),
                          })
                        }
                        className="rounded-lg border border-[#DCE6F2] bg-white p-2 text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
              <FormField label="Refundable Security Deposit (₹)">
                <input
                  type="number"
                  min={0}
                  value={form.rental.securityDeposit}
                  onChange={(e) =>
                    updateField('rental', {
                      ...form.rental,
                      securityDeposit: Number(e.target.value),
                    })
                  }
                  className={`${inputClass} tabular-nums`}
                />
              </FormField>

              <FormField label="Delivery &amp; Pickup Charge (₹)">
                <input
                  type="number"
                  min={0}
                  value={form.rental.deliveryPickupCharge}
                  onChange={(e) =>
                    updateField('rental', {
                      ...form.rental,
                      deliveryPickupCharge: Number(e.target.value),
                    })
                  }
                  className={`${inputClass} tabular-nums`}
                />
              </FormField>

              <FormField label="Doctor Prescription Required">
                <select
                  value={form.rental.prescriptionRequired ? 'yes' : 'no'}
                  onChange={(e) =>
                    updateField('rental', {
                      ...form.rental,
                      prescriptionRequired: e.target.value === 'yes',
                    })
                  }
                  className={selectClass}
                >
                  <option value="yes">Yes (Clinical Rx upload required)</option>
                  <option value="no">No</option>
                </select>
              </FormField>
            </div>
          </div>
        )}

        {activeTab === 'seo' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <FormField
                label="Meta Title"
                hint={`${form.seoTitle.length}/60 characters recommended`}
              >
                <input
                  type="text"
                  value={form.seoTitle}
                  onChange={(e) => updateField('seoTitle', e.target.value)}
                  placeholder={`${form.name || 'Product Name'} | Buy Denmed`}
                  className={inputClass}
                />
              </FormField>

              <FormField
                label="Meta Description"
                hint={`${form.seoDescription.length}/160 characters recommended`}
              >
                <textarea
                  value={form.seoDescription}
                  onChange={(e) => updateField('seoDescription', e.target.value)}
                  placeholder="Enter compelling search snippet describing clinical specs, warranty, and EMI/rental availability."
                  className={textareaClass}
                />
              </FormField>
            </div>

            {/* Google Snippet Preview */}
            <div className="rounded-xl border border-[#DCE6F2] bg-[#F6F9FD] p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#5B6B82] mb-3">
                Google Search Snippet Preview
              </p>
              <div className="rounded-xl border border-[#DCE6F2] bg-white p-4 space-y-1">
                <p className="text-xs text-[#202124]">
                  https://buydenmed.in › products › {form.slug || 'product-slug'}
                </p>
                <p className="text-base font-medium text-[#1a0dab] leading-snug">
                  {form.seoTitle || `${form.name || 'Medical Equipment'} | Buy Denmed`}
                </p>
                <p className="text-xs text-[#4d5156] leading-relaxed">
                  {form.seoDescription ||
                    form.shortDescription ||
                    'Certified medical & dental equipment available with GST invoicing, EMI, and doorstep delivery across India.'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sticky Save / Cancel Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-[#DCE6F2] bg-white/95 backdrop-blur px-6 py-3.5 lg:pl-[276px]">
        <div className="mx-auto max-w-[1600px] flex items-center justify-between gap-4">
          <span className="text-xs text-[#5B6B82]">
            {isDirty ? 'You have unsaved product changes.' : 'All changes saved.'}
          </span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleCancel}
              className="rounded-lg border border-[#DCE6F2] bg-white px-4 py-2 text-xs font-semibold text-[#12263F] hover:bg-[#EAF2FC]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#1D5FAF] px-5 py-2 text-xs font-semibold text-white hover:bg-[#174D8F] disabled:opacity-60"
            >
              <Save className="h-3.5 w-3.5" />
              {saving ? 'Saving...' : isNew ? 'Create Product' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={leaveConfirmOpen}
        title="Discard unsaved changes?"
        description="You modified fields on this product without saving. Leaving now will discard your edits."
        confirmLabel="Discard Changes"
        variant="warning"
        onCancel={() => setLeaveConfirmOpen(false)}
        onConfirm={() => {
          setIsDirty(false);
          setLeaveConfirmOpen(false);
          navigate('/admin/products');
        }}
      />

      {previewOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B2545]/50 p-4"
          onClick={() => setPreviewOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-xl border border-[#DCE6F2] bg-white shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#DCE6F2] px-5 py-3.5 bg-[#F6F9FD]">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-[#1D5FAF]">Storefront Preview</p>
                {form.status === 'active' && !isDirty ? (
                  <a
                    href={storefrontProductUrl(form.slug)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] font-mono text-[#1D5FAF] hover:underline break-all"
                  >
                    Open {storefrontProductUrl(form.slug)}
                  </a>
                ) : (
                  <p className="text-[11px] text-[#B85A0E]">
                    {isDirty
                      ? 'Save your changes to see them on the storefront'
                      : 'Visible on the storefront only when the status is Active'}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setPreviewOpen(false)}
                className="rounded-lg p-1 text-[#5B6B82] hover:bg-[#EAF2FC]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-5 flex gap-4">
              <div className="h-28 w-28 shrink-0 overflow-hidden rounded-xl border border-[#DCE6F2]">
                <SafeImage src={form.images[0]?.url} alt={form.name} />
              </div>
              <div className="space-y-1.5 min-w-0">
                <h4 className="text-base font-bold text-[#12263F]">{form.name}</h4>
                <p className="text-xs text-[#5B6B82]">{form.shortDescription}</p>
                <p className="text-base font-bold text-[#1D5FAF] tabular-nums">
                  {formatINR(form.price)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
