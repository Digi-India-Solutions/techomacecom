import { Metadata } from 'next';
import { getCategoryBySlug, getCategories, getProducts, getBrands, getBestSellers, getPageBanners } from '@/lib/api';
import CategoryListingClient from '@/components/category/CategoryListingClient';
import CategoryNotFoundView from '@/components/category/CategoryNotFoundView';

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

export const dynamic = 'force-dynamic';

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { slug } = await params;
  const { sub } = await searchParams;

  const category = await getCategoryBySlug(slug);
  if (!category) {
    const [allCategories, bestSellers] = await Promise.all([
      getCategories(),
      getBestSellers()
    ]);
    return (
      <CategoryNotFoundView
        slug={slug}
        categories={allCategories}
        suggestedProducts={bestSellers}
      />
    );
  }

  const [productsData, brands, pageBanners] = await Promise.all([
    getProducts({ categoryId: category.id, limit: 100 }),
    getBrands(),
    getPageBanners('category', category.slug, category.id).catch(() => [])
  ]);

  return (
    <CategoryListingClient
      category={category}
      initialProducts={productsData.products}
      brands={brands}
      initialSubCategory={sub}
      banners={pageBanners}
    />
  );
}
