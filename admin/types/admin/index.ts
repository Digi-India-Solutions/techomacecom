export * from './part2';

export type AdminRole = 'super_admin' | 'manager' | 'staff';

export type AdminPermission =
  | 'dashboard.view'
  | 'products.view'
  | 'products.create'
  | 'products.edit'
  | 'products.delete'
  | 'categories.manage'
  | 'brands.manage'
  | 'bulk_import.run'
  | 'inventory.view'
  | 'inventory.adjust'
  | 'rental_units.view'
  | 'rental_units.manage'
  | 'orders.view'
  | 'rentals.view'
  | 'enquiries.view'
  | 'reviews.view'
  | 'customers.view'
  | 'marketing.manage'
  | 'content.manage'
  | 'settings.manage'
  | 'staff.manage'
  | 'activity_log.view';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  /** Role slug from the API: super_admin, manager, staff or a custom role key */
  role: AdminRole | string;
  roleId: string;
  roleLabel: string;
  avatarInitials: string;
  /** Profile photo (256 × 256 WebP) or null */
  avatarUrl?: string | null;
  phone: string;
  department: string;
  status?: 'active' | 'inactive';
  isSuperAdmin?: boolean;
  lastLoginAt: string;
  passwordChangedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

/** A browser/app where this staff member is signed in (auth_sessions row). */
export interface DeviceSession {
  id: string;
  browser: string;
  os: string;
  type: 'desktop' | 'mobile' | 'tablet';
  label: string;
  ipAddress: string | null;
  lastActiveAt: string;
  expiresAt: string;
  rememberMe: boolean;
  /** The browser making this request */
  current: boolean;
}

/** One row of the signed-in staff member's own audit trail. */
export interface MyActivityEntry {
  id: string;
  timestamp: string;
  module: string;
  action: string;
  recordLabel: string;
  summary: string;
  ipAddress: string | null;
}

/** Signed-in staff member + the permission codes of their role (module.action). Tokens live in httpOnly cookies. */
export interface AuthSession {
  user: AdminUser;
  permissions: string[];
}

export type DateRangePreset = 'today' | '7d' | '30d' | 'custom';

export interface DateRangeValue {
  preset: DateRangePreset;
  from: string;
  to: string;
}

export interface DashboardKpi {
  key: string;
  label: string;
  value: number;
  formattedValue: string;
  deltaPercent: number;
  deltaLabel: string;
  href: string;
  isAlert?: boolean;
}

export interface SalesTrendPoint {
  date: string;
  label: string;
  sales: number;
  rentalRevenue: number;
  orders: number;
}

export interface OrderStatusSlice {
  status: string;
  label: string;
  count: number;
  color: string;
}

export interface TopSellingProduct {
  id: string;
  name: string;
  sku: string;
  unitsSold: number;
  revenue: number;
  imageUrl: string;
  brandName?: string;
  categoryName?: string;
}

export interface ActionNeededItem {
  id: string;
  key: string;
  title: string;
  description: string;
  count: number;
  severity: 'urgent' | 'warning' | 'info';
  href: string;
}

export interface RecentOrderSummary {
  id: string;
  orderNumber: string;
  customerName: string;
  customerCity: string;
  itemsCount: number;
  total: number;
  paymentMethod: 'UPI' | 'Card' | 'COD' | 'EMI' | 'NetBanking';
  status: 'pending' | 'confirmed' | 'to_ship' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: string;
}

export interface RecentEnquirySummary {
  id: string;
  enquiryNumber: string;
  customerName: string;
  organization: string;
  phone: string;
  subject: string;
  productInterest: string;
  type: 'bulk_quote' | 'rental' | 'product_demo' | 'service';
  status: 'new' | 'in_progress' | 'quoted' | 'closed';
  createdAt: string;
}

export interface DashboardOverview {
  kpis: DashboardKpi[];
  salesTrend: SalesTrendPoint[];
  ordersByStatus: OrderStatusSlice[];
  topProducts: TopSellingProduct[];
  actionNeeded: ActionNeededItem[];
  recentOrders: RecentOrderSummary[];
  recentEnquiries: RecentEnquirySummary[];
}

