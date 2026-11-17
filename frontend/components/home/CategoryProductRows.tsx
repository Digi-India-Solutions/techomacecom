import React from 'react';
import Link from 'next/link';
import { Product } from '@/types';
import ProductCard from '@/components/product/ProductCard';
import { ArrowRight, Sparkles } from 'lucide-react';

interface CategoryProductRowsProps {
  title: string;
  subtitle: string;
  categorySlug: string;
  products: Product[];
}

export const CategoryProductRows: React.FC<CategoryProductRowsProps> = ({
  title,
  subtitle,
  categorySlug,
  products
}) => {
  if (products.length === 0) return null;

  return (
    <section className="py-10 px-4 sm:px-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 gap-2">
        <div>
          <span className="text-[12px] font-bold text-[#1D5FAF] uppercase tracking-wider">
            {subtitle}
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-[#12263F] tracking-tight">
            {title}
          </h2>
        </div>
        <Link
          href={`/category/${categorySlug}`}
          className="text-xs font-bold text-[#1D5FAF] hover:text-[#174E90] flex items-center gap-1 group"
        >
          <span>View All in {title}</span>
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {products.slice(0, 4).map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
};

export default CategoryProductRows;
