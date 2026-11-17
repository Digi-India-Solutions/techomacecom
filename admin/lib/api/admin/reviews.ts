import type { ProductReview, ReviewStatus } from '@/types/admin';
import { mockDelay } from './client';
import { PRODUCT_IMAGES } from './mockData';

let reviewsStore: ProductReview[] = [
  {
    id: 'rev-1',
    productId: 'prod-oxy-5l',
    productName: 'MedixPulse 5L Stationary Oxygen Concentrator',
    productImage: PRODUCT_IMAGES.oxygenConcentrator,
    reviewerName: 'Sandeep Kulkarni',
    reviewerMobileMasked: '+91 98XXX XX412',
    rating: 5,
    title: 'Whisper-quiet 24/7 operation for my father',
    comment: 'We ordered this for post-hospital recovery at home. Purity stays at 94% even at 4 LPM and the humidifier bottle works smoothly.',
    images: [PRODUCT_IMAGES.oxygenConcentrator],
    verifiedBuyer: true,
    status: 'pending',
    createdAt: '2026-11-17T06:15:00Z',
  },
  {
    id: 'rev-2',
    productId: 'prod-dental-chair',
    productName: 'DentaLux 5000 Electromechanical Dental Chair Unit',
    productImage: PRODUCT_IMAGES.dentalChair,
    reviewerName: 'Dr. Neha Verma',
    reviewerMobileMasked: '+91 97XXX XX901',
    rating: 5,
    title: 'Smooth actuator and bright sensor LED lamp',
    comment: 'Technician arrived within 24 hours of chair delivery and completed plumbing + compressor testing cleanly.',
    images: [PRODUCT_IMAGES.dentalChair],
    verifiedBuyer: true,
    status: 'pending',
    createdAt: '2026-11-16T18:30:00Z',
  },
  {
    id: 'rev-3',
    productId: 'prod-wheelchair',
    productName: 'Karma ErgoLite Ultra-Light Folding Wheelchair',
    productImage: PRODUCT_IMAGES.wheelchair,
    reviewerName: 'Arjun Nair',
    reviewerMobileMasked: '+91 99XXX XX118',
    rating: 4,
    title: 'Fits easily in hatchback car boot',
    comment: 'Very light at around 10 kg. Cushioning is firm and comfortable for senior citizens.',
    images: [],
    verifiedBuyer: true,
    status: 'approved',
    createdAt: '2026-11-14T10:15:00Z',
  },
  {
    id: 'rev-4',
    productId: 'prod-patient-monitor',
    productName: 'MediCore Med-Vitals 7000 5-Para Patient Monitor',
    productImage: PRODUCT_IMAGES.patientMonitor,
    reviewerName: 'City Pulse Nursing Home',
    reviewerMobileMasked: '+91 98XXX XX772',
    rating: 5,
    title: 'Accurate NIBP and clear ECG screen',
    comment: 'Using 3 units in our step-down ICU ward. Battery easily lasts 3.5–4 hours during power backup switchovers.',
    images: [PRODUCT_IMAGES.patientMonitor],
    verifiedBuyer: true,
    status: 'approved',
    createdAt: '2026-11-12T12:00:00Z',
  },
  {
    id: 'rev-5',
    productId: 'prod-oxy-5l',
    productName: 'MedixPulse 5L Stationary Oxygen Concentrator',
    productImage: PRODUCT_IMAGES.oxygenConcentrator,
    reviewerName: 'Unknown Guest',
    reviewerMobileMasked: '+91 90XXX XX009',
    rating: 1,
    title: 'Spam link comment',
    comment: 'Buy cheap medicines from external site xyz...',
    images: [],
    verifiedBuyer: false,
    status: 'rejected',
    rejectionReason: 'Promotional spam / unverified purchase',
    createdAt: '2026-11-10T08:45:00Z',
  },
];

export async function listReviews(status?: 'all' | ReviewStatus): Promise<ProductReview[]> {
  await mockDelay(120);
  const list = status && status !== 'all' ? reviewsStore.filter((r) => r.status === status) : reviewsStore;
  return structuredClone(list);
}

export async function getAllReviewsForSummary(): Promise<ProductReview[]> {
  return structuredClone(reviewsStore);
}

export async function updateReviewStatus(
  id: string,
  status: ReviewStatus,
  rejectionReason?: string
): Promise<ProductReview> {
  await mockDelay(130);
  const existing = reviewsStore.find((r) => r.id === id);
  if (!existing) throw new Error('Review not found');
  const updated: ProductReview = {
    ...existing,
    status,
    rejectionReason: status === 'rejected' ? rejectionReason : undefined,
  };
  reviewsStore = reviewsStore.map((r) => (r.id === id ? updated : r));
  return structuredClone(updated);
}

export async function editReviewText(
  id: string,
  title: string,
  comment: string
): Promise<ProductReview> {
  await mockDelay(130);
  const existing = reviewsStore.find((r) => r.id === id);
  if (!existing) throw new Error('Review not found');
  const updated: ProductReview = { ...existing, title, comment };
  reviewsStore = reviewsStore.map((r) => (r.id === id ? updated : r));
  return structuredClone(updated);
}

export async function deleteReview(id: string): Promise<void> {
  await mockDelay(110);
  reviewsStore = reviewsStore.filter((r) => r.id !== id);
}

export async function bulkUpdateReviews(
  ids: string[],
  status: 'approved' | 'rejected',
  rejectionReason?: string
): Promise<void> {
  await mockDelay(160);
  reviewsStore = reviewsStore.map((r) =>
    ids.includes(r.id) ? { ...r, status, rejectionReason } : r
  );
}
