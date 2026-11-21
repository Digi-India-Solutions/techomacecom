'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight } from 'lucide-react';

export interface BentoCategoryItem {
  id: string;
  name: string;
  slug: string;
  image?: string;
  icon?: string;
  bannerDesktop?: string;
  description?: string;
}

interface BentoCardItem {
  id: string;
  name: string;
  href: string;
  image: string;
}

const DEFAULT_BENTO_IMAGES: Record<string, string> = {
  'respiratory-care': '/images/bento_oxygen_conc_1793803384593.jpg',
  'oxygen-concentrators': '/images/bento_oxygen_conc_1793803384593.jpg',
  'bipap-cpap': '/images/bento_cpap_bipap_1793803386703.jpg',
  'sleep-apnea-therapy': '/images/bento_cpap_bipap_1793803386703.jpg',
  'dental-chairs': '/images/bento_dental_equip_1793803387280.jpg',
  'dental-autoclaves': '/images/bento_dental_equip_1793803387280.jpg',
  'dental-handpieces-motors': '/images/bento_dental_equip_1793803387280.jpg',
  'dental-equipment': '/images/bento_dental_equip_1793803387280.jpg',
  'patient-monitors': '/images/bento_monitoring_vitals_1793803410618.jpg',
  'diagnostic-monitoring': '/images/bento_monitoring_vitals_1793803410618.jpg',
  'icu-beds': '/images/bento_homecare_mobility_1793803387668.jpg',
  'hospital-furniture': '/images/bento_homecare_mobility_1793803387668.jpg',
  'manual-wheelchairs': '/images/bento_homecare_mobility_1793803387668.jpg',
  'wheelchairs': '/images/bento_homecare_mobility_1793803387668.jpg',
};

const FALLBACK_BENTO_IMAGES = [
  '/images/bento_oxygen_conc_1793803384593.jpg',
  '/images/bento_cpap_bipap_1793803386703.jpg',
  '/images/bento_dental_equip_1793803387280.jpg',
  '/images/bento_monitoring_vitals_1793803410618.jpg',
  '/images/bento_homecare_mobility_1793803387668.jpg',
];

function resolveCategoryImage(cat: BentoCategoryItem, index: number): string {
  if (cat.image && cat.image.trim()) return cat.image.trim();
  if (cat.bannerDesktop && cat.bannerDesktop.trim()) return cat.bannerDesktop.trim();

  const slug = (cat.slug || '').toLowerCase();
  for (const [key, img] of Object.entries(DEFAULT_BENTO_IMAGES)) {
    if (slug.includes(key) || key.includes(slug)) return img;
  }

  const name = (cat.name || '').toLowerCase();
  if (name.includes('oxygen') || name.includes('respiratory')) return '/images/bento_oxygen_conc_1793803384593.jpg';
  if (name.includes('cpap') || name.includes('bipap') || name.includes('sleep')) return '/images/bento_cpap_bipap_1793803386703.jpg';
  if (name.includes('dental') || name.includes('autoclave') || name.includes('chair')) return '/images/bento_dental_equip_1793803387280.jpg';
  if (name.includes('monitor') || name.includes('diagnostic') || name.includes('vital')) return '/images/bento_monitoring_vitals_1793803410618.jpg';
  if (name.includes('bed') || name.includes('wheelchair') || name.includes('furniture') || name.includes('mobility')) return '/images/bento_homecare_mobility_1793803387668.jpg';

  return FALLBACK_BENTO_IMAGES[index % FALLBACK_BENTO_IMAGES.length];
}

const FALLBACK_ITEMS: BentoCardItem[] = [
  {
    id: 'oxygen',
    name: 'Oxygen Concentrators',
    href: '/category/oxygen-concentrators',
    image: '/images/bento_oxygen_conc_1793803384593.jpg',
  },
  {
    id: 'cpap',
    name: 'CPAP & BiPAP Devices',
    href: '/category/bipap-cpap',
    image: '/images/bento_cpap_bipap_1793803386703.jpg',
  },
  {
    id: 'dental',
    name: 'Dental Operatory & Chairs',
    href: '/category/dental-chairs',
    image: '/images/bento_dental_equip_1793803387280.jpg',
  },
  {
    id: 'monitoring',
    name: 'Patient Monitors & ECG',
    href: '/category/patient-monitors',
    image: '/images/bento_monitoring_vitals_1793803410618.jpg',
  },
  {
    id: 'homecare',
    name: 'Hospital Beds & Mobility',
    href: '/category/icu-beds',
    image: '/images/bento_homecare_mobility_1793803387668.jpg',
  },
];

