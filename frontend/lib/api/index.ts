import { 
  Product, 
  User,
  Category, 
  Brand, 
  Coupon, 
  BlogPost, 
  SleepTestPackage, 
  Order, 
  ActiveRental, 
  Rental,
  // Review — reviews now come from ./reviews (live API)
  FilterOptions, 
  Enquiry,
  HeroBanner,
  PageBanner
} from '@/types';
import {
  MOCK_COUPONS,
  MOCK_BLOG_POSTS,
  MOCK_SLEEP_TEST_PACKAGES,
  MOCK_ORDERS,
  MOCK_ACTIVE_RENTALS,
  MOCK_RENTALS
  // MOCK_REVIEWS — reviews now come from the live API
} from '@/lib/mock/data';
// import { sendLoginOtp, verifyLoginOtp } from './customerAuth'; // mobile OTP sign-in disabled
import { getBrandBySlug, getCategoryBySlug } from './catalog';
import { apiPost, errorMessage } from './backend';
import { getLiveBlogPosts, getLiveBlogPostBySlug, getFaqs, getCmsPage, listCmsPages } from './cms';

// Read base URL from NEXT_PUBLIC_API_URL if configured for real REST backend
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

/**
 * Helper to simulate network latency for realistic feel or fetch from real REST API
 */
async function fetchOrMock<T>(endpoint: string, mockFallback: () => T | Promise<T>, options?: RequestInit): Promise<T> {
  if (API_BASE_URL) {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(options?.headers || {})
        },
        ...options
      });
      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
      return await response.json();
    } catch (err) {
      console.warn(`Falling back to mock data for ${endpoint}:`, err);
      return await mockFallback();
    }
  }

  // Simulated latency for smooth UX state transitions (loading skeletons)
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockFallback());
    }, 40);
  });
}

// Catalog (categories, brands, products, search) comes from the live API — see ./catalog.ts
export * from './catalog';
import { checkPincode, checkRentalPincode } from '@/lib/settings/pincode-api';
export * from './marketing';
import {
  getHomepageConfig,
  getHeroBanners as getMarketingHeroBanners,
  getPageBanners as getMarketingPageBanners,
  applyCouponViaBackend
} from './marketing';

/**
 * Check Indian pincode serviceability
 */
/** Delivery check against Settings → Shipping (backend /pincodes/:pincode). */
export async function checkPincodeServiceability(pincode: string): Promise<{
  serviceable: boolean;
  city: string;
  state: string;
  deliveryDays: string;
  codAvailable: boolean;
}> {
  const r = await checkPincode(pincode);
  return {
    serviceable: r.serviceable,
    // No city in the uploaded list → show the PIN itself (e.g. "Deliver to 110020")
    city: r.city || r.pincode,
    state: r.state,
    deliveryDays: r.serviceable ? `${r.deliveryDays} business days` : r.message,
    codAvailable: r.codAvailable
  };
}

/** Rental equipment delivery check against Settings → Rental (backend /rentals/pincodes/:pincode). */
export async function checkRentalPincodeServiceability(pincode: string): Promise<{
  serviceable: boolean;
  city: string;
  state: string;
  deliveryDays: string;
  codAvailable: boolean;
}> {
  const r = await checkRentalPincode(pincode);
  return {
    serviceable: r.serviceable,
    city: r.city || r.pincode,
    state: r.state,
    deliveryDays: r.serviceable ? `${r.deliveryDays} business days` : r.message,
    codAvailable: false
  };
}

/**
 * Coupon validation (backed by PostgreSQL coupons table with fallback)
 */
