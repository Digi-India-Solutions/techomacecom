import React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { getBrandBySlug, getProducts, getPageBanners } from '@/lib/api';
import ProductCard from '@/components/product/ProductCard';
import PageBannerSlider from '@/components/common/PageBannerSlider';
import { ShieldCheck, ChevronRight, MapPin, Award } from 'lucide-react';

interface BrandPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: BrandPageProps): Promise<Metadata> {
  const { slug } = await params;
  const brand = await getBrandBySlug(slug);

  if (!brand) {
    return {
      title: 'Brand Not Found | Buy Denmed',
      description: 'The requested brand was not found.'
    };
  }

  // SEO fields from Admin → Brands win; otherwise a sensible default
  const ogImage = brand.bannerImage || brand.logo;
  return {
    title: brand.seoTitle || `${brand.name} Products Online - Authorized Distributor | Buy Denmed`,
    description:
      brand.seoDescription ||
      `Shop genuine ${brand.name} products with manufacturer warranty, pan-India delivery, and GST tax invoice. ${brand.description}`,
    openGraph: {
      title: `${brand.name} | Buy Denmed`,
      description: brand.seoDescription || brand.description,
      ...(ogImage ? { images: [{ url: ogImage }] } : {})
    }
  };
}

export const dynamic = 'force-dynamic';

export default async function BrandPage({ params }: BrandPageProps) {
  const { slug } = await params;
  const brand = await getBrandBySlug(slug);

  if (!brand) {
    notFound();
  }

  const [productsData, pageBanners] = await Promise.all([
    getProducts({ brandIds: [brand.id], limit: 40 }),
    getPageBanners('brand', brand.slug, brand.id).catch(() => [])
  ]);

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Dynamic Page Banners from Admin */}
      {pageBanners && pageBanners.length > 0 && (
        <PageBannerSlider banners={pageBanners} className="mb-2" />
      )}

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-[#5B6B82]">
        <Link href="/" className="hover:text-[#1D5FAF]">Home</Link>
        <ChevronRight className="w-3.5 h-3.5 text-[#5B6B82]" />
        <Link href="/brands" className="hover:text-[#1D5FAF]">Brands</Link>
        <ChevronRight className="w-3.5 h-3.5 text-[#5B6B82]" />
        <span className="font-semibold text-[#12263F]">{brand.name}</span>
      </nav>

      {/* Brand Hero Banner */}
      <div className="relative rounded-3xl bg-[#0B2545] text-white overflow-hidden shadow-xl border border-[#13335E]">
        {brand.bannerImage && (
          <div className="absolute inset-0 opacity-25">
            <Image
              src={brand.bannerImage}
              alt={brand.name}
              fill
              className="object-cover"
              priority
              referrerPolicy="no-referrer"
            />
          </div>
        )}

        <div className="relative z-10 p-6 sm:p-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
           <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl bg-white p-2 relative overflow-hidden shadow-lg shrink-0">
              {brand.logo ? (
                <Image
                  src={brand.logo}
                  alt={brand.name}
                  fill
                  className="object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                // No logo uploaded → text wordmark (document: logo_url NULL → wordmark)
                <span className="flex h-full w-full items-center justify-center text-center text-sm font-black text-[#0B2545] leading-tight">
                  {brand.name}
                </span>
              )}
            </div>
            <div className="space-y-1">
              {brand.authorizedDistributor && (
                <div className="inline-flex items-center gap-1.5 text-[12px] font-bold text-green-400 bg-white/10 px-2.5 py-0.5 rounded-full backdrop-blur-xs">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Authorized Indian Distributor</span>
                </div>
              )}
              <h1 className="text-2xl sm:text-4xl font-black tracking-tight">{brand.name}</h1>
              <p className="text-xs text-blue-100/80 max-w-xl leading-relaxed">
                {brand.description}
              </p>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15 text-center shrink-0">
            <div className="text-2xl font-black text-[#EAF2FC]">{productsData.total}</div>
            <div className="text-xs text-blue-100/90">Catalog Products</div>
            {brand.originCountry && (
              <div className="text-[11px] text-blue-200/75 mt-1">Origin: {brand.originCountry}</div>
            )}
          </div>
        </div>
      </div>

      {/* Brand Products Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#12263F]">
            All Products from {brand.name}
          </h2>
          <span className="text-xs text-[#5B6B82]">
            Showing {productsData.products.length} items
          </span>
        </div>

        {productsData.products.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-2xl border border-[#DCE6F2]">
            <p className="text-xs text-[#5B6B82]">No products currently in stock for this brand.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {productsData.products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
