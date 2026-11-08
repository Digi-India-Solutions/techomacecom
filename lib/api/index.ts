import { 
  Product, 
  Category, 
  Brand, 
  Coupon, 
  BlogPost, 
  SleepTestPackage, 
  Order, 
  ActiveRental, 
  Rental,
  Review, 
  FilterOptions, 
  Enquiry,
  PageBanner
} from '@/types';
import {
  MOCK_CATEGORIES,
  MOCK_BRANDS,
  MOCK_PRODUCTS,
  MOCK_COUPONS,
  MOCK_BLOG_POSTS,
  MOCK_SLEEP_TEST_PACKAGES,
  MOCK_ORDERS,
  MOCK_ACTIVE_RENTALS,
  MOCK_RENTALS,
  MOCK_REVIEWS
} from '@/lib/mock/data';

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

/**
 * Fetch all categories or single category
 */
export async function getCategories(): Promise<Category[]> {
  return fetchOrMock('/api/categories', () => [...MOCK_CATEGORIES]);
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  return fetchOrMock(`/api/categories/${slug}`, () => {
    return MOCK_CATEGORIES.find((c) => c.slug === slug) || null;
  });
}

/**
 * Fetch all brands or single brand
 */
export async function getBrands(): Promise<Brand[]> {
  return fetchOrMock('/api/brands', () => [...MOCK_BRANDS]);
}

export async function getBrandBySlug(slug: string): Promise<Brand | null> {
  return fetchOrMock(`/api/brands/${slug}`, () => {
    return MOCK_BRANDS.find((b) => b.slug === slug) || null;
  });
}

/**
 * Fetch products with extensive filter & sort capabilities
 */
export async function getProducts(options: FilterOptions = {}): Promise<{
  products: Product[];
  total: number;
  page: number;
  totalPages: number;
}> {
  return fetchOrMock(
    `/api/products?${new URLSearchParams(
      Object.entries(options).reduce((acc, [k, v]) => {
        if (v !== undefined) acc[k] = String(v);
        return acc;
      }, {} as Record<string, string>)
    ).toString()}`,
    () => {
      let filtered = [...MOCK_PRODUCTS];

      // Category filter
      if (options.categoryId) {
        filtered = filtered.filter((p) => p.categoryId === options.categoryId);
      }

      // Subcategory slug filter
      if (options.subCategorySlug) {
        filtered = filtered.filter((p) => p.subCategorySlug === options.subCategorySlug);
      }

      // Brand filter (multiple)
      if (options.brandIds && options.brandIds.length > 0) {
        filtered = filtered.filter((p) => options.brandIds!.includes(p.brandId));
      }

      // Price filter
      if (options.minPrice !== undefined) {
        filtered = filtered.filter((p) => p.price >= options.minPrice!);
      }
      if (options.maxPrice !== undefined) {
        filtered = filtered.filter((p) => p.price <= options.maxPrice!);
      }

      // Discount filter
      if (options.minDiscount !== undefined) {
        filtered = filtered.filter((p) => p.discountPercentage >= options.minDiscount!);
      }

      // In stock only
      if (options.inStockOnly) {
        filtered = filtered.filter((p) => p.inStock);
      }

      // Rent only
      if (options.rentOnly) {
        filtered = filtered.filter((p) => p.rentEnabled);
      }

      // EMI only
      if (options.emiOnly) {
        filtered = filtered.filter((p) => p.emiEnabled);
      }

      // Search query
      if (options.query) {
        const q = options.query.toLowerCase().trim();
        filtered = filtered.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            p.brandName.toLowerCase().includes(q) ||
            p.categoryName.toLowerCase().includes(q) ||
            p.subCategory.toLowerCase().includes(q) ||
            p.sku.toLowerCase().includes(q) ||
            p.shortDescription.toLowerCase().includes(q)
        );
      }

      // Sort
      switch (options.sortBy) {
        case 'price-asc':
          filtered.sort((a, b) => a.price - b.price);
          break;
        case 'price-desc':
          filtered.sort((a, b) => b.price - a.price);
          break;
        case 'newest':
          filtered.sort((a, b) => (b.isNewArrival ? 1 : 0) - (a.isNewArrival ? 1 : 0));
          break;
        case 'discount':
          filtered.sort((a, b) => b.discountPercentage - a.discountPercentage);
          break;
        case 'popularity':
        default:
          filtered.sort((a, b) => (b.isBestSeller ? 1 : 0) - (a.isBestSeller ? 1 : 0) || b.reviewsCount - a.reviewsCount);
          break;
      }

      const total = filtered.length;
      const page = options.page || 1;
      const limit = options.limit || 12;
      const totalPages = Math.ceil(total / limit);
      const start = (page - 1) * limit;
      const products = filtered.slice(start, start + limit);

      return {
        products,
        total,
        page,
        totalPages
      };
    }
  );
}

