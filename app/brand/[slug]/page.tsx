import React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { getBrandBySlug, getProducts } from '@/lib/api';
import ProductCard from '@/components/product/ProductCard';
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

  return {
    title: `${brand.name} Products Online - Authorized Distributor | Buy Denmed`,
    description: `Shop genuine ${brand.name} products with manufacturer warranty, pan-India delivery, and GST tax invoice. ${brand.description}`,
    openGraph: {
      title: `${brand.name} | Buy Denmed`,
      description: brand.description,
      images: [{ url: brand.bannerImage || brand.logo }]
    }
  };
}

export default async function BrandPage({ params }: BrandPageProps) {
  const { slug } = await params;
  const brand = await getBrandBySlug(slug);

  if (!brand) {
    notFound();
  }

  const productsData = await getProducts({ brandIds: [brand.id], limit: 40 });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6 space-y-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-gray-500">
        <Link href="/" className="hover:text-[#FF6B00]">Home</Link>
        <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
        <Link href="/brands" className="hover:text-[#FF6B00]">Brands</Link>
        <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
        <span className="font-semibold text-gray-900">{brand.name}</span>
      </nav>

      {/* Brand Hero Banner */}
      <div className="relative rounded-3xl bg-[#2B2B2B] text-white overflow-hidden shadow-xl border border-gray-800">
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

        <div className="relative z-10 p-6 sm:p-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white p-2 relative overflow-hidden shadow-lg shrink-0">
              <Image
                src={brand.logo}
                alt={brand.name}
                fill
                className="object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="space-y-1">
              {brand.authorizedDistributor && (
                <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-green-400 bg-white/10 px-2.5 py-0.5 rounded-full backdrop-blur-xs">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Authorized Indian Distributor</span>
                </div>
              )}
              <h1 className="text-2xl sm:text-4xl font-black tracking-tight">{brand.name}</h1>
              <p className="text-xs text-gray-300 max-w-xl leading-relaxed">
                {brand.description}
              </p>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15 text-center shrink-0">
            <div className="text-2xl font-black text-[#FF6B00]">{productsData.products.length}</div>
            <div className="text-xs text-gray-300">Catalog Products</div>
            <div className="text-[10px] text-gray-400 mt-1">Origin: {brand.originCountry}</div>
          </div>
        </div>
      </div>

      {/* Brand Products Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">
            All Products from {brand.name}
          </h2>
          <span className="text-xs text-gray-500">
            Showing {productsData.products.length} items
          </span>
        </div>

        {productsData.products.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-2xl border border-gray-200">
            <p className="text-xs text-gray-500">No products currently in stock for this brand.</p>
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
