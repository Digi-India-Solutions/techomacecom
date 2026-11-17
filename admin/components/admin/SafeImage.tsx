import React, { useState } from 'react';
import { Package } from 'lucide-react';

interface SafeImageProps {
  src?: string;
  alt: string;
  className?: string;
  fallbackClassName?: string;
}

export function SafeImage({
  src,
  alt,
  className = 'h-full w-full object-cover',
  fallbackClassName = 'h-full w-full',
}: SafeImageProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
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
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