export async function applyCoupon(code: string, subtotal: number): Promise<{
  valid: boolean;
  coupon?: Coupon;
  discountAmount: number;
  message: string;
}> {
  // 1. Try real PostgreSQL database coupon
  try {
    const live = await applyCouponViaBackend(code, subtotal);
    if (live.valid) return live;
  } catch (err) {
    console.warn('Backend coupon apply failed, testing mock fallback:', err);
  }

  // 2. Fallback to mock coupons for demo/testing
  const normalized = code.trim().toUpperCase();
  const coupon = MOCK_COUPONS.find((c) => c.code === normalized);

  if (!coupon) {
    return {
      valid: false,
      discountAmount: 0,
      message: 'Invalid coupon code. Try WELCOME10 or CLINIC2000.'
    };
  }

  if (subtotal < coupon.minOrderValue) {
    return {
      valid: false,
      discountAmount: 0,
      message: `Minimum order value for ${coupon.code} is ₹${coupon.minOrderValue.toLocaleString('en-IN')}`
    };
  }

  let discount = 0;
  if (coupon.discountType === 'percentage') {
    discount = Math.round((subtotal * coupon.discountValue) / 100);
    if (coupon.maxDiscount && discount > coupon.maxDiscount) {
      discount = coupon.maxDiscount;
    }
  } else {
    discount = coupon.discountValue;
  }

  return {
    valid: true,
    coupon,
    discountAmount: discount,
    message: `Coupon ${coupon.code} applied successfully! You save ₹${discount.toLocaleString('en-IN')}`
  };
}

/**
 * Bulk Purchase enquiry
 */
export async function submitBulkEnquiry(
  data: Enquiry & { honeypot?: string; sourcePage?: string }
): Promise<{ success: boolean; message: string; enquiryId: string }> {
  // Live API: POST /api/v1/enquiries/bulk (saved as type "bulk", shown in Admin → Enquiries → Bulk / B2B)
  const res = await apiPost<{ enquiryId: string; message: string }>('/enquiries/bulk', {
    name: data.name.trim(),
    organizationName: data.organizationName.trim(),
    email: data.email.trim().toLowerCase(),
    mobile: data.phone.replace(/\D/g, '').slice(-10),
    city: data.city.trim(),
    state: (data.state || '').trim(),
    pincode: (data.pincode || '').trim(),
    equipmentRequired: data.equipmentRequired || [],
    estimatedBudget: data.estimatedBudget || '',
    timeline: data.timeline || '',
    message: (data.message || '').trim(),
    honeypot: data.honeypot || '',
    sourcePage: data.sourcePage || (typeof window !== 'undefined' ? window.location.pathname : '/bulk-enquiry'),
  });
  return { success: true, ...res };
}

/**
 * Contact Us form — live API: POST /api/v1/enquiries/contact
 * (saved as type "contact", shown in Admin → Enquiries → Contact Form).
 * Throws ApiClientError (with field errors) when the API rejects the form.
 */
export async function submitContactEnquiry(data: {
  name: string;
  phone: string;
  email: string;
  subject: string;
  message: string;
  honeypot?: string;
  sourcePage?: string;
}): Promise<{ success: boolean; message: string; enquiryId: string }> {
  const res = await apiPost<{ enquiryId: string; message: string }>('/enquiries/contact', {
    name: data.name.trim(),
    mobile: data.phone.replace(/\D/g, '').slice(-10),
    email: data.email.trim().toLowerCase(),
    subject: data.subject.trim(),
    message: data.message.trim(),
    honeypot: data.honeypot || '',
    sourcePage: data.sourcePage || (typeof window !== 'undefined' ? window.location.pathname : '/contact'),
  });
  return { success: true, ...res };
}

/**
 * Sleep-test callback enquiry — saved by the live API (POST /api/v1/enquiries,
 * backend/src/modules/enquiries). Used by the /sleep-test header form and the
 * risk-quiz result page. `quiz` carries the STOP-BANG answers; the API recomputes the risk.
 * Throws ApiClientError (with field errors) when the API rejects the form.
 */
