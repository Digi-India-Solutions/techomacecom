export interface Variant {
  id: string;
  name: string; // e.g. "Pack of 10", "5 Litres", "Standard Adult Cuff", "Torque Head"
  sku: string;
  price: number;
  mrp: number;
  inStock: boolean;
  stockCount: number;
  optionType?: 'Size' | 'Pack' | 'Model';
  image?: string;
  isDefault?: boolean;
  /** "Buy 2+" price per unit */
  bulkPrice?: number;
  bulkMinQty?: number;
}

/** Breadcrumb entry: Level 1 → Level 3 category of a product */
export interface CategoryCrumb {
  id: string;
  name: string;
  slug: string;
}

export interface EmiPlan {
  tenureMonths: number;
  monthlyAmount: number;
  bankName: string;
  interestRate: number;
  isNoCost?: boolean;
}

export type RentalPlanType = 'daily' | 'weekly' | 'monthly';

export interface RentalPlan {
  type: RentalPlanType;
  price: number;
  minDuration: number;
  maxDuration: number;
  tenureMonths?: number;
  pricePerMonth?: number;
  securityDeposit?: number;
  installationFee?: number;
  freeMaintenance?: boolean;
}

export type ProductImageType = 'main' | 'angle' | 'detail' | 'in-use' | 'box-contents' | 'infographic';

export interface ProductImage {
  url: string;
  alt: string;
  type: ProductImageType;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  brandId: string;
  brandName: string;
  categoryId: string;
  categoryName: string;
  subCategory: string;
  subCategorySlug?: string;
  sku: string;
  price: number;
  mrp: number;
  discountPercentage: number;
  rating: number;
  reviewsCount: number;
  inStock: boolean;
  stockCount: number;
  isDealOfDay?: boolean;
  dealExpiresAt?: string;
  isBestSeller?: boolean;
  isNewArrival?: boolean;
  emiEnabled: boolean;
  emiStartingFrom?: number;
  rentEnabled: boolean;
  rentPricePerMonth?: number;
  rentalPlans?: RentalPlan[];
  securityDeposit?: number; // refundable deposit
  deliveryPickupCharge?: number;
  images: ProductImage[];
  thumbnail: string;
  image?: string; // fallback for cards if images is empty
  shortDescription: string;
  description: string;
  specifications: Record<string, string>;
  features: string[];
  warranty: string;
  variants?: Variant[];
  emiPlans?: EmiPlan[];
  certifications?: string[];
  gstRate?: number; // e.g. 12 or 18
  // ---- Live API extras (backend/src/modules/catalog/products/dto.js) ----
  brandSlug?: string;
  categorySlug?: string;
  /** The exact (possibly Level 3) category the product is filed under */
  leafCategoryId?: string;
  categoryPath?: CategoryCrumb[];
  soldCount?: number;
  /** Normal price while a Deal of the Day overrides `price` */
  regularPrice?: number;
  isFeatured?: boolean;
  badgeText?: string;
  codEnabled?: boolean;
  saleEnabled?: boolean;
  rentalPrescriptionRequired?: boolean;
  defaultVariantId?: string;
  bulkPrice?: number;
  bulkMinQty?: number;
  hsnCode?: string;
  weightKg?: number;
  seoTitle?: string;
  seoDescription?: string;
}

export type RentalStatus =
  | 'pending_approval'
  | 'approved'
  | 'dispatched'
  | 'active'
  | 'extension_requested'
  | 'return_scheduled'
  | 'returned'
  | 'deposit_refunded'
  | 'cancelled';

export interface RentalPayment {
  id: string;
  amount: number;
  date: string;
  method: string;
  type: 'initial' | 'extension' | 'refund';
  status: 'paid' | 'refunded';
  transactionId?: string;
}

export interface RentalCharges {
  deliveryPickup: number;
  gst?: number;
}

export interface Rental {
  id: string;
  bookingNumber: string;
  product: Product;
  plan: RentalPlan;
  duration: number; // number of days, weeks, or months
  startDate: string; // ISO date string (YYYY-MM-DD)
  endDate: string; // ISO date string (YYYY-MM-DD)
  deposit: number; // 100% refundable security deposit
  rentAmount: number; // plan.price * duration
  charges: RentalCharges;
  status: RentalStatus;
  address: Address;
  payments: RentalPayment[];
  createdAt: string;
  returnPickupDate?: string;
  extensionRequestedDuration?: number;
  extensionPrice?: number;
}

