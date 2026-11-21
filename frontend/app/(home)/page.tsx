import React from 'react';
import { 
  getCategories, 
  getBrands, 
  getProducts,
  getDealsOfTheDay, 
  getBestSellers, 
  getNewArrivals,
  getRentableProducts,
  getBlogPosts,
  getHeroBanners,
  getPageBanners,
  getHomepageConfig
} from '@/lib/api';
import type { Product, Category } from '@/types';
import HeroSlider from '@/components/home/HeroSlider';
import TrustStrip from '@/components/home/TrustStrip';
import TopCategoriesGrid from '@/components/home/TopCategoriesGrid';
import FeaturedCategoriesBento from '@/components/home/FeaturedCategoriesBento';
import DealOfDay from '@/components/home/DealOfDay';
import ProductRowSlider from '@/components/home/ProductRowSlider';
import RentalServicesSection from '@/components/home/RentalServicesSection';
import ShopByBrandSlider from '@/components/home/ShopByBrandSlider';
import ShopByNeed from '@/components/home/ShopByNeed';
import SleepTestPromo from '@/components/home/SleepTestPromo';
import WhyBuyDenmed from '@/components/home/WhyBuyDenmed';
import TestimonialsSection from '@/components/home/TestimonialsSection';
import BlogPreviewSection from '@/components/home/BlogPreviewSection';
import NewsletterSection from '@/components/home/NewsletterSection';
import PromoBannerGrid from '@/components/home/PromoBannerGrid';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const [
    homepageConfig,
    heroBanners,
    categories,
    brands,
    catalogProductsRes,
    deals,
    bestSellers,
    newArrivals,
    rentalProducts,
    blogPosts,
    hotSellingBanners
  ] = await Promise.all([
    getHomepageConfig(),
    getHeroBanners(),
    getCategories(),
    getBrands(),
    getProducts({ limit: 100 }),
    getDealsOfTheDay(),
    getBestSellers(),
    getNewArrivals(),
    getRentableProducts(),
    getBlogPosts(),
    getPageBanners('hot_selling').catch(() => [])
  ]);

  const dynamicPromoBanners = hotSellingBanners && hotSellingBanners.length >= 3
    ? hotSellingBanners.slice(0, 3).map((b) => ({
        id: b.id,
        href: b.link || '/',
        creative: b.imageDesktop,
        title: b.title,
        tagline: b.tagline,
      }))
    : undefined;

  const catalogProducts = catalogProductsRes?.products || [];

  // Admin → Categories "Show on homepage" and Admin → Brands "Featured on homepage" pick what
  // the home page shows. Until the admin has flagged any, show all so the sections are never empty.
  const homeCategories = categories.some((c) => c.showOnHome) ? categories.filter((c) => c.showOnHome) : categories;
  const homeBrands = brands.some((b) => b.isFeatured) ? brands.filter((b) => b.isFeatured) : brands;

  const sectionList = [...homepageConfig.sections]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .filter((s) => s.visible !== false);

  const getSectionConfig = (key: string) => {
    return homepageConfig.sections.find((item) => item.key === key);
  };

  const getSectionTitle = (key: string, fallback: string) => {
    const s = getSectionConfig(key);
    return s?.title?.trim() || fallback;
  };

  // Helper to match products selected by Admin in Homepage Sections
  const resolveCuratedProducts = (
    key: string,
    fallback: Product[]
  ): Product[] => {
    const sec = getSectionConfig(key);
    const selectedIds = sec?.selectedIds || sec?.targetIds;
    if (!selectedIds || selectedIds.length === 0) return fallback;

    const pool = [...fallback, ...catalogProducts];
    const map = new Map<string, Product>();
    pool.forEach((p) => {
      map.set(String(p.id).toLowerCase(), p);
      if (p.slug) map.set(p.slug.toLowerCase(), p);
      if (p.sku) map.set(p.sku.toLowerCase(), p);
    });

    const curated: Product[] = [];
    selectedIds.forEach((id) => {
      const cleanId = String(id).toLowerCase();
      let match = map.get(cleanId);
      if (!match) {
        const stripped = cleanId.replace(/^prod-/, '').replace(/[-_]/g, '');
        match = pool.find((p) => {
          const s = (p.slug || '').toLowerCase().replace(/[-_]/g, '');
          const k = (p.sku || '').toLowerCase().replace(/[-_]/g, '');
          const n = (p.name || '').toLowerCase().replace(/[-_]/g, '');
          return s.includes(stripped) || k.includes(stripped) || n.includes(stripped);
        });
      }
      if (match && !curated.some((p) => p.id === match!.id)) {
        curated.push(match);
      }
    });

    return curated.length > 0 ? curated : fallback;
  };

  // Helper to match categories selected by Admin in Homepage Sections
  const resolveCuratedCategories = (
    key: string,
    fallback: Category[]
  ): Category[] => {
    const sec = getSectionConfig(key);
    const selectedIds = sec?.selectedIds || sec?.targetIds;
    const baseList = categories.length > 0 ? categories : fallback;
    if (!selectedIds || selectedIds.length === 0) return baseList;

    const curated: Category[] = [];
    selectedIds.forEach((id) => {
      const cleanId = String(id).toLowerCase();
      let match = categories.find(
        (c) => String(c.id).toLowerCase() === cleanId || (c.slug && c.slug.toLowerCase() === cleanId)
      );
      if (!match) {
        const stripped = cleanId.replace(/^cat-/, '').replace(/[-_]/g, '');
        match = categories.find((c) => {
          const s = (c.slug || '').toLowerCase().replace(/[-_]/g, '');
          const n = (c.name || '').toLowerCase().replace(/[-_]/g, '');
          if (stripped.includes('respiratory') || stripped.includes('oxygen')) {
            return s.includes('oxygen') || s.includes('bipap') || n.includes('oxygen');
          }
          if (stripped.includes('dental')) {
            return s.includes('dental') || n.includes('dental');
          }
          if (stripped.includes('patient') || stripped.includes('monitoring')) {
            return s.includes('monitor') || n.includes('monitor');
          }
          if (stripped.includes('hospital') || stripped.includes('mobility') || stripped.includes('bed')) {
            return s.includes('bed') || s.includes('wheelchair') || n.includes('bed');
          }
          return s.includes(stripped) || n.includes(stripped);
        });
      }
      if (match && !curated.some((c) => c.id === match!.id)) {
        curated.push(match);
      }
    });

    // Append remaining categories from baseList so Top Categories is always rich & complete
    for (const c of baseList) {
      if (!curated.some((item) => String(item.id) === String(c.id))) {
        curated.push(c);
      }
    }

    return curated.length > 0 ? curated : baseList;
  };

  const renderSection = (key: string) => {
    switch (key) {
      case 'hero':
        return <HeroSlider key="hero" banners={heroBanners} />;
      case 'trust_strip':
        return <TrustStrip key="trust_strip" />;
      case 'top_categories': {
        const curatedCats = resolveCuratedCategories('top_categories', homeCategories);
        return (
          <TopCategoriesGrid
            key="top_categories"
            categories={curatedCats}
            title={getSectionTitle('top_categories', 'Shop by Medical Department')}
          />
        );
      }
      case 'featured_categories':
        return (
          <FeaturedCategoriesBento
            key="featured_categories"
            title={getSectionTitle('featured_categories', 'Clinical & Homecare Essentials')}
          />
        );
      case 'deal_of_the_day': {
        // Active deals scheduled in Admin ➔ Marketing ➔ Deal of the Day
        let activeDeals = deals;
        const sec = getSectionConfig('deal_of_the_day');
        const selectedIds = sec?.selectedIds || sec?.targetIds;
        if (selectedIds && selectedIds.length > 0) {
          const curated = resolveCuratedProducts('deal_of_the_day', deals);
          const remaining = deals.filter((d) => !curated.some((c) => c.id === d.id));
          activeDeals = [...curated, ...remaining];
        }
        return (
          <DealOfDay
            key="deal_of_the_day"
            deals={activeDeals}
            title={getSectionTitle('deal_of_the_day', 'Deal of the Day')}
          />
        );
      }
      case 'hot_selling': {
        const curatedHotSelling = resolveCuratedProducts('hot_selling', bestSellers);
        return (
          <React.Fragment key="hot_selling">
            <ProductRowSlider
              title={getSectionTitle('hot_selling', 'Hot Selling Medical Devices')}
              subtitle="Most ordered operatory handpieces, oxygen concentrators & clinical disposables"
              viewAllLink="/best-sellers"
              products={curatedHotSelling}
            />
            <PromoBannerGrid banners={dynamicPromoBanners} />
          </React.Fragment>
        );
      }
      case 'rental_section': {
        const curatedRentals = resolveCuratedProducts('rental_section', rentalProducts);
        return (
          <RentalServicesSection
            key="rental_section"
            rentalProducts={curatedRentals}
            title={getSectionTitle('rental_section', 'Medical Equipment on Rent')}
          />
        );
      }
      case 'shop_by_brand':
        return <ShopByBrandSlider key="shop_by_brand" brands={homeBrands} />;
      case 'shop_by_need':
        return <ShopByNeed key="shop_by_need" />;
      case 'sleep_test_banner':
        return <SleepTestPromo key="sleep_test_banner" />;
      case 'new_arrivals': {
        const curatedNewArrivals = resolveCuratedProducts('new_arrivals', newArrivals);
        return (
          <ProductRowSlider
            key="new_arrivals"
            title={getSectionTitle('new_arrivals', 'New Arrivals')}
            subtitle="Latest medical innovations, imported European autoclaves & dental ceramics"
            viewAllLink="/new-arrivals"
            products={curatedNewArrivals}
          />
        );
      }
      case 'why_buy_denmed':
        return <WhyBuyDenmed key="why_buy_denmed" />;
      case 'testimonials':
        return <TestimonialsSection key="testimonials" />;
      case 'blog':
        return <BlogPreviewSection key="blog" posts={blogPosts} />;
      default:
        return null;
    }
  };

  return (
    <div className="home-compact flex flex-col min-h-screen bg-[#F6F9FD]">
      {sectionList.map((sec) => renderSection(sec.key))}
      <NewsletterSection />
    </div>
  );
}
