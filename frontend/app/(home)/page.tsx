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
  getHomepageConfig,
  getFeaturedReviews
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
import PromoBannerGrid, { PROMO_BANNERS } from '@/components/home/PromoBannerGrid';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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
    hotSellingBanners,
    featuredReviews,
    promo1Banners,
    promo2Banners
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
    getPageBanners('hot_selling').catch(() => []),
    // Admin → Reviews → "Feature on home page" (approved reviews only)
    getFeaturedReviews(12),
    getPageBanners('promo_banner_1').catch(() => getPageBanners('promo_1').catch(() => getPageBanners('featured_categories').catch(() => []))),
    getPageBanners('promo_banner_2').catch(() => getPageBanners('promo_2').catch(() => getPageBanners('promo_banners').catch(() => [])))
  ]);

  const activePromo1Banners = promo1Banners && promo1Banners.length > 0
    ? promo1Banners.map((b, idx) => {
        const image = b.imageDesktop || b.desktopImageUrl || b.imageUrl || '';
        return {
          id: String(b.id || `promo1-${idx}`),
          href: b.linkUrl || b.link || '/',
          title: b.title || '',
          brand: b.title?.includes('-') ? b.title.split('-')[0].trim() : '',
          tagline: b.tagline || '',
          creative: image,
          image: image,
        };
      })
    : [];

  const activePromo2Banners = promo2Banners && promo2Banners.length > 0
    ? promo2Banners.map((b, idx) => {
        const def = PROMO_BANNERS[idx] || {};
        const image = b.imageDesktop || b.desktopImageUrl || b.imageUrl || def.creative || def.image;

        return {
          ...def,
          id: String(b.id || `promo2-${idx}`),
          href: b.linkUrl || b.link || def.href || '/',
          title: b.title ? (b.title.includes('-') ? b.title.split('-').slice(1).join('-').trim() : b.title) : (def.title || ''),
          brand: b.title?.includes('-') ? b.title.split('-')[0].trim() : (def.brand || ''),
          tagline: b.tagline || def.tagline || '',
          creative: image,
          image: image,
        };
      })
    : (hotSellingBanners && hotSellingBanners.length >= 3
      ? hotSellingBanners.map((b) => ({
          id: String(b.id),
          href: b.linkUrl || b.link || '/',
          creative: b.imageDesktop || b.desktopImageUrl,
          title: b.title,
          tagline: b.tagline,
        }))
      : PROMO_BANNERS);

  const catalogProducts = catalogProductsRes?.products || [];

  // Admin → Categories "Show on homepage" and Admin → Brands "Featured on homepage" pick what
  // the home page shows. Until the admin has flagged any, show all so the sections are never empty.
  const homeCategories = categories.some((c) => c.showOnHome) ? categories.filter((c) => c.showOnHome) : categories;
  const homeBrands = brands.some((b) => b.isFeatured) ? brands.filter((b) => b.isFeatured) : brands;

  const sectionList = [...homepageConfig.sections]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .filter((s) => s.visible !== false);

  const getSectionConfig = (key: string) => {
    const cleanKey = key.toLowerCase().replace(/[-_]/g, '');
    return homepageConfig.sections.find(
      (item) => item.key === key || item.key.toLowerCase().replace(/[-_]/g, '') === cleanKey
    );
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
    fallback: Category[],
    exactOnly: boolean = false
  ): Category[] => {
    const sec = getSectionConfig(key);
    const selectedIds = sec?.selectedIds || sec?.targetIds;
    const baseList = categories.length > 0 ? categories : fallback;
    if (!selectedIds || selectedIds.length === 0) {
      return exactOnly ? baseList.slice(0, 6) : baseList;
    }

    // Flatten all category levels (Level 1, Level 2, Level 3) so any admin-selected category matches
    const flatPool: Category[] = [];
    const seenIds = new Set<string>();

    const addCat = (c: Category) => {
      if (!c || seenIds.has(String(c.id))) return;
      seenIds.add(String(c.id));
      flatPool.push(c);
    };

    categories.forEach((cat) => {
      addCat(cat);
      if (Array.isArray(cat.subCategories)) {
        cat.subCategories.forEach((sub) => {
          addCat({
            id: String(sub.id),
            name: sub.name,
            slug: sub.slug,
            icon: sub.icon || cat.icon || '',
            image: sub.image || cat.image || '',
            description: cat.description || '',
            itemCount: sub.itemCount || 0,
            subCategories: [],
            bannerDesktop: cat.bannerDesktop,
          });
          if (Array.isArray(sub.children)) {
            sub.children.forEach((child) => {
              addCat({
                id: String(child.id),
                name: child.name,
                slug: child.slug,
                icon: sub.icon || cat.icon || '',
                image: sub.image || cat.image || '',
                description: cat.description || '',
                itemCount: child.itemCount || 0,
                subCategories: [],
                bannerDesktop: cat.bannerDesktop,
              });
            });
          }
        });
      }
    });

    const curated: Category[] = [];
    selectedIds.forEach((id) => {
      const cleanId = String(id).toLowerCase().trim();
      let match = flatPool.find(
        (c) => String(c.id).toLowerCase() === cleanId || (c.slug && c.slug.toLowerCase() === cleanId)
      );
      if (!match) {
        const stripped = cleanId.replace(/^cat-/, '').replace(/[-_]/g, '');
        match = flatPool.find((c) => {
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
      if (match && !curated.some((c) => String(c.id) === String(match!.id))) {
        curated.push(match);
      }
    });

    if (exactOnly) {
      // If fewer than 5 items selected, supplement from pool so Bento layout is full
      if (curated.length < 5) {
        for (const c of flatPool) {
          if (!curated.some((item) => String(item.id) === String(c.id))) {
            curated.push(c);
            if (curated.length >= 5) break;
          }
        }
      }
      return curated.length > 0 ? curated : baseList.slice(0, 6);
    }

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
      case 'featured_categories': {
        const curatedCats = resolveCuratedCategories('featured_categories', homeCategories, true);
        return (
          <FeaturedCategoriesBento
            key="featured_categories"
            title={getSectionTitle('featured_categories', 'Clinical & Homecare Essentials')}
            categories={curatedCats}
            showButton={true}
          />
        );
      }
      case 'promo_banner_1':
      case 'promo_1': {
        if (!activePromo1Banners || activePromo1Banners.length === 0) return null;
        return (
          <PromoBannerGrid
            key={key}
            title={getSectionTitle('promo_banner_1', '')}
            banners={activePromo1Banners}
          />
        );
      }
      case 'promo_banner_2':
      case 'promo_banners':
      case 'promo_2': {
        return (
          <PromoBannerGrid
            key={key}
            title={getSectionTitle('promo_banner_2', '')}
            banners={activePromo2Banners}
          />
        );
      }
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
        const hasSeparatePromo2 = sectionList.some((s) => s.key === 'promo_banner_2' || s.key === 'promo_banners' || s.key === 'promo_2');
        return (
          <React.Fragment key="hot_selling">
            <ProductRowSlider
              title={getSectionTitle('hot_selling', 'Hot Selling Medical Devices')}
              subtitle="Most ordered operatory handpieces, oxygen concentrators & clinical disposables"
              viewAllLink="/best-sellers"
              products={curatedHotSelling}
            />
            {!hasSeparatePromo2 && <PromoBannerGrid banners={activePromo2Banners} />}
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
        return (
          <ShopByBrandSlider
            key="shop_by_brand"
            brands={homeBrands}
            title={getSectionTitle('shop_by_brand', 'Shop by Brands')}
          />
        );
      case 'shop_by_need':
        return (
          <ShopByNeed
            key="shop_by_need"
            title={getSectionTitle('shop_by_need', 'Shop by Medical Need')}
          />
        );
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
        return (
          <WhyBuyDenmed
            key="why_buy_denmed"
            title={getSectionTitle('why_buy_denmed', 'Why Doctors & Families Choose Buy Denmed')}
          />
        );
      case 'testimonials':
        return (
          <TestimonialsSection
            key="testimonials"
            reviews={featuredReviews}
            title={getSectionTitle('testimonials', 'What Doctors & Patients Say')}
          />
        );
      case 'blog':
        return (
          <BlogPreviewSection
            key="blog"
            posts={blogPosts}
            title={getSectionTitle('blog', 'From the Denmed Knowledge Hub')}
          />
        );
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