const BentoCard: React.FC<{
  item: BentoCardItem;
  className?: string;
  sizes: string;
}> = ({ item, className = '', sizes }) => {
  return (
    <Link
      href={item.href}
      aria-label={`Shop ${item.name}`}
      className={`group relative block rounded-2xl overflow-hidden bg-[#F6F9FD] shadow-2xs hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 border border-[#E2E8F0]/70 ${className}`}
    >
      <Image
        src={item.image}
        alt={item.name}
        fill
        className="object-cover transition-transform duration-500 group-hover:scale-105"
        sizes={sizes}
        referrerPolicy="no-referrer"
      />
      {/* Subtle bottom vignette to ensure pill text contrast */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent opacity-60 group-hover:opacity-85 transition-opacity duration-300" />

      {/* Floating Category Label Pill */}
      <div className="absolute bottom-3.5 left-3.5 right-3.5 flex items-center pointer-events-none">
        <span className="bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-xl shadow-xs border border-white/60 text-xs sm:text-[13px] font-bold font-heading text-[#12263F] group-hover:bg-[#1D5FAF] group-hover:text-white flex items-center gap-1.5 transition-all duration-300 max-w-[90%]">
          <span className="truncate">{item.name}</span>
          <ChevronRight className="w-3.5 h-3.5 text-[#5B6B82] group-hover:text-white transition-colors shrink-0" />
        </span>
      </div>
    </Link>
  );
};

interface FeaturedCategoriesBentoProps {
  title?: string;
  subtitle?: string;
  categories?: BentoCategoryItem[];
}

export const FeaturedCategoriesBento: React.FC<FeaturedCategoriesBentoProps> = ({
  title = 'Clinical & Homecare Essentials',
  subtitle = 'Curated dental operatory units, respiratory life support & hospital furniture from certified global manufacturers',
  categories,
}) => {
  // Build items from dynamic categories if passed, else fallback
  let items: BentoCardItem[] = [];

  if (categories && categories.length > 0) {
    items = categories.slice(0, 6).map((cat, idx) => ({
      id: cat.id || `bento-cat-${idx}`,
      name: cat.name,
      href: `/category/${cat.slug || cat.id}`,
      image: resolveCategoryImage(cat, idx),
    }));

    // If fewer than 5 items, supplement from fallback so grid is always complete
    if (items.length < 5) {
      for (const fallback of FALLBACK_ITEMS) {
        if (!items.some((it) => it.id === fallback.id || it.href === fallback.href)) {
          items.push(fallback);
          if (items.length >= 5) break;
        }
      }
    }
  } else {
    items = FALLBACK_ITEMS;
  }

  const isSixItems = items.length >= 6;
  const leftItems = items.slice(0, 4);
  const rightItems = isSixItems ? items.slice(4, 6) : items.slice(4, 5);

  const exploreAllHref = items[0]?.href || '/category/oxygen-concentrators';

  return (
    <section className="my-10 sm:my-14">
      <div className="max-w-[1320px] mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="flex items-end justify-between mb-5 sm:mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#0F172A] font-heading relative inline-block">
              {title || 'Clinical & Homecare Essentials'}
              <span className="absolute bottom-[-4px] left-0 w-10 h-[3px] bg-[#1D5FAF] rounded-full" />
            </h2>
            <p className="text-xs sm:text-sm text-[#475569] font-body mt-2">
              {subtitle}
            </p>
          </div>
          <Link
            href={exploreAllHref}
            className="text-xs sm:text-sm font-bold text-[#1D5FAF] hover:text-[#0B2545] flex items-center gap-1 font-heading transition-colors"
          >
            <span>Explore All</span>
            <span className="tracking-tighter">&gt;&gt;</span>
          </Link>
        </div>

        {/* Bento Grid: 2x2 on left, 1 tall (if 5 items) or 2 stacked (if 6 items) on right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">
          <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            {leftItems.map((item) => (
              <BentoCard
                key={item.id}
                item={item}
                className="min-h-[190px] sm:min-h-[210px] aspect-[16/10] sm:aspect-auto"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 430px"
              />
            ))}
          </div>

          <div className="lg:col-span-4">
            {isSixItems ? (
              <div className="grid grid-cols-1 gap-4 sm:gap-5 h-full">
                {rightItems.map((item) => (
                  <BentoCard
                    key={item.id}
                    item={item}
                    className="min-h-[190px] sm:min-h-[210px] aspect-[16/10] sm:aspect-auto h-full"
                    sizes="(max-width: 1024px) 100vw, 430px"
                  />
                ))}
              </div>
            ) : (
              <div className="flex h-full">
                {rightItems[0] && (
                  <BentoCard
                    item={rightItems[0]}
                    className="w-full min-h-[380px] sm:min-h-[440px] h-full"
                    sizes="(max-width: 1024px) 100vw, 430px"
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturedCategoriesBento;
