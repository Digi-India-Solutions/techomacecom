import React from 'react';
import Link from 'next/link';
import { Product } from '@/types';
import ProductCard from '@/components/product/ProductCard';
import { Flame, ArrowRight } from 'lucide-react';

interface BestSellersRowProps {
  products: Product[];
}

export const BestSellersRow: React.FC<BestSellersRowProps> = ({ products }) => {
  return (
    <section className="py-12 px-4 sm:px-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-2">
        <div>
          <span className="text-xs font-bold text-[#FF6B00] uppercase tracking-wider flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 fill-current" />
            Clinic Staples & Doctor Favorites
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#2B2B2B] tracking-tight">
            Best Sellers Across India
          </h2>
        </div>
        <Link
          href="/best-sellers"
          className="text-xs font-bold text-[#FF6B00] hover:text-[#E65D00] flex items-center gap-1 group"
        >
          <span>View All Best Sellers</span>
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {products.slice(0, 8).map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
};

export default BestSellersRow;
