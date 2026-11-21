import type { AdminRole } from './index';

// --- ORDERS & RETURNS ---
export type OrderStatus =
  | 'new'
  | 'confirmed'
  | 'packed'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'returned';

export type OrderPaymentMethod = 'Razorpay' | 'COD' | 'EMI';
export type OrderPaymentStatus = 'paid' | 'pending' | 'failed' | 'refunded' | 'partial_refund';

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  variantName: string;
  sku: string;
  imageUrl: string;
  qty: number;
  unitPrice: number;
  gstPercent: number;
  gstAmount: number;
  lineTotal: number;
}

export interface OrderAddress {
  name: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
}

export interface OrderGstDetails {
  companyName: string;
  gstin: string;
}

export interface OrderTimelineEvent {
  id: string;
  status: string;
  note: string;
  actor: string;
  timestamp: string;
}

export interface OrderShipment {
  courier: string;
  awb: string;
  trackingUrl: string;
  weightKg: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  shippedAt: string;
}

export interface OrderSellerDetails {
  name: string;
  brandName?: string;
  address: string;
  gstin?: string;
  supportPhone?: string;
  supportEmail?: string;
  logoUrl?: string | null;
  invoicePrefix?: string;
  invoiceNumberDigits?: number;
  dispatchStateCode?: string;
  dispatchStateName?: string;
  signatoryName?: string;
  signatoryUrl?: string | null;
  footerTerms?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: OrderAddress;
  billingAddress: OrderAddress;
  gstDetails?: OrderGstDetails;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  couponCode?: string;
  shippingCharge: number;
  codCharge?: number;
  gstTotal: number;
  total: number;
  paymentMethod: OrderPaymentMethod;
  paymentStatus: OrderPaymentStatus;
  razorpayPaymentId?: string;
  emiPlan?: string;
  orderStatus: OrderStatus;
  shipment?: OrderShipment;
  invoiceNumber?: string;
  invoiceUrl?: string;
  seller?: OrderSellerDetails;
  cancelReason?: string;
  timeline: OrderTimelineEvent[];
  internalNotes: string[];
  createdAt: string;
  updatedAt: string;
}

export type ReturnStatus =
  | 'requested'
  | 'approved'
  | 'pickup_scheduled'
  | 'received'
  | 'refunded'
  | 'rejected';

export interface ReturnRefundRecord {
  id: string;
  amount: number;
  method: 'Razorpay' | 'Bank Transfer (NEFT/IMPS)';
  reference: string;
  processedBy: string;
  processedAt: string;
}

export interface ReturnRequest {
  id: string;
  returnNumber: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  paymentMethod: OrderPaymentMethod;
  items: { productName: string; sku: string; qty: number; refundEligibleAmount: number }[];
  reason: string;
  customerNote: string;
  photos: string[];
  status: ReturnStatus;
  adminNote?: string;
  pickupDate?: string;
  pickupCourier?: string;
  bankDetails?: {
    accountHolder: string;
    accountNumber: string;
    ifsc: string;
  };
  refundHistory: ReturnRefundRecord[];
  createdAt: string;
}

// --- RENTALS ---
export type RentalStatus =
  | 'pending_approval'
  | 'approved'
  | 'dispatched'
  | 'active'
  | 'extension_requested'
  | 'return_scheduled'
  | 'overdue'
  | 'returned'
  | 'deposit_refunded'
  | 'cancelled';

export interface RentalLedgerEntry {
  id: string;
  type: 'rent' | 'deposit' | 'delivery_charge' | 'extension' | 'deduction' | 'refund';
  description: string;
  amount: number;
  status: 'paid' | 'pending' | 'refunded';
  reference?: string;
  date: string;
}

export interface RentalTimelineEvent {
  id: string;
  event: string;
  actor: string;
  note?: string;
  timestamp: string;
}

export interface RentalDeductionLine {
  id: string;
  reason: string;
  amount: number;
}

export interface RentalBooking {
  id: string;
  rentalNumber: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  deliveryAddress: OrderAddress;
  productId: string;
  productName: string;
  productImage: string;
  planType: 'daily' | 'weekly' | 'monthly';
  planRate: number;
  startDate: string;
  endDate: string;
  status: RentalStatus;
  assignedUnitId?: string;
  assignedUnitCode?: string;
  assignedUnitSerial?: string;
  depositAmount: number;
  depositStatus: 'held' | 'pending' | 'partial_refunded' | 'refunded';
  amountPaid: number;
  shipment?: {
    courier: string;
    awb: string;
    trackingUrl: string;
  };
  extensionRequest?: {
    requestedEndDate: string;
    additionalAmount: number;
    paymentStatus: 'paid' | 'pending';
    approved?: boolean;
  };
  returnInfo?: {
    pickupDate: string;
    receivedAt?: string;
    inspectionCondition?: 'good' | 'needs_service' | 'damaged';
    inspectionNotes?: string;
    inspectionPhotos?: string[];
  };
  depositRefund?: {
    deductions: RentalDeductionLine[];
    netRefundAmount: number;
    method: 'Razorpay' | 'Bank Transfer' | 'UPI';
    reference: string;
    refundedAt: string;
  };
  ledger: RentalLedgerEntry[];
  timeline: RentalTimelineEvent[];
  internalNotes: string[];
  lastReminderSentAt?: string;
  createdAt: string;
}

