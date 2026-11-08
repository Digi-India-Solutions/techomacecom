import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getProductBySlug, getRelatedProducts, getProductReviews } from '@/lib/api';
import ProductDetailClient from '@/components/product/ProductDetailClient';

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return {
      title: 'Product Not Found | Buy Denmed',
      description: 'The requested medical/dental equipment was not found.'
    };
  }

  return {
    title: `${product.name} - ₹${product.price.toLocaleString('en-IN')} | Buy Denmed India`,
    description: `${product.shortDescription} Genuine ${product.brandName} with official warranty, GST tax invoice, and pan-India shipping.`,
    openGraph: {
      title: `${product.name} | Buy Denmed`,
      description: product.shortDescription,
      images: [{ url: product.thumbnail || (typeof product.images?.[0] === 'string' ? product.images[0] : product.images?.[0]?.url) || '/images/hero_medical_sale_1793803411713.jpg' }]
    }
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const [relatedProducts, reviews] = await Promise.all([
    getRelatedProducts(product.id, product.categoryId, 4),
    getProductReviews(product.id)
  ]);

  return (
    <ProductDetailClient
      product={product}
      relatedProducts={relatedProducts}
      initialReviews={reviews}
    />
  );
}