export async function submitEnquiry(data: {
  type: string;
  fullName?: string;
  name?: string;
  phone?: string;
  mobile?: string;
  email?: string;
  city?: string;
  preferredDate?: string;
  testType?: string;
  message?: string;
  consent?: boolean;
  honeypot?: string;
  sourcePage?: string;
  quiz?: {
    answers: Record<'snoring' | 'tired' | 'observed' | 'pressure' | 'age' | 'neck' | 'male', boolean>;
    heightCm: number;
    weightKg: number;
    unit: 'imperial' | 'metric';
  };
}): Promise<{ success: boolean; message: string; enquiryId: string; risk?: string; score?: number }> {
  const res = await apiPost<{ enquiryId: string; message: string; risk?: string; score?: number }>('/enquiries', {
    type: 'sleep_test',
    name: (data.fullName || data.name || '').trim(),
    mobile: (data.mobile || data.phone || '').replace(/\D/g, ''),
    email: data.email || '',
    city: data.city || '',
    preferredDate: data.preferredDate || '',
    testType: data.testType || 'Not sure',
    message: data.message || '',
    consent: Boolean(data.consent),
    honeypot: data.honeypot || '',
    sourcePage: data.sourcePage || (typeof window !== 'undefined' ? window.location.pathname : ''),
    ...(data.quiz ? { quiz: data.quiz } : {}),
  });
  return { success: true, ...res };
}

export interface SellerRegistrationInput {
  companyName: string;
  registeredAs: string;
  email: string;
  mobile: string;
  originCountry?: string;
  vendorType: string;
  gstNumber?: string;
  brands?: { name: string; country: string }[];
  contactPerson?: string;
  city?: string;
  categories?: string[];
  message?: string;
  consent: boolean;
  honeypot?: string;
  sourcePage?: string;
}

export async function submitSellerRegistration(data: SellerRegistrationInput): Promise<{
  success: boolean;
  message: string;
  enquiryId: string;
}> {
  const cleanMobile = data.mobile.replace(/\D/g, '');
  const res = await apiPost<{ enquiryId: string; message: string }>('/enquiries/seller', {
    companyName: data.companyName.trim(),
    registeredAs: data.registeredAs,
    email: data.email.trim().toLowerCase(),
    mobile: cleanMobile,
    originCountry: data.originCountry || 'India',
    vendorType: data.vendorType,
    gstNumber: (data.gstNumber || '').trim().toUpperCase(),
    brands: data.brands || [],
    contactPerson: (data.contactPerson || '').trim(),
    city: (data.city || '').trim(),
    categories: data.categories || [],
    message: (data.message || '').trim(),
    consent: Boolean(data.consent),
    honeypot: data.honeypot || '',
    sourcePage: data.sourcePage || (typeof window !== 'undefined' ? window.location.pathname : '/sell'),
  });
  return { success: true, ...res };
}

/**
 * Mobile OTP Authentication UI helpers
 */
// ---------------------------------------------------------------------------
// Mobile OTP sign-in — DISABLED (storefront uses email + password; backend /auth/otp/* routes
// are commented out). Rental checkout now embeds the email sign-in form instead.
// ---------------------------------------------------------------------------
// /**
//  * Mobile OTP sign-in — now served by the real API (backend/src/modules/auth).
//  * Kept with the old signatures for existing callers (e.g. rental checkout);
//  * new code should use lib/api/customerAuth directly.
//  */
// export async function requestMobileOtp(phone: string): Promise<{ success: boolean; message: string; demoOtp: string }> {
//   try {
//     const res = await sendLoginOtp(phone);
//     return { success: true, message: res.message, demoOtp: res.devOtp || '' };
//   } catch (error) {
//     return { success: false, message: errorMessage(error), demoOtp: '' };
//   }
// }
// 
// export async function verifyMobileOtp(phone: string, otp: string): Promise<{ success: boolean; token?: string; user?: User; message: string }> {
//   try {
//     const { user, isNewUser } = await verifyLoginOtp({ mobile: phone, otp });
//     return { success: true, user, message: isNewUser ? 'Account created' : 'Signed in' };
//   } catch (error) {
//     return { success: false, message: errorMessage(error) };
//   }
// }

/**
 * Customer orders — fetched from the live backend (/api/v1/account/orders).
 * Falls back to mock data only when the backend is not reachable.
 */
/** The signed-in customer's orders (live API only — errors are shown, never sample orders). */
export async function getOrders(): Promise<Order[]> {
  const { fetchOrders } = await import('./orders');
  return fetchOrders();
}

