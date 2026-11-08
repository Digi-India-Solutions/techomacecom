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
  Truck, 
  Percent, 
  Flame, 
  Sparkles, 
  Layers, 
  Bed, 
  Activity, 
  FileText,
  X
} from 'lucide-react';
import Logo from '@/components/common/Logo';
import { useCartStore, useWishlistStore, usePincodeStore, useUserStore } from '@/lib/store';
import { searchSuggestions, getCategories } from '@/lib/api';
import { Category } from '@/types';
import { MOCK_CATEGORIES } from '@/lib/mock/data';

interface HeaderProps {
  onOpenMobileMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenMobileMenu }) => {
  const router = useRouter();
  const { getItemCount, setIsCartOpen } = useCartStore();
  const { items: wishlistItems } = useWishlistStore();
  const { pincode, city, setPincodeModalOpen } = usePincodeStore();
  const { user, isAuthenticated, setAuthModalOpen } = useUserStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<{
    products: any[];
    categories: any[];
    brands: any[];
  }>({ products: [], categories: [], brands: [] });

  const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);
  const [activeCategoryIndex, setActiveCategoryIndex] = useState(0);

  const categories = MOCK_CATEGORIES;
  const currentCategory = categories[activeCategoryIndex] || categories[0];

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const megaMenuRef = useRef<HTMLDivElement>(null);

  // Handle outside click for search suggestions
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
    <header className="sticky top-0 z-40 w-full shadow-md font-heading">
      {/* 1. TOP STRIP (TEAL #0F766E) */}
      <div className="bg-[#0F766E] text-white text-[11px] sm:text-xs font-semibold py-1.5 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 truncate">
            <span className="hidden sm:inline-block">★</span>
            <span className="truncate">
              100% Genuine Products | Pan-India Delivery | Easy EMI Options
            </span>
          </div>
          <div className="flex items-center gap-4 shrink-0 text-[11px]">
            <Link href="/bulk-enquiry" className="hover:underline flex items-center gap-1">
              <FileText className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Hospital & Clinic</span> Bulk Inquiry
            </Link>
            <span className="text-white/60">|</span>
            <a href="tel:+919811234567" className="hover:underline flex items-center gap-1 font-bold">
              <Phone className="w-3.5 h-3.5" />
              <span>+91 98112 34567</span>
            </a>
          </div>
        </div>
      </div>

      {/* 2. MAIN BAR (SLATE #1E293B) */}
      <div className="bg-[#1E293B] text-white px-4 sm:px-8 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 sm:gap-6">
          {/* Mobile hamburger + Logo */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={onOpenMobileMenu}
              className="lg:hidden p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-white/10 cursor-pointer"
              aria-label="Open Mobile Menu"
            >
              <Menu className="w-6 h-6" />
            </button>
            <Logo variant="dark" size="md" showTagline={true} />
          </div>

          {/* Large Search Bar with Live Suggestions */}
          <div ref={searchContainerRef} className="relative flex-1 max-w-2xl hidden md:block">
            <form onSubmit={handleSearchSubmit} className="relative flex items-center">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                placeholder="Search medical equipment, dental handpieces, brands, or SKU..."
                className="w-full bg-white text-slate-900 text-sm pl-4 pr-11 py-2.5 rounded-full border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0F766E] placeholder-slate-400 font-medium font-body shadow-inner"
              />
              <button
                type="submit"
                className="absolute right-1.5 w-8 h-8 rounded-full bg-[#0F766E] hover:bg-[#0B5F58] text-white flex items-center justify-center transition-colors shadow-sm cursor-pointer"
                aria-label="Search"
              >
                <Search className="w-4 h-4" />
              </button>
            </form>

            {/* Live Suggestions Dropdown */}
            {isSearchFocused && (searchQuery.trim() || suggestions.products.length > 0) && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50 animate-in fade-in text-slate-900">
                {suggestions.products.length === 0 &&
                suggestions.categories.length === 0 &&
                suggestions.brands.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-500 font-body">
                    No exact match found for &quot;{searchQuery}&quot;. Press enter to search all products.
                  </div>
                ) : (
                  <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
                    {/* Products */}
                    {suggestions.products.length > 0 && (
                      <div className="p-3">
                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                          Products
                        </div>
                        <div className="space-y-1.5">
                          {suggestions.products.map((p) => (
                            <Link
                              key={p.id}
                              href={`/product/${p.slug}`}
                              onClick={() => setIsSearchFocused(false)}
                              className="flex items-center gap-3 p-2 rounded-lg hover:bg-teal-50/80 transition-colors group"
                            >
                              <div className="w-10 h-10 rounded-md bg-slate-50 border border-slate-100 relative shrink-0 overflow-hidden">
                                <Image
                                  src={p.thumbnail}
                                  alt={p.name}
                                  fill
                                  className="object-contain p-0.5"
                                  referrerPolicy="no-referrer"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-[10px] text-slate-400 font-semibold">{p.brandName}</div>
                                <div className="text-xs font-semibold text-slate-800 group-hover:text-[#0F766E] truncate">
                                  {p.name}
                                </div>
                              </div>
                              <div className="text-xs font-bold text-[#0F766E] shrink-0 font-body">
                                ₹{p.price.toLocaleString('en-IN')}
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Brands & Categories */}
                    {(suggestions.brands.length > 0 || suggestions.categories.length > 0) && (
                      <div className="p-3 bg-slate-50/60 flex flex-wrap gap-2 text-xs">
                        {suggestions.brands.map((b) => (
                          <Link
                            key={b.id}
                            href={`/brand/${b.slug}`}
                            onClick={() => setIsSearchFocused(false)}
                            className="bg-white px-2.5 py-1 rounded-md border border-slate-200 hover:border-[#0F766E] hover:text-[#0F766E] font-medium"
                          >
                            Brand: <strong>{b.name}</strong>
                          </Link>
                        ))}
                        {suggestions.categories.map((c) => (
                          <Link
                            key={c.id}
                            href={`/category/${c.slug}`}
                            onClick={() => setIsSearchFocused(false)}
                            className="bg-white px-2.5 py-1 rounded-md border border-slate-200 hover:border-[#0F766E] hover:text-[#0F766E] font-medium"
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

          {/* Right Action Icons & Badges */}
          <div className="flex items-center gap-3 sm:gap-5 shrink-0">
            {/* Pincode delivery button */}
            <button
              onClick={() => setPincodeModalOpen(true)}
              className="hidden lg:flex items-center gap-2 text-left hover:text-[#FF6B00] transition-colors p-1"
            >
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-[#FF6B00]">
                <MapPin className="w-4 h-4" />
              </div>
              <div className="text-xs leading-tight">
                <span className="text-[10px] text-gray-400 block">Deliver to</span>
                <span className="font-bold text-white truncate max-w-[90px] block">
                  {pincode || 'Select Pin'}
                </span>
              </div>
            </button>

            {/* Account / Login */}
            {isAuthenticated && user ? (
              <Link
                href="/account"
                className="flex items-center gap-2 hover:text-[#FF6B00] transition-colors p-1"
              >
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-[#FF6B00]">
                  <UserIcon className="w-4 h-4" />
                </div>
                <div className="hidden sm:block text-xs leading-tight">
                  <span className="text-[10px] text-gray-400 block">Doctor Account</span>
                  <span className="font-bold text-white truncate max-w-[100px] block">
                    {user.name.split(' ')[0]}
                  </span>
                </div>
              </Link>
            ) : (
              <button
                onClick={() => setAuthModalOpen(true)}
                className="flex items-center gap-2 hover:text-[#FF6B00] transition-colors p-1"
              >
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-gray-300">
                  <UserIcon className="w-4 h-4" />
                </div>
                <div className="hidden sm:block text-xs leading-tight text-left">
                  <span className="text-[10px] text-gray-400 block">Doctor / Clinic</span>
                  <span className="font-bold text-white block">Login</span>
                </div>
              </button>
            )}

            {/* Wishlist */}
            <Link
              href="/account#wishlist"
              className="relative p-2 text-slate-300 hover:text-[#0F766E] transition-colors"
              aria-label="Wishlist"
            >
              <Heart className="w-5 h-5" />
              {wishlistItems.length > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#0F766E] text-white text-[10px] font-bold flex items-center justify-center">
                  {wishlistItems.length}
                </span>
              )}
            </Link>

            {/* Cart with count & trigger */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="flex items-center gap-2 bg-[#0F766E] hover:bg-[#0B5F58] text-white px-3.5 py-2 rounded-full font-bold text-xs transition-colors shadow-sm cursor-pointer"
              aria-label="Shopping Cart"
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="hidden sm:inline">Cart</span>
              <span className="bg-white text-[#0F766E] text-[11px] font-black w-5 h-5 rounded-full flex items-center justify-center font-body">
                {getItemCount()}
              </span>
            </button>
          </div>
        </div>

        {/* Mobile Search Bar Row */}
        <div className="mt-2.5 md:hidden">
          <form onSubmit={handleSearchSubmit} className="relative flex items-center">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search equipment, brands, SKU..."
              className="w-full bg-white text-slate-900 text-xs pl-4 pr-10 py-2 rounded-full border border-slate-300 focus:outline-none placeholder-slate-400 font-medium font-body"
            />
            <button
              type="submit"
              className="absolute right-1 w-7 h-7 rounded-full bg-[#0F766E] text-white flex items-center justify-center cursor-pointer"
            >
              <Search className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>

      {/* 3. NAVIGATION MENU (3-LEVEL MEGA MENU & DIRECT LINKS) */}
      <nav className="bg-[#182232] text-slate-200 border-t border-white/10 hidden lg:block text-xs font-semibold">
        <div className="max-w-7xl mx-auto px-8 flex items-center justify-between">
          <div className="flex items-center space-x-1">
            {/* All Categories Trigger */}
            <div ref={megaMenuRef} className="relative">
              <button
                onClick={() => setIsMegaMenuOpen(!isMegaMenuOpen)}
                className={`flex items-center gap-2 px-4 py-3 font-bold uppercase tracking-wider text-white transition-colors cursor-pointer ${
                  isMegaMenuOpen ? 'bg-[#0F766E]' : 'bg-slate-700/80 hover:bg-[#0F766E]'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>All Categories</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${isMegaMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* 3-Level Mega Menu Overlay */}
              {isMegaMenuOpen && (
                <div className="absolute top-full left-0 w-[940px] bg-white rounded-b-2xl shadow-2xl border border-slate-200 text-slate-900 z-50 flex overflow-hidden animate-in fade-in duration-150 font-body">
                  {/* Column 1: Main Categories */}
                  <div className="w-64 bg-slate-50 border-r border-slate-200 py-2 max-h-[500px] overflow-y-auto">
                    {categories.map((cat, idx) => (
                      <button
                        key={cat.id}
                        onMouseEnter={() => setActiveCategoryIndex(idx)}
                        onClick={() => {
                          setIsMegaMenuOpen(false);
                          router.push(`/category/${cat.slug}`);
                        }}
                        className={`w-full text-left px-4 py-2.5 text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                          activeCategoryIndex === idx
                            ? 'bg-white text-[#0F766E] border-l-4 border-[#0F766E] shadow-xs'
                            : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                        }`}
                      >
                        <span className="truncate">{cat.name}</span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      </button>
                    ))}
                  </div>

                  {/* Column 2 & 3: Subcategories & Items */}
                  <div className="flex-1 p-6 max-h-[500px] overflow-y-auto">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4 font-heading">
                      <div>
                        <h4 className="font-extrabold text-base text-slate-900">{currentCategory.name}</h4>
                        <p className="text-xs text-slate-500 mt-0.5 font-body">{currentCategory.description}</p>
                      </div>
                      <Link
                        href={`/category/${currentCategory.slug}`}
                        onClick={() => setIsMegaMenuOpen(false)}
                        className="text-xs font-bold text-[#0F766E] hover:underline flex items-center gap-1 shrink-0"
                      >
                        View All {currentCategory.itemCount} Products
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      {currentCategory.subCategories.map((sub) => (
                        <div key={sub.id} className="space-y-2">
                          <Link
                            href={`/category/${currentCategory.slug}?sub=${sub.slug}`}
                            onClick={() => setIsMegaMenuOpen(false)}
                            className="font-bold text-xs text-slate-900 hover:text-[#0F766E] flex items-center gap-1 group font-heading"
                          >
                            <span>{sub.name}</span>
                            <span className="text-[10px] text-slate-400 font-normal font-body">({sub.itemCount})</span>
                          </Link>

                          {/* Level 3 items */}
                          {sub.items && (
                            <ul className="space-y-1 pl-2 border-l border-slate-100 font-body">
                              {sub.items.map((item, i) => (
                                <li key={i}>
                                  <Link
                                    href={`/search?q=${encodeURIComponent(item)}`}
                                    onClick={() => setIsMegaMenuOpen(false)}
                                    className="text-[11px] text-slate-600 hover:text-[#0F766E] block py-0.5 transition-colors"
                                  >
                                    {item}
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

            {/* Direct Links */}
            <Link
              href="/brands"
              className="px-3.5 py-3 hover:text-[#0F766E] transition-colors"
            >
              Brands
            </Link>

            <Link
              href="/rent"
              className="px-3.5 py-3 hover:text-[#0F766E] transition-colors flex items-center gap-1.5"
            >
              <Bed className="w-3.5 h-3.5 text-[#0F766E]" />
              <span>Rent Equipment</span>
              <span className="text-[9px] bg-teal-500/20 text-teal-300 border border-teal-400/40 px-1.5 py-0.2 rounded font-bold">
                POPULAR
              </span>
            </Link>

            <Link
              href="/sleep-test"
              className="px-3.5 py-3 hover:text-[#0F766E] transition-colors flex items-center gap-1.5"
            >
              <Activity className="w-3.5 h-3.5 text-teal-400" />
              <span>Sleep Test</span>
            </Link>

            <Link
              href="/offers"
              className="px-3.5 py-3 hover:text-[#0F766E] transition-colors flex items-center gap-1"
            >
              <Percent className="w-3.5 h-3.5 text-amber-400" />
              <span>Offers</span>
            </Link>

            <Link
              href="/best-sellers"
              className="px-3.5 py-3 hover:text-[#0F766E] transition-colors flex items-center gap-1"
            >
              <Flame className="w-3.5 h-3.5 text-[#F28C38]" />
              <span>Best Sellers</span>
            </Link>

            <Link
              href="/new-arrivals"
              className="px-3.5 py-3 hover:text-[#0F766E] transition-colors flex items-center gap-1"
            >
              <Sparkles className="w-3.5 h-3.5 text-teal-300" />
              <span>New Arrivals</span>
            </Link>
          </div>

          <div className="flex items-center">
            <Link
              href="/bulk-enquiry"
              className="px-3.5 py-3 text-teal-400 hover:text-white transition-colors font-bold uppercase tracking-wide text-[11px]"
            >
              Bulk Inquiry →
            </Link>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;