export type ProductStatus = 'active' | 'draft' | 'out_of_stock';
export type GstRate = 0 | 5 | 12 | 18 | 28;
export type ProductImageType =
  | 'main'
  | 'angle'
  | 'detail'
  | 'in_use'
  | 'box_contents'
  | 'infographic';

export interface ProductImage {
  id: string;
  url: string;
  /** Server path from the upload API (/uploads/…webp) — what the product API will store */
  path?: string;
  /** Tiny blurred preview from the upload API */
  placeholder?: string;
  /** true while the file is being converted / uploaded */
  uploading?: boolean;
  type: ProductImageType;
  altText: string;
  sortOrder: number;
}

export type VariantOptionType = 'Size' | 'Pack' | 'Model';

export interface ProductVariant {
  id: string;
  optionType: VariantOptionType;
  name: string;
  sku: string;
  price: number;
  mrp: number;
  stock: number;
  imageUrl: string;
  brandName?: string;
  categoryName?: string;
  isDefault: boolean;
  isActive: boolean;
  sortOrder: number;
}

export interface ProductSpecification {
  id: string;
  key: string;
  value: string;
  sortOrder: number;
}

export type RentalPlanDuration = 'daily' | 'weekly' | 'monthly';

export interface ProductRentalPlan {
  id: string;
  durationType: RentalPlanDuration;
  price: number;
  minDuration: number;
  maxDuration: number;
}

