import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getProductBySlug } from '@/lib/api';
import RentalDetailClient from '@/components/rental/RentalDetailClient';

interface RentalProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: RentalProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product || !product.rentEnabled) {
    return {
      title: 'Rental Equipment Not Found | Buy Denmed',
      description: 'The requested medical rental equipment is not available.'
    };
  }

  const startingPrice = product.rentalPlans?.[0]?.price || product.rentPricePerMonth || 3500;
  const deposit = product.securityDeposit || 10000;

  return {
    title: `Rent ${product.name} from ₹${startingPrice.toLocaleString('en-IN')} | Buy Denmed`,
    description: `Rent ${product.name} anywhere in India. Flexible daily, weekly & monthly rental plans, ₹${deposit.toLocaleString('en-IN')} refundable security deposit, free doorstep calibration demo and emergency maintenance.`,
    openGraph: {
      title: `Rent ${product.name} | Buy Denmed India`,
      description: product.shortDescription,
      images: [{ url: product.thumbnail || (typeof product.images?.[0] === 'string' ? product.images[0] : product.images?.[0]?.url) || '/images/hero_medical_sale_1793803411713.jpg' }]
    }
  };
}

export const dynamic = 'force-dynamic';

export default async function RentalProductPage({ params }: RentalProductPageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product || !product.rentEnabled) {
    notFound();
  }

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8">
      <RentalDetailClient product={product} />
    </div>
  );
}