export async function getOrderById(orderId: string): Promise<Order | null> {
  const { fetchOrderById } = await import('./orders');
  return fetchOrderById(orderId);
}

/**
 * Rentals — live API in lib/api/rentals.ts (quote, booking, KYC, payments, extensions, pickup).
 */

/**
 * Blog
 */
export async function getBlogPosts(): Promise<BlogPost[]> {
  return getLiveBlogPosts();
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  return getLiveBlogPostBySlug(slug);
}

export { getFaqs, getCmsPage, listCmsPages, getLiveBlogPosts, getLiveBlogPostBySlug };

/**
 * Sleep test packages
 */
export async function getSleepTestPackages(): Promise<SleepTestPackage[]> {
  return fetchOrMock('/api/sleep-test/packages', () => [...MOCK_SLEEP_TEST_PACKAGES]);
}

/**
 * Reviews — now served by the live API (lib/api/reviews.ts → backend/src/modules/reviews).
 * Writing a review needs a signed-in customer; the old mobile-OTP flow below is switched off.
 */
export * from './reviews';

// ---------------------------------------------------------------------------
// OLD mock reviews + review mobile OTP — DISABLED (kept for reference).
// ---------------------------------------------------------------------------
// /**
//  * Reviews (admin-moderated)
//  */
// // In-memory array for user submitted reviews during runtime
// const submittedReviewsStore: Review[] = [];
// // In-memory OTP storage for review verification
// const pendingReviewOtps: Record<string, { otp: string; expiresAt: number }> = {};
//
// /**
//  * Fetch approved reviews for a specific product
//  */
// export async function getProductReviews(productId: string): Promise<Review[]> {
//   return fetchOrMock(`/api/products/${productId}/reviews`, () => {
//     // Return only approved reviews matching the productId
//     const staticReviews = MOCK_REVIEWS.filter(
//       (r) => r.productId === productId && r.status === 'approved'
//     );
//
//     const runtimeApproved = submittedReviewsStore.filter(
//       (r) => r.productId === productId && r.status === 'approved'
//     );
//
//     const all = [...runtimeApproved, ...staticReviews];
//
//     // If specific product has no direct reviews, fallback to general approved medical reviews
//     // so the review section looks active and clinical
//     if (all.length === 0) {
//       return MOCK_REVIEWS.filter((r) => r.status === 'approved').slice(0, 3);
//     }
//
//     return all;
//   });
// }
//
// /**
//  * Send 6-digit OTP to mobile for review submission spam prevention
//  */
// export async function sendReviewOtp(mobile: string): Promise<{
//   success: boolean;
//   message: string;
//   simulatedOtp?: string;
// }> {
//   return fetchOrMock(
//     '/api/reviews/send-otp',
//     () => {
//       const cleanMobile = mobile.replace(/\D/g, '');
//       if (!/^[6-9]\d{9}$/.test(cleanMobile)) {
//         throw new Error('Please enter a valid 10-digit Indian mobile number');
//       }
//
//       // Generate 6-digit OTP (for testing/demo: default 123456 or random)
//       const otp = '123456';
//       pendingReviewOtps[cleanMobile] = {
//         otp,
//         expiresAt: Date.now() + 5 * 60 * 1000 // 5 minutes validity
//       };
//
//       return {
//         success: true,
//         message: `OTP sent successfully to +91 ${cleanMobile}. (Use test code 123456)`,
//         simulatedOtp: otp
//       };
//     },
//     {
//       method: 'POST',
//       body: JSON.stringify({ mobile })
//     }
//   );
// }
//
// /**
//  * Verify 6-digit review OTP
//  */
// export async function verifyReviewOtp(
//   mobile: string,
//   otp: string
// ): Promise<{ success: boolean; message: string }> {
//   return fetchOrMock(
//     '/api/reviews/verify-otp',
//     () => {
//       const cleanMobile = mobile.replace(/\D/g, '');
//       const record = pendingReviewOtps[cleanMobile];
//
//       // Allow 123456 as master test OTP or match stored OTP
//       if (otp.trim() === '123456' || (record && record.otp === otp.trim())) {
//         delete pendingReviewOtps[cleanMobile];
//         return {
//           success: true,
//           message: 'Mobile number verified successfully'
//         };
//       }
//
//       throw new Error('Invalid OTP. Please check the 6-digit code or enter 123456.');
//     },
//     {
//       method: 'POST',
//       body: JSON.stringify({ mobile, otp })
//     }
//   );
// }
//
// /**
//  * Submit product review (requires admin moderation, starts with status 'pending')
//  */
// export async function submitReview(data: {
//   productId: string;
//   name: string;
//   mobile?: string;
//   rating: number;
//   title?: string;
//   comment: string;
//   images?: string[];
//   isVerifiedBuyer?: boolean;
// }): Promise<{ success: boolean; reviewId: string; message: string }> {
//   return fetchOrMock(
//     `/api/products/${data.productId}/reviews`,
//     () => {
//       const reviewId = `rev-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
//       const newReview: Review = {
//         id: reviewId,
//         productId: data.productId,
//         name: data.name.trim(),
//         authorName: data.name.trim(),
//         mobile: data.mobile?.trim(),
//         rating: data.rating,
//         title: data.title?.trim() || 'Verified Product Feedback',
//         comment: data.comment.trim(),
//         images: data.images || [],
//         isVerifiedBuyer: data.isVerifiedBuyer ?? true,
//         verifiedBuyer: data.isVerifiedBuyer ?? true,
//         status: 'pending', // NOT shown publicly until admin approves
//         createdAt: new Date().toISOString(),
//         date: new Date().toISOString().split('T')[0],
//         helpfulCount: 0
//       };
//
//       submittedReviewsStore.unshift(newReview);
//
//       return {
//         success: true,
//         reviewId,
//         message: 'Thank you! Your review has been submitted and will be visible after approval.'
//       };
//     },
//     {
//       method: 'POST',
//       body: JSON.stringify(data)
//     }
//   );
// }
//
// export async function getFeaturedReviews(): Promise<Review[]> {
//   return fetchOrMock('/api/reviews/featured', () => [...MOCK_REVIEWS]);
// }
//