export interface ProductRentalConfig {
  enabled: boolean;
  plans: ProductRentalPlan[];
  securityDeposit: number;
  deliveryPickupCharge: number;
  kycRequired: boolean;
  prescriptionRequired: boolean;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string;
  brandId: string;
  brandName: string;
  categoryId: string;
  categoryPath: string;
  shortDescription: string;
  fullDescription: string;
  status: ProductStatus;
  price: number;
  mrp: number;
  gstPercent: GstRate;
  hsnCode: string;
  buyTwoPlusPrice?: number | null;
  stock: number;
  reservedStock: number;
  lowStockThreshold: number;
  emiEnabled: boolean;
  codEnabled: boolean;
  featured: boolean;
  bestSeller: boolean;
  dealOfTheDay: boolean;
  newArrival: boolean;
  showAvailableOnRent: boolean;
  variants: ProductVariant[];
  images: ProductImage[];
  specifications: ProductSpecification[];
  weightKg: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  rental: ProductRentalConfig;
  seoTitle: string;
  seoDescription: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductFilters {
  search?: string;
  categoryId?: string;
  brandId?: string;
  status?: ProductStatus | 'all';
  stockLevel?: 'all' | 'in_stock' | 'low_stock' | 'out_of_stock';
  emiEnabled?: boolean;
  rentEnabled?: boolean;
  codEnabled?: boolean;
}

export type ProductFormPayload = Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'brandName' | 'categoryPath'>;

export type CategoryStatus = 'active' | 'inactive';

export interface CategoryNode {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  level: 1 | 2 | 3;
  sortOrder: number;
  iconUrl: string;
  desktopBannerUrl: string;
  mobileBannerUrl: string;
  description: string;
  seoTitle: string;
  seoDescription: string;
  showInMenu: boolean;
  showOnHomepage: boolean;
  status: CategoryStatus;
  productCount: number;
  children?: CategoryNode[];
}

export type CategoryPayload = Omit<CategoryNode, 'id' | 'productCount' | 'children' | 'level' | 'sortOrder'> & {
  id?: string;
};

export type BrandStatus = 'active' | 'inactive';

export interface Brand {
  id: string;
  name: string;
  slug: string;
  logoUrl: string;
  desktopBannerUrl: string;
  mobileBannerUrl: string;
  description: string;
  featuredOnHomepage: boolean;
  status: BrandStatus;
  seoTitle: string;
  seoDescription: string;
  productCount: number;
  updatedAt: string;
}

export type BrandPayload = Omit<Brand, 'id' | 'productCount' | 'updatedAt'> & {
  id?: string;
};

export type BulkImportTab = 'import_products' | 'update_prices_stock' | 'export_products';

export interface BulkImportRowError {
  field: string;
  message: string;
}

export interface BulkImportPreviewRow {
  rowNumber: number;
  sku: string;
  name: string;
  categoryPath: string;
  brandName: string;
  price: number;
  mrp: number;
  stock: number;
  gstPercent: number;
  valid: boolean;
  errors: BulkImportRowError[];
}

export interface BulkImportResult {
  jobId: string;
  fileName: string;
  totalRows: number;
  createdCount: number;
  updatedCount: number;
  failedCount: number;
  failedRows: BulkImportPreviewRow[];
  completedAt: string;
}

export interface BulkImportHistoryItem {
  id: string;
  fileName: string;
  type: 'import_products' | 'update_prices_stock';
  uploadedBy: string;
  totalRows: number;
  createdCount: number;
  updatedCount: number;
  failedCount: number;
  status: 'completed' | 'partial' | 'failed';
  createdAt: string;
}

export type StockAdjustmentReason =
  | 'purchase'
  | 'sale'
  | 'return'
  | 'damage'
  | 'correction'
  | 'audit'
  | 'reserve'
  | 'release';
export type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock';

export interface StockItem {
  id: string;
  productId: string;
  productName: string;
  variantId?: string;
  variantName?: string;
  sku: string;
  imageUrl: string;
  brandName?: string;
  categoryName?: string;
  warehouseId: string;
  warehouseName: string;
  availableStock: number;
  reservedStock: number;
  lowStockThreshold: number;
  status: StockStatus;
  updatedAt: string;
}

export interface StockMovement {
  id: string;
  stockItemId: string;
  sku: string;
  delta: number;
  previousStock: number;
  newStock: number;
  reason: StockAdjustmentReason;
  note: string;
  performedBy: string;
  createdAt: string;
}

export type RentalUnitCondition = 'new' | 'good' | 'needs_service' | 'damaged' | 'retired';
export type RentalUnitStatus =
  | 'available'
  | 'reserved'
  | 'with_customer'
  | 'in_transit'
  | 'under_service'
  | 'retired';

export interface RentalUnitHistoryEvent {
  id: string;
  rentalId: string;
  customerName: string;
  customerPhone: string;
  startDate: string;
  endDate: string;
  returnedDate?: string;
  status: 'active' | 'completed' | 'overdue';
  notes: string;
}

export interface RentalUnitServiceLog {
  id: string;
  date: string;
  issue: string;
  actionTaken: string;
  technician: string;
  cost: number;
  nextDueDate: string;
}

export interface RentalUnitSanitisationLog {
  id: string;
  date: string;
  method: string;
  chemicalUsed: string;
  verifiedBy: string;
  passed: boolean;
}

export interface RentalUnit {
  id: string;
  unitCode: string;
  productId: string;
  productName: string;
  productImage: string;
  serialNumber: string;
  purchaseDate: string;
  condition: RentalUnitCondition;
  status: RentalUnitStatus;
  currentCustomerName?: string;
  currentRentalId?: string;
  expectedReturnDate?: string;
  lastServiceDate: string;
  nextServiceDue: string;
  notes: string;
  rentalHistory: RentalUnitHistoryEvent[];
  serviceLogs: RentalUnitServiceLog[];
  sanitisationLogs: RentalUnitSanitisationLog[];
}

export interface GlobalSearchResult {
  id: string;
  type: 'product' | 'order' | 'customer';
  title: string;
  subtitle: string;
  meta: string;
  href: string;
}

export interface AdminNotification {
  id: string;
  title: string;
  message: string;
  severity: 'urgent' | 'warning' | 'info';
  href: string;
  read: boolean;
  createdAt: string;
}