export interface SubCategory {
  id: string;
  name: string;
  slug: string;
  itemCount?: number;
  /** Level 3 names (mega menu) */
  items?: string[];
  /** Level 3 categories with slugs (link to /category/<slug>) */
  children?: { id: string; name: string; slug: string; itemCount?: number }[];
  icon?: string;
  image?: string;
  showInMenu?: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  image: string;
  description: string;
  itemCount: number;
  subCategories: SubCategory[];
  // ---- Live API extras ----
  level?: number;
  parentId?: string | null;
  bannerDesktop?: string;
  bannerMobile?: string;
  seoTitle?: string;
  seoDescription?: string;
  showInMenu?: boolean;
  showOnHome?: boolean;
  /** Present on GET /categories/:slug — Level 1 → this category */
  breadcrumbs?: CategoryCrumb[];
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  logo: string;
  logoUrl?: string; // Real logo uploadable from admin
  bannerImage: string;
  originCountry?: string;
  description?: string;
  authorizedDistributor?: boolean;
  productCount: number;
  featuredCategories?: string[];
  bannerMobile?: string;
  isFeatured?: boolean;
  seoTitle?: string;
  seoDescription?: string;
}

export interface CartItem {
  productId: string;
  product: Product;
  variantId?: string;
  variantName?: string;
  quantity: number;
  price: number;
  mrp: number;
  isRental?: boolean;
  rentalTenureMonths?: number;
}

export interface Address {
  id: string;
  type: 'Clinic' | 'Hospital' | 'Home' | 'Office';
  name: string;
  clinicHospitalName?: string;
  phone: string;
  alternatePhone?: string;
  addressLine1: string;
  addressLine2?: string;
  landmark?: string;
  pincode: string;
  city: string;
  state: string;
  isDefault: boolean;
}

export interface GstDetails {
  gstin: string;
  legalBusinessName: string;
  panNumber?: string;
  isVerified?: boolean;
}

/** A saved GSTIN (customers can keep several, e.g. one per branch). */
export interface GstProfile {
  id: string;
  gstin: string;
  legalBusinessName: string;
  billingAddress?: string;
  stateCode: string;
  stateName?: string;
  pan: string;
  isDefault: boolean;
}

/** A browser/app where the customer is signed in. */
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
  current: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'doctor' | 'clinic_admin' | 'procurement' | 'individual';
  degree?: string;
  registrationNumber?: string; // Dental/Medical Council reg number
  addresses: Address[];
  /** The default GST profile (used at checkout) */
  gstDetails?: GstDetails;
  /** Every saved GST profile, default first */
  gstProfiles?: GstProfile[];
  // From the API (backend/src/modules/auth)
  avatarUrl?: string;
  mobileVerified?: boolean;
  emailVerified?: boolean;
  hasGoogle?: boolean;
  /** Signed up with email + password — the email is the sign-in id */
  hasPassword?: boolean;
  createdAt?: string;
  lastLoginAt?: string;
  /** false until the customer has both a name and a verified mobile */
  profileComplete?: boolean;
}

export interface OrderItem {
  /** order_items.id — used to pick items for a return */
  orderItemId?: string;
  productId: string;
  productName: string;
  productSlug?: string;
  brandName: string;
  image: string;
  sku: string;
  variantName?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  /** Units that can still be returned (0 when outside the window, non-returnable, or already returned) */
  returnableQty?: number;
  returnedQty?: number;
  nonReturnable?: boolean;
  isRental?: boolean;
  rentalTenureMonths?: number;
}

export type OrderStatus =
  | 'Placed'
  | 'Confirmed'
  | 'Packed'
  | 'Dispatched'
  | 'Delivered'
  | 'Cancelled'
  | 'Returned'
  | 'Return Requested'
  | 'Return Approved'
  | 'Pickup Scheduled'
  | 'Return Received'
  | 'Refunded'
  | 'Return Rejected';

export interface OrderTimelineEvent {
  status: OrderStatus;
  date: string;
  title: string;
  description: string;
  completed: boolean;
}

export type RefundStatus = 'processing' | 'processed' | 'failed';

export interface OrderRefund {
  id: string;
  amount: number;
  reason: 'cancel' | 'return' | 'goodwill' | 'deposit_refund';
  method: 'gateway' | 'bank_transfer' | 'upi';
  methodLabel: string;
  status: RefundStatus;
  reference: string | null;
  note: string | null;
  returnId: string | null;
  createdAt: string;
  processedAt: string | null;
}

export type ReturnRequestStatus =
  | 'requested'
  | 'approved'
  | 'pickup_scheduled'
  | 'received'
  | 'replacement_shipped'
  | 'refunded'
  | 'completed'
  | 'rejected'
  | 'cancelled';

export interface ReturnShipmentInfo {
  courier: string;
  awb: string;
  trackingUrl: string;
  pickupDate: string | null;
  status: string;
  createdAt: string | null;
  deliveredAt: string | null;
}

