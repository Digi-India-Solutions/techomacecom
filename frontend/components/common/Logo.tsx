'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSiteSettings } from '@/lib/settings/store';

interface LogoProps {
  variant?: 'light' | 'dark';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Shift the image so the 'BUY DENMED' letters (not the arrow) sit on the vertical centre */
  centerWordmark?: boolean;
  showTagline?: boolean;
  className?: string;
  /** footer uses Settings → Store → Footer logo (falls back to the header logo) */
  placement?: 'header' | 'footer';
}

export const Logo: React.FC<LogoProps> = ({
  variant = 'dark',
  size = 'md',
  showTagline = true,
  centerWordmark = false,
  className = '',
  placement = 'header'
}) => {
  const isDark = variant === 'dark';
  const { store } = useSiteSettings();
  // Uploaded in admin → Settings → Store; otherwise the bundled logo
  const uploaded = placement === 'footer' ? store.footerLogoUrl : store.logoUrl;
  const src = uploaded || '/assets/aistudio/logo_transparent.png';

  const heightClasses =
    size === 'sm'
      ? 'h-7 sm:h-8'
      : size === 'lg'
      ? 'h-10 sm:h-12'
      : size === 'xl'
      ? 'h-12 sm:h-14'
      : 'h-8 sm:h-10';

  return (
    <Link
      href="/"
      className={`inline-flex items-center gap-3 select-none group transition-opacity hover:opacity-95 shrink-0 whitespace-nowrap ${className}`}
      title={`${store.brandName} - ${store.tagline}`}
    >
      <div className={`relative ${heightClasses} w-auto flex items-center shrink-0 ${centerWordmark && !uploaded ? '-translate-y-[14%]' : ''}`}>
        <Image
          src={src}
          alt={`${store.brandName} logo`}
          width={220}
          height={44}
          priority
          className="h-full w-auto object-contain shrink-0"
        />
      </div>

      {showTagline && (
        <span
          className={`hidden xl:inline-block text-xs font-semibold border-l pl-2.5 leading-none uppercase tracking-wider font-heading ${
            isDark
              ? 'text-slate-300 border-[#13335E]'
              : 'text-[#5B6B82] border-[#DCE6F2]'
          }`}
        >
          {store.tagline}
        </span>
      )}
    </Link>
  );
};

export default Logo;