/**
 * Page Banners for Listing Pages (Category, Brand, Offers, Deals, Best Sellers, etc.)
 */
export async function getPageBanners(
  pageType: string,
  slug?: string,
  targetId?: string
): Promise<PageBanner[]> {
  // 1. Primary: Marketing Page Banners configured in Admin (Admin → Marketing → Page Banners)
  try {
    const banners = await getMarketingPageBanners(pageType, slug, targetId);
    if (banners && banners.length > 0) return banners;
  } catch (err) {
    console.warn('Could not fetch marketing page banners:', err);
  }

  // 2. Secondary: Banners uploaded in Admin → Catalog (category / brand)
  if ((pageType === 'category' || pageType === 'brand') && slug) {
    const entity =
      pageType === 'category'
        ? await getCategoryBySlug(slug).catch(() => null)
        : await getBrandBySlug(slug).catch(() => null);
    const desktop = !entity ? '' : 'bannerImage' in entity ? entity.bannerImage : entity.bannerDesktop;
    if (entity && desktop) {
      return [
        {
          id: `${pageType}-${entity.id}`,
          imageDesktop: desktop,
          imageUrl: desktop,
          imageMobile: entity.bannerMobile || desktop,
          link: `/${pageType}/${entity.slug}`,
          alt: entity.name,
          title: entity.name,
          headline: entity.name,
          tagline: entity.description || '',
          subtext: entity.description || '',
          bgColor: 'from-[#EAF2FC] via-white to-[#F6F9FD]'
        }
      ];
    }
  }

  const liveBrand = pageType === 'brand' && slug ? await getBrandBySlug(slug).catch(() => null) : null;

  return fetchOrMock(`/api/banners?type=${pageType}&slug=${slug || ''}`, () => {
    switch (pageType) {
      case 'category': {
        if (slug === 'respiratory-care') {
          return [
            {
              id: 'cat-resp-1',
              imageDesktop: '/images/bento_oxygen_conc_1793803384593.jpg',
              link: '/category/respiratory-care',
              alt: 'Respiratory & Oxygen Care',
              title: 'Clinical Respiratory Care & Oxygen Purity',
              tagline: 'Authorized Philips & ResMed 5L/10L Concentrators with GST Invoice',
              bgColor: 'from-[#EAF2FC] via-white to-[#F6F9FD]'
            },
            {
              id: 'cat-resp-2',
              imageDesktop: '/images/bento_cpap_bipap_1793803386703.jpg',
              link: '/category/sleep-apnea-therapy',
              alt: 'CPAP & BiPAP Devices',
              title: 'Advanced Sleep Apnea & Non-Invasive Ventilation',
              tagline: 'ResMed AirSense 10 & BMC G2S Auto-Titrating Units',
              bgColor: 'from-[#EAF2FC] via-white to-[#F6F9FD]'
            }
          ];
        }
        if (slug === 'dental-handpieces-motors') {
          return [
            {
              id: 'cat-dent-1',
              imageDesktop: '/images/bento_dental_equip_1793803387280.jpg',
              link: '/category/dental-handpieces-motors',
              alt: 'Precision Dental Operatory',
              title: 'Japanese & European Operatory Handpieces',
              tagline: 'NSK Pana-Air FX & Waldent LED High-Speed Turbines with Official Warranty',
              bgColor: 'from-[#EAF2FC] via-white to-[#F6F9FD]'
            }
          ];
        }
        return [
          {
            id: `cat-${slug || 'default'}`,
            imageDesktop: '/images/hero_medical_sale_1793803411713.jpg',
            link: `/category/${slug || 'respiratory-care'}`,
            alt: 'Specialized Medical Range',
            title: 'Hospital-Grade Equipment & Consumables',
            tagline: '100% Genuine Certified Brands with Pan-India Cold-Chain Shipping',
            bgColor: 'from-[#EAF2FC] via-white to-[#F6F9FD]'
          }
        ];
      }

      case 'brand': {
        const brandName = liveBrand ? liveBrand.name : 'Authorized Brand';
        return [
          {
            id: `brand-${slug || 'default'}`,
            imageDesktop: '/images/hero_medical_sale_1793803411713.jpg',
            link: `/brand/${slug || ''}`,
            alt: `${brandName} Products`,
            title: `${brandName} Official Catalog`,
            tagline: 'Direct Manufacturer Warranty & Input Tax Credit (GST) Guaranteed',
            bgColor: 'from-[#EAF2FC] via-white to-[#F6F9FD]'
          }
        ];
      }

      case 'brands': {
        return [
          {
            id: 'brands-dir-1',
            imageDesktop: '/images/hero_dental_setup_1793803412433.jpg',
            link: '/brands',
            alt: 'Authorized Brands Directory',
            title: '100+ Authorized Global Healthcare Brands',
            tagline: 'Browse by Alphabetical Directory with Guaranteed Batch Traceability',
            bgColor: 'from-[#EAF2FC] via-white to-[#F6F9FD]'
          }
        ];
      }

      case 'best-sellers': {
        return [
          {
            id: 'bestseller-1',
            imageDesktop: '/images/bento_oxygen_conc_1793803384593.jpg',
            link: '/best-sellers',
            alt: 'Best Selling Medical Equipment',
            title: 'Best Selling Medical & Dental Equipment',
            tagline: 'Trusted by 15,000+ Clinics, Hospitals & Practitioners Across India',
            bgColor: 'from-[#EAF2FC] via-white to-[#F6F9FD]'
          }
        ];
      }

      case 'new-arrivals': {
        return [
          {
            id: 'newarrivals-1',
            imageDesktop: '/images/bento_dental_equip_1793803387280.jpg',
            link: '/new-arrivals',
            alt: 'New Arrivals',
            title: 'New Clinical Innovations & Fresh Batches',
            tagline: 'Latest Imported Autoclaves, NiTi Endodontic Files & Digital Sensors',
            bgColor: 'from-[#EAF2FC] via-white to-[#F6F9FD]'
          }
        ];
      }

      case 'hot-selling': {
        return [
          {
            id: 'hotselling-1',
            imageDesktop: '/images/bento_monitoring_vitals_1793803410618.jpg',
            link: '/hot-selling',
            alt: 'Hot Selling Clinical Equipment',
            title: 'Hot Selling Clinical Operatory Units',
            tagline: 'High-Demand Hospital Disposables, Oxygen Plants & Handpieces',
            bgColor: 'from-[#EAF2FC] via-white to-[#F6F9FD]'
          }
        ];
      }

      case 'deals': {
        return [
          {
            id: 'deals-1',
            imageDesktop: '/images/bento_oxygen_conc_1793803384593.jpg',
            link: '/deals',
            alt: 'Deals of the Day',
            title: 'Flash Clinical Deals & Clearance Offers',
            tagline: 'Save Up to 45% on Authorized Diagnostic & Operatory Equipment',
            bgColor: 'from-[#EAF2FC] via-white to-[#F6F9FD]'
          }
        ];
      }

      case 'offers': {
        return [
          {
            id: 'offers-1',
            imageDesktop: '/images/rental_composed_banner_1793803411001.jpg',
            link: '/offers',
            alt: 'Exclusive Clinical Offers',
            title: 'Mega Clinic Setup & Bulk B2B Offers',
            tagline: 'Special Tier Discounts, Easy EMI & GST Invoice Benefits',
            bgColor: 'from-[#EAF2FC] via-white to-[#F6F9FD]'
          }
        ];
      }

      default: {
        return [
          {
            id: 'generic-1',
            imageDesktop: '/images/hero_medical_sale_1793803411713.jpg',
            link: '/category/respiratory-care',
            alt: 'Buy Denmed Store',
            title: 'Pan-India Medical & Dental Direct',
            tagline: '100% Genuine Equipment with Doorstep Delivery',
            bgColor: 'from-[#EAF2FC] via-white to-[#F6F9FD]'
          }
        ];
      }
    }
  });
}

