import { useState } from 'react';

interface AvatarProps {
  name: string;
  initials: string;
  url?: string | null;
  /** Tailwind size + text classes, e.g. "h-7 w-7 text-xs" */
  className?: string;
  rounded?: string;
}

/** Profile photo with an initials fallback (also used when the image fails to load). */
export function Avatar({ name, initials, url, className = 'h-8 w-8 text-xs', rounded = 'rounded-md' }: AvatarProps) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const showImage = Boolean(url) && failedUrl !== url;

  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden bg-[#0B2545] font-semibold text-white ${rounded} ${className}`}
      aria-label={name}
    >
      {showImage ? (
        <img
          src={url as string}
          alt=""
          className="h-full w-full object-cover"
          loading="lazy"
          decoding="async"
          onError={() => setFailedUrl(url ?? null)}
        />
      ) : (
        <span aria-hidden="true">{initials}</span>
      )}
    </span>
  );
}
