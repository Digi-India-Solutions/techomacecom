import type {
  BulkImportHistoryItem,
  BulkImportPreviewRow,
  BulkImportResult,
  BulkImportRowError,
} from '@/types/admin';
import { downloadCsv, mockDelay, slugify } from './client';
import { INITIAL_BULK_IMPORT_HISTORY, INITIAL_BRANDS, PRODUCT_IMAGES } from './mockData';
import { flattenCategories, listCategories } from './categories';
import { getProductsStore, setProductsStore } from './legacyProductStore';

let importHistoryStore: BulkImportHistoryItem[] = structuredClone(INITIAL_BULK_IMPORT_HISTORY);

export async function getImportHistory(): Promise<BulkImportHistoryItem[]> {
  await mockDelay(120);
  return structuredClone(importHistoryStore);
}

export function downloadBulkTemplate(type: 'import_products' | 'update_prices_stock'): void {
  if (type === 'import_products') {
    downloadCsv(
      'buydenmed-products-import-template.csv',
      ['sku', 'name', 'category_path', 'brand_name', 'price', 'mrp', 'stock', 'gst_percent', 'hsn_code'],
      [
        [
          'BDM-NEB-PRO-01',
          'Yuwell Compressor Nebulizer Pro',
          'Respiratory Care > Oxygen Therapy > Oxygen Concentrators',
          'Yuwell Medical',
          '3200',
          '4200',
          '25',
          '12',
          '90192010',
        ],
        [
          'BDM-ECG-12CH',
          'Contec 12-Channel Digital ECG Machine',
          'Patient Monitoring > Vital Signs Monitors > Multiparameter Monitors',
          'Contec Medical',
          '52000',
          '64000',
          '6',
          '12',
          '90181100',
        ],
      ]
    );
  } else {
    const products = getProductsStore();
    downloadCsv(
      'buydenmed-price-stock-update-template.csv',
      ['sku', 'price', 'mrp', 'stock'],
      products.slice(0, 5).map((p) => [p.sku, p.price, p.mrp, p.stock])
    );
  }
}

export function exportAllProductsCsv(): void {
  const products = getProductsStore();
  downloadCsv(
    `buydenmed-products-export-${new Date().toISOString().slice(0, 10)}.csv`,
    [
      'SKU',
      'Product Name',
      'Brand',
      'Category',
      'Price (INR)',
      'MRP (INR)',
      'GST %',
      'HSN',
      'Available Stock',
      'Status',
      'EMI',
      'Rent',
      'COD',
    ],
    products.map((p) => [
      p.sku,
      p.name,
      p.brandName,
      p.categoryPath,
      p.price,
      p.mrp,
      p.gstPercent,
      p.hsnCode,
      p.stock,
      p.status,
      p.emiEnabled ? 'Yes' : 'No',
      p.showAvailableOnRent ? 'Yes' : 'No',
      p.codEnabled ? 'Yes' : 'No',
    ])
  );
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

export async function parseAndValidateCsv(
  csvText: string,
  mode: 'import_products' | 'update_prices_stock'
): Promise<BulkImportPreviewRow[]> {
  await mockDelay(200);
  const lines = csvText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    throw new Error('CSV file must include a header row and at least one data row.');
  }

  const headers = parseCsvLine(lines[0]).map((h) => h.toLowerCase());
  const categories = await listCategories();
  const flatCats = flattenCategories(categories);
  const existingProducts = getProductsStore();
  const seenSkus = new Set<string>();

  const rows: BulkImportPreviewRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cells = parseCsvLine(lines[i]);
    const get = (key: string): string => {
      const idx = headers.indexOf(key);
      return idx >= 0 ? cells[idx] || '' : '';
    };

    const sku = get('sku');
    const name = get('name') || existingProducts.find((p) => p.sku === sku)?.name || '';
    const categoryPath = get('category_path') || get('category') || '';
    const brandName = get('brand_name') || get('brand') || '';
    const price = Number(get('price'));
    const mrp = Number(get('mrp') || get('price'));
    const stock = Number(get('stock'));
    const gstPercent = Number(get('gst_percent') || 12);

    const errors: BulkImportRowError[] = [];

    if (!sku) {
      errors.push({ field: 'sku', message: 'Missing SKU' });
    } else if (seenSkus.has(sku.toUpperCase())) {
      errors.push({ field: 'sku', message: 'Duplicate SKU in file' });
    } else if (mode === 'import_products' && existingProducts.some((p) => p.sku.toUpperCase() === sku.toUpperCase())) {
      errors.push({ field: 'sku', message: 'Duplicate SKU already exists in catalog' });
    } else if (mode === 'update_prices_stock' && !existingProducts.some((p) => p.sku.toUpperCase() === sku.toUpperCase())) {
      errors.push({ field: 'sku', message: 'SKU not found in catalog' });
    }

    if (sku) seenSkus.add(sku.toUpperCase());

    if (mode === 'import_products') {
      if (!name) errors.push({ field: 'name', message: 'Product name required' });
      const matchedCat = flatCats.find(
        (c) =>
          c.path.toLowerCase() === categoryPath.toLowerCase() ||
          c.node.name.toLowerCase() === categoryPath.toLowerCase()
      );
      if (!categoryPath || !matchedCat) {
        errors.push({ field: 'categoryPath', message: 'Invalid category path' });
      }
    }

    if (Number.isNaN(price) || price <= 0) {
      errors.push({ field: 'price', message: 'Price must be > 0' });
    }
    if (!Number.isNaN(mrp) && !Number.isNaN(price) && mrp > 0 && mrp < price) {
      errors.push({ field: 'mrp', message: 'MRP cannot be less than selling price' });
    }
    if (Number.isNaN(stock) || stock < 0) {
      errors.push({ field: 'stock', message: 'Stock must be ≥ 0' });
    }

    rows.push({
      rowNumber: i,
      sku,
      name,
      categoryPath,
      brandName: brandName || 'Yuwell Medical',
      price: Number.isNaN(price) ? 0 : price,
      mrp: Number.isNaN(mrp) ? 0 : mrp,
      stock: Number.isNaN(stock) ? 0 : stock,
      gstPercent: [0, 5, 12, 18, 28].includes(gstPercent) ? gstPercent : 12,
      valid: errors.length === 0,
      errors,
    });
  }

  return rows;
}

