import type {
  Coupon,
  DealOfTheDayItem,
  HeroBanner,
  HomepageSection,
  PageBanner,
} from '@/types/admin';
import { adminDelete, adminGet, adminPost, adminPut, mockDelay } from './client';
import { PRODUCT_IMAGES } from './mockData';

let heroBannersStore: HeroBanner[] = [
  {
    id: 'hb-1',
    title: 'Home ICU & Respiratory Care — Rent or Buy',
    desktopImageUrl: PRODUCT_IMAGES.oxygenConcentrator,
    mobileImageUrl: PRODUCT_IMAGES.oxygenConcentrator,
    linkUrl: '/category/respiratory-care',
    altText: 'MedixPulse 5L Oxygen Concentrators starting ₹4,500/month on rent',
    startDate: '2026-11-01',
    endDate: '2026-12-31',
    active: true,
    sortOrder: 1,
  },
  {
    id: 'hb-2',
    title: 'Turnkey Dental Clinic Chairs — 0% EMI Available',
    desktopImageUrl: PRODUCT_IMAGES.dentalChair,
    mobileImageUrl: PRODUCT_IMAGES.dentalChair,
    linkUrl: '/category/dental-equipment',
    altText: 'DentaLux 5000 Dental Chair with free pan-India installation',
    startDate: '2026-11-10',
    endDate: '2026-12-15',
    active: true,
    sortOrder: 2,
  },
];

let pageBannersStore: PageBanner[] = [
  {
    id: 'pb-1',
    pageType: 'Category',
    targetId: 'cat-respiratory',
    targetLabel: 'Respiratory Care',
    title: 'Certified 5L & 10L Oxygen Concentrators',
    desktopImageUrl: PRODUCT_IMAGES.oxygenConcentrator,
    mobileImageUrl: PRODUCT_IMAGES.oxygenConcentrator,
    linkUrl: '/category/respiratory-care',
    startDate: '2026-11-01',
    endDate: '2026-12-31',
    active: true,
    sortOrder: 1,
  },
  {
    id: 'pb-2',
    pageType: 'Deal of the Day',
    title: '24-Hour Clinic Sterilization & Operatory Deals',
    desktopImageUrl: PRODUCT_IMAGES.autoclave,
    mobileImageUrl: PRODUCT_IMAGES.autoclave,
    linkUrl: '/deals',
    startDate: '2026-11-15',
    endDate: '2026-11-30',
    active: true,
    sortOrder: 2,
  },
];

let announcementStrip =
  'Free Pan-India Technician Installation on Dental Chairs & ICU Beds · 100% GST Input Tax Credit · Same-Day Delhi NCR Rental Dispatch';

let homepageSectionsStore: HomepageSection[] = [
  { id: 'hs-1', key: 'hero', defaultName: 'Hero', title: 'Featured Clinical Solutions', visible: true, sortOrder: 1, configurableType: 'none', selectedIds: [] },
  { id: 'hs-2', key: 'trust_strip', defaultName: 'Trust Strip', title: 'Why Clinics & Families Trust Buy Denmed', visible: true, sortOrder: 2, configurableType: 'none', selectedIds: [] },
  { id: 'hs-3', key: 'top_categories', defaultName: 'Top Categories', title: 'Shop by Medical Department', visible: true, sortOrder: 3, configurableType: 'categories', selectedIds: ['cat-respiratory', 'cat-dental', 'cat-patient-monitoring', 'cat-hospital-mobility'] },
  { id: 'hs-4', key: 'featured_categories', defaultName: 'Featured Categories', title: 'Clinical & Homecare Essentials', visible: true, sortOrder: 4, configurableType: 'categories', selectedIds: ['cat-oxygen-therapy', 'cat-operatory'] },
  { id: 'hs-5', key: 'deal_of_the_day', defaultName: 'Deal of the Day', title: 'Deal of the Day', visible: true, sortOrder: 5, configurableType: 'products', selectedIds: ['prod-dental-chair'] },
  { id: 'hs-6', key: 'hot_selling', defaultName: 'Hot Selling', title: 'Hot Selling Medical Devices', visible: true, sortOrder: 6, configurableType: 'products', selectedIds: ['prod-oxy-5l', 'prod-patient-monitor', 'prod-wheelchair'] },
  { id: 'hs-7', key: 'rental_section', defaultName: 'Rental Section', title: 'Medical Equipment on Rent', visible: true, sortOrder: 7, configurableType: 'products', selectedIds: ['prod-oxy-5l', 'prod-icu-bed', 'prod-patient-monitor'] },
  { id: 'hs-8', key: 'shop_by_brand', defaultName: 'Shop by Brand', title: 'Authorized Global Brands', visible: true, sortOrder: 8, configurableType: 'none', selectedIds: [] },
  { id: 'hs-9', key: 'shop_by_need', defaultName: 'Shop by Need', title: 'Shop by Care Setting', visible: true, sortOrder: 9, configurableType: 'none', selectedIds: [] },
  { id: 'hs-10', key: 'sleep_test_banner', defaultName: 'Sleep Test Banner', title: 'Book a Home Sleep Apnea Study', visible: true, sortOrder: 10, configurableType: 'none', selectedIds: [] },
  { id: 'hs-11', key: 'new_arrivals', defaultName: 'New Arrivals', title: 'New Arrivals', visible: true, sortOrder: 11, configurableType: 'products', selectedIds: ['prod-patient-monitor', 'prod-autoclave'] },
  { id: 'hs-12', key: 'why_buy_denmed', defaultName: 'Why Buy Denmed', title: 'Biomedical Service & Warranty Guarantee', visible: true, sortOrder: 12, configurableType: 'none', selectedIds: [] },
  { id: 'hs-13', key: 'testimonials', defaultName: 'Testimonials', title: 'Trusted by 4,200+ Doctors & Caregivers', visible: true, sortOrder: 13, configurableType: 'none', selectedIds: [] },
  { id: 'hs-14', key: 'blog', defaultName: 'Blog', title: 'Clinical Buyer Guides', visible: true, sortOrder: 14, configurableType: 'none', selectedIds: [] },
];

