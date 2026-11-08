import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { getProducts } from '@/lib/api';
import ProductCard from '@/components/product/ProductCard';
import { Search, ChevronRight, SlidersHorizontal } from 'lucide-react';

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>;
}

export async function generateMetadata({ searchParams }: SearchPageProps): Promise<Metadata> {
  const { q } = await searchParams;
  return {
    title: q ? `Search Results for "${q}" | Buy Denmed` : 'Search Medical & Dental Equipment | Buy Denmed',
    description: `Find medical equipment, dental units, instruments and consumables matching ${q || 'your query'}.`
  };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q = '' } = await searchParams;
  const data = await getProducts({ query: q, limit: 30 });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-gray-500">
        <Link href="/" className="hover:text-[#FF6B00]">Home</Link>
        <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
        <span className="font-semibold text-gray-900">Search Results</span>
      </nav>

      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-[#FF6B00] uppercase tracking-wider">
            Query Results
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-[#2B2B2B] tracking-tight">
            {q ? (
              <>Showing results for &ldquo;<span className="text-[#FF6B00]">{q}</span>&rdquo;</>
            ) : (
              'All Equipment & Consumables'
            )}
          </h1>
        </div>
        <div className="text-xs text-gray-500 font-semibold bg-gray-50 px-3.5 py-1.5 rounded-lg border border-gray-200">
          <strong>{data.products.length}</strong> items found
        </div>
      </div>

      {/* Results Grid */}
      {data.products.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-200 space-y-3">
          <div className="w-16 h-16 rounded-full bg-orange-50 flex items-center justify-center text-[#FF6B00] mx-auto">
            <Search className="w-8 h-8" />
          </div>
          <h3 className="font-bold text-lg text-gray-900">No matching medical or dental equipment found</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            Please check your spelling or search for broader keywords like &quot;oxygen&quot;, &quot;autoclave&quot;, &quot;handpiece&quot;, or &quot;composite&quot;.
          </p>
          <div className="pt-2 flex justify-center gap-2">
            {['Oxygen Concentrator', 'Autoclave', 'CPAP', 'Dental Handpiece', 'Composite'].map((s) => (
              <Link
                key={s}
                href={`/search?q=${encodeURIComponent(s)}`}
                className="text-xs bg-gray-100 hover:bg-orange-50 hover:text-[#FF6B00] px-3 py-1.5 rounded-lg font-medium text-gray-700"
              >
                {s}
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {data.products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
