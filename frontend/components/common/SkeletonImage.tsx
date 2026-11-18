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
  const key = typeof src === 'string' ? src : 'src' in src ? src.src : src.default.src;
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null);
  const loaded = loadedSrc === key;

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
          setLoadedSrc(key);
          onError?.(e);
        }}
      />
    </>
  );
};

export default SkeletonImage;