let couponsStore: Coupon[] = [
  {
    id: 'cpn-1',
    code: 'CLINIC2000',
    type: 'flat',
    value: 2000,
    minOrderValue: 25000,
    applicableTo: 'all',
    applicableTargetIds: [],
    usageLimitTotal: 200,
    usageLimitPerCustomer: 2,
    usedCount: 38,
    totalDiscountGiven: 76000,
    startDate: '2026-11-01',
    endDate: '2026-12-31',
    active: true,
    firstOrderOnly: false,
  },
  {
    id: 'cpn-2',
    code: 'WELCOME10',
    type: 'percentage',
    value: 10,
    maxDiscount: 3500,
    minOrderValue: 8000,
    applicableTo: 'categories',
    applicableTargetIds: ['cat-respiratory', 'cat-hospital-mobility'],
    usageLimitTotal: 500,
    usageLimitPerCustomer: 1,
    usedCount: 94,
    totalDiscountGiven: 184200,
    startDate: '2026-10-01',
    endDate: '2026-12-31',
    active: true,
    firstOrderOnly: true,
  },
];

let dealsStore: DealOfTheDayItem[] = [
  {
    id: 'deal-1',
    productId: 'prod-dental-chair',
    productName: 'DentaLux 5000 Electromechanical Dental Chair Unit',
    productImage: PRODUCT_IMAGES.dentalChair,
    regularPrice: 185000,
    dealPrice: 169900,
    startTime: '2026-11-17T00:00',
    endTime: '2026-11-18T23:59',
    active: true,
  },
  {
    id: 'deal-2',
    productId: 'prod-oxy-5l',
    productName: 'MedixPulse 5L Stationary Oxygen Concentrator',
    productImage: PRODUCT_IMAGES.oxygenConcentrator,
    regularPrice: 42500,
    dealPrice: 39500,
    startTime: '2026-11-17T00:00',
    endTime: '2026-11-19T23:59',
    active: false,
  },
];

// Hero Banners (backed by PostgreSQL banners table where placement = 'hero')
export async function listHeroBanners(): Promise<HeroBanner[]> {
  try {
    const data = await adminGet<HeroBanner[]>('/admin/banners/hero');
    if (Array.isArray(data)) {
      heroBannersStore = data;
      return data;
    }
  } catch (err) {
    console.warn('Falling back to local hero banners store:', err);
  }
  return structuredClone([...heroBannersStore].sort((a, b) => a.sortOrder - b.sortOrder));
}

