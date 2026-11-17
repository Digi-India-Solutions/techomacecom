import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface LogoProps {
  variant?: 'light' | 'dark';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Shift the image so the 'BUY DENMED' letters (not the arrow) sit on the vertical centre */
  centerWordmark?: boolean;
  showTagline?: boolean;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({
  variant = 'dark',
  size = 'md',
  showTagline = true,
  centerWordmark = false,
  className = ''
}) => {
  const isDark = variant === 'dark';

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
      title="Buy Denmed - Medical & Dental Direct"
    >
      <div className={`relative ${heightClasses} w-auto flex items-center shrink-0 ${centerWordmark ? '-translate-y-[14%]' : ''}`}>
        <Image
          src="/assets/aistudio/logo_transparent.png"
          alt="Buy Denmed Logo"
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
          Medical &amp; Dental Direct
        </span>
      )}
    </Link>
  );
};

export default Logo;