/** A return / replacement request (RMA) as the customer sees it */
export interface OrderReturnRequest {
  id: string;
  returnNumber: string;
  type: 'refund' | 'replacement';
  typeLabel: string;
  status: ReturnRequestStatus;
  statusLabel: string;
  reason: string;
  customerNote: string;
  photos: string[];
  items: {
    id: string;
    orderItemId: string;
    productName: string;
    variantName: string;
    sku: string;
    image: string;
    quantity: number;
    orderedQuantity: number;
    refundAmount: number;
    condition: 'resellable' | 'damaged' | null;
  }[];
  requestedAmount: number;
  rejectionReason: string | null;
  pickup: ReturnShipmentInfo | null;
  replacementShipment: ReturnShipmentInfo | null;
  steps: { key: string; label: string; done: boolean; current: boolean; at: string | null }[];
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  orderId: string;
  orderNumber: string;
  refundAccount: { mode: 'bank' | 'upi'; label: string } | null;
  refunds: OrderRefund[];
  refundedAmount: number;
  canCancel: boolean;
  timeline: { status: string; label: string; note: string; at: string }[];
}

export interface OrderReturnPolicy {
  windowDays: number;
  windowEndsAt: string | null;
  windowOpen: boolean;
  types: ('refund' | 'replacement')[];
  /** Why the order cannot be returned (only once delivered) */
  blockReason: string | null;
}

export interface Order {
  id: string;
  orderNumber: string;
  date: string;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  shipping: number;
  gstAmount: number;
  totalAmount: number;
  paymentMethod: 'Online Razorpay (Cards/UPI/EMI)' | 'Cash on Delivery';
  paymentStatus: 'Paid' | 'Pending' | 'Refunded' | 'Partially Refunded' | 'Failed';
  shippingAddress: Address;
  gstDetails?: GstDetails;
  trackingNumber?: string;
  courierPartner?: string;
  trackingUrl?: string;
  estimatedDelivery: string;
  deliveredAt?: string;
  timeline: OrderTimelineEvent[];
  /** Invoice details from admin-generated invoice record */
  invoiceNumber?: string;
  invoiceUrl?: string;
  /** Coupon applied at checkout */
  couponCode?: string;
  /** Dynamic action eligibility (from the API, driven by admin → Settings → Returns) */
  canCancel?: boolean;
  canReturn?: boolean;
  returnPolicy?: OrderReturnPolicy;
  /** Return / replacement requests, newest first */
  returns?: OrderReturnRequest[];
  /** Every refund on this order (cancellation, return, goodwill) */
  refunds?: OrderRefund[];
  cancelReason?: string;
  cancelledAt?: string;
}

export interface ActiveRental {
  id: string;
  equipmentName: string;
  brand: string;
  serialNumber: string;
  startDate: string;
  tenureMonths: number;
  monthlyRent: number;
  securityDeposit: number;
  nextRenewalDate: string;
  status: 'Active' | 'Under Service' | 'Returned';
  image: string;
}

export interface Coupon {
  code: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderValue: number;
  maxDiscount?: number;
  expiresAt: string;
}

export interface Enquiry {
  id?: string;
  name: string;
  organizationName: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  pincode: string;
  equipmentRequired: string[];
  estimatedBudget?: string;
  timeline?: string;
  message: string;
  createdAt?: string;
}

export interface Review {
  id: string;
  productId: string;
  name: string;
  mobile?: string; // never shown publicly
  rating: number; // 1-5
  title?: string;
  comment: string;
  images?: string[]; // max 3
  isVerifiedBuyer: boolean;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  // Backwards compatibility fields
  authorName?: string;
  clinicName?: string;
  city?: string;
  date?: string;
  verifiedBuyer?: boolean;
  helpfulCount?: number;
}

export interface HeroBanner {
  id: string;
  imageDesktop: string;
  imageMobile: string;
  link: string;
  alt: string;
}

export interface PageBanner {
  id: string;
  imageDesktop?: string;
  imageMobile?: string;
  imageUrl?: string;
  link?: string;
  linkUrl?: string;
  alt?: string;
  title?: string;
  headline?: string;
  tagline?: string;
  subtext?: string;
  bgColor?: string;
  ctaText?: string;
  ctaLink?: string;
  pageType?: string;
  slug?: string;
}

export interface FilterOptions {
  categoryId?: string;
  subCategorySlug?: string;
  brandIds?: string[];
  minPrice?: number;
  maxPrice?: number;
  minDiscount?: number;
  inStockOnly?: boolean;
  rentOnly?: boolean;
  emiOnly?: boolean;
  sortBy?: 'popularity' | 'price-asc' | 'price-desc' | 'newest' | 'discount';
  query?: string;
  page?: number;
  limit?: number;
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  authorRole: string;
  publishedAt: string;
  readTime: string;
  category: string;
  coverImage: string;
  tags: string[];
}