/**
 * Fetch a single product by slug
 */
export async function getProductBySlug(slug: string): Promise<Product | null> {
  return fetchOrMock(`/api/products/${slug}`, () => {
    return MOCK_PRODUCTS.find((p) => p.slug === slug) || null;
  });
}

/**
 * Fetch related products
 */
export async function getRelatedProducts(productId: string, categoryId: string, limit = 4): Promise<Product[]> {
  return fetchOrMock(`/api/products/${productId}/related`, () => {
    return MOCK_PRODUCTS.filter((p) => p.id !== productId && p.categoryId === categoryId).slice(0, limit);
  });
}

/**
 * Deals of the day
 */
export async function getDealsOfTheDay(): Promise<Product[]> {
  return fetchOrMock('/api/deals', () => {
    return MOCK_PRODUCTS.filter((p) => p.isDealOfDay);
  });
}

/**
 * Best sellers
 */
export async function getBestSellers(): Promise<Product[]> {
  return fetchOrMock('/api/best-sellers', () => {
    return MOCK_PRODUCTS.filter((p) => p.isBestSeller);
  });
}

/**
 * New arrivals
 */
export async function getNewArrivals(): Promise<Product[]> {
  return fetchOrMock('/api/new-arrivals', () => {
    return MOCK_PRODUCTS.filter((p) => p.isNewArrival);
  });
}

/**
 * Rentable products
 */
export async function getRentableProducts(): Promise<Product[]> {
  return fetchOrMock('/api/rentals', () => {
    return MOCK_PRODUCTS.filter((p) => p.rentEnabled);
  });
}

/**
 * Search autocomplete suggestions
 */
export async function searchSuggestions(query: string): Promise<{
  products: { id: string; name: string; slug: string; price: number; thumbnail: string; brandName: string }[];
  categories: { id: string; name: string; slug: string }[];
  brands: { id: string; name: string; slug: string }[];
}> {
  const q = query.toLowerCase().trim();
  if (!q) {
    return { products: [], categories: [], brands: [] };
  }

  const matchedProducts = MOCK_PRODUCTS.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.brandName.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q)
  )
    .slice(0, 5)
    .map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      price: p.price,
      thumbnail: p.thumbnail,
      brandName: p.brandName
    }));

  const matchedCategories = MOCK_CATEGORIES.filter((c) =>
    c.name.toLowerCase().includes(q)
  )
    .slice(0, 3)
    .map((c) => ({ id: c.id, name: c.name, slug: c.slug }));

  const matchedBrands = MOCK_BRANDS.filter((b) =>
    b.name.toLowerCase().includes(q)
  )
    .slice(0, 3)
    .map((b) => ({ id: b.id, name: b.name, slug: b.slug }));

  return {
    products: matchedProducts,
    categories: matchedCategories,
    brands: matchedBrands
  };
}

/**
 * Check Indian pincode serviceability
 */
