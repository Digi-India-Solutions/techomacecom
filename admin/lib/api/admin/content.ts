import type { BlogPost, CmsPage, FaqItem } from '@/types/admin';
import { mockDelay, slugify } from './client';
import { PRODUCT_IMAGES } from './mockData';

let cmsPagesStore: CmsPage[] = [
  {
    id: 'pg-about',
    slug: 'about',
    title: 'About Buy Denmed',
    contentHtml:
      '<h3>India’s Trusted Medical &amp; Dental Equipment Partner</h3><p>Buy Denmed connects clinics, hospitals, and homecare families with ISO-certified diagnostic, respiratory, and dental equipment — available for both outright purchase and flexible monthly rentals.</p>',
    seoTitle: 'About Buy Denmed | Medical & Dental Equipment Store',
    seoDescription: 'Learn about Buy Denmed’s biomedical engineering support, pan-India installation, and home ICU rental fleet.',
    updatedAt: '2026-11-10T12:00:00Z',
  },
  {
    id: 'pg-contact',
    slug: 'contact',
    title: 'Contact Us',
    contentHtml: '<p>Reach our Biomedical Sales &amp; Rental Support desk Monday–Saturday, 9 AM to 8 PM IST at +91 11 4089 2210 or care@buydenmed.in.</p>',
    seoTitle: 'Contact Buy Denmed Support',
    seoDescription: 'Phone, WhatsApp, and Okhla Fulfillment Hub contact details for Buy Denmed.',
    updatedAt: '2026-11-05T09:30:00Z',
  },
  {
    id: 'pg-shipping',
    slug: 'shipping-policy',
    title: 'Shipping Policy',
    contentHtml: '<p>Standard clinical devices ship within 24 hours via BlueDart Air and Delhivery. Heavy equipment like Dental Chairs and ICU Beds ship with insured freight and technician assembly.</p>',
    seoTitle: 'Shipping & Delivery Policy | Buy Denmed',
    seoDescription: 'Pan-India delivery timelines and insured biomedical freight information.',
    updatedAt: '2026-10-28T14:00:00Z',
  },
  {
    id: 'pg-returns',
    slug: 'returns-refunds',
    title: 'Returns & Refunds',
    contentHtml: '<p>Eligible unopened equipment may be returned within 7 days of delivery. Transit-damaged devices qualify for instant replacement or full refund.</p>',
    seoTitle: 'Returns & Refunds Policy | Buy Denmed',
    seoDescription: 'Return window, reverse pickup, and Razorpay/bank refund timelines.',
    updatedAt: '2026-10-24T11:00:00Z',
  },
  {
    id: 'pg-rental-terms',
    slug: 'rental-terms',
    title: 'Rental Terms',
    contentHtml: '<p>All medical rentals require a refundable security deposit, which is returned after the equipment is picked up and inspected.</p>',
    seoTitle: 'Medical Equipment Rental Terms | Buy Denmed',
    seoDescription: 'Security deposit, extension, and sanitisation guarantees.',
    updatedAt: '2026-11-01T16:15:00Z',
  },
  {
    id: 'pg-privacy',
    slug: 'privacy-policy',
    title: 'Privacy Policy',
    contentHtml: '<p>Customer details and any doctor prescriptions shared with us are used strictly for order fulfilment and clinical compliance.</p>',
    seoTitle: 'Privacy Policy | Buy Denmed',
    seoDescription: 'How Buy Denmed protects customer and clinical data.',
    updatedAt: '2026-10-12T10:00:00Z',
  },
  {
    id: 'pg-terms',
    slug: 'terms-of-use',
    title: 'Terms & Conditions',
    contentHtml: '<p>Purchases and rentals on Buy Denmed are governed by Indian commercial and medical device distribution regulations.</p>',
    seoTitle: 'Terms & Conditions | Buy Denmed',
    seoDescription: 'Terms of sale, warranty, and equipment usage.',
    updatedAt: '2026-10-12T10:00:00Z',
  },
];

let faqsStore: FaqItem[] = [
  {
    id: 'faq-1',
    group: 'General',
    question: 'Do you provide GST tax invoices for clinics and hospitals?',
    answer: 'Yes. Enter your company name and 15-digit GSTIN at checkout to automatically receive a B2B tax invoice eligible for 100% Input Tax Credit.',
    sortOrder: 1,
    active: true,
  },
  {
    id: 'faq-2',
    group: 'General',
    question: 'Is installation included for dental chairs and ICU beds?',
    answer: 'Yes, a certified Buy Denmed biomedical technician installs and calibrates heavy equipment at your clinic or home at no extra charge.',
    sortOrder: 2,
    active: true,
  },
  {
    id: 'faq-3',
    group: 'Rental',
    question: 'What documents are required to rent an oxygen concentrator or ICU bed?',
    answer: 'We require Aadhaar/Address Proof for all rentals, plus a doctor prescription for oxygen concentrators and BiPAP machines.',
    sortOrder: 1,
    active: true,
  },
  {
    id: 'faq-4',
    group: 'Rental',
    question: 'When is the security deposit refunded?',
    answer: 'Once the unit is picked up and passes physical inspection at our warehouse, the deposit is refunded within 24–48 business hours.',
    sortOrder: 2,
    active: true,
  },
  {
    id: 'faq-5',
    group: 'Sleep Test',
    question: 'How does the Home Level-3 Sleep Apnea Study work?',
    answer: 'Our sleep technician delivers and demonstrates a compact respiratory polygraphy kit at your home, collects it the next morning, and delivers a pulmonologist-signed report within 48 hours.',
    sortOrder: 1,
    active: true,
  },
];

