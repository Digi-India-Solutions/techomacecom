import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface LogoProps {
  variant?: 'light' | 'dark'; // on dark background or light
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  showTagline = false,
  className = ''
}) => {
  // Height: ~40px desktop, ~32px mobile on charcoal header
  const heightClasses =
    size === 'sm'
      ? 'h-7 sm:h-8'
      : size === 'lg'
      ? 'h-10 sm:h-12'
      : 'h-8 sm:h-10'; // ~32px mobile, ~40px desktop

  return (
    <Link
      href="/"
      className={`inline-flex items-center gap-2 select-none ${className}`}
      title="Buy Denmed - Medical & Dental Direct"
    >
      <div className={`relative ${heightClasses} w-auto flex items-center`}>
        <Image
          src="/assets/aistudio/logo_transparent.png"
          alt="Buy Denmed Logo"
          width={220}
          height={40}
          priority
          className="h-full w-auto object-contain"
        />
      </div>
      {showTagline && (
        <span className="hidden xl:inline-block text-[10px] text-gray-400 font-medium border-l border-neutral-700 pl-2 leading-none uppercase tracking-wider font-heading">
          Medical &amp; Dental Direct
        </span>
      )}
    </Link>
  );
};

export default Logo;
