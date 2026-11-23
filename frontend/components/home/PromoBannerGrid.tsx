'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

/**
 * Brand promo banners — 2 stacked on the left, 1 tall on the right.
 *
 * Each banner can be either:
 *  - a ready-made creative: set `creative` to the banner image path (e.g. '/images/banners/meril-mericron.jpg')
 *    and the whole image is shown as a clickable banner, or
 *  - a coded banner built from brand / title / tagline / price / product image (used until creatives are added).
 */
export interface PromoBanner {
  id: string;
  href: string;
  creative?: string;
  brand?: string;
  title?: string;
  subtitle?: string;
  tagline?: string;
  price?: number;
  image?: string;
  /** Background gradient + accent colour for coded banners */
  theme?: {
    bg: string;
    accent: string;
    accentText?: string;
  };
}

export const PROMO_BANNERS: PromoBanner[] = [
  {
    id: 'promo-filtek',
    href: '/product/3m-filtek-z250-universal-restorative-composite',
    brand: '3M ESPE',
    title: 'FILTEK Z250',
    tagline: 'Because every restoration begins with the right shade.',
    price: 1199,
    image: '/images/prod_composite_main.jpg',
    theme: { bg: 'from-[#EEF1FB] via-[#F4F6FC] to-[#DDE3F6]', accent: '#3B2A8C' }
  },
  {
    id: 'promo-omron',
    href: '/product/omron-hem-7156-digital-blood-pressure-monitor',
    brand: 'OMRON',
    title: 'HEM-7156',
    tagline: 'Accurate readings at home, every time.',
    price: 2499,
    image: '/images/prod_bp_main.jpg',
    theme: { bg: 'from-[#FBF1F1] via-[#FBF6F4] to-[#F1E3E1]', accent: '#8A2846' }
  },
  {
    id: 'promo-euronda',
    href: '/product/euronda-e8-class-b-vacuum-autoclave-24l',
    brand: 'Euronda',
    title: 'E8 CLASS B',
    subtitle: 'VACUUM AUTOCLAVE',
    tagline: 'Sterile instruments.\nEvery single cycle.',
    price: 189000,
    image: '/images/prod_autoclave_main.jpg',
    theme: { bg: 'from-[#F7F7F5] via-[#F2F1EE] to-[#E7E5E0]', accent: '#E8712B', accentText: '#E8712B' }
  }
];

const formatPrice = (n: number) => `₹${n.toLocaleString('en-IN')}/-`;