let blogStore: BlogPost[] = [
  {
    id: 'blog-1',
    title: '5L vs 10L Oxygen Concentrator: How to Choose for Home Care',
    slug: '5l-vs-10l-oxygen-concentrator-home-care-guide',
    coverImageUrl: PRODUCT_IMAGES.oxygenConcentrator,
    excerpt: 'Understand flow rate requirements, oxygen purity percentages, and noise levels before buying or renting.',
    contentHtml: '<p>Choosing between a 5 LPM and 10 LPM stationary oxygen concentrator depends strictly on the patient’s prescribed LPM flow rate and whether bleed-in to a BiPAP ventilator is needed.</p>',
    category: 'Respiratory Care',
    tags: ['Oxygen Concentrator', 'Home ICU', 'Buyer Guide'],
    status: 'published',
    publishDate: '2026-11-08',
    seoTitle: '5L vs 10L Oxygen Concentrator Guide | Buy Denmed',
    seoDescription: 'Clinical comparison of 5L and 10L oxygen concentrators for Indian homecare.',
    author: 'Dr. Anjali Deshpande',
    updatedAt: '2026-11-08T10:00:00Z',
  },
  {
    id: 'blog-2',
    title: 'Class B vs Class N Autoclaves: Dental Clinic Compliance Checklist',
    slug: 'class-b-vs-class-n-autoclaves-dental-clinic',
    coverImageUrl: PRODUCT_IMAGES.autoclave,
    excerpt: 'Why pre-vacuum Class B sterilization is mandatory for hollow handpieces and pouched surgical kits.',
    contentHtml: '<p>Modern dental practices require triple pre-vacuum steam penetration to sterilize wrapped instruments and turbine handpieces reliably.</p>',
    category: 'Dental Sterilization',
    tags: ['Autoclave', 'Dental Clinic', 'Infection Control'],
    status: 'draft',
    publishDate: '2026-11-22',
    seoTitle: 'Class B vs Class N Autoclave Guide | Buy Denmed',
    seoDescription: 'Dental sterilization standards and Class B vacuum autoclave selection guide.',
    author: 'Rohan Malhotra',
    updatedAt: '2026-11-16T15:20:00Z',
  },
];

export async function listCmsPages(): Promise<CmsPage[]> {
  await mockDelay(100);
  return structuredClone(cmsPagesStore);
}
export async function saveCmsPage(page: CmsPage): Promise<CmsPage> {
  await mockDelay(130);
  const updated = { ...page, updatedAt: new Date().toISOString() };
  cmsPagesStore = cmsPagesStore.map((p) => (p.id === page.id ? updated : p));
  return structuredClone(updated);
}

export async function listFaqs(): Promise<FaqItem[]> {
  await mockDelay(100);
  return structuredClone([...faqsStore].sort((a, b) => a.sortOrder - b.sortOrder));
}
export async function saveFaq(faq: Omit<FaqItem, 'id' | 'sortOrder'> & { id?: string }): Promise<FaqItem[]> {
  await mockDelay(120);
  if (faq.id) {
    faqsStore = faqsStore.map((f) => (f.id === faq.id ? { ...f, ...faq } : f));
  } else {
    faqsStore.push({ ...faq, id: `faq-${Date.now()}`, sortOrder: faqsStore.length + 1 });
  }
  return listFaqs();
}
export async function reorderFaqs(next: FaqItem[]): Promise<FaqItem[]> {
  await mockDelay(90);
  faqsStore = next.map((f, idx) => ({ ...f, sortOrder: idx + 1 }));
  return listFaqs();
}
export async function deleteFaq(id: string): Promise<FaqItem[]> {
  await mockDelay(90);
  faqsStore = faqsStore.filter((f) => f.id !== id);
  return listFaqs();
}

export async function listBlogPosts(): Promise<BlogPost[]> {
  await mockDelay(100);
  return structuredClone(blogStore);
}
export async function saveBlogPost(
  post: Omit<BlogPost, 'id' | 'updatedAt'> & { id?: string }
): Promise<BlogPost[]> {
  await mockDelay(140);
  const now = new Date().toISOString();
  if (post.id) {
    blogStore = blogStore.map((p) =>
      p.id === post.id ? { ...p, ...post, slug: post.slug || slugify(post.title), updatedAt: now } : p
    );
  } else {
    blogStore.unshift({
      ...post,
      id: `blog-${Date.now()}`,
      slug: post.slug || slugify(post.title),
      updatedAt: now,
    });
  }
  return listBlogPosts();
}
export async function deleteBlogPost(id: string): Promise<BlogPost[]> {
  await mockDelay(100);
  blogStore = blogStore.filter((p) => p.id !== id);
  return listBlogPosts();
}
