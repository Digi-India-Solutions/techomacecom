'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { X, ChevronRight, ChevronDown, Layers, Bed, Activity, Percent, Flame, Sparkles, FileText, Phone, MapPin, User } from 'lucide-react';
import Logo from '@/components/common/Logo';
import { useCatalogCategories } from '@/lib/hooks/useCatalogCategories';
import { usePincodeStore, useUserStore } from '@/lib/store';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileDrawer: React.FC<MobileDrawerProps> = ({ isOpen, onClose }) => {
  const { pincode, city, setPincodeModalOpen } = usePincodeStore();
  const { user, isAuthenticated, setAuthModalOpen } = useUserStore();

  const [expandedCat, setExpandedCat] = useState<string | null>(null);
  // Live categories from Admin → Catalog (menu-visible only)
  const categories = useCatalogCategories({ menuOnly: true });

  if (!isOpen) return null;

  const toggleCategory = (id: string) => {
    setExpandedCat(expandedCat === id ? null : id);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden lg:hidden font-body">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in"
      />

      <div className="fixed inset-y-0 left-0 max-w-full flex pr-10">
        <div className="w-screen max-w-xs sm:max-w-sm bg-white shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-4 bg-[#0B2545] text-white flex items-center justify-between shrink-0">
            <Logo variant="dark" size="sm" showTagline={false} />
            <button onClick={onClose} className="text-slate-300 hover:text-white p-1 rounded-lg hover:bg-[#13335E]">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User & Pincode summary strip */}
          <div className="p-3 bg-[#EAF2FC] border-b border-[#DCE6F2] flex items-center justify-between text-xs sm:text-sm">
            {isAuthenticated && user ? (
              <Link
                href="/account"
                onClick={onClose}
                className="flex items-center gap-2 font-semibold text-[#12263F] hover:text-[#1D5FAF]"
              >
                <User className="w-4 h-4 text-[#1D5FAF]" />
                <span className="truncate max-w-[120px] font-heading">{user.name}</span>
              </Link>
            ) : (
              <button
                onClick={() => {
                  onClose();
                  setAuthModalOpen(true);
                }}
                className="flex items-center gap-1.5 font-bold text-[#174E90] font-heading"
              >
                <User className="w-4 h-4" />
                <span>Doctor Login / Register</span>
              </button>
            )}

            <button
              onClick={() => {
                onClose();
                setPincodeModalOpen(true);
              }}
              className="flex items-center gap-1 text-[#5B6B82] hover:text-[#1D5FAF]"
            >
              <MapPin className="w-3.5 h-3.5 text-[#1D5FAF]" />
              <span className="font-semibold text-[#12263F]">{pincode || 'Set Pin'}</span>
            </button>
          </div>

          {/* Navigation Links */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Direct Quick Links */}
            <div className="space-y-1 pb-3 border-b border-[#DCE6F2]">
              <Link
                href="/brands"
                onClick={onClose}
                className="flex items-center justify-between py-2.5 text-sm font-semibold text-[#12263F] hover:text-[#1D5FAF]"
              >
                <span>Shop by Brand</span>
                <ChevronRight className="w-4 h-4 text-[#5B6B82]" />
              </Link>
              <Link
                href="/rent"
                onClick={onClose}
                className="flex items-center justify-between py-2.5 text-sm font-semibold text-[#12263F] hover:text-[#1D5FAF]"
              >
                <div className="flex items-center gap-2">
                  <Bed className="w-4 h-4 text-[#1D5FAF]" />
                  <span>Rent Medical Equipment</span>
                </div>
                <span className="text-[11px] bg-[#EAF2FC] text-[#174E90] font-bold px-1.5 py-0.5 rounded">
                  Plans
                </span>
              </Link>
              <Link
                href="/sleep-test"
                onClick={onClose}
                className="flex items-center justify-between py-2.5 text-sm font-semibold text-[#12263F] hover:text-[#1D5FAF]"
              >
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#1D5FAF]" />
                  <span>Home Sleep Test</span>
                </div>
                <ChevronRight className="w-4 h-4 text-[#5B6B82]" />
              </Link>
              <Link
                href="/offers"
                onClick={onClose}
                className="flex items-center justify-between py-2.5 text-sm font-semibold text-[#12263F] hover:text-[#1D5FAF]"
              >
                <div className="flex items-center gap-2">
                  <Percent className="w-4 h-4 text-[#F28C38]" />
                  <span>Offers &amp; Combos</span>
                </div>
                <ChevronRight className="w-4 h-4 text-[#5B6B82]" />
              </Link>
              <Link
                href="/best-sellers"
                onClick={onClose}
                className="flex items-center justify-between py-2.5 text-sm font-semibold text-[#12263F] hover:text-[#1D5FAF]"
              >
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-[#F5B841]" />
                  <span>Best Sellers</span>
                </div>
                <ChevronRight className="w-4 h-4 text-[#5B6B82]" />
              </Link>
              <Link
                href="/new-arrivals"
                onClick={onClose}
                className="flex items-center justify-between py-2.5 text-sm font-semibold text-[#12263F] hover:text-[#1D5FAF]"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#1D5FAF]" />
                  <span>New Arrivals</span>
                </div>
                <ChevronRight className="w-4 h-4 text-[#5B6B82]" />
              </Link>
              <Link
                href="/bulk-enquiry"
                onClick={onClose}
                className="flex items-center justify-between py-2.5 text-sm font-semibold text-[#1D5FAF]"
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#1D5FAF]" />
                  <span>Bulk Institution Inquiry</span>
                </div>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Categories Accordion */}
            <div>
              <div className="text-xs font-bold text-[#5B6B82] uppercase tracking-wider mb-2 font-heading">
                All Categories
              </div>
              <div className="space-y-1.5">
                {categories.map((cat) => {
                  const isExpanded = expandedCat === cat.id;
                  return (
                    <div key={cat.id} className="rounded-xl border border-[#DCE6F2] overflow-hidden">
                      <div className="flex items-center justify-between p-3 bg-[#F6F9FD]">
                        <Link
                          href={`/category/${cat.slug}`}
                          onClick={onClose}
                          className="font-semibold text-xs sm:text-sm text-[#12263F] hover:text-[#1D5FAF] flex-1 truncate font-heading"
                        >
                          {cat.name}
                        </Link>
                        <button
                          onClick={() => toggleCategory(cat.id)}
                          className="p-1 text-[#5B6B82] hover:text-[#1D5FAF]"
                        >
                          <ChevronDown
                            className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                          />
                        </button>
                      </div>

                      {isExpanded && cat.subCategories && (
                        <div className="p-3 bg-white space-y-2 border-t border-[#DCE6F2]">
                          {cat.subCategories.map((sub) => (
                            <Link
                              key={sub.id}
                              href={`/category/${cat.slug}?sub=${sub.slug}`}
                              onClick={onClose}
                              className="block text-xs text-[#5B6B82] hover:text-[#1D5FAF] py-1"
                            >
                              {sub.name}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileDrawer;