export interface SleepTestPackage {
  id: string;
  title: string;
  subtitle: string;
  channels: number; // e.g. 7-channel, 16-channel
  price: number;
  mrp: number;
  duration: string;
  badge?: string;
  features: string[];
  reportDeliveryHours: number;
  doctorConsultationIncluded: boolean;
}

// ---------------------------------------------------------------------------
// Rentals — live API (backend/src/modules/rentals)
// ---------------------------------------------------------------------------

export interface RentalKycDocType {
  key: string;
  label: string;
  hint: string;
}

export interface RentalKycDoc {
  id: string;
  docType: string;
  label: string;
  fileName: string;
  mimeType: string;
  size: number;
  status: 'uploaded' | 'approved' | 'rejected';
  rejectReason?: string | null;
  uploadedAt: string;
}

/** POST /rentals/quote — the server's price for a plan + duration */
export interface RentalQuote {
  productId: string;
  /** Free rentable units right now (serial-numbered machines) */
  available: number;
  inStock: boolean;
  period: 'daily' | 'weekly' | 'monthly';
  periods: number;
  durationLabel: string;
  rate: number;
  rent: number;
  delivery: number;
  gst: number;
  gstRate: number;
  deposit: number;
  total: number;
  advancePercent: number;
  payNow: number;
  balance: number;
  balanceDue: 'before_dispatch' | 'on_delivery';
  startDate: string;
  endDate: string;
  earliestStartDate: string;
  kyc: { required: boolean; documents: RentalKycDocType[]; instructions: string };
}

export type CustomerRentalStatus =
  | 'pending_payment'
  | 'pending_approval'
  | 'approved'
  | 'dispatched'
  | 'active'
  | 'extension_requested'
  | 'overdue'
  | 'return_scheduled'
  | 'returned'
  | 'deposit_refunded'
  | 'cancelled';

export interface RentalShipment {
  courier: string;
  awb: string;
  trackingUrl: string;
  pickupDate: string | null;
  status: string;
  createdAt: string | null;
  deliveredAt: string | null;
}

export interface CustomerRental {
  id: string;
  rentalNumber: string;
  status: CustomerRentalStatus;
  statusLabel: string;
  product: { id: string; name: string; slug: string; brand: string; image: string };
  plan: { period: 'daily' | 'weekly' | 'monthly'; periodLabel: string; unit: string; rate: number; periods: number; durationLabel: string; minPeriods: number; maxPeriods: number };
  requestedStartDate: string | null;
  startDate: string | null;
  endDate: string | null;
  daysLeft: number | null;
  overdueDays: number;
  lateFeeAccrued: number;
  amounts: {
    rent: number;
    delivery: number;
    gst: number;
    deposit: number;
    total: number;
    advancePercent: number;
    advance: number;
    paid: number;
    advanceDue: number;
    balanceDue: number;
    refunded: number;
    depositRefund: number | null;
  };
  balanceDuePolicy: 'before_dispatch' | 'on_delivery';
  deliveryAddress: { name: string; phone: string; organisation: string; line1: string; line2: string; landmark: string; city: string; state: string; pincode: string } | null;
  kyc: {
    required: boolean;
    status: 'pending' | 'submitted' | 'approved' | 'rejected' | null;
    statusLabel: string | null;
    note: string | null;
    requirements: { key: string; label: string; hint: string; document: RentalKycDoc | null }[];
    documents: RentalKycDoc[];
  };
  unit: { serialNumber: string } | null;
  delivery: RentalShipment | null;
  returnPickup: RentalShipment | null;
  returnRequestedOn: string | null;
  returnCondition: string | null;
  returnNotes: string | null;
  deductions: { id: string; type: string; amount: number; description: string }[];
  extensions: { id: string; extraPeriods: number; amount: number; status: string; oldEndDate: string | null; newEndDate: string | null; createdAt: string }[];
  pendingExtensionId: string | null;
  payments: { id: string; amount: number; purpose: string; method: string; reference: string | null; paidAt: string }[];
  refunds: OrderRefund[];
  steps: { key: string; label: string; done: boolean; current: boolean; at: string | null }[];
  timeline: { status: string; label: string; note: string; at: string }[];
  actions: { payAdvance: boolean; payBalance: boolean; cancel: boolean; uploadKyc: boolean; extend: boolean; requestReturn: boolean };
  cancelReason: string | null;
  createdAt: string;
  updatedAt: string;
}