/**
 * Home Page Hero Banner Slider Data (1920x500 desktop + 800x600 mobile)
 */
export async function getHeroBanners(): Promise<HeroBanner[]> {
  try {
    const live = await getMarketingHeroBanners();
    if (live && live.length > 0) return live;
  } catch (err) {
    console.warn('Could not fetch marketing hero banners:', err);
  }

  return fetchOrMock('/api/hero-banners', () => [
    {
      id: 'hero-oxygen-concentrators',
      imageDesktop: '/images/hero_oxygen_desktop_1920x500.jpg',
      imageMobile: '/images/hero_oxygen_mobile_800x600.jpg',
      link: '/category/oxygen-concentrators',
      alt: 'Breathe Easy at Home - Oxygen Concentrators Up to 30% OFF - Shop Now'
    },
    {
      id: 'hero-medical-rentals',
      imageDesktop: '/images/hero_rental_desktop_1920x500.jpg',
      imageMobile: '/images/hero_rental_mobile_800x600.jpg',
      link: '/rent',
      alt: 'Medical Equipment on Rent - Delivered Anywhere in India - Rent Now'
    },
    {
      id: 'hero-dental-clinic-setup',
      imageDesktop: '/images/hero_dental_desktop_1920x500.jpg',
      imageMobile: '/images/hero_dental_mobile_800x600.jpg',
      link: '/category/dental-equipment',
      alt: 'Set Up Your Dental Clinic - Chairs, Handpieces, Autoclaves & More - Explore Now'
    },
    {
      id: 'hero-home-sleep-test',
      imageDesktop: '/images/hero_sleeptest_desktop_1920x500.jpg',
      imageMobile: '/images/hero_sleeptest_mobile_800x600.jpg',
      link: '/sleep-test',
      alt: 'Snoring? Feeling Tired All Day? Get a Sleep Study at Home - Enquire Now'
    }
  ]);
}

export const api = {
  getHeroBanners
};

export * from './cms';


