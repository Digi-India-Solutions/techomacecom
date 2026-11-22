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
export type OrderPaymentStatus = 'paid' | 'pending' | 'failed' | 'refunded' | 'partially_refunded';

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
  /** Every refund attempt on this order (cancellation, return, goodwill) */
  refunds: RefundRecord[];
  refundSummary: RefundSummary;
  /** Return / replacement requests raised on this order */
  returns: OrderReturnSummary[];
  timeline: OrderTimelineEvent[];
  internalNotes: string[];
  createdAt: string;
  updatedAt: string;
}

// --- REFUNDS ---
export type RefundMode = 'gateway' | 'bank_transfer' | 'upi';
export type RefundStatus = 'processing' | 'processed' | 'failed';

export interface RefundRecord {
  id: string;
  amount: number;
  reason: 'cancel' | 'return' | 'goodwill' | 'deposit_refund';
  method: RefundMode;
  methodLabel: string;
  status: RefundStatus;
  reference: string | null;
  note: string | null;
  returnId: string | null;
  createdAt: string;
  processedAt: string | null;
  gatewayRefundId?: string | null;
  failureReason?: string | null;
  processedBy?: string;
}

export interface RefundSummary {
  paid: number;
  refunded: number;
  balance: number;
  /** A captured Razorpay payment exists, so "original payment method" refunds are possible */
  gatewayAvailable: boolean;
  paymentId: string | null;
}

export interface OrderReturnSummary {
  id: string;
  returnNumber: string;
  type: ReturnRequestType;
  status: ReturnStatus;
  statusLabel: string;
  itemCount: number;
  requestedAmount: number;
  createdAt: string;
}

export type ReturnStatus =
  | 'requested'
  | 'approved'
  | 'pickup_scheduled'
  | 'received'
  | 'replacement_shipped'
  | 'refunded'
  | 'completed'
  | 'rejected'
  | 'cancelled';

export type ReturnRequestType = 'refund' | 'replacement';

export interface ReturnShipment {
  courier: string;
  awb: string;
  trackingUrl: string;
  pickupDate: string | null;
  status: string;
  createdAt: string | null;
  deliveredAt: string | null;
}

export interface ReturnStep {
  key: string;
  label: string;
  done: boolean;
  current: boolean;
  at: string | null;
}

export interface ReturnRequestItem {
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
}

export interface ReturnRefundAccount {
  mode: 'bank' | 'upi';
  label: string;
  /** Only in the detail view */
  details?: {
    mode: 'bank' | 'upi';
    accountHolder?: string | null;
    accountNumber?: string;
    ifsc?: string;
    bankName?: string | null;
    upiId?: string;
  };
}

export interface ReturnRequest {
  id: string;
  returnNumber: string;
  type: ReturnRequestType;
  typeLabel: string;
  status: ReturnStatus;
  statusLabel: string;
  reason: string;
  customerNote: string;
  photos: string[];
  items: ReturnRequestItem[];
  requestedAmount: number;
  rejectionReason: string | null;
  pickup: ReturnShipment | null;
  replacementShipment: ReturnShipment | null;
  steps: ReturnStep[];
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  orderId: string;
  orderNumber: string;
  orderTotal: number;
  orderPlacedAt: string | null;
  orderDeliveredAt: string | null;
  paymentMethod: OrderPaymentMethod;
  customer: { id: string; name: string; phone: string; email: string; address: string };
  refundAccount: ReturnRefundAccount | null;
  adminNote: string;
  refunds: RefundRecord[];
  refundedAmount: number;
  history: { id: string; status: string; label: string; note: string; actor: string; at: string }[];
  /** Detail view only */
  refundable?: {
    paid: number;
    alreadyRefunded: number;
    max: number;
    suggested: number;
    gatewayAvailable: boolean;
    defaultMode: RefundMode;
  };
}

export interface ReturnsSummary {
  needsReview: number;
  inPickup: number;
  awaitingResolution: number;
  replacementInTransit: number;
  open: number;
  closed: number;
  total: number;
  refundedLast30Days: number;
}

// --- RENTALS (backend/src/modules/rentals) ---
export type RentalStatus =
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

export type RentalPeriod = 'daily' | 'weekly' | 'monthly';
export type RentalKycStatus = 'pending' | 'submitted' | 'approved' | 'rejected';
export type OfflinePaymentMethod = 'cash' | 'upi' | 'bank_transfer' | 'cheque';

