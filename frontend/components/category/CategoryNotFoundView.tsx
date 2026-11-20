'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Category, Product } from '@/types';
import ProductCard from '@/components/product/ProductCard';
import SkeletonImage from '@/components/common/SkeletonImage';
import {
  Search,
  Home,
  ChevronRight,
  FolderOpen,
  ArrowRight,
  Sparkles,
  HelpCircle,
  Phone
} from 'lucide-react';

interface CategoryNotFoundViewProps {
  slug: string;
  categories: Category[];
  suggestedProducts: Product[];
}

const CATEGORY_DEFAULT_IMAGES: Record<string, string> = {
  'oxygen-concentrators': '/images/bento_oxygen_conc_1793803384593.jpg',
  'dental-chairs': '/images/prod_dental_chair_1793803541905.jpg',
  'patient-monitors': '/images/bento_monitoring_vitals_1793803410618.jpg',
  'icu-beds': '/images/bento_homecare_mobility_1793803387668.jpg',
  'manual-wheelchairs': '/images/prod_wheelchair_main.jpg',
  'dental-autoclaves': '/images/prod_autoclave_main.jpg',
  'bipap-cpap': '/images/bento_cpap_bipap_1793803386703.jpg',
};

const getCategoryImage = (cat: Category): string => {
  if (cat.image && cat.image.trim()) return cat.image;
  if (cat.icon && cat.icon.trim()) return cat.icon;
  const s = (cat.slug || '').toLowerCase();
  for (const [key, img] of Object.entries(CATEGORY_DEFAULT_IMAGES)) {
    if (s.includes(key) || key.includes(s)) return img;
  }
  return '/images/bento_oxygen_conc_1793803384593.jpg';
};

export const CategoryNotFoundView: React.FC<CategoryNotFoundViewProps> = ({
  slug,
  categories,
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
              Categories
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
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EAF2FC] text-[#1D5FAF] text-xs font-semibold mb-3">
              <HelpCircle className="w-3.5 h-3.5" />
              Department Update
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B2545] font-heading tracking-tight mb-2">
              Category &ldquo;{formattedSlug}&rdquo; Not Found
            </h1>
            <p className="text-sm text-[#475569] leading-relaxed mb-6">
              The category you are looking for might have been reorganized or renamed. You can search directly or choose from our authorized clinical departments below:
            </p>

            {/* Direct Search Input */}
            <form onSubmit={handleSearch} className="max-w-lg relative flex items-center">
              <Search className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search products, equipment, or models..."
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

        {/* Available Clinical Categories Grid */}
        <div className="space-y-4">
          <div className="flex items-end justify-between border-b border-[#E2E8F0] pb-3">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-[#0F172A] font-heading">
                Explore Available Clinical Departments
              </h2>
              <p className="text-xs text-slate-500">
                Authorized medical and dental equipment with official warranty & GST billing
              </p>
            </div>
            <Link
              href="/search"
              className="text-xs font-bold text-[#1D5FAF] hover:underline flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3 sm:gap-4">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/category/${cat.slug}`}
                className="group bg-white rounded-2xl border border-[#DCE6F2] hover:border-[#1D5FAF] hover:shadow-md hover:-translate-y-0.5 transition-all p-3 flex flex-col items-center text-center shadow-2xs"
              >
                <div className="relative w-full aspect-square rounded-xl bg-[#EAF2FC] group-hover:bg-[#D6E6F8] overflow-hidden transition-colors mb-2.5">
                  <SkeletonImage
                    src={getCategoryImage(cat)}
                    alt={cat.name}
                    fill
                    className="object-contain p-2 transition-transform duration-300 group-hover:scale-105"
                    sizes="120px"
                  />
                </div>
                <p className="font-heading font-bold text-xs text-[#0F172A] group-hover:text-[#1D5FAF] line-clamp-2 transition-colors">
                  {cat.name}
                </p>
                <span className="text-[10px] text-slate-400 mt-0.5">
                  {cat.itemCount ? `${cat.itemCount}+ Products` : 'Available'}
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* Trending & Best Selling Products */}
        {suggestedProducts.length > 0 && (
          <div className="space-y-4 pt-4">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 bg-[#EA580C] text-white text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider font-heading">
                  <Sparkles className="w-3 h-3 fill-current" />
                  Popular
                </span>
                <h2 className="text-lg sm:text-xl font-bold text-[#0F172A] font-heading">
                  Trending Clinical Equipment
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
      </div>
    </div>
  );
};

export default CategoryNotFoundView;