export async function saveHeroBanner(
  banner: Omit<HeroBanner, 'id' | 'sortOrder'> & { id?: string }
): Promise<HeroBanner[]> {
  try {
    let data: HeroBanner[];
    if (banner.id && !banner.id.startsWith('hb-')) {
      data = await adminPut<HeroBanner[]>(`/admin/banners/hero/${banner.id}`, banner);
    } else {
      data = await adminPost<HeroBanner[]>('/admin/banners/hero', banner);
    }
    if (Array.isArray(data)) {
      heroBannersStore = data;
      return data;
    }
  } catch (err) {
    console.warn('Falling back to local save for hero banner:', err);
    if (banner.id) {
      heroBannersStore = heroBannersStore.map((b) => (b.id === banner.id ? { ...b, ...banner } : b));
    } else {
      heroBannersStore.push({ ...banner, id: `hb-${Date.now()}`, sortOrder: heroBannersStore.length + 1 });
    }
  }
  return listHeroBanners();
}

export async function reorderHeroBanners(ordered: HeroBanner[]): Promise<HeroBanner[]> {
  try {
    const data = await adminPut<HeroBanner[]>('/admin/banners/hero/reorder', {
      ordered: ordered.map((b, i) => ({ id: b.id, sortOrder: i + 1 })),
    });
    if (Array.isArray(data)) {
      heroBannersStore = data;
      return data;
    }
  } catch (err) {
    console.warn('Falling back to local reorder for hero banners:', err);
    heroBannersStore = ordered.map((b, i) => ({ ...b, sortOrder: i + 1 }));
  }
  return listHeroBanners();
}

export async function deleteHeroBanner(id: string): Promise<HeroBanner[]> {
  try {
    const data = await adminDelete<HeroBanner[]>(`/admin/banners/hero/${id}`);
    if (Array.isArray(data)) {
      heroBannersStore = data;
      return data;
    }
  } catch (err) {
    console.warn('Falling back to local delete for hero banner:', err);
    heroBannersStore = heroBannersStore.filter((b) => b.id !== id);
  }
  return listHeroBanners();
}

// Page Banners (backed by PostgreSQL banners table where placement != 'hero')
export async function listPageBanners(pageType?: string): Promise<PageBanner[]> {
  try {
    const query = pageType && pageType !== 'all' ? `?pageType=${encodeURIComponent(pageType)}` : '';
    const data = await adminGet<PageBanner[]>(`/admin/banners/page${query}`);
    if (Array.isArray(data)) {
      pageBannersStore = data;
      return data;
    }
  } catch (err) {
    console.warn('Falling back to local page banners store:', err);
  }
  return structuredClone([...pageBannersStore].sort((a, b) => a.sortOrder - b.sortOrder));
}

export async function savePageBanner(
  banner: Omit<PageBanner, 'id' | 'sortOrder'> & { id?: string }
): Promise<PageBanner[]> {
  try {
    let data: PageBanner[];
    if (banner.id && !banner.id.startsWith('pb-')) {
      data = await adminPut<PageBanner[]>(`/admin/banners/page/${banner.id}`, banner);
    } else {
      data = await adminPost<PageBanner[]>('/admin/banners/page', banner);
    }
    if (Array.isArray(data)) {
      pageBannersStore = data;
      return data;
    }
  } catch (err) {
    console.warn('Falling back to local save for page banner:', err);
    if (banner.id) {
      pageBannersStore = pageBannersStore.map((b) => (b.id === banner.id ? { ...b, ...banner } : b));
    } else {
      pageBannersStore.push({ ...banner, id: `pb-${Date.now()}`, sortOrder: pageBannersStore.length + 1 });
    }
  }
  return listPageBanners();
}

export async function deletePageBanner(id: string): Promise<PageBanner[]> {
  try {
    const data = await adminDelete<PageBanner[]>(`/admin/banners/page/${id}`);
    if (Array.isArray(data)) {
      pageBannersStore = data;
      return data;
    }
  } catch (err) {
    console.warn('Falling back to local delete for page banner:', err);
    pageBannersStore = pageBannersStore.filter((b) => b.id !== id);
  }
  return listPageBanners();
}

// Homepage Sections (backed by PostgreSQL homepage_sections and settings tables)
export async function getHomepageConfig(): Promise<{
  announcementStrip: string;
  sections: HomepageSection[];
}> {
  try {
    const data = await adminGet<{ announcementStrip: string; sections: HomepageSection[] }>(
      '/admin/banners/homepage-config'
    );
    if (data && Array.isArray(data.sections)) {
      announcementStrip = data.announcementStrip ?? announcementStrip;
      homepageSectionsStore = data.sections;
      return data;
    }
  } catch (err) {
    console.warn('Falling back to local homepage config store:', err);
  }
  return {
    announcementStrip,
    sections: structuredClone([...homepageSectionsStore].sort((a, b) => a.sortOrder - b.sortOrder)),
  };
}