export async function checkPincodeServiceability(pincode: string): Promise<{
  serviceable: boolean;
  city: string;
  state: string;
  deliveryDays: string;
  codAvailable: boolean;
}> {
  // Common city pincode lookup simulation for Indian tier 1 & 2 cities
  const cleanPin = pincode.trim();
  if (!/^\d{6}$/.test(cleanPin)) {
    return {
      serviceable: false,
      city: '',
      state: '',
      deliveryDays: '',
      codAvailable: false
    };
  }

  const prefix = cleanPin.substring(0, 2);
  let city = 'Delhi NCR';
  let state = 'Delhi';
  let deliveryDays = '1-2 Days (Fast Dispatch)';

  if (prefix === '11') {
    city = 'New Delhi';
    state = 'Delhi';
    deliveryDays = 'Same Day / Next Day Delivery';
  } else if (prefix === '20' || prefix === '12') {
    city = 'Noida / Gurugram';
    state = 'NCR';
    deliveryDays = '1-2 Days Delivery';
  } else if (prefix === '40') {
    city = 'Mumbai';
    state = 'Maharashtra';
    deliveryDays = '2-3 Days Delivery';
  } else if (prefix === '56') {
    city = 'Bengaluru';
    state = 'Karnataka';
    deliveryDays = '2-3 Days Delivery';
  } else if (prefix === '50') {
    city = 'Hyderabad';
    state = 'Telangana';
    deliveryDays = '2-3 Days Delivery';
  } else if (prefix === '60') {
    city = 'Chennai';
    state = 'Tamil Nadu';
    deliveryDays = '2-4 Days Delivery';
  } else if (prefix === '70') {
    city = 'Kolkata';
    state = 'West Bengal';
    deliveryDays = '3-4 Days Delivery';
  } else if (prefix === '38' || prefix === '39') {
    city = 'Ahmedabad';
    state = 'Gujarat';
    deliveryDays = '2-3 Days Delivery';
  } else {
    city = 'Regional Hub';
    state = 'India';
    deliveryDays = '3-5 Days via Air Cargo';
  }

  return {
    serviceable: true,
    city,
    state,
    deliveryDays,
    codAvailable: true
  };
}

/**
 * Coupon validation
 */
