import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Product, ProductImage } from "@/types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getProductImageUrl(
  imageOrProduct: Product | ProductImage | string | undefined | null,
  fallback = '/images/prod_bp_main.jpg'
): string {
  if (!imageOrProduct) return fallback;
  if (typeof imageOrProduct === 'string') {
    return imageOrProduct.trim() ? imageOrProduct.trim() : fallback;
  }
  if ('url' in imageOrProduct && typeof imageOrProduct.url === 'string') {
    return imageOrProduct.url.trim() ? imageOrProduct.url.trim() : fallback;
  }
  if ('thumbnail' in imageOrProduct && imageOrProduct.thumbnail && typeof imageOrProduct.thumbnail === 'string') {
    if (imageOrProduct.thumbnail.trim()) return imageOrProduct.thumbnail.trim();
  }
  if ('images' in imageOrProduct && Array.isArray(imageOrProduct.images) && imageOrProduct.images.length > 0) {
    for (const item of imageOrProduct.images) {
      const url = typeof item === 'string' ? item : item?.url;
      if (url && typeof url === 'string' && url.trim()) return url.trim();
    }
  }
  if ('image' in imageOrProduct && typeof (imageOrProduct as any).image === 'string') {
    const img = (imageOrProduct as any).image.trim();
    if (img) return img;
  }
  return fallback;
}

export function getProductImages(product: Product | undefined | null): ProductImage[] {
  if (!product) return [];
  if (Array.isArray(product.images) && product.images.length > 0) {
    const valid = product.images
      .map((item: any, idx) => {
        const url = typeof item === 'string' ? item.trim() : item?.url?.trim();
        if (!url) return null;
        const types: ProductImage['type'][] = ['main', 'angle', 'detail', 'in-use', 'box-contents', 'infographic'];
        return {
          url,
          alt: (typeof item === 'object' && item?.alt) ? item.alt : `${product.name} - View ${idx + 1}`,
          type: (typeof item === 'object' && item?.type) ? item.type : (types[idx] || 'detail')
        };
      })
      .filter((img): img is ProductImage => img !== null);

    if (valid.length > 0) return valid;
  }

  if (product.image && product.image.trim()) {
    return [{ url: product.image.trim(), alt: product.name, type: 'main' }];
  }
  if (product.thumbnail && product.thumbnail.trim()) {
    return [{ url: product.thumbnail.trim(), alt: product.name, type: 'main' }];
  }
  return [];
}