const BannerCard: React.FC<{ banner: PromoBanner; tall?: boolean }> = ({ banner, tall = false }) => {
  const base =
    'group relative block w-full h-full overflow-hidden rounded-2xl border border-[#E6EAF0] shadow-2xs hover:shadow-lg transition-shadow duration-300';

  // Ready-made creative image
  if (banner.creative) {
    return (
      <Link href={banner.href} className={base}>
        <Image
          src={banner.creative}
          alt={banner.title || banner.brand || 'Promotion'}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
          sizes="(max-width: 1024px) 100vw, 660px"
          referrerPolicy="no-referrer"
        />
      </Link>
    );
  }

  const accent = banner.theme?.accent || '#1D5FAF';

  return (
    <Link href={banner.href} className={`${base} bg-gradient-to-br ${banner.theme?.bg || 'from-white to-[#EAF2FC]'}`}>
      {/* Product image — right side, white photo background blended into the banner */}
      {banner.image && (
        <div
          className={`absolute ${
            tall ? 'right-0 bottom-0 w-[62%] h-[78%]' : 'right-0 top-0 w-[50%] h-full'
          }`}
        >
          <Image
            src={banner.image}
            alt={`${banner.brand ?? ''} ${banner.title ?? ''}`.trim()}
            fill
            className="object-contain mix-blend-multiply p-4 transition-transform duration-700 group-hover:scale-105"
            sizes={tall ? '(max-width: 1024px) 60vw, 420px' : '(max-width: 1024px) 50vw, 330px'}
            referrerPolicy="no-referrer"
          />
        </div>
      )}

      {/* Copy */}
      <div
        className={`relative z-10 h-full flex flex-col justify-center ${
          tall ? 'p-7 sm:p-10 max-w-[62%] lg:justify-start lg:pt-16' : 'p-6 sm:p-8 max-w-[56%]'
        }`}
      >
        {banner.brand && (
          <span
            className={`font-heading font-semibold tracking-tight ${tall ? 'text-3xl sm:text-4xl' : 'text-base sm:text-lg'}`}
            style={{ color: tall ? '#1E3A8A' : accent }}
          >
            {banner.brand}
          </span>
        )}

        {banner.title && (
          <h3
            className={`font-heading font-extrabold leading-[1.05] tracking-tight ${
              tall ? 'mt-8 text-3xl sm:text-[44px]' : 'mt-2 text-2xl sm:text-[34px]'
            }`}
            style={{ color: tall ? banner.theme?.accentText || accent : accent }}
          >
            {banner.title}
          </h3>
        )}

        {banner.subtitle && (
          <p className={`font-heading font-bold text-[#2A2F3A] ${tall ? 'mt-2 text-xl sm:text-2xl' : 'mt-1 text-base'}`}>
            {banner.subtitle}
          </p>
        )}

        {tall && (
          <span className="mt-5 block h-[3px] w-40 rounded-full bg-gradient-to-r from-[#E8712B] from-40% to-[#9CA3AF] to-40%" />
        )}

        {banner.tagline && (
          <p
            className={`whitespace-pre-line text-[#2A2F3A] leading-snug ${
              tall ? 'mt-5 text-lg sm:text-[22px]' : 'mt-2 text-[13px] sm:text-sm'
            }`}
          >
            {banner.tagline}
          </p>
        )}

        <div className={`flex items-center gap-3 ${tall ? 'mt-10' : 'mt-4 sm:mt-5'}`}>
          <span
            className={`inline-flex items-center rounded-md font-heading font-bold uppercase tracking-wide text-white transition-transform duration-300 group-hover:-translate-y-0.5 ${
              tall ? 'px-4 py-2.5 text-sm' : 'px-3 py-1.5 text-[12px]'
            }`}
            style={{ backgroundColor: accent }}
          >
            Shop Now
          </span>
          {banner.price !== undefined && (
            <span className={`font-heading font-semibold text-[#1C2331] ${tall ? 'text-3xl sm:text-4xl' : 'text-xl sm:text-2xl'}`}>
              {formatPrice(banner.price)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
};

interface PromoBannerGridProps {
  title?: string;
  banners?: PromoBanner[];
}

export const PromoBannerGrid: React.FC<PromoBannerGridProps> = ({ title, banners = PROMO_BANNERS }) => {
  if (!banners || banners.length === 0) return null;

  const header = title ? (
    <div className="mb-4 sm:mb-6">
      <h2 className="text-xl sm:text-2xl font-heading font-bold text-[#12263F]">{title}</h2>
    </div>
  ) : null;

  // Single banner
  if (banners.length === 1) {
    return (
      <section className="my-8 sm:my-12">
        <div className="max-w-[1320px] mx-auto px-4 sm:px-6">
          {header}
          <div className="h-[200px] sm:h-[250px]">
            <BannerCard banner={banners[0]} />
          </div>
        </div>
      </section>
    );
  }

  // Two banners side-by-side
  if (banners.length === 2) {
    return (
      <section className="my-8 sm:my-12">
        <div className="max-w-[1320px] mx-auto px-4 sm:px-6">
          {header}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
            <div className="h-[200px] sm:h-[230px]">
              <BannerCard banner={banners[0]} />
            </div>
            <div className="h-[200px] sm:h-[230px]">
              <BannerCard banner={banners[1]} />
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Three banners: 2 stacked on left, 1 tall on right
  if (banners.length === 3) {
    const [topLeft, bottomLeft, tall] = banners;
    return (
      <section className="my-8 sm:my-12">
        <div className="max-w-[1320px] mx-auto px-4 sm:px-6">
          {header}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
            <div className="grid grid-rows-2 gap-4 sm:gap-5">
              <div className="h-[200px] sm:h-[230px]">
                <BannerCard banner={topLeft} />
              </div>
              <div className="h-[200px] sm:h-[230px]">
                <BannerCard banner={bottomLeft} />
              </div>
            </div>
            <div className="h-[420px] sm:h-[480px] lg:h-auto">
              <BannerCard banner={tall} tall />
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Four banners: 2x2 grid
  if (banners.length === 4) {
    const [b1, b2, b3, b4] = banners;
    return (
      <section className="my-8 sm:my-12">
        <div className="max-w-[1320px] mx-auto px-4 sm:px-6">
          {header}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            <div className="h-[200px] sm:h-[230px]">
              <BannerCard banner={b1} />
            </div>
            <div className="h-[200px] sm:h-[230px]">
              <BannerCard banner={b2} />
            </div>
            <div className="h-[200px] sm:h-[230px]">
              <BannerCard banner={b3} />
            </div>
            <div className="h-[200px] sm:h-[230px]">
              <BannerCard banner={b4} />
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Five or more banners: Pattern of "4 chote (2x2 grid) + 5-va bada (tall card)", repeating every 5 banners
  const fullGroups: PromoBanner[][] = [];
  let idx = 0;
  while (idx + 5 <= banners.length) {
    fullGroups.push(banners.slice(idx, idx + 5));
    idx += 5;
  }
  const remainder = banners.slice(idx);

  return (
    <section className="my-8 sm:my-12">
      <div className="max-w-[1320px] mx-auto px-4 sm:px-6 space-y-4 sm:space-y-6">
        {header}

        {fullGroups.map((group, groupIndex) => {
          const [b1, b2, b3, b4, b5] = group;
          const isAlt = groupIndex % 2 === 1;

          const smallCards = (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 h-full">
              <div className="h-[200px] sm:h-[220px]">
                <BannerCard banner={b1} />
              </div>
              <div className="h-[200px] sm:h-[220px]">
                <BannerCard banner={b2} />
              </div>
              <div className="h-[200px] sm:h-[220px]">
                <BannerCard banner={b3} />
              </div>
              <div className="h-[200px] sm:h-[220px]">
                <BannerCard banner={b4} />
              </div>
            </div>
          );

          const bigCard = (
            <div className="h-[320px] sm:h-[380px] lg:h-full min-h-[420px] sm:min-h-[460px]">
              <BannerCard banner={b5} tall />
            </div>
          );

          return (
            <div
              key={`group-${groupIndex}`}
              className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 items-stretch"
            >
              {isAlt ? (
                <>
                  <div className="lg:col-span-5 h-full order-1 lg:order-1">
                    {bigCard}
                  </div>
                  <div className="lg:col-span-7 h-full order-2 lg:order-2">
                    {smallCards}
                  </div>
                </>
              ) : (
                <>
                  <div className="lg:col-span-7 h-full order-1 lg:order-1">
                    {smallCards}
                  </div>
                  <div className="lg:col-span-5 h-full order-2 lg:order-2">
                    {bigCard}
                  </div>
                </>
              )}
            </div>
          );
        })}

        {/* Remainder banners if count is not an exact multiple of 5 */}
        {remainder.length === 1 && (
          <div className="h-[200px] sm:h-[250px]">
            <BannerCard banner={remainder[0]} />
          </div>
        )}

        {remainder.length === 2 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
            <div className="h-[200px] sm:h-[230px]">
              <BannerCard banner={remainder[0]} />
            </div>
            <div className="h-[200px] sm:h-[230px]">
              <BannerCard banner={remainder[1]} />
            </div>
          </div>
        )}

        {remainder.length === 3 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
            <div className="grid grid-rows-2 gap-4 sm:gap-5">
              <div className="h-[200px] sm:h-[230px]">
                <BannerCard banner={remainder[0]} />
              </div>
              <div className="h-[200px] sm:h-[230px]">
                <BannerCard banner={remainder[1]} />
              </div>
            </div>
            <div className="h-[420px] sm:h-[480px] lg:h-auto">
              <BannerCard banner={remainder[2]} tall />
            </div>
          </div>
        )}

        {remainder.length === 4 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            {remainder.map((b) => (
              <div key={b.id} className="h-[200px] sm:h-[230px]">
                <BannerCard banner={b} />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default PromoBannerGrid;
