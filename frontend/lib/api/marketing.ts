import { BACKEND_API_URL } from '../config';
import type { Coupon, HeroBanner, PageBanner } from '@/types';

export interface HomepageSectionConfig {
  id: string;
  key: string;
  title: string;
  visible: boolean;
  sortOrder: number;
  targetIds?: string[];
  selectedIds?: string[];
  configurableType?: string;
}

export interface HomepageConfigData {
  announcementStrip: string;
  sections: HomepageSectionConfig[];
}

const DEFAULT_ANNOUNCEMENT =
  'Free Pan-India Technician Installation on Dental Chairs & ICU Beds · 100% GST Input Tax Credit · Same-Day Delhi NCR Rental Dispatch';

const DEFAULT_SECTIONS: HomepageSectionConfig[] = [
  { id: '1', key: 'hero', title: 'Featured Clinical Solutions', visible: true, sortOrder: 1 },
  { id: '2', key: 'trust_strip', title: 'Why Clinics & Families Trust Buy Denmed', visible: true, sortOrder: 2 },
  { id: '3', key: 'top_categories', title: 'Shop by Medical Department', visible: true, sortOrder: 3 },
  { id: '4', key: 'featured_categories', title: 'Clinical & Homecare Essentials', visible: true, sortOrder: 4 },
  { id: '5', key: 'deal_of_the_day', title: 'Deal of the Day', visible: true, sortOrder: 5 },
  { id: '6', key: 'hot_selling', title: 'Hot Selling Medical Devices', visible: true, sortOrder: 6 },
  { id: '7', key: 'rental_section', title: 'Medical Equipment on Rent', visible: true, sortOrder: 7 },
  { id: '8', key: 'shop_by_brand', title: 'Authorized Global Brands', visible: true, sortOrder: 8 },
  { id: '9', key: 'shop_by_need', title: '', visible: true, sortOrder: 9 },
  { id: '10', key: 'sleep_test_banner', title: 'Book a Home Sleep Apnea Study', visible: true, sortOrder: 10 },
  { id: '11', key: 'new_arrivals', title: 'New Arrivals', visible: true, sortOrder: 11 },
  { id: '12', key: 'why_buy_denmed', title: 'Biomedical Service & Warranty Guarantee', visible: true, sortOrder: 12 },
  { id: '13', key: 'testimonials', title: 'Trusted by 4,200+ Doctors & Caregivers', visible: true, sortOrder: 13 },
  { id: '14', key: 'blog', title: 'Clinical Buyer Guides', visible: true, sortOrder: 14 },
];

const DEFAULT_HERO_BANNERS: HeroBanner[] = [
  {
    id: 'hero-oxygen-concentrators',
    imageDesktop: '/images/hero_oxygen_desktop_1920x500.jpg',
    imageMobile: '/images/hero_oxygen_mobile_800x600.jpg',
    link: '/category/oxygen-concentrators',
    alt: 'Breathe Easy at Home - Oxygen Concentrators Up to 30% OFF - Shop Now',
  },
  {
    id: 'hero-medical-rentals',
    imageDesktop: '/images/hero_rental_desktop_1920x500.jpg',
    imageMobile: '/images/hero_rental_mobile_800x600.jpg',
    link: '/rent',
    alt: 'Medical Equipment on Rent - Delivered Anywhere in India - Rent Now',
  },
  {
    id: 'hero-dental-clinic-setup',
    imageDesktop: '/images/hero_dental_desktop_1920x500.jpg',
    imageMobile: '/images/hero_dental_mobile_800x600.jpg',
    link: '/category/dental-equipment',
    alt: 'Set Up Your Dental Clinic - Chairs, Handpieces, Autoclaves & More - Explore Now',
  },
  {
    id: 'hero-home-sleep-test',
    imageDesktop: '/images/hero_sleeptest_desktop_1920x500.jpg',
    imageMobile: '/images/hero_sleeptest_mobile_800x600.jpg',
    link: '/sleep-test',
    alt: 'Snoring? Feeling Tired All Day? Get a Sleep Study at Home - Enquire Now',
  },
];

/**
 * Fetch dynamic homepage layout config (announcement strip + section ordering / visibility)
 */
