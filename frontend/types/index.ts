export interface Variant {
  id: string;
  name: string; // e.g. "Pack of 10", "5 Litres", "Standard Adult Cuff", "Torque Head"
  sku: string;
  price: number;
  mrp: number;
  inStock: boolean;
  stockCount: number;
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
  rentalKycRequired?: boolean;
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

export interface RentalKycDocuments {
  idProofFront?: string;
  idProofBack?: string;
  addressProof?: string;
  doctorPrescription?: string;
  verified?: boolean;
}

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
  kycDocuments: RentalKycDocuments;
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
  items?: string[];
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

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'doctor' | 'clinic_admin' | 'procurement' | 'individual';
  degree?: string;
  registrationNumber?: string; // Dental/Medical Council reg number
  addresses: Address[];
  gstDetails?: GstDetails;
}

export interface OrderItem {
  productId: string;
  productName: string;
  brandName: string;
  image: string;
  sku: string;
  variantName?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  isRental?: boolean;
  rentalTenureMonths?: number;
}

export type OrderStatus = 'Placed' | 'Confirmed' | 'Packed' | 'Dispatched' | 'Delivered' | 'Cancelled';

export interface OrderTimelineEvent {
  status: OrderStatus;
  date: string;
  title: string;
  description: string;
  completed: boolean;
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
  paymentStatus: 'Paid' | 'Pending' | 'Refunded';
  shippingAddress: Address;
  gstDetails?: GstDetails;
  trackingNumber?: string;
  courierPartner?: string;
  estimatedDelivery: string;
  timeline: OrderTimelineEvent[];
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
