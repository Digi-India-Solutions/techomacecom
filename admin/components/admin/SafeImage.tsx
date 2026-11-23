import React, { useState, useEffect } from 'react';
import { Package } from 'lucide-react';

interface SafeImageProps {
  src?: string;
  alt: string;
  className?: string;
  fallbackClassName?: string;
}

export function resolveAdminImageUrl(src?: string): string | undefined {
  if (!src) return undefined;
  const s = src.trim();
  if (!s) return undefined;

  // Fully qualified or blob/data URLs
  if (
    s.startsWith('http://') ||
    s.startsWith('https://') ||
    s.startsWith('blob:') ||
    s.startsWith('data:')
  ) {
    return s;
  }

  // Backend uploaded images
  if (s.startsWith('/uploads/')) {
    return `http://localhost:5001${s}`;
  }

  // Frontend public images (bento, categories, products)
  if (s.startsWith('/images/')) {
    return `http://localhost:3000${s}`;
  }

  // Root-relative assets within admin (e.g. /src/assets/...)
  return s;
}

export function SafeImage({
  src,
  alt,
  className = 'h-full w-full object-cover',
  fallbackClassName = 'h-full w-full',
}: SafeImageProps) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  const resolvedSrc = resolveAdminImageUrl(src);

  if (!resolvedSrc || failed) {
    return (
      <div
        className={`flex items-center justify-center bg-[#EAF2FC] text-[#1D5FAF] ${fallbackClassName}`}
        aria-label={alt}
      >
        <Package className="h-5 w-5 opacity-75" />
      </div>
    );
  }

  return (
    <img
      src={resolvedSrc}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
