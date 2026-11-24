'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { 
  Search, 
  MapPin, 
  User as UserIcon, 
  Heart, 
  ShoppingBag, 
  Menu, 
  ChevronDown, 
  ChevronRight, 
  Phone, 
  Percent, 
  Flame, 
  Sparkles, 
  Layers, 
  Bed, 
  Activity, 
  FileText,
  Clock,
  ShieldCheck,
  CheckCircle2,
  CircleUserRound,
  Truck,
  X,
  CreditCard
} from 'lucide-react';
import Logo from '@/components/common/Logo';
import { useCartStore, useWishlistStore, usePincodeStore, useUserStore } from '@/lib/store';
import { searchSuggestions, getHomepageConfig } from '@/lib/api';
import { useCatalogCategories } from '@/lib/hooks/useCatalogCategories';
import { useHydrated } from '@/hooks/use-hydrated';
import { Skeleton } from '@/components/common/Skeleton';

interface HeaderProps {
  onOpenMobileMenu?: () => void;
}

/** Notices scrolled in the top blue strip — edit this list to change the marquee. */
const TOP_NOTICES: { icon: React.ElementType; text: string; highlight?: boolean }[] = [
  { icon: ShieldCheck, text: '100% Genuine Clinical & Dental Equipment' },
  { icon: Truck, text: 'Free Pan-India Delivery on orders above ₹5,000' },
  { icon: CreditCard, text: 'Zero-Cost EMI on all major cards' },
  { icon: FileText, text: 'GST Tax Credit Invoicing available', highlight: true },
  { icon: Bed, text: 'Rent CPAP, BiPAP & Oxygen Concentrators from ₹1,999/month' },
  { icon: Activity, text: 'Home Sleep Test — reports in 24–48 hrs' }
];

