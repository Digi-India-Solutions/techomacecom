import React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { getBrandBySlug, getProducts, getPageBanners } from '@/lib/api';
import ProductCard from '@/components/product/ProductCard';
import PageBannerSlider from '@/components/common/PageBannerSlider';
import { ShieldCheck, ChevronRight, MapPin, Award, CheckCircle2 } from 'lucide-react';

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

  const ogImage = brand.logo || brand.bannerImage;
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

  // Only show top slider if an explicit marketing page banner was configured in Admin (not auto-synthesized brand fallback)
  const marketingBanners = (pageBanners || []).filter(
    (b) => !b.id.startsWith('brand-') && !b.id.includes('-admin')
  );

  return (
    <div className="max-w-[1400px] mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
      {/* Explicit Marketing Banners from Admin (if configured) */}
      {marketingBanners.length > 0 && (
        <PageBannerSlider banners={marketingBanners} className="mb-2" />
      )}

      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-1.5 text-xs text-[#5B6B82] font-body flex-wrap">
        <Link href="/" className="hover:text-[#1D5FAF] transition-colors">Home</Link>
        <ChevronRight className="w-3.5 h-3.5 text-[#5B6B82]" />
        <Link href="/brands" className="hover:text-[#1D5FAF] transition-colors">Brands</Link>
        <ChevronRight className="w-3.5 h-3.5 text-[#5B6B82]" />
        <span className="font-semibold text-[#12263F]">{brand.name}</span>
      </nav>

      {/* Brand Hero Header - Clean Premium Gradient Surface (NO Background Image) */}
      <div className="relative rounded-2xl sm:rounded-3xl bg-gradient-to-r from-[#0B2545] via-[#10345E] to-[#0B2545] text-white overflow-hidden shadow-lg border border-[#174E90]/30 p-5 sm:p-8">
        {/* Subtle decorative geometric glow (Pure CSS blur, NO photo images) */}
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-[#1D5FAF]/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-[#1D5FAF]/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5 sm:gap-6">
          {/* Left: Brand Logo & Information */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
            {/* Crisp Logo Container */}
            <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-2xl bg-white p-2.5 relative overflow-hidden shadow-md shrink-0 flex items-center justify-center border border-white/20">
              {brand.logo ? (
                <div className="relative w-full h-full">
                  <Image
                    src={brand.logo}
                    alt={brand.name}
                    fill
                    className="object-contain p-1"
                    referrerPolicy="no-referrer"
                  />
                </div>
              ) : (
                <span className="flex h-full w-full items-center justify-center text-center text-sm sm:text-base font-black text-[#0B2545] font-heading leading-tight px-1">
                  {brand.name}
                </span>
              )}
            </div>

            {/* Brand Meta & Info */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                {brand.authorizedDistributor ? (
                  <span className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-bold text-emerald-300 bg-emerald-950/50 border border-emerald-500/40 px-2.5 py-0.5 rounded-full font-heading shadow-xs">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Authorized Indian Distributor</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-bold text-blue-200 bg-white/10 border border-white/15 px-2.5 py-0.5 rounded-full font-heading shadow-xs">
                    <Award className="w-3.5 h-3.5 text-[#60A5FA]" />
                    <span>100% Genuine Clinical Manufacturer</span>
                  </span>
                )}

                {brand.originCountry && (
                  <span className="inline-flex items-center gap-1 text-[11px] text-blue-200/90 bg-white/10 border border-white/15 px-2.5 py-0.5 rounded-full font-heading">
                    <MapPin className="w-3 h-3 text-[#60A5FA]" />
                    <span>Origin: {brand.originCountry}</span>
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold font-heading text-white tracking-tight">
                {brand.name}
              </h1>

              {brand.description && (
                <p className="text-xs sm:text-sm text-blue-100/85 max-w-2xl leading-relaxed font-body">
                  {brand.description}
                </p>
              )}
            </div>
          </div>

          {/* Right: Products Count Metric Card */}
          <div className="flex sm:flex-col items-center justify-between sm:justify-center bg-white/10 backdrop-blur-md px-5 py-3.5 sm:px-6 sm:py-4 rounded-2xl border border-white/15 text-center shrink-0 shadow-xs">
            <div>
              <div className="text-2xl sm:text-3xl font-black text-white font-heading tracking-tight">
                {productsData.total}
              </div>
              <div className="text-[11px] font-semibold text-blue-200 uppercase tracking-wider font-heading mt-0.5">
                {productsData.total === 1 ? 'Catalog Product' : 'Catalog Products'}
              </div>
            </div>
            <div className="hidden sm:inline-flex items-center gap-1 text-[10px] text-emerald-300 font-medium font-body mt-2 pt-2 border-t border-white/10">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span>Genuine Warranty</span>
            </div>
          </div>
        </div>
      </div>

      {/* Brand Products Grid */}
      <div className="space-y-3.5 sm:space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-xl font-bold text-[#12263F] font-heading">
            All Products from {brand.name}
          </h2>
          <span className="font-semibold text-[#174E90] bg-[#EAF2FC] px-2.5 py-0.5 rounded-full text-xs font-heading">
            Showing {productsData.products.length} {productsData.products.length === 1 ? 'item' : 'items'}
          </span>
        </div>

        {productsData.products.length === 0 ? (
          <div className="bg-white p-8 sm:p-12 text-center rounded-2xl border border-[#DCE6F2] space-y-2">
            <p className="text-sm font-semibold text-[#12263F] font-heading">No products currently available</p>
            <p className="text-xs text-[#5B6B82] font-body">Products for this brand will be updated soon.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5 sm:gap-3.5">
            {productsData.products.map((product) => (
              <ProductCard key={product.id} product={product} className="h-full" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
