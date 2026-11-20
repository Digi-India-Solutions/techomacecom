import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getCategoryBySlug, getCategories, getProducts, getBrands } from '@/lib/api';
import CategoryListingClient from '@/components/category/CategoryListingClient';

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ sub?: string }>;
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);

  if (!category) {
    return {
      title: 'Category Not Found | Buy Denmed',
      description: 'The requested medical and dental category was not found on Buy Denmed.'
    };
  }

  // SEO fields from Admin → Categories win; otherwise a sensible default
  return {
    title: category.seoTitle || `${category.name} - Buy Online at Best Prices | Buy Denmed India`,
    description:
      category.seoDescription ||
      `Shop authentic ${category.name.toLowerCase()} equipment, instruments and consumables from verified brands. Pan-India delivery, easy EMI, and GST tax invoice on Buy Denmed.`,
    openGraph: {
      title: `${category.name} | Buy Denmed Store`,
      description: category.seoDescription || category.description,
      ...(category.image ? { images: [{ url: category.image }] } : {})
    }
  };
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { slug } = await params;
  const { sub } = await searchParams;

  const category = await getCategoryBySlug(slug);
  if (!category) {
    notFound();
  }

  const [productsData, brands] = await Promise.all([
    getProducts({ categoryId: category.id, limit: 100 }),
    getBrands()
  ]);

  return (
    <CategoryListingClient
      category={category}
      initialProducts={productsData.products}
      brands={brands}
      initialSubCategory={sub}
    />
  );
}