export async function getHomepageConfig(): Promise<HomepageConfigData> {
  try {
    const res = await fetch(`${BACKEND_API_URL}/banners/public/homepage-config`, {
      cache: 'no-store',
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const body = await res.json();
    if (body?.success && body.data) {
      return {
        announcementStrip: body.data.announcementStrip || DEFAULT_ANNOUNCEMENT,
        sections: Array.isArray(body.data.sections) && body.data.sections.length > 0
          ? body.data.sections.map((s: any) => ({
              id: String(s.id),
              key: s.key,
              title: s.title || '',
              visible: s.visible !== false,
              sortOrder: s.sortOrder || 1,
              selectedIds: Array.isArray(s.selectedIds) ? s.selectedIds : [],
              targetIds: Array.isArray(s.selectedIds) ? s.selectedIds : [],
              configurableType: s.configurableType || 'none',
            }))
          : DEFAULT_SECTIONS,
      };
    }
  } catch (err) {
    console.warn('Falling back to default homepage config:', err);
  }

  return {
    announcementStrip: DEFAULT_ANNOUNCEMENT,
    sections: DEFAULT_SECTIONS,
  };
}

/**
 * Fetch dynamic hero banners scheduled in Admin
 */
export async function getHeroBanners(): Promise<HeroBanner[]> {
  try {
    const res = await fetch(`${BACKEND_API_URL}/banners/public/hero`, {
      cache: 'no-store',
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const body = await res.json();
    if (body?.success && Array.isArray(body.data) && body.data.length > 0) {
      return body.data.map((b: any) => ({
        id: String(b.id),
        imageDesktop: b.desktopImageUrl || b.imageDesktop || '/images/hero_oxygen_desktop_1920x500.jpg',
        imageMobile: b.mobileImageUrl || b.imageMobile || b.desktopImageUrl || '/images/hero_oxygen_mobile_800x600.jpg',
        link: b.linkUrl || b.link || '/',
        alt: b.altText || b.title || 'Hero Banner',
      }));
    }
  } catch (err) {
    console.warn('Falling back to default hero banners:', err);
  }

  return DEFAULT_HERO_BANNERS;
}

/**
 * Fetch dynamic page banners scheduled in Admin
 */
export async function getPageBanners(
  pageType: string,
  slug?: string,
  targetId?: string
): Promise<PageBanner[]> {
  try {
    const query = new URLSearchParams();
    if (pageType) query.set('pageType', pageType);
    if (slug) query.set('slug', slug);
    if (targetId) query.set('targetId', targetId);

    const res = await fetch(`${BACKEND_API_URL}/banners/public/page?${query.toString()}`, {
      cache: 'no-store',
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const body = await res.json();
    if (body?.success && Array.isArray(body.data) && body.data.length > 0) {
      return body.data.map((b: any) => ({
        id: String(b.id),
        imageDesktop: b.desktopImageUrl || b.imageDesktop,
        imageMobile: b.mobileImageUrl || b.imageMobile || b.desktopImageUrl,
        imageUrl: b.desktopImageUrl || b.imageUrl,
        link: b.linkUrl || b.link || '/',
        linkUrl: b.linkUrl || b.link || '/',
        alt: b.altText || b.title || '',
        title: b.title || '',
        headline: b.title || '',
        tagline: b.tagline || b.targetLabel || '',
        subtext: b.tagline || b.subtext || (b.targetLabel ? `Promotions & equipment for ${b.targetLabel}` : ''),
        bgColor: b.bgColor || 'from-[#EAF2FC] via-white to-[#F6F9FD]',
        ctaText: 'Explore Catalog',
        ctaLink: b.linkUrl || '#catalog',
        pageType: b.pageType,
        slug: b.targetId || slug,
      }));
    }
  } catch (err) {
    console.warn('Falling back to default page banners:', err);
  }

  return [];
}

/**
 * Validate and apply coupon code via backend PostgreSQL coupons database
 */
export async function applyCouponViaBackend(
  code: string,
  subtotal: number
): Promise<{
  valid: boolean;
  coupon?: Coupon;
  discountAmount: number;
  message: string;
}> {
  try {
    const res = await fetch(`${BACKEND_API_URL}/coupons/apply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: code.trim().toUpperCase(),
        orderTotalPaise: Math.round(subtotal * 100),
      }),
    });

    const body = await res.json();
    if (res.ok && body?.success && body.data) {
      const data = body.data;
      return {
        valid: true,
        coupon: {
          code: data.code,
          description: `${data.type === 'percentage' ? 'Percentage' : 'Flat'} Discount Coupon`,
          discountType: data.type === 'percentage' ? 'percentage' : 'fixed',
          discountValue: data.discountRupees,
          minOrderValue: 0,
          expiresAt: '',
        },
        discountAmount: data.discountRupees,
        message: `Coupon ${data.code} applied successfully! You save ₹${data.discountRupees.toLocaleString('en-IN')}`,
      };
    }

    return {
      valid: false,
      discountAmount: 0,
      message: body?.error?.message || 'Invalid or inactive coupon code',
    };
  } catch (err: any) {
    return {
      valid: false,
      discountAmount: 0,
      message: err?.message || 'Could not validate coupon. Please check connection.',
    };
  }
}

