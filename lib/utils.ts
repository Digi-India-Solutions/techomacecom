import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Product, ProductImage } from "@/types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getProductImageUrl(
  imageOrProduct: Product | ProductImage | string | undefined | null,
  fallback = '/images/bento_dental_equip_1793803387280.jpg'
): string {
  if (!imageOrProduct) return fallback;
  if (typeof imageOrProduct === 'string') return imageOrProduct;
  if ('url' in imageOrProduct && typeof imageOrProduct.url === 'string') {
    return imageOrProduct.url;
  }
  if ('thumbnail' in imageOrProduct && imageOrProduct.thumbnail) {
    return imageOrProduct.thumbnail;
  }
  if ('images' in imageOrProduct && Array.isArray(imageOrProduct.images) && imageOrProduct.images.length > 0) {
    const first = imageOrProduct.images[0];
    return typeof first === 'string' ? first : first.url;
  }
  if ('image' in imageOrProduct && typeof (imageOrProduct as any).image === 'string') {
    return (imageOrProduct as any).image;
  }
  return fallback;
}

export function getProductImages(product: Product | undefined | null): ProductImage[] {
  if (!product) return [];
  if (Array.isArray(product.images) && product.images.length > 0) {
    return product.images.map((item, idx) => {
      if (typeof item === 'string') {
        const types: ProductImage['type'][] = ['main', 'angle', 'detail', 'in-use', 'box-contents', 'infographic'];
        return {
          url: item,
          alt: `${product.name} - View ${idx + 1}`,
          type: types[idx] || 'detail'
        };
      }
      return item;
    });
  }
  if (product.image) {
    return [{ url: product.image, alt: product.name, type: 'main' }];
  }
  if (product.thumbnail) {
    return [{ url: product.thumbnail, alt: product.name, type: 'main' }];
  }
  return [];
}
