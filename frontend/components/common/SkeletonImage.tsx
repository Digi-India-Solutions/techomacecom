'use client';

import React, { useState } from 'react';
import Image, { type ImageProps } from 'next/image';
import { Skeleton } from '@/components/common/Skeleton';

/**
 * Drop-in for `next/image` with `fill`: shows a shimmer in the image's box
 * until the picture has loaded (or failed), then gets out of the way.
 * The parent must be `relative` — same rule as any `fill` image.
 */
export const SkeletonImage: React.FC<ImageProps> = ({ onLoad, onError, src, alt, ...props }) => {
  // Track which src has finished, so switching images (gallery, thumbnails) shows the shimmer again
  const key = !src ? '' : typeof src === 'string' ? src : 'src' in src ? src.src : src.default.src;
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null);
  const [errorSrc, setErrorSrc] = useState<string | null>(null);
  const loaded = loadedSrc === key;
  const hasError = errorSrc === key;

  // Catalog images are optional in the admin (e.g. a category without a card image):
  // next/image throws on an empty src, so show a neutral tile instead.
  if (!key || hasError) {
    return (
      <div
        role="img"
        aria-label={alt}
        className="absolute inset-0 flex items-center justify-center bg-[#EAF2FC] text-[#1D5FAF] text-2xl font-bold"
      >
        {alt?.trim().charAt(0).toUpperCase() || '•'}
      </div>
    );
  }

  return (
    <>
      {!loaded && <Skeleton className="absolute inset-0 rounded-none" />}
      <Image
        src={src}
        alt={alt}
        {...props}
        onLoad={(e) => {
          setLoadedSrc(key);
          onLoad?.(e);
        }}
        onError={(e) => {
          setErrorSrc(key);
          setLoadedSrc(key);
          onError?.(e);
        }}
      />
    </>
  );
};

export default SkeletonImage;