export async function saveHomepageConfig(params: {
  announcementStrip: string;
  sections: HomepageSection[];
}): Promise<void> {
  try {
    const data = await adminPut<{ announcementStrip: string; sections: HomepageSection[] }>(
      '/admin/banners/homepage-config',
      params
    );
    if (data && Array.isArray(data.sections)) {
      announcementStrip = data.announcementStrip ?? params.announcementStrip;
      homepageSectionsStore = data.sections;
      return;
    }
  } catch (err) {
    console.warn('Falling back to local save for homepage config:', err);
    announcementStrip = params.announcementStrip;
    homepageSectionsStore = params.sections.map((s, idx) => ({ ...s, sortOrder: idx + 1 }));
  }
}

// Coupons (backed by PostgreSQL coupons & coupon_redemptions tables)
export async function listCoupons(): Promise<Coupon[]> {
  try {
    const data = await adminGet<Coupon[]>('/admin/coupons');
    if (Array.isArray(data)) {
      couponsStore = data;
      return data;
    }
  } catch (err) {
    console.warn('Falling back to local coupons store:', err);
  }
  return structuredClone(couponsStore);
}

export async function saveCoupon(
  coupon: Omit<Coupon, 'id' | 'usedCount' | 'totalDiscountGiven'> & { id?: string }
): Promise<Coupon[]> {
  try {
    let data: Coupon[];
    if (coupon.id && !coupon.id.startsWith('cpn-')) {
      data = await adminPut<Coupon[]>(`/admin/coupons/${coupon.id}`, coupon);
    } else {
      data = await adminPost<Coupon[]>('/admin/coupons', coupon);
    }
    if (Array.isArray(data)) {
      couponsStore = data;
      return data;
    }
  } catch (err) {
    console.warn('Falling back to local save for coupon:', err);
    if (coupon.id) {
      couponsStore = couponsStore.map((c) => (c.id === coupon.id ? { ...c, ...coupon } : c));
    } else {
      couponsStore.unshift({
        ...coupon,
        id: `cpn-${Date.now()}`,
        usedCount: 0,
        totalDiscountGiven: 0,
      });
    }
  }
  return listCoupons();
}

export async function deleteCoupon(id: string): Promise<Coupon[]> {
  try {
    const data = await adminDelete<Coupon[]>(`/admin/coupons/${id}`);
    if (Array.isArray(data)) {
      couponsStore = data;
      return data;
    }
  } catch (err) {
    console.warn('Falling back to local delete for coupon:', err);
    couponsStore = couponsStore.filter((c) => c.id !== id);
  }
  return listCoupons();
}

// Deals of the Day (backed by PostgreSQL deals & product_variants tables)
export async function listDeals(): Promise<DealOfTheDayItem[]> {
  try {
    const data = await adminGet<DealOfTheDayItem[]>('/admin/deals');
    if (Array.isArray(data)) {
      dealsStore = data;
      return data;
    }
  } catch (err) {
    console.warn('Falling back to local deals store:', err);
  }
  return structuredClone(dealsStore);
}

export async function saveDeal(
  deal: Omit<DealOfTheDayItem, 'id'> & { id?: string }
): Promise<DealOfTheDayItem[]> {
  try {
    let data: DealOfTheDayItem[];
    if (deal.id && !deal.id.startsWith('deal-')) {
      data = await adminPut<DealOfTheDayItem[]>(`/admin/deals/${deal.id}`, deal);
    } else {
      data = await adminPost<DealOfTheDayItem[]>('/admin/deals', deal);
    }
    if (Array.isArray(data)) {
      dealsStore = data;
      return data;
    }
  } catch (err) {
    console.warn('Falling back to local save for deal:', err);
    if (deal.id) {
      dealsStore = dealsStore.map((d) => (d.id === deal.id ? { ...d, ...deal } : d));
    } else {
      dealsStore.unshift({ ...deal, id: `deal-${Date.now()}` });
    }
  }
  return listDeals();
}

export async function deleteDeal(id: string): Promise<DealOfTheDayItem[]> {
  try {
    const data = await adminDelete<DealOfTheDayItem[]>(`/admin/deals/${id}`);
    if (Array.isArray(data)) {
      dealsStore = data;
      return data;
    }
  } catch (err) {
    console.warn('Falling back to local delete for deal:', err);
    dealsStore = dealsStore.filter((d) => d.id !== id);
  }
  return listDeals();
}
