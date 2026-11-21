import { BACKEND_API_URL } from '../config';
import type { BlogPost } from '@/types';

export interface CmsPageData {
  id: string;
  slug: string;
  title: string;
  contentHtml: string;
  seoTitle?: string;
  seoDescription?: string;
  isPublished?: boolean;
  updatedAt?: string;
}

export interface FaqData {
  id: string;
  group: string;
  question: string;
  answer: string;
  sortOrder: number;
  active: boolean;
}

const FALLBACK_PAGES: Record<string, CmsPageData> = {
  about: {
    id: '1',
    slug: 'about',
    title: 'About Buy Denmed',
    contentHtml:
      '<h3>India’s Trusted Medical &amp; Dental Equipment Partner</h3><p>Buy Denmed connects clinics, hospitals, and homecare families with ISO-certified diagnostic, respiratory, and dental equipment — available for both outright purchase and flexible monthly rentals.</p><p>Founded to bridge the trust and accessibility gap for healthcare practitioners across Indian cities, Buy Denmed delivers authorized equipment with verified GST invoices, calibrated warranties, and doorstep biomedical engineer support.</p>',
    seoTitle: 'About Buy Denmed | Medical & Dental Equipment Store',
    seoDescription: 'Learn about Buy Denmed’s biomedical engineering support, pan-India installation, and home ICU rental fleet.',
  },
  contact: {
    id: '2',
    slug: 'contact',
    title: 'Contact Us',
    contentHtml:
      '<p>Reach our Biomedical Sales &amp; Rental Support desk Monday–Saturday, 9 AM to 8 PM IST at <strong>+91 11 4089 2210</strong> or <strong>care@buydenmed.in</strong>.</p><p>Need assistance with order tracking, warranty claims, equipment rentals, or hospital tenders? Our dedicated biomedical engineers and customer desk are here to help.</p>',
    seoTitle: 'Contact Buy Denmed Support',
    seoDescription: 'Phone, WhatsApp, and Okhla Fulfillment Hub contact details for Buy Denmed.',
  },
  'shipping-policy': {
    id: '3',
    slug: 'shipping-policy',
    title: 'Shipping Policy',
    contentHtml:
      '<p>Standard clinical devices ship within 24 hours via BlueDart Air and Delhivery. Heavy equipment like Dental Chairs and ICU Beds ship with insured freight and technician assembly.</p><p>Orders with an invoice value exceeding ₹1,999 qualify for 100% Free Doorstep Delivery anywhere in India. Delhi NCR deliveries dispatch within 24 hours.</p>',
    seoTitle: 'Shipping & Delivery Policy | Buy Denmed',
    seoDescription: 'Pan-India delivery timelines and insured biomedical freight information.',
  },
  'returns-refunds': {
    id: '4',
    slug: 'returns-refunds',
    title: 'Returns & Refunds',
    contentHtml:
      '<p>Eligible unopened equipment may be returned within 7 days of delivery. Transit-damaged devices qualify for instant replacement or full refund.</p><p>Refunds are credited directly to the original payment source within 3-5 business days following our warehouse quality inspection.</p>',
    seoTitle: 'Returns & Refunds Policy | Buy Denmed',
    seoDescription: 'Return window, reverse pickup, and Razorpay/bank refund timelines.',
  },
  'rental-terms': {
    id: '5',
    slug: 'rental-terms',
    title: 'Rental Terms',
    contentHtml:
      '<p>All medical rentals require valid Aadhaar KYC and a refundable security deposit. Deposits are refunded within 48 hours of return inspection.</p><p>Renters bear zero repair or routine service expenses. If an oxygen concentrator or CPAP machine displays a fault, our technician provides an immediate replacement unit.</p>',
    seoTitle: 'Medical Equipment Rental Terms | Buy Denmed',
    seoDescription: 'Security deposit, KYC verification, extension, and sanitisation guarantees.',
  },
  'privacy-policy': {
    id: '6',
    slug: 'privacy-policy',
    title: 'Privacy Policy',
    contentHtml:
      '<p>Customer KYC documents and doctor prescriptions are encrypted and used strictly for clinical compliance and rental verification.</p><p>We collect practitioner details solely for order processing, logistics dispatch, and B2B tax invoice generation. Buy Denmed never sells clinical data to third parties.</p>',
    seoTitle: 'Privacy Policy | Buy Denmed',
    seoDescription: 'How Buy Denmed protects customer and clinical data.',
  },
  'terms-of-use': {
    id: '7',
    slug: 'terms-of-use',
    title: 'Terms & Conditions',
    contentHtml:
      '<p>Purchases and rentals on Buy Denmed are governed by Indian commercial and medical device distribution regulations.</p><p>All listed prices are in Indian Rupees (INR) and inclusive of GST unless specified. Valid GST invoices with appropriate HSN codes are provided for every purchase.</p>',
    seoTitle: 'Terms & Conditions | Buy Denmed',
    seoDescription: 'Terms of sale, warranty, and equipment usage.',
  },
};

