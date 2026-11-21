'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Product } from '@/types';
import ProductCard from '@/components/product/ProductCard';
import {
  Search,
  Home,
  ChevronRight,
  PackageSearch,
  ArrowRight,
  Sparkles,
  Phone,
  MessageCircle
} from 'lucide-react';

interface ProductNotFoundViewProps {
  slug: string;
  suggestedProducts: Product[];
}

export const ProductNotFoundView: React.FC<ProductNotFoundViewProps> = ({
  slug,
  suggestedProducts,
}) => {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  const formattedSlug = slug
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="min-h-screen bg-[#F6F9FD] pb-16">
      {/* Breadcrumb Bar */}
      <div className="bg-white border-b border-[#E2E8F0]">
        <div className="max-w-[1320px] mx-auto px-4 sm:px-6 py-3">
          <nav className="flex items-center gap-1.5 text-xs text-slate-500">
            <Link href="/" className="hover:text-[#1D5FAF] flex items-center gap-1">
              <Home className="w-3.5 h-3.5" />
              <span>Home</span>
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <Link href="/search" className="hover:text-[#1D5FAF]">
              Products
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[#0B2545] font-semibold truncate max-w-[200px]">
              {formattedSlug} (Not Found)
            </span>
          </nav>
        </div>
      </div>

      <div className="max-w-[1320px] mx-auto px-4 sm:px-6 pt-8 space-y-10">
        {/* Friendly Hero Banner Card */}
        <div className="rounded-3xl bg-white border border-[#DCE6F2] p-6 sm:p-10 shadow-xs relative overflow-hidden">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EA580C]/10 text-[#EA580C] text-xs font-semibold mb-3">
              <PackageSearch className="w-3.5 h-3.5" />
              Product Unavailable
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B2545] font-heading tracking-tight mb-2">
              Product &ldquo;{formattedSlug}&rdquo; Not Found
            </h1>
            <p className="text-sm text-[#475569] leading-relaxed mb-6">
              This medical or dental equipment may be temporarily out of stock, archived, or the link may have changed. Search below or browse authentic clinical devices in stock:
            </p>

            {/* Direct Search Input */}
            <form onSubmit={handleSearch} className="max-w-lg relative flex items-center">
              <Search className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by brand, SKU, or product name..."
                className="w-full pl-10 pr-24 py-2.5 rounded-xl border border-[#CBD5E1] bg-slate-50 focus:bg-white text-xs sm:text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#1D5FAF]"
              />
              <button
                type="submit"
                className="absolute right-1 px-4 py-1.5 bg-[#1D5FAF] hover:bg-[#174D8F] text-white text-xs font-semibold rounded-lg transition-colors"
              >
                Search
              </button>
            </form>
          </div>
        </div>

        {/* Recommended In-Stock Equipment */}
        {suggestedProducts.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 bg-[#1D5FAF] text-white text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider font-heading">
                  <Sparkles className="w-3 h-3 fill-current" />
                  Recommended
                </span>
                <h2 className="text-lg sm:text-xl font-bold text-[#0F172A] font-heading">
                  Popular In-Stock Medical Equipment
                </h2>
              </div>
              <Link
                href="/best-sellers"
                className="text-xs font-bold text-[#1D5FAF] hover:underline flex items-center gap-1"
              >
                <span>Browse All</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {suggestedProducts.slice(0, 8).map((prod) => (
                <ProductCard key={prod.id} product={prod} />
              ))}
            </div>
          </div>
        )}

        {/* Support Strip */}
        <div className="p-4 rounded-2xl bg-white border border-[#E2E8F0] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#475569]">
          <span>Looking for a bulk quotation or specialized medical unit?</span>
          <div className="flex items-center gap-3">
            <a href="tel:+919131734930" className="inline-flex items-center gap-1 font-semibold text-[#1D5FAF] hover:underline">
              <Phone className="w-3.5 h-3.5" />
              Call +91 9131734930
            </a>
            <span className="text-slate-300">•</span>
            <a href="https://wa.me/919131734930" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold text-emerald-600 hover:underline">
              <MessageCircle className="w-3.5 h-3.5" />
              WhatsApp Helpdesk
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductNotFoundView;