export const Header: React.FC<HeaderProps> = ({ onOpenMobileMenu }) => {
  const router = useRouter();
  const { getItemCount, setIsCartOpen } = useCartStore();
  const { items: wishlistItems } = useWishlistStore();
  const { pincode, city, setPincodeModalOpen } = usePincodeStore();
  const { user, isAuthenticated, setAuthModalOpen } = useUserStore();
  // Login state and badge counts come from localStorage — wait for it before showing them
  const hydrated = useHydrated();

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<{
    products: any[];
    categories: any[];
    brands: any[];
  }>({ products: [], categories: [], brands: [] });

  const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);
  const [activeCategoryIndex, setActiveCategoryIndex] = useState(0);
  const [marqueeNotices, setMarqueeNotices] = useState(TOP_NOTICES);

  useEffect(() => {
    let active = true;
    getHomepageConfig()
      .then((cfg) => {
        if (!active || !cfg?.announcementStrip) return;
        const text = cfg.announcementStrip.trim();
        if (!text) return;
        const parts = text
          .split(/[·•|]/)
          .map((s) => s.trim())
          .filter(Boolean);
        if (parts.length > 0) {
          const icons = [Truck, ShieldCheck, FileText, CreditCard, Sparkles, Activity];
          const dynamicList = parts.map((partText, idx) => ({
            icon: icons[idx % icons.length],
            text: partText,
            highlight: idx === 1 || partText.toLowerCase().includes('gst')
          }));
          setMarqueeNotices(dynamicList);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const categories = useCatalogCategories({ menuOnly: true });
  const currentCategory = categories[activeCategoryIndex] || categories[0];

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const megaMenuRef = useRef<HTMLDivElement>(null);
  const megaMenuCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Open the mega menu on hover; close after a short delay so moving the
  // pointer from the trigger into the panel doesn't flicker it shut.
  const openMegaMenu = () => {
    if (megaMenuCloseTimer.current) clearTimeout(megaMenuCloseTimer.current);
    setIsMegaMenuOpen(true);
  };
  const scheduleCloseMegaMenu = () => {
    if (megaMenuCloseTimer.current) clearTimeout(megaMenuCloseTimer.current);
    megaMenuCloseTimer.current = setTimeout(() => setIsMegaMenuOpen(false), 180);
  };
  useEffect(() => () => {
    if (megaMenuCloseTimer.current) clearTimeout(megaMenuCloseTimer.current);
  }, []);

  // Handle outside click for search suggestions & mega menu
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
      if (megaMenuRef.current && !megaMenuRef.current.contains(event.target as Node)) {
        setIsMegaMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch search suggestions debounced
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!searchQuery.trim()) {
        setSuggestions({ products: [], categories: [], brands: [] });
      } else {
        const res = await searchSuggestions(searchQuery);
        setSuggestions(res);
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setIsSearchFocused(false);
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="nav-compact sticky top-0 z-40 w-full shadow-lg font-heading">
      {/* ========================================================
          1. TOP UTILITY STRIP (MEDICAL BLUE #1D5FAF)
          ======================================================== */}
      <div className="bg-[#1D5FAF] text-white text-xs sm:text-[11px] font-semibold py-2 px-4 sm:px-8 border-b border-white/10">
        <div className="max-w-[1440px] mx-auto flex items-center">
          {/* Full-width scrolling notice marquee (pauses on hover) */}
          <div
            className="marquee relative flex-1 min-w-0 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_24px,black_calc(100%-24px),transparent)]"
            aria-label="Store notices"
          >
            <div className="marquee-track flex w-max">
              {[0, 1].map((copy) => (
                <ul
                  key={copy}
                  className="flex shrink-0 items-center"
                  aria-hidden={copy === 1 ? true : undefined}
                >
                  {marqueeNotices.map((notice, i) => (
                    <li key={i} className="flex items-center gap-1.5 whitespace-nowrap px-5">
                      <notice.icon className="w-3.5 h-3.5 text-[#F28C38] shrink-0" />
                      <span className={notice.highlight ? 'text-[#BFDBFE] font-bold' : 'text-white'}>
                        {notice.text}
                      </span>
                      <span className="ml-5 text-white/40">•</span>
                    </li>
                  ))}
                </ul>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* ========================================================
          2. MAIN HEADER BAR (NAVY #0B2545)
          ======================================================== */}
      <div className="bg-[#0B2545] text-white px-4 sm:px-8 lg:px-10 py-3.5 sm:py-4">
        <div className="max-w-[1440px] mx-auto flex items-center justify-between gap-3 lg:gap-6 xl:gap-10">
          {/* Left: Mobile Menu Trigger + Brand Logo */}
          <div className="flex items-center gap-3.5 shrink-0">
            <button
              onClick={onOpenMobileMenu}
              className="lg:hidden p-2 text-slate-200 hover:text-white rounded-xl hover:bg-[#13335E] transition-colors cursor-pointer"
              aria-label="Open Navigation Menu"
              suppressHydrationWarning
            >
              <Menu className="w-6 h-6" />
            </button>
            <Logo variant="dark" size="lg" showTagline={false} centerWordmark />
          </div>

          {/* Delivery location — sits right after the logo */}
          <button
            type="button"
            onClick={() => setPincodeModalOpen(true)}
            className="group hidden lg:flex items-start gap-2 shrink-0 text-left cursor-pointer"
            title="Change Delivery Location"
            suppressHydrationWarning
          >
            <MapPin className="w-5 h-5 mt-0.5 text-[#F28C38] shrink-0" />
            <span className="leading-tight" suppressHydrationWarning>
              <span className="block text-sm font-semibold text-white truncate max-w-[170px]" suppressHydrationWarning>
                {hydrated && pincode ? `Deliver to ${pincode}` : 'Select Location'}
              </span>
              <span className="flex items-center gap-0.5 text-[11px] font-semibold text-[#93C5FD] group-hover:text-white transition-colors" suppressHydrationWarning>
                {hydrated && pincode ? (city || 'Change location') : 'Set Pincode'}
                <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
              </span>
            </span>
          </button>

          {/* Center: Expansive, Generous Search Bar with Suggestions */}
          <div ref={searchContainerRef} className="relative flex-1 min-w-0 max-w-[760px] hidden md:block">
            <form onSubmit={handleSearchSubmit} className="flex items-stretch rounded-lg overflow-hidden border border-[#DCE6F2] bg-white focus-within:ring-2 focus-within:ring-[#93C5FD] shadow-xs">
              <input
                id="header-search-desktop"
                name="q"
                type="search"
                autoComplete="off"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                placeholder="Search Product, Category, Brand..."
                className="flex-1 min-w-0 bg-white text-[#12263F] text-sm sm:text-base px-4 py-2.5 sm:py-3 focus:outline-none placeholder-[#5B6B82] font-body"
                suppressHydrationWarning
              />
              <button
                type="submit"
                className="w-14 sm:w-16 shrink-0 bg-[#1D5FAF] hover:bg-[#174E90] text-white flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Search"
                suppressHydrationWarning
              >
                <Search className="w-5 h-5" />
              </button>
            </form>

            {/* Live Search Suggestions Dropdown */}
            {isSearchFocused && (searchQuery.trim() || suggestions.products.length > 0) && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-[#DCE6F2] overflow-hidden z-50 animate-in fade-in text-[#12263F]">
                {suggestions.products.length === 0 &&
                suggestions.categories.length === 0 &&
                suggestions.brands.length === 0 ? (
                  <div className="p-5 text-center text-sm text-[#5B6B82] font-body">
                    No exact match found for &quot;{searchQuery}&quot;. Press enter to search all 20,000+ catalog products.
                  </div>
                ) : (
                  <div className="max-h-96 overflow-y-auto divide-y divide-[#DCE6F2]">
                    {/* Products */}
                    {suggestions.products.length > 0 && (
                      <div className="p-3.5">
                        <div className="text-xs font-bold text-[#5B6B82] uppercase tracking-wider mb-2 font-heading">
                          Products
                        </div>
                        <div className="space-y-1">
                          {suggestions.products.map((p) => (
                            <div
                              key={p.id}
                              className="flex items-center gap-3.5 p-2 rounded-xl hover:bg-[#EAF2FC] transition-colors group"
                            >
                              <Link
                                href={`/product/${p.slug}`}
                                onClick={() => setIsSearchFocused(false)}
                                className="flex items-center gap-3.5 flex-1 min-w-0"
                              >
                                <div className="w-12 h-12 rounded-lg bg-[#F6F9FD] border border-[#DCE6F2] relative shrink-0 overflow-hidden flex items-center justify-center">
                                  <Image
                                    src={p.thumbnail}
                                    alt={p.name}
                                    fill
                                    className="object-contain p-1"
                                    referrerPolicy="no-referrer"
                                  />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-xs text-[#5B6B82] font-semibold">{p.brandName}</div>
                                  <div className="text-sm font-semibold text-[#12263F] group-hover:text-[#1D5FAF] truncate font-heading">
                                    {p.name}
                                  </div>
                                </div>
                              </Link>

                              <div className="flex items-center gap-2.5 shrink-0">
                                <Link
                                  href={`/product/${p.slug}`}
                                  onClick={() => setIsSearchFocused(false)}
                                  className="text-right group/buy"
                                >
                                  <div className="text-sm font-bold text-[#1D5FAF] font-body">
                                    ₹{p.price.toLocaleString('en-IN')}
                                  </div>
                                  <span className="text-[10px] text-[#5B6B82] block leading-tight font-medium group-hover/buy:text-[#1D5FAF]">
                                    Buy Now &rarr;
                                  </span>
                                </Link>

                                {p.rentEnabled && (
                                  <Link
                                    href={`/rent/${p.slug}`}
                                    onClick={() => setIsSearchFocused(false)}
                                    className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#EFF6FF] hover:bg-[#1D5FAF] text-[#1D5FAF] hover:text-white border border-[#BFDBFE] hover:border-[#1D5FAF] rounded-lg transition-all text-xs font-semibold shadow-2xs group/rent"
                                    title={`Rent ${p.name}`}
                                  >
                                    <Bed className="w-3.5 h-3.5 shrink-0 text-[#1D5FAF] group-hover/rent:text-white" />
                                    <div className="text-left leading-tight">
                                      <span className="block text-[11px] font-bold">Rent</span>
                                      {p.rentPricePerMonth ? (
                                        <span className="block text-[9px] opacity-85 font-normal">
                                          ₹{p.rentPricePerMonth.toLocaleString('en-IN')}/mo
                                        </span>
                                      ) : null}
                                    </div>
                                  </Link>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Brands & Categories */}
                    {(suggestions.brands.length > 0 || suggestions.categories.length > 0) && (
                      <div className="p-3.5 bg-[#F6F9FD] flex flex-wrap gap-2 text-xs sm:text-sm">
                        {suggestions.brands.map((b) => (
                          <Link
                            key={b.id}
                            href={`/brand/${b.slug}`}
                            onClick={() => setIsSearchFocused(false)}
                            className="bg-white px-3 py-1.5 rounded-lg border border-[#DCE6F2] hover:border-[#1D5FAF] hover:text-[#1D5FAF] font-semibold shadow-2xs"
                          >
                            Brand: <strong>{b.name}</strong>
                          </Link>
                        ))}
                        {suggestions.categories.map((c) => (
                          <Link
                            key={c.id}
                            href={`/category/${c.slug}`}
                            onClick={() => setIsSearchFocused(false)}
                            className="bg-white px-3 py-1.5 rounded-lg border border-[#DCE6F2] hover:border-[#1D5FAF] hover:text-[#1D5FAF] font-semibold shadow-2xs"
                          >
                            Category: <strong>{c.name}</strong>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right: plain icon + label actions (Login · Track Order · Wishlist · Cart) */}
          <div className="flex items-center gap-1 sm:gap-2 xl:gap-4 shrink-0">
            {!hydrated ? (
              <div className="flex items-center gap-2 px-2 py-2" aria-hidden="true">
                <Skeleton dark className="w-6 h-6 rounded-full" />
                <Skeleton dark className="hidden sm:block h-3 w-16" />
              </div>
            ) : isAuthenticated && user ? (
              <Link
                href="/account"
                className="flex items-center gap-2 px-2 py-2 rounded-lg text-white hover:text-[#93C5FD] transition-colors"
              >
                <CircleUserRound className="w-6 h-6" />
                <span className="hidden sm:inline text-[13px] font-medium truncate max-w-[120px]">
                  Hi, {user.name.split(' ')[0]}
                </span>
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => setAuthModalOpen(true)}
                className="flex items-center gap-2 px-2 py-2 rounded-lg text-white hover:text-[#93C5FD] transition-colors cursor-pointer"
                suppressHydrationWarning
              >
                <CircleUserRound className="w-6 h-6" />
                <span className="hidden sm:inline text-[13px] font-medium" suppressHydrationWarning>Login Now</span>
              </button>
            )}

            <Link
              href="/account?tab=orders"
              className="hidden md:flex items-center gap-2 px-2 py-2 rounded-lg text-white hover:text-[#93C5FD] transition-colors"
            >
              <Truck className="w-6 h-6" />
              <span className="hidden xl:inline text-[13px] font-medium whitespace-nowrap">Track Order</span>
            </Link>

            <Link
              href="/account?tab=wishlist"
              className="relative flex items-center gap-2 px-2 py-2 rounded-lg text-white hover:text-[#93C5FD] transition-colors"
              aria-label="Wishlist"
            >
              <span className="relative">
                <Heart className="w-6 h-6" />
                {hydrated && wishlistItems.length > 0 && (
                  <span className="absolute -top-1.5 -right-2 min-w-[18px] h-[18px] px-1 rounded-full bg-[#F28C38] text-white text-[9px] font-bold flex items-center justify-center">
                    {wishlistItems.length}
                  </span>
                )}
              </span>
              <span className="hidden xl:inline text-[13px] font-medium">Wishlist</span>
            </Link>

            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              className="flex items-center gap-2 px-2 py-2 rounded-lg text-white hover:text-[#93C5FD] transition-colors cursor-pointer"
              aria-label="Shopping Cart"
              suppressHydrationWarning
            >
              <span className="relative">
                <ShoppingBag className="w-6 h-6" />
                {hydrated && getItemCount() > 0 && (
                  <span className="absolute -top-1.5 -right-2 min-w-[18px] h-[18px] px-1 rounded-full bg-[#F28C38] text-white text-[9px] font-bold flex items-center justify-center">
                    {getItemCount()}
                  </span>
                )}
              </span>
              <span className="hidden sm:inline text-[13px] font-medium" suppressHydrationWarning>Cart</span>
            </button>
          </div>
        </div>

        {/* Mobile Search Bar Row (Small Screens) */}
        <div className="mt-3 md:hidden">
          <form onSubmit={handleSearchSubmit} className="relative flex items-center">
            <input
              id="header-search-mobile"
              name="q_mobile"
              type="search"
              autoComplete="off"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search equipment, brands, SKU..."
              className="w-full bg-white text-[#12263F] text-sm pl-3.5 pr-10 py-2 rounded-xl border border-[#DCE6F2] focus:outline-none focus:ring-2 focus:ring-[#1D5FAF] placeholder-[#5B6B82] font-medium font-body"
              suppressHydrationWarning
            />
            <button
              type="submit"
              className="absolute right-1 w-7 h-7 rounded-lg bg-[#1D5FAF] text-white flex items-center justify-center cursor-pointer shadow-xs"
              suppressHydrationWarning
            >
              <Search className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* ========================================================
          3. SUB-NAVBAR (3-LEVEL MEGA MENU & DIRECT LINKS)
          ======================================================== */}
      <nav className="bg-[#0B2545] text-slate-100 border-t border-[#13335E] hidden lg:block text-sm font-semibold relative z-30">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-3">
          <div className="flex items-center space-x-1 xl:space-x-2 shrink-0">
            {/* All Categories Trigger */}
            <div
              ref={megaMenuRef}
              className="relative shrink-0"
              onMouseEnter={openMegaMenu}
              onMouseLeave={scheduleCloseMegaMenu}
            >
              <button
                type="button"
                aria-haspopup="true"
                aria-expanded={isMegaMenuOpen}
                suppressHydrationWarning
                onClick={(e) => {
                  // Mouse users already opened it by hovering — a click shouldn't close it.
                  // Touch / keyboard still toggle.
                  const pointerType = (e.nativeEvent as PointerEvent).pointerType;
                  if (pointerType === 'mouse') openMegaMenu();
                  else setIsMegaMenuOpen((open) => !open);
                }}
                className={`flex items-center gap-2 px-4 py-3.5 font-bold uppercase tracking-wider text-white transition-colors cursor-pointer rounded-t-xl text-sm sm:text-[13px] shrink-0 whitespace-nowrap ${
                  isMegaMenuOpen ? 'bg-[#1D5FAF]' : 'bg-[#13335E] hover:bg-[#1D5FAF]'
                }`}
              >
                <Layers className="w-4.5 h-4.5" />
                <span>All Categories</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${isMegaMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* 3-Level Mega Menu Overlay */}
              {isMegaMenuOpen && currentCategory && (
                <div className="absolute top-full left-0 w-[940px] max-w-[calc(100vw-32px)] bg-white rounded-b-2xl shadow-2xl border border-[#DCE6F2] text-[#12263F] z-50 flex overflow-hidden animate-in fade-in duration-150 font-body">
                  {/* Column 1: Main Categories */}
                  <div className="w-72 bg-[#F6F9FD] border-r border-[#DCE6F2] py-2 max-h-[520px] overflow-y-auto shrink-0">
                    {categories.map((cat, idx) => (
                      <button
                        key={cat.id}
                        onMouseEnter={() => setActiveCategoryIndex(idx)}
                        onClick={() => {
                          setIsMegaMenuOpen(false);
                          router.push(`/category/${cat.slug}`);
                        }}
                        className={`w-full text-left px-5 py-3 text-[13px] font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                          activeCategoryIndex === idx
                            ? 'bg-white text-[#1D5FAF] border-l-4 border-[#1D5FAF] shadow-xs font-bold'
                            : 'text-[#12263F] hover:bg-[#EAF2FC] hover:text-[#174E90]'
                        }`}
                      >
                        <span className="truncate">{cat.name}</span>
                        <ChevronRight className="w-4 h-4 text-[#5B6B82] shrink-0" />
                      </button>
                    ))}
                  </div>

                  {/* Column 2 & 3: Subcategories & Items */}
                  <div className="flex-1 min-w-0 p-6 max-h-[520px] overflow-y-auto">
                    <div className="pb-3.5 border-b border-[#DCE6F2] mb-5 font-heading">
                      <div className="flex items-center justify-between gap-4">
                        <h4 className="font-extrabold text-base text-[#12263F] truncate">{currentCategory.name}</h4>
                        <Link
                          href={`/category/${currentCategory.slug}`}
                          onClick={() => setIsMegaMenuOpen(false)}
                          className="text-xs font-bold text-[#1D5FAF] hover:underline flex items-center gap-1 shrink-0 whitespace-nowrap"
                        >
                          View All {currentCategory.itemCount} Products
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      </div>
                      <p className="text-xs text-[#5B6B82] mt-1 font-body">{currentCategory.description}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-x-6 gap-y-5">
                      {(currentCategory.subCategories || []).map((sub) => (
                        <div key={sub.id} className="space-y-2">
                          <Link
                            href={`/category/${currentCategory.slug}?sub=${sub.slug}`}
                            onClick={() => setIsMegaMenuOpen(false)}
                            className="font-bold text-[13px] text-[#12263F] hover:text-[#1D5FAF] flex items-center gap-1.5 group font-heading"
                          >
                            <span>{sub.name}</span>
                            <span className="text-[11px] text-[#5B6B82] font-normal font-body">({sub.itemCount})</span>
                          </Link>

                          {/* Level 3 categories → their own category page */}
                          {sub.children && sub.children.length > 0 && (
                            <ul className="space-y-1.5 pl-2.5 border-l border-[#DCE6F2] font-body">
                              {sub.children.map((child) => (
                                <li key={child.id}>
                                  <Link
                                    href={`/category/${child.slug}`}
                                    onClick={() => setIsMegaMenuOpen(false)}
                                    className="text-xs text-[#5B6B82] hover:text-[#1D5FAF] block py-0.5 transition-colors"
                                  >
                                    {child.name}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Direct Links (Larger font, comfortable padding, non-breaking) */}
            <Link
              href="/brands"
              className="whitespace-nowrap shrink-0 px-3.5 py-3.5 text-sm sm:text-[13px] hover:text-[#93C5FD] transition-colors rounded-lg hover:bg-[#13335E]/40"
            >
              Brands
            </Link>

            <Link
              href="/rent"
              className="whitespace-nowrap shrink-0 px-3.5 py-3.5 text-sm sm:text-[13px] hover:text-[#93C5FD] transition-colors flex items-center gap-1.5 rounded-lg hover:bg-[#13335E]/40"
            >
              <Bed className="w-4 h-4 text-[#93C5FD]" />
              <span>Rent Equipment</span>
              <span className="text-[9px] bg-[#1D5FAF] text-white border border-white/20 px-2 py-0.5 rounded-full font-bold">
                POPULAR
              </span>
            </Link>

            <Link
              href="/sleep-test"
              className="whitespace-nowrap shrink-0 px-3.5 py-3.5 text-sm sm:text-[13px] hover:text-[#93C5FD] transition-colors flex items-center gap-1.5 rounded-lg hover:bg-[#13335E]/40"
            >
              <Activity className="w-4 h-4 text-[#93C5FD]" />
              <span>Sleep Test</span>
            </Link>

            <Link
              href="/offers"
              className="whitespace-nowrap shrink-0 px-3.5 py-3.5 text-sm sm:text-[13px] hover:text-[#93C5FD] transition-colors flex items-center gap-1.5 rounded-lg hover:bg-[#13335E]/40"
            >
              <Percent className="w-4 h-4 text-[#F28C38]" />
              <span>Offers</span>
            </Link>

            <Link
              href="/best-sellers"
              className="whitespace-nowrap shrink-0 px-3.5 py-3.5 text-sm sm:text-[13px] hover:text-[#93C5FD] transition-colors flex items-center gap-1.5 rounded-lg hover:bg-[#13335E]/40"
            >
              <Flame className="w-4 h-4 text-[#F5B841]" />
              <span>Best Sellers</span>
            </Link>

            <Link
              href="/new-arrivals"
              className="whitespace-nowrap shrink-0 px-3.5 py-3.5 text-sm sm:text-[13px] hover:text-[#93C5FD] transition-colors flex items-center gap-1.5 rounded-lg hover:bg-[#13335E]/40"
            >
              <Sparkles className="w-4 h-4 text-[#93C5FD]" />
              <span>New Arrivals</span>
            </Link>
          </div>

          {/* Right: Prominent Bulk Inquiry Action Button */}
          <div className="flex items-center shrink-0">
            <Link
              href="/bulk-enquiry"
              className="whitespace-nowrap shrink-0 px-4 py-2 bg-[#13335E] hover:bg-[#1D5FAF] text-[#93C5FD] hover:text-white rounded-full transition-all font-bold uppercase tracking-wider text-xs sm:text-[12px] flex items-center gap-1.5 border border-[#93C5FD]/30 shadow-xs"
            >
              <FileText className="w-4 h-4" />
              <span>Bulk Inquiry →</span>
            </Link>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;