// --- ENQUIRIES ---
export type EnquiryCategory = 'sleep_test' | 'bulk_b2b' | 'contact';
export type EnquiryStatus = 'new' | 'contacted' | 'follow_up' | 'converted' | 'closed';

export interface EnquiryNote {
  id: string;
  author: string;
  text: string;
  createdAt: string;
}

export interface EnquiryRecord {
  id: string;
  enquiryNumber: string;
  category: EnquiryCategory;
  name: string;
  mobile: string;
  email: string;
  city: string;
  // Type-specific
  testType?: 'Home Level-3 Sleep Study' | 'Polysomnography (Level-1)' | 'CPAP Titration';
  preferredDate?: string;
  organization?: string;
  gstin?: string;
  productsSummary?: string;
  estimatedQty?: number;
  subject?: string;
  message: string;
  status: EnquiryStatus;
  assignedStaffId?: string;
  assignedStaffName?: string;
  nextFollowUpDate?: string;
  notes: EnquiryNote[];
  createdAt: string;
}

// --- REVIEWS ---
export type ReviewStatus = 'pending' | 'approved' | 'rejected';

export interface ProductReview {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  reviewerName: string;
  reviewerMobileMasked: string;
  rating: 1 | 2 | 3 | 4 | 5;
  title: string;
  comment: string;
  images: string[];
  verifiedBuyer: boolean;
  status: ReviewStatus;
  rejectionReason?: string;
  createdAt: string;
}

// --- CUSTOMERS ---
export type CustomerStatus = 'active' | 'blocked';

export interface CustomerRecord {
  id: string;
  name: string;
  mobile: string;
  email: string;
  city: string;
  state: string;
  ordersCount: number;
  rentalsCount: number;
  totalSpent: number;
  joinedAt: string;
  status: CustomerStatus;
  addresses: OrderAddress[];
  gstDetails?: OrderGstDetails;
  notes: string[];
}

// --- MARKETING ---
export interface HeroBanner {
  id: string;
  title: string;
  desktopImageUrl: string;
  mobileImageUrl: string;
  linkUrl: string;
  altText: string;
  startDate: string;
  endDate: string;
  active: boolean;
  sortOrder: number;
}

export type PageBannerType =
  | 'Category'
  | 'Brand'
  | 'Best Sellers'
  | 'New Arrivals'
  | 'Offers'
  | 'Hot Selling'
  | 'Deal of the Day'
  | 'Brands';

export interface PageBanner {
  id: string;
  pageType: PageBannerType;
  targetId?: string;
  targetLabel?: string;
  title: string;
  desktopImageUrl: string;
  mobileImageUrl: string;
  linkUrl: string;
  startDate: string;
  endDate: string;
  active: boolean;
  sortOrder: number;
}

export interface HomepageSection {
  id: string;
  key: string;
  defaultName: string;
  title: string;
  visible: boolean;
  sortOrder: number;
  configurableType: 'none' | 'products' | 'categories';
  selectedIds: string[];
}

export interface Coupon {
  id: string;
  code: string;
  type: 'percentage' | 'flat';
  value: number;
  maxDiscount?: number;
  minOrderValue: number;
  applicableTo: 'all' | 'categories' | 'products' | 'brands';
  applicableTargetIds: string[];
  usageLimitTotal: number;
  usageLimitPerCustomer: number;
  usedCount: number;
  totalDiscountGiven: number;
  startDate: string;
  endDate: string;
  active: boolean;
  firstOrderOnly: boolean;
}

export interface DealOfTheDayItem {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  regularPrice: number;
  dealPrice: number;
  startTime: string;
  endTime: string;
  active: boolean;
}

// --- CONTENT ---
export interface CmsPage {
  id: string;
  slug: string;
  title: string;
  contentHtml: string;
  seoTitle: string;
  seoDescription: string;
  updatedAt: string;
}

export type FaqGroup = 'General' | 'Rental' | 'Sleep Test';

export interface FaqItem {
  id: string;
  group: FaqGroup;
  question: string;
  answer: string;
  sortOrder: number;
  active: boolean;
}

export type BlogStatus = 'published' | 'draft' | 'scheduled';

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  coverImageUrl: string;
  excerpt: string;
  contentHtml: string;
  category: string;
  tags: string[];
  status: BlogStatus;
  publishDate: string;
  seoTitle: string;
  seoDescription: string;
  author: string;
  updatedAt: string;
}