export interface RentalKycDocument {
  id: string;
  docType: string;
  label: string;
  fileName: string;
  mimeType: string;
  size: number;
  status: 'uploaded' | 'approved' | 'rejected';
  rejectReason: string | null;
  uploadedAt: string;
}

export interface RentalShipmentInfo {
  courier: string;
  awb: string;
  trackingUrl: string;
  pickupDate: string | null;
  status: string;
  createdAt: string | null;
  deliveredAt: string | null;
}

export interface AdminRental {
  id: string;
  rentalNumber: string;
  status: RentalStatus;
  statusLabel: string;
  product: { id: string; name: string; slug: string; brand: string; image: string };
  plan: {
    period: RentalPeriod;
    periodLabel: string;
    unit: string;
    rate: number;
    periods: number;
    durationLabel: string;
    minPeriods: number;
    maxPeriods: number;
  };
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
  deliveryAddress: {
    name: string;
    phone: string;
    organisation: string;
    line1: string;
    line2: string;
    landmark: string;
    city: string;
    state: string;
    pincode: string;
  } | null;
  kyc: {
    required: boolean;
    status: RentalKycStatus | null;
    statusLabel: string | null;
    note: string | null;
    requirements: { key: string; label: string; hint: string; document: RentalKycDocument | null }[];
    documents: RentalKycDocument[];
  };
  customer: { id: string; name: string; phone: string; email: string };
  unit: { id: string; unitCode: string; serialNumber: string; condition: string; status: string } | null;
  prescriptionRequired: boolean;
  delivery: RentalShipmentInfo | null;
  returnPickup: RentalShipmentInfo | null;
  returnRequestedOn: string | null;
  returnCondition: 'good' | 'needs_service' | 'damaged' | null;
  returnNotes: string | null;
  deductions: { id: string; type: 'late_fee' | 'damage' | 'missing_accessory'; amount: number; description: string }[];
  extensions: { id: string; extraPeriods: number; amount: number; status: string; oldEndDate: string | null; newEndDate: string | null; createdAt: string }[];
  pendingExtensionId: string | null;
  payments: { id: string; amount: number; purpose: string; method: string; reference: string | null; paidAt: string }[];
  refunds: RefundRecord[];
  ledger: { id: string; type: string; direction: 'debit' | 'credit'; amount: number; description: string; at: string }[];
  steps: { key: string; label: string; done: boolean; current: boolean; at: string | null }[];
  internalNotes: { text: string; by: string; at: string }[];
  cancelReason: string | null;
  createdAt: string;
  updatedAt: string;
  /** Detail view only */
  history?: { id: string; status: string; label: string; note: string; actor: string; at: string }[];
  availableUnits?: { id: string; unitCode: string; serialNumber: string; condition: string; nextServiceDue: string | null }[] | null;
}

/** @deprecated old mock shape — use AdminRental */
export type RentalBooking = AdminRental;

export interface RentalsSummary {
  awaitingApproval: number;
  kycToReview: number;
  toDispatch: number;
  inUse: number;
  overdue: number;
  dueIn7Days: number;
  pickups: number;
  depositsToRefund: number;
  depositsHeld: number;
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
    advancePaymentPercent: number;
    balanceDue: 'before_dispatch' | 'on_delivery';
    minLeadDays: number;
    kycRequired: boolean;
    kycDocuments: string[];
    kycInstructions: string;
  };
  returns: {
    returnsEnabled: boolean;
    returnWindowDays: number;
    refundEnabled: boolean;
    replacementEnabled: boolean;
    photosRequired: boolean;
    maxPhotos: number;
    refundProcessingDays: string;
    returnReasons: string[];
    cancelReasons: string[];
    nonReturnableCategoryIds: string[];
    conditions: string;
  };
  images: { logo: string | null; footerLogo: string | null; favicon: string | null; signatory: string | null };
  options: {
    states: { code: string; name: string }[];
    gstRates: number[];
    categories?: { id: string; name: string; path: string; active: boolean }[];
    kycDocumentTypes?: { key: string; label: string; hint: string }[];
  };
}

export type SettingsGroup = 'store' | 'shipping' | 'tax' | 'rental' | 'returns';
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
