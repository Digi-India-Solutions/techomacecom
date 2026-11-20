'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface BentoItem {
  id: string;
  firstWord: string;
  secondWord: string;
  tagline: string;
  href: string;
  image: string;
}

const BentoImageCard: React.FC<{ item: BentoItem; className?: string; sizes: string }> = ({
  item,
  className = '',
  sizes
}) => {
  const label = `${item.firstWord} ${item.secondWord}`;
  return (
    <Link
      href={item.href}
      aria-label={`Shop ${label}`}
      className={`group relative block rounded-2xl overflow-hidden bg-[#F6F9FD] shadow-2xs hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 ${className}`}
    >
      <Image
        src={item.image}
        alt={label}
        fill
        className="object-cover transition-transform duration-500 group-hover:scale-105"
        sizes={sizes}
        referrerPolicy="no-referrer"
      />
    </Link>
  );
};

interface FeaturedCategoriesBentoProps {
  title?: string;
}

export const FeaturedCategoriesBento: React.FC<FeaturedCategoriesBentoProps> = ({ title = 'Featured Clinical Solutions' }) => {
  const topRowItems: BentoItem[] = [
    {
      id: 'oxygen',
      firstWord: 'OXYGEN',
      secondWord: 'CONCENTRATORS',
      tagline: 'High-Purity 5L & 10L Continuous Medical Oxygen',
      href: '/category/respiratory-care',
      image: '/images/bento_oxygen_conc_1793803384593.jpg'
    },
    {
      id: 'cpap',
      firstWord: 'CPAP &',
      secondWord: 'BIPAP DEVICES',
      tagline: 'AutoSet Sleep Apnea & Non-Invasive Ventilation',
      href: '/category/sleep-apnea-therapy',
      image: '/images/bento_cpap_bipap_1793803386703.jpg'
    }
  ];

  const bottomRowItems: BentoItem[] = [
    {
      id: 'dental',
      firstWord: 'DENTAL',
      secondWord: 'OPERATORY',
      tagline: 'Precision Turbines, Handpieces & Clinic Units',
      href: '/category/dental-handpieces-motors',
      image: '/images/bento_dental_equip_1793803387280.jpg'
    },
    {
      id: 'monitoring',
      firstWord: 'PATIENT',
      secondWord: 'MONITORS',
      tagline: 'Multipara Vital Signs, Pulse Oximeters & ECG',
      href: '/category/diagnostic-monitoring',
      image: '/images/bento_monitoring_vitals_1793803410618.jpg'
    }
  ];

  const tallItem: BentoItem = {
    id: 'homecare',
    firstWord: 'HOME CARE',
    secondWord: '& MOBILITY',
    tagline: 'Motorized Hospital Beds, Wheelchairs, Suction Units & Anti-Decubitus Mattresses',
    href: '/category/hospital-furniture',
    image: '/images/bento_homecare_mobility_1793803387668.jpg'
  };

  return (
    <section className="my-10 sm:my-14">
      <div className="max-w-[1320px] mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="flex items-end justify-between mb-5 sm:mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#0F172A] font-heading relative inline-block">
              {title || 'Featured Clinical Solutions'}
              <span className="absolute bottom-[-4px] left-0 w-10 h-[3px] bg-[#1D5FAF] rounded-full" />
            </h2>
            <p className="text-xs sm:text-sm text-[#475569] font-body mt-2">
              Curated dental operatory units, respiratory life support & hospital furniture from certified global manufacturers
            </p>
          </div>
          <Link
            href="/category/respiratory-care"
            className="text-xs sm:text-sm font-bold text-[#1D5FAF] hover:text-[#0B2545] flex items-center gap-1 font-heading transition-colors"
          >
            <span>Explore All</span>
            <span className="tracking-tighter">&gt;&gt;</span>
          </Link>
        </div>

        {/* Bento Grid: 2x2 on left, 1 tall banner on right — image-only cards, whole card is the link */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">
          <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            {[...topRowItems, ...bottomRowItems].map((item) => (
              <BentoImageCard
                key={item.id}
                item={item}
                className="min-h-[200px]"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 430px"
              />
            ))}
          </div>

          <div className="lg:col-span-4 flex">
            <BentoImageCard
              item={tallItem}
              className="w-full min-h-[380px]"
              sizes="(max-width: 1024px) 100vw, 430px"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturedCategoriesBento;