// --- SETTINGS ---
/** Settings → Notifications: one event's template (backend modules/settings/notifications.service.js). */
export interface NotificationTemplate {
  event: string;
  label: string;
  group: string;
  variables: string[];
  /** Message used for SMS, WhatsApp and the email body */
  body: string;
  /** Email subject */
  subject: string;
  sms: { active: boolean; templateId: string };
  whatsapp: { active: boolean; templateId: string };
  email: { active: boolean };
  /** Body rendered with sample values (read-only, from the API) */
  preview?: string;
}

export interface NotificationChannelStatus {
  email: string;
  sms: string;
  whatsapp: string;
}

/** Settings tabs as the API returns them — money in rupees, images as URLs. */
export interface AdminSettings {
  store: {
    storeName: string;
    brandName: string;
    tagline: string;
    logoPath: string;
    footerLogoPath: string;
    faviconPath: string;
    supportPhone: string;
    salesPhone: string;
    tollFreePhone: string;
    supportEmail: string;
    salesEmail: string;
    whatsappNumber: string;
    address: string;
    mapUrl: string;
    gstin: string;
    supportOpenTime: string;
    supportCloseTime: string;
    openOnSunday: boolean;
    instagramUrl: string;
    facebookUrl: string;
    linkedinUrl: string;
    youtubeUrl: string;
    twitterUrl: string;
  };
  shipping: {
    flatShippingCharge: number;
    freeShippingAbove: number;
    codEnabled: boolean;
    codMaxOrderValue: number;
    codCharge: number;
    defaultDeliveryDays: string;
    dispatchCutoffTime: string;
  };
  tax: {
    gstEnabled: boolean;
    pricesIncludeGst: boolean;
    defaultGstRate: number;
    dispatchStateCode: string;
    invoicePrefix: string;
    nextInvoiceNumber: number;
    invoiceNumberDigits: number;
    footerTerms: string;
    signatoryName: string;
    signatoryPath: string;
  };
  rental: {
    reminderDaysBeforeDue: number;
    lateFeePerDay: number;
    gracePeriodDays: number;
    depositRefundDays: number;
  };
  images: { logo: string | null; footerLogo: string | null; favicon: string | null; signatory: string | null };
  options: {
    states: { code: string; name: string }[];
    gstRates: number[];
  };
}

export type SettingsGroup = 'store' | 'shipping' | 'tax' | 'rental';
export type SettingsImage = 'logo' | 'footerLogo' | 'favicon' | 'signatory';

export interface PincodeSummary {
  total: number;
  active: number;
  codAvailable: number;
  lastUpdatedAt: string | null;
  restricted: boolean;
}

export interface PincodeRow {
  pincode: string;
  city: string;
  state: string;
  codAvailable: boolean;
  deliveryDays: string;
  active: boolean;
}

export interface PincodeImportResult {
  mode: 'merge' | 'replace';
  imported: number;
  skipped: number;
  errors: { line: number; message: string }[];
  before: number;
  after: number;
  summary: PincodeSummary;
}

export interface NotificationLogRow {
  id: string;
  event: string;
  channel: 'sms' | 'whatsapp' | 'email';
  recipient: string;
  status: 'queued' | 'sent' | 'failed';
  error: string | null;
  at: string;
}

// --- STAFF, ROLES & ACTIVITY LOG ---
export type MatrixModuleKey =
  | 'dashboard'
  | 'products'
  | 'categories'
  | 'brands'
  | 'bulk_import'
  | 'inventory'
  | 'rental_units'
  | 'orders'
  | 'returns'
  | 'rentals'
  | 'enquiries'
  | 'reviews'
  | 'customers'
  | 'marketing'
  | 'content'
  | 'settings'
  | 'staff'
  | 'activity';

export type MatrixActionKey = 'view' | 'create' | 'edit' | 'delete' | 'export';

export type RolePermissionMatrix = Record<MatrixModuleKey, Record<MatrixActionKey, boolean>>;

export interface RoleDefinition {
  id: string;
  name: string;
  key: AdminRole | string;
  description: string;
  isDefault: boolean;
  /** Super Admin: always every permission, matrix cannot be edited */
  isLocked?: boolean;
  staffCount?: number;
  matrix: RolePermissionMatrix;
}

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  mobile: string;
  roleId: string;
  roleName: string;
  department: string;
  status: 'active' | 'inactive';
  lastLoginAt: string;
  roleKey?: string;
  /** false until the invite link has been used */
  passwordSet?: boolean;
  lockedUntil?: string | null;
}

export interface ActivityLogEntry {
  id: string;
  timestamp: string;
  staffId: string;
  staffName: string;
  module: string;
  action: string;
  recordLabel: string;
  recordHref: string;
  changesSummary: string;
}