export async function applyCoupon(code: string, subtotal: number): Promise<{
  valid: boolean;
  coupon?: Coupon;
  discountAmount: number;
  message: string;
}> {
  const normalized = code.trim().toUpperCase();
  const coupon = MOCK_COUPONS.find((c) => c.code === normalized);

  if (!coupon) {
    return {
      valid: false,
      discountAmount: 0,
      message: 'Invalid coupon code. Try DENMED10 or CLINIC500.'
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
export async function submitBulkEnquiry(data: Enquiry): Promise<{ success: boolean; message: string; enquiryId: string }> {
  return fetchOrMock('/api/enquiries/bulk', () => {
    return {
      success: true,
      message: 'Thank you! Our institutional medical equipment specialist will call you within 2 hours with wholesale quotations.',
      enquiryId: `ENQ-${Date.now().toString().slice(-6)}`
    };
  }, {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

/**
 * Universal enquiry submission (Sleep Test, Equipment, Rentals, Support)
 */
export async function submitEnquiry(data: {
  type: string;
  fullName?: string;
  name?: string;
  phone?: string;
  mobile?: string;
  city?: string;
  preferredDate?: string;
  testType?: string;
  message?: string;
  consent?: boolean;
  honeypot?: string;
  [key: string]: any;
}): Promise<{ success: boolean; message: string; enquiryId: string }> {
  return fetchOrMock('/api/enquiries', () => {
    // Honeypot spam trap: if filled, silently accept without processing
    if (data.honeypot && data.honeypot.trim() !== '') {
      return {
        success: true,
        message: 'Your enquiry has been received.',
        enquiryId: `ENQ-BOT-${Date.now().toString().slice(-6)}`
      };
    }

    const generatedId = `ENQ-ST-${Date.now().toString().slice(-6)}`;
    return {
      success: true,
      message: 'Thank you! Your sleep study enquiry has been submitted. Our clinical sleep specialist will call you within 30 minutes.',
      enquiryId: generatedId
    };
  }, {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

/**
 * Mobile OTP Authentication UI helpers
 */
export async function requestMobileOtp(phone: string): Promise<{ success: boolean; message: string; demoOtp: string }> {
  return fetchOrMock('/api/auth/otp/request', () => {
    return {
      success: true,
      message: `OTP sent successfully to +91 ${phone}`,
      demoOtp: '123456' // For instant testing
    };
  }, {
    method: 'POST',
    body: JSON.stringify({ phone })
  });
}

export async function verifyMobileOtp(phone: string, otp: string): Promise<{ success: boolean; token?: string; user?: any; message: string }> {
  return fetchOrMock('/api/auth/otp/verify', () => {
    if (otp === '123456' || otp.length === 6) {
      return {
        success: true,
        token: 'bdm_jwt_sample_token_' + Date.now(),
        user: {
          id: 'usr-1',
          name: 'Dr. Vikram Malhotra',
          email: 'dr.vikram@malhotraclinic.com',
          phone: phone,
          role: 'doctor' as const,
          degree: 'BDS, MDS (Prosthodontics)',
          registrationNumber: 'DCI-DEL-18920',
          addresses: [
            {
              id: 'addr-1',
              type: 'Clinic' as const,
              name: 'Dr. Vikram Malhotra',
              clinicHospitalName: 'Malhotra Multi-Speciality Dental & Respiratory Center',
              phone: '+91 ' + phone,
              addressLine1: 'Suite 204, Metro Plaza, Sector 18',
              pincode: '201301',
              city: 'Noida',
              state: 'Uttar Pradesh',
              isDefault: true
            }
          ],
          gstDetails: {
            gstin: '09AAACM1234F1Z8',
            legalBusinessName: 'Malhotra Healthcare Pvt Ltd',
            isVerified: true
          }
        },
        message: 'Welcome back, Dr. Malhotra!'
      };
    }
    return {
      success: false,
      message: 'Invalid verification code. Please enter 123456.'
    };
  }, {
    method: 'POST',
    body: JSON.stringify({ phone, otp })
  });
}

/**
 * Orders
 */
export async function getOrders(): Promise<Order[]> {
  return fetchOrMock('/api/orders', () => [...MOCK_ORDERS]);
}

export async function getOrderById(orderId: string): Promise<Order | null> {
  return fetchOrMock(`/api/orders/${orderId}`, () => {
    return MOCK_ORDERS.find((o) => o.id === orderId || o.orderNumber === orderId) || null;
  });
}

/**
 * Rentals
 */
export async function getActiveRentals(): Promise<ActiveRental[]> {
  return fetchOrMock('/api/rentals/active', () => [...MOCK_ACTIVE_RENTALS]);
}

export async function getRentals(): Promise<Rental[]> {
  return fetchOrMock('/api/rentals', () => [...MOCK_RENTALS]);
}

export async function getRentalById(id: string): Promise<Rental | null> {
  return fetchOrMock(`/api/rentals/${id}`, () => {
    return MOCK_RENTALS.find((r) => r.id === id || r.bookingNumber === id) || null;
  });
}

export async function createRentalBooking(data: Partial<Rental>): Promise<{ success: boolean; rental: Rental; message: string }> {
  return fetchOrMock(
    '/api/rentals/book',
    () => {
      const newRental: Rental = {
        id: `rnt-${Date.now()}`,
        bookingNumber: `BDM-RNT-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`,
        product: data.product!,
        plan: data.plan!,
        duration: data.duration || 1,
        startDate: data.startDate || new Date().toISOString().split('T')[0],
        endDate: data.endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        deposit: data.deposit || 0,
        rentAmount: data.rentAmount || 0,
        charges: data.charges || { deliveryPickup: 500, gst: 0 },
        status: 'pending_approval',
        address: data.address!,
        kycDocuments: data.kycDocuments || { verified: false },
        payments: data.payments || [],
        createdAt: new Date().toISOString()
      };
      MOCK_RENTALS.unshift(newRental);
      return {
        success: true,
        rental: newRental,
        message: 'Rental booking created successfully! Biomedical verification and KYC approval in progress.'
      };
    },
    {
      method: 'POST',
      body: JSON.stringify(data)
    }
  );
}

export async function requestRentalExtension(
  rentalId: string,
  extraDuration: number,
  extraRent: number,
  paymentMethod = 'Online Razorpay'
): Promise<{ success: boolean; rental: Rental; message: string }> {
  return fetchOrMock(
    `/api/rentals/${rentalId}/extend`,
    () => {
      const rental = MOCK_RENTALS.find((r) => r.id === rentalId || r.bookingNumber === rentalId);
      if (!rental) throw new Error('Rental not found');

      // Calculate extended end date
      const currentEnd = new Date(rental.endDate);
      if (rental.plan.type === 'daily') {
        currentEnd.setDate(currentEnd.getDate() + extraDuration);
      } else if (rental.plan.type === 'weekly') {
        currentEnd.setDate(currentEnd.getDate() + extraDuration * 7);
      } else {
        currentEnd.setMonth(currentEnd.getMonth() + extraDuration);
      }
      const newEndDate = currentEnd.toISOString().split('T')[0];

      rental.duration += extraDuration;
      rental.endDate = newEndDate;
      rental.rentAmount += extraRent;
      rental.status = 'active';
      rental.extensionRequestedDuration = undefined;

      rental.payments.push({
        id: `pay-ext-${Date.now()}`,
        amount: extraRent,
        date: new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
        method: paymentMethod,
        type: 'extension',
        status: 'paid',
        transactionId: `pay_ext_${Math.floor(1000000 + Math.random() * 9000000)}`
      });

      return {
        success: true,
        rental,
        message: `Rental successfully extended to ${newEndDate}. Receipt generated.`
      };
    },
    {
      method: 'POST',
      body: JSON.stringify({ extraDuration, extraRent, paymentMethod })
    }
  );
}

export async function scheduleRentalReturn(
  rentalId: string,
  pickupDate: string
): Promise<{ success: boolean; rental: Rental; message: string }> {
  return fetchOrMock(
    `/api/rentals/${rentalId}/schedule-return`,
    () => {
      const rental = MOCK_RENTALS.find((r) => r.id === rentalId || r.bookingNumber === rentalId);
      if (!rental) throw new Error('Rental not found');

      rental.status = 'return_scheduled';
      rental.returnPickupDate = pickupDate;

      return {
        success: true,
        rental,
        message: `Doorstep return pickup scheduled for ${pickupDate}. Our logistics partner will arrive with sanitized packing material.`
      };
    },
    {
      method: 'POST',
      body: JSON.stringify({ pickupDate })
    }
  );
}

/**
 * Blog
 */
export async function getBlogPosts(): Promise<BlogPost[]> {
  return fetchOrMock('/api/blog', () => [...MOCK_BLOG_POSTS]);
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  return fetchOrMock(`/api/blog/${slug}`, () => {
    return MOCK_BLOG_POSTS.find((b) => b.slug === slug) || null;
  });
}

/**
 * Sleep test packages
 */
export async function getSleepTestPackages(): Promise<SleepTestPackage[]> {
  return fetchOrMock('/api/sleep-test/packages', () => [...MOCK_SLEEP_TEST_PACKAGES]);
}

/**
 * Reviews (admin-moderated)
 */
// In-memory array for user submitted reviews during runtime
const submittedReviewsStore: Review[] = [];
// In-memory OTP storage for review verification
const pendingReviewOtps: Record<string, { otp: string; expiresAt: number }> = {};

/**
 * Fetch approved reviews for a specific product
 */
export async function getProductReviews(productId: string): Promise<Review[]> {
  return fetchOrMock(`/api/products/${productId}/reviews`, () => {
    // Return only approved reviews matching the productId
    const staticReviews = MOCK_REVIEWS.filter(
      (r) => r.productId === productId && r.status === 'approved'
    );

    const runtimeApproved = submittedReviewsStore.filter(
      (r) => r.productId === productId && r.status === 'approved'
    );

    const all = [...runtimeApproved, ...staticReviews];

    // If specific product has no direct reviews, fallback to general approved medical reviews
    // so the review section looks active and clinical
    if (all.length === 0) {
      return MOCK_REVIEWS.filter((r) => r.status === 'approved').slice(0, 3);
    }

    return all;
  });
}

/**
 * Send 6-digit OTP to mobile for review submission spam prevention
 */
export async function sendReviewOtp(mobile: string): Promise<{
  success: boolean;
  message: string;
  simulatedOtp?: string;
}> {
  return fetchOrMock(
    '/api/reviews/send-otp',
    () => {
      const cleanMobile = mobile.replace(/\D/g, '');
      if (!/^[6-9]\d{9}$/.test(cleanMobile)) {
        throw new Error('Please enter a valid 10-digit Indian mobile number');
      }

      // Generate 6-digit OTP (for testing/demo: default 123456 or random)
      const otp = '123456';
      pendingReviewOtps[cleanMobile] = {
        otp,
        expiresAt: Date.now() + 5 * 60 * 1000 // 5 minutes validity
      };

      return {
        success: true,
        message: `OTP sent successfully to +91 ${cleanMobile}. (Use test code 123456)`,
        simulatedOtp: otp
      };
    },
    {
      method: 'POST',
      body: JSON.stringify({ mobile })
    }
  );
}

/**
 * Verify 6-digit review OTP
 */
export async function verifyReviewOtp(
  mobile: string,
  otp: string
): Promise<{ success: boolean; message: string }> {
  return fetchOrMock(
    '/api/reviews/verify-otp',
    () => {
      const cleanMobile = mobile.replace(/\D/g, '');
      const record = pendingReviewOtps[cleanMobile];

      // Allow 123456 as master test OTP or match stored OTP
      if (otp.trim() === '123456' || (record && record.otp === otp.trim())) {
        delete pendingReviewOtps[cleanMobile];
        return {
          success: true,
          message: 'Mobile number verified successfully'
        };
      }

      throw new Error('Invalid OTP. Please check the 6-digit code or enter 123456.');
    },
    {
      method: 'POST',
      body: JSON.stringify({ mobile, otp })
    }
  );
}

/**
 * Submit product review (requires admin moderation, starts with status 'pending')
 */
export async function submitReview(data: {
  productId: string;
  name: string;
  mobile?: string;
  rating: number;
  title?: string;
  comment: string;
  images?: string[];
  isVerifiedBuyer?: boolean;
}): Promise<{ success: boolean; reviewId: string; message: string }> {
  return fetchOrMock(
    `/api/products/${data.productId}/reviews`,
    () => {
      const reviewId = `rev-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const newReview: Review = {
        id: reviewId,
        productId: data.productId,
        name: data.name.trim(),
        authorName: data.name.trim(),
        mobile: data.mobile?.trim(),
        rating: data.rating,
        title: data.title?.trim() || 'Verified Product Feedback',
        comment: data.comment.trim(),
        images: data.images || [],
        isVerifiedBuyer: data.isVerifiedBuyer ?? true,
        verifiedBuyer: data.isVerifiedBuyer ?? true,
        status: 'pending', // NOT shown publicly until admin approves
        createdAt: new Date().toISOString(),
        date: new Date().toISOString().split('T')[0],
        helpfulCount: 0
      };

      submittedReviewsStore.unshift(newReview);

      return {
        success: true,
        reviewId,
        message: 'Thank you! Your review has been submitted and will be visible after approval.'
      };
    },
    {
      method: 'POST',
      body: JSON.stringify(data)
    }
  );
}

export async function getFeaturedReviews(): Promise<Review[]> {
  return fetchOrMock('/api/reviews/featured', () => [...MOCK_REVIEWS]);
}

/**
 * Page Banners for Listing Pages (Category, Brand, Offers, Deals, Best Sellers, etc.)
 */
export async function getPageBanners(
  pageType: string,
  slug?: string
): Promise<PageBanner[]> {
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
              bgColor: 'from-orange-50 via-white to-amber-50/50'
            },
            {
              id: 'cat-resp-2',
              imageDesktop: '/images/bento_cpap_bipap_1793803386703.jpg',
              link: '/category/sleep-apnea-therapy',
              alt: 'CPAP & BiPAP Devices',
              title: 'Advanced Sleep Apnea & Non-Invasive Ventilation',
              tagline: 'ResMed AirSense 10 & BMC G2S Auto-Titrating Units',
              bgColor: 'from-blue-50 via-white to-orange-50/40'
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
              bgColor: 'from-orange-50 via-white to-gray-50'
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
            bgColor: 'from-orange-50 via-white to-orange-50/30'
          }
        ];
      }

      case 'brand': {
        const brand = MOCK_BRANDS.find((b) => b.slug === slug);
        const brandName = brand ? brand.name : 'Authorized Brand';
        return [
          {
            id: `brand-${slug || 'default'}`,
            imageDesktop: '/images/hero_medical_sale_1793803411713.jpg',
            link: `/brand/${slug || ''}`,
            alt: `${brandName} Products`,
            title: `${brandName} Official Catalog`,
            tagline: 'Direct Manufacturer Warranty & Input Tax Credit (GST) Guaranteed',
            bgColor: 'from-neutral-50 via-white to-orange-50/40'
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
            bgColor: 'from-orange-50 via-white to-neutral-50'
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
            bgColor: 'from-orange-50 via-white to-amber-50/40'
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
            bgColor: 'from-blue-50 via-white to-orange-50/40'
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
            bgColor: 'from-orange-50 via-white to-red-50/30'
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
            bgColor: 'from-amber-50 via-white to-orange-50/50'
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
            bgColor: 'from-orange-50 via-white to-emerald-50/30'
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
            bgColor: 'from-orange-50 via-white to-gray-50'
          }
        ];
      }
    }
  });
}
