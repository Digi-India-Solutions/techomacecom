import React from 'react';
import { 
  getCategories, 
  getBrands, 
  getDealsOfTheDay, 
  getBestSellers, 
  getNewArrivals,
  getRentableProducts,
  getBlogPosts
} from '@/lib/api';
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

export default async function HomePage() {
  const [categories, brands, deals, bestSellers, newArrivals, rentalProducts, blogPosts] = await Promise.all([
    getCategories(),
    getBrands(),
    getDealsOfTheDay(),
    getBestSellers(),
    getNewArrivals(),
    getRentableProducts(),
    getBlogPosts()
  ]);

  return (
    <div className="flex flex-col min-h-screen bg-[#F7F7F7]">
      {/* a) Hero slider (3 graphic banners: medical sale, dental setup, rental services) */}
      <HeroSlider />

      {/* b) Trust strip (100% Genuine, Best Prices, Pan-India Delivery, EMI Available, Secure Payments, Easy Returns) */}
      <TrustStrip />

      {/* c) Top Categories (horizontal scroll of rounded image icons) */}
      <TopCategoriesGrid categories={categories} />

      {/* d) Featured Categories Bento Grid (Dentalkart style with 5 banners) */}
      <FeaturedCategoriesBento />

      {/* e) Deal of the Day with countdown timer and product slider */}
      <DealOfDay deals={deals} />

      {/* f) "Hot Selling" product slider */}
      <ProductRowSlider
        title="Hot Selling Products"
        subtitle="Most ordered operatory handpieces, oxygen concentrators & clinical disposables"
        viewAllLink="/category/respiratory-care"
        accentBadge="High Demand"
        products={bestSellers}
      />

      {/* g) Rental Services Section (full-width graphic banner with 4 highlights, Rent Now + Buy buttons, and below it Popular Rental Equipment slider) */}
      <RentalServicesSection rentalProducts={rentalProducts} />

      {/* h) Shop by Brand logo slider */}
      <ShopByBrandSlider brands={brands} />

      {/* i) Shop by Need (4 cards: Home Care, Respiratory Care, Dental Clinic, New Clinic Setup) */}
      <ShopByNeed />

      {/* j) Home Sleep Test promo banner ("Snoring? Feeling tired all day? Get a Sleep Study at Home" -> /sleep-test) */}
      <SleepTestPromo />

      {/* k) New Arrivals product slider */}
      <ProductRowSlider
        title="New Arrivals"
        subtitle="Latest medical innovations, imported European autoclaves & dental ceramics"
        viewAllLink="/category/dental-handpieces-motors"
        accentBadge="Just In"
        products={newArrivals}
      />

      {/* l) Why Buy Denmed stats counters (1000+ Products, 100+ Brands, Pan-India Delivery, 24x7 Support) */}
      <WhyBuyDenmed />

      {/* m) Testimonials slider (name, city, stars) */}
      <TestimonialsSection />

      {/* n) Blog preview (3 cards) & newsletter signup */}
      <BlogPreviewSection posts={blogPosts} />
      <NewsletterSection />
    </div>
  );
}