export async function executeBulkImport(params: {
  fileName: string;
  mode: 'import_products' | 'update_prices_stock';
  rows: BulkImportPreviewRow[];
  importValidOnly: boolean;
  uploadedBy: string;
}): Promise<BulkImportResult> {
  await mockDelay(350);

  const targetRows = params.importValidOnly
    ? params.rows.filter((r) => r.valid)
    : params.rows.every((r) => r.valid)
      ? params.rows
      : [];

  if (!params.importValidOnly && params.rows.some((r) => !r.valid)) {
    throw new Error('Fix validation errors or enable "Import valid rows only" before importing.');
  }

  const categories = await listCategories();
  const flatCats = flattenCategories(categories);
  const currentProducts = getProductsStore();
  let createdCount = 0;
  let updatedCount = 0;

  if (params.mode === 'import_products') {
    const additions = targetRows.map((row) => {
      const cat =
        flatCats.find(
          (c) =>
            c.path.toLowerCase() === row.categoryPath.toLowerCase() ||
            c.node.name.toLowerCase() === row.categoryPath.toLowerCase()
        ) || flatCats[0];
      const brand =
        INITIAL_BRANDS.find((b) => b.name.toLowerCase() === row.brandName.toLowerCase()) ||
        INITIAL_BRANDS[0];

      createdCount++;
      const now = new Date().toISOString();
      return {
        id: `prod-imp-${Date.now()}-${row.rowNumber}`,
        name: row.name,
        slug: slugify(row.name),
        sku: row.sku,
        brandId: brand.id,
        brandName: brand.name,
        categoryId: cat.node.id,
        categoryPath: cat.path,
        shortDescription: `${row.name} imported via bulk catalog upload.`,
        fullDescription: `<p>${row.name} — certified medical equipment available on Buy Denmed.</p>`,
        status: 'active' as const,
        price: row.price,
        mrp: row.mrp || row.price,
        gstPercent: (row.gstPercent as 0 | 5 | 12 | 18 | 28) || 12,
        hsnCode: '90189099',
        buyTwoPlusPrice: null,
        stock: row.stock,
        reservedStock: 0,
        lowStockThreshold: 5,
        emiEnabled: row.price >= 15000,
        codEnabled: row.price <= 50000,
        featured: false,
        bestSeller: false,
        dealOfTheDay: false,
        newArrival: true,
        showAvailableOnRent: false,
        variants: [],
        images: [
          {
            id: `img-${Date.now()}-${row.rowNumber}`,
            url: PRODUCT_IMAGES.patientMonitor,
            type: 'main' as const,
            altText: row.name,
            sortOrder: 0,
          },
        ],
        specifications: [],
        weightKg: 5,
        lengthCm: 35,
        widthCm: 30,
        heightCm: 25,
        rental: {
          enabled: false,
          plans: [],
          securityDeposit: 0,
          deliveryPickupCharge: 0,
          kycRequired: false,
          prescriptionRequired: false,
        },
        seoTitle: `${row.name} | Buy Denmed`,
        seoDescription: `Shop ${row.name} on Buy Denmed.`,
        createdAt: now,
        updatedAt: now,
      };
    });
    setProductsStore([...additions, ...currentProducts]);
  } else {
    const updatedList = currentProducts.map((prod) => {
      const match = targetRows.find((r) => r.sku.toUpperCase() === prod.sku.toUpperCase());
      if (!match) return prod;
      updatedCount++;
      return {
        ...prod,
        price: match.price,
        mrp: match.mrp || prod.mrp,
        stock: match.stock,
        updatedAt: new Date().toISOString(),
      };
    });
    setProductsStore(updatedList);
  }

  const failedRows = params.rows.filter((r) => !r.valid);
  const result: BulkImportResult = {
    jobId: `job-${Date.now()}`,
    fileName: params.fileName,
    totalRows: params.rows.length,
    createdCount,
    updatedCount,
    failedCount: failedRows.length,
    failedRows,
    completedAt: new Date().toISOString(),
  };

  importHistoryStore = [
    {
      id: result.jobId,
      fileName: params.fileName,
      type: params.mode,
      uploadedBy: params.uploadedBy,
      totalRows: params.rows.length,
      createdCount,
      updatedCount,
      failedCount: failedRows.length,
      status: failedRows.length === 0 ? 'completed' : targetRows.length > 0 ? 'partial' : 'failed',
      createdAt: result.completedAt,
    },
    ...importHistoryStore,
  ];

  return result;
}

export function downloadErrorReport(failedRows: BulkImportPreviewRow[]): void {
  downloadCsv(
    `buydenmed-import-errors-${new Date().toISOString().slice(0, 10)}.csv`,
    ['Row', 'SKU', 'Name', 'Category', 'Price', 'MRP', 'Stock', 'Errors'],
    failedRows.map((r) => [
      r.rowNumber,
      r.sku,
      r.name,
      r.categoryPath,
      r.price,
      r.mrp,
      r.stock,
      r.errors.map((e) => `${e.field}: ${e.message}`).join(' | '),
    ])
  );
}