const FALLBACK_FAQS: FaqData[] = [
  {
    id: '1',
    group: 'General',
    question: 'Do you provide GST tax invoices for clinics and hospitals?',
    answer: 'Yes. Enter your company name and 15-digit GSTIN at checkout to automatically receive a B2B tax invoice eligible for 100% Input Tax Credit.',
    sortOrder: 1,
    active: true,
  },
  {
    id: '2',
    group: 'General',
    question: 'How do I know the products on Buy Denmed are 100% genuine?',
    answer: 'Buy Denmed is an authorized distribution partner for global brands including Philips Respironics, ResMed, 3M ESPE, Dentsply Sirona, Omron, W&H, and Woodpecker. Every product arrives in tamper-evident manufacturer packaging with verifiable batch codes and holographic seals.',
    sortOrder: 2,
    active: true,
  },
  {
    id: '3',
    group: 'Rental',
    question: 'What documents are required to rent an oxygen concentrator or ICU bed?',
    answer: 'We require Aadhaar/Address Proof for all rentals, plus a doctor prescription for oxygen concentrators and BiPAP machines.',
    sortOrder: 1,
    active: true,
  },
  {
    id: '4',
    group: 'Sleep Test',
    question: 'How does the Home Level-3 Sleep Apnea Study work?',
    answer: 'Our sleep technician delivers and demonstrates a compact respiratory polygraphy kit at your home, collects it the next morning, and delivers a pulmonologist-signed report within 48 hours.',
    sortOrder: 1,
    active: true,
  },
];

const FALLBACK_BLOGS: BlogPost[] = [
  {
    id: '1',
    slug: 'dental-clinic-setup-checklist-india',
    title: 'Complete 2026 Dental Clinic Setup Checklist: Equipment, Compliance & Budgeting',
    excerpt: 'Step-by-step equipment guide for dentists setting up their first clinic in India: from dental chairs to autoclaves and AERB radiation permissions.',
    content: '<p>Setting up a modern dental operatory requires balancing clinical ergonomics, infection control regulations, and capital expenditure.</p>',
    author: 'Dr. Rohan Verma',
    authorRole: 'MDS Oral & Maxillofacial Surgery, Clinical Advisor',
    publishedAt: 'Oct 18, 2026',
    readTime: '6 min read',
    category: 'Dental Clinic Management',
    coverImage: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=800&q=80',
    tags: ['Dental Clinic', 'Equipment Setup', 'Autoclave', 'AERB'],
  },
  {
    id: '2',
    slug: '5l-vs-10l-oxygen-concentrator-home-care-guide',
    title: '5L vs 10L Oxygen Concentrator: How to Choose for Home Care',
    excerpt: 'Understand flow rate requirements, oxygen purity percentages, and noise levels before buying or renting.',
    content: '<p>Choosing between a 5 LPM and 10 LPM stationary oxygen concentrator depends strictly on the patient’s prescribed LPM flow rate and whether bleed-in to a BiPAP ventilator is needed.</p>',
    author: 'Dr. Anjali Deshpande',
    authorRole: 'Consultant Pulmonologist',
    publishedAt: 'Nov 8, 2026',
    readTime: '5 min read',
    category: 'Respiratory Care',
    coverImage: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=800&q=80',
    tags: ['Oxygen Concentrator', 'Home ICU', 'Buyer Guide'],
  },
];

const ALIAS_MAP: Record<string, string> = {
  shipping: 'shipping-policy',
  'shipping-policy': 'shipping-policy',
  returns: 'returns-refunds',
  'returns-refunds': 'returns-refunds',
  privacy: 'privacy-policy',
  'privacy-policy': 'privacy-policy',
  terms: 'terms-of-use',
  'terms-of-use': 'terms-of-use',
  about: 'about',
  contact: 'contact',
  'rental-terms': 'rental-terms',
};

export async function getCmsPage(rawSlug: string): Promise<CmsPageData | null> {
  const cleanSlug = rawSlug.trim().toLowerCase().replace(/^\/+/, '');
  const slug = ALIAS_MAP[cleanSlug] || cleanSlug;

  try {
    const res = await fetch(`${BACKEND_API_URL}/pages/${slug}`, {
      cache: 'no-store',
      headers: { Accept: 'application/json' },
    });
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        return json.data as CmsPageData;
      }
    }
  } catch (err) {
    console.warn(`[CMS API] Failed to fetch page "${slug}", falling back:`, err);
  }

  return FALLBACK_PAGES[slug] || null;
}

export async function listCmsPages(): Promise<CmsPageData[]> {
  try {
    const res = await fetch(`${BACKEND_API_URL}/pages`, {
      cache: 'no-store',
      headers: { Accept: 'application/json' },
    });
    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        return json.data as CmsPageData[];
      }
    }
  } catch (err) {
    console.warn('[CMS API] Failed to list pages:', err);
  }

  return Object.values(FALLBACK_PAGES);
}

export async function getFaqs(group?: string): Promise<FaqData[]> {
  const url = group && group !== 'All'
    ? `${BACKEND_API_URL}/faqs?group=${encodeURIComponent(group)}`
    : `${BACKEND_API_URL}/faqs`;

  try {
    const res = await fetch(url, {
      cache: 'no-store',
      headers: { Accept: 'application/json' },
    });
    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        return json.data as FaqData[];
      }
    }
  } catch (err) {
    console.warn('[CMS API] Failed to fetch FAQs:', err);
  }

  if (group && group !== 'All') {
    return FALLBACK_FAQS.filter((f) => f.group.toLowerCase() === group.toLowerCase());
  }
  return FALLBACK_FAQS;
}

export async function getLiveBlogPosts(): Promise<BlogPost[]> {
  try {
    const res = await fetch(`${BACKEND_API_URL}/blog`, {
      cache: 'no-store',
      headers: { Accept: 'application/json' },
    });
    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        return json.data as BlogPost[];
      }
    }
  } catch (err) {
    console.warn('[CMS API] Failed to fetch live blog posts:', err);
  }

  return FALLBACK_BLOGS;
}

export async function getLiveBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  const cleanSlug = String(slug).trim().toLowerCase().replace(/^\/+/, '');
  try {
    const res = await fetch(`${BACKEND_API_URL}/blog/${cleanSlug}`, {
      cache: 'no-store',
      headers: { Accept: 'application/json' },
    });
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        return json.data as BlogPost;
      }
    }
  } catch (err) {
    console.warn(`[CMS API] Failed to fetch live blog post "${cleanSlug}":`, err);
  }

  return FALLBACK_BLOGS.find((b) => b.slug === cleanSlug) || null;
}
