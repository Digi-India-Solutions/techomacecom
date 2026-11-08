'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { X, ChevronRight, ChevronDown, Layers, Bed, Activity, Percent, Flame, Sparkles, FileText, Phone, MapPin, User } from 'lucide-react';
import Logo from '@/components/common/Logo';
import { MOCK_CATEGORIES } from '@/lib/mock/data';
import { usePincodeStore, useUserStore } from '@/lib/store';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileDrawer: React.FC<MobileDrawerProps> = ({ isOpen, onClose }) => {
  const { pincode, city, setPincodeModalOpen } = usePincodeStore();
  const { user, isAuthenticated, setAuthModalOpen } = useUserStore();

  const [expandedCat, setExpandedCat] = useState<string | null>(null);

  if (!isOpen) return null;

  const toggleCategory = (id: string) => {
    setExpandedCat(expandedCat === id ? null : id);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden lg:hidden">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in"
      />

      <div className="fixed inset-y-0 left-0 max-w-full flex pr-12">
        <div className="w-screen max-w-xs bg-white shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-4 bg-[#2B2B2B] text-white flex items-center justify-between shrink-0">
            <Logo variant="dark" size="sm" showTagline={false} />
            <button onClick={onClose} className="text-gray-400 hover:text-white p-1">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User & Pincode summary strip */}
          <div className="p-3 bg-gray-100 border-b border-gray-200 flex items-center justify-between text-xs">
            {isAuthenticated && user ? (
              <Link
                href="/account"
                onClick={onClose}
                className="flex items-center gap-2 font-semibold text-gray-800 hover:text-[#FF6B00]"
              >
                <User className="w-4 h-4 text-[#FF6B00]" />
                <span className="truncate max-w-[120px]">{user.name}</span>
              </Link>
            ) : (
              <button
                onClick={() => {
                  onClose();
                  setAuthModalOpen(true);
                }}
                className="flex items-center gap-1.5 font-semibold text-[#FF6B00]"
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
              className="flex items-center gap-1 text-gray-600 hover:text-[#FF6B00]"
            >
              <MapPin className="w-3.5 h-3.5 text-[#FF6B00]" />
              <span className="font-semibold">{pincode}</span>
            </button>
          </div>

          {/* Navigation Links */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Direct Quick Links */}
            <div className="space-y-1 pb-3 border-b border-gray-100">
              <Link
                href="/brands"
                onClick={onClose}
                className="flex items-center justify-between py-2 text-xs font-semibold text-gray-800 hover:text-[#FF6B00]"
              >
                <span>Shop by Brand</span>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </Link>
              <Link
                href="/rent"
                onClick={onClose}
                className="flex items-center justify-between py-2 text-xs font-semibold text-gray-800 hover:text-[#FF6B00]"
              >
                <div className="flex items-center gap-2">
                  <Bed className="w-4 h-4 text-[#FF6B00]" />
                  <span>Rent Medical Equipment</span>
                </div>
                <span className="text-[10px] bg-orange-100 text-[#FF6B00] font-bold px-1.5 py-0.5 rounded">
                  Plans
                </span>
              </Link>
              <Link
                href="/sleep-test"
                onClick={onClose}
                className="flex items-center justify-between py-2 text-xs font-semibold text-gray-800 hover:text-[#FF6B00]"
              >
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-500" />
                  <span>Home Sleep Test</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </Link>
              <Link
                href="/offers"
                onClick={onClose}
                className="flex items-center justify-between py-2 text-xs font-semibold text-gray-800 hover:text-[#FF6B00]"
              >
                <div className="flex items-center gap-2">
                  <Percent className="w-4 h-4 text-amber-500" />
                  <span>Offers & Combos</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </Link>
              <Link
                href="/best-sellers"
                onClick={onClose}
                className="flex items-center justify-between py-2 text-xs font-semibold text-gray-800 hover:text-[#FF6B00]"
              >
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-[#FF6B00]" />
                  <span>Best Sellers</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </Link>
              <Link
                href="/new-arrivals"
                onClick={onClose}
                className="flex items-center justify-between py-2 text-xs font-semibold text-gray-800 hover:text-[#FF6B00]"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-yellow-500" />
                  <span>New Arrivals</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </Link>
              <Link
                href="/bulk-enquiry"
                onClick={onClose}
                className="flex items-center justify-between py-2 text-xs font-semibold text-[#FF6B00]"
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#FF6B00]" />
                  <span>Bulk Institution Inquiry</span>
                </div>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Categories Accordion */}
            <div>
              <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                All Categories
              </div>
              <div className="space-y-1">
                {MOCK_CATEGORIES.map((cat) => {
                  const isExpanded = expandedCat === cat.id;
                  return (
                    <div key={cat.id} className="rounded-lg border border-gray-100 overflow-hidden">
                      <div className="flex items-center justify-between p-2.5 bg-gray-50/70">
                        <Link
                          href={`/category/${cat.slug}`}
                          onClick={onClose}
                          className="font-semibold text-xs text-gray-800 hover:text-[#FF6B00] flex-1 truncate"
                        >
                          {cat.name}
                        </Link>
                        <button
                          onClick={() => toggleCategory(cat.id)}
                          className="p-1 text-gray-400 hover:text-gray-700"
                        >
                          <ChevronDown
                            className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180 text-[#FF6B00]' : ''}`}
                          />
                        </button>
                      </div>

                      {isExpanded && (
                        <div className="p-3 bg-white space-y-2 border-t border-gray-100">
                          {cat.subCategories.map((sub) => (
                            <div key={sub.id} className="pl-1 space-y-1">
                              <Link
                                href={`/category/${cat.slug}?sub=${sub.slug}`}
                                onClick={onClose}
                                className="block font-semibold text-xs text-gray-700 hover:text-[#FF6B00]"
                              >
                                {sub.name}
                              </Link>
                              {sub.items && (
                                <div className="pl-2 space-y-1">
                                  {sub.items.slice(0, 3).map((item, i) => (
                                    <Link
                                      key={i}
                                      href={`/search?q=${encodeURIComponent(item)}`}
                                      onClick={onClose}
                                      className="block text-[11px] text-gray-500 hover:text-[#FF6B00]"
                                    >
                                      • {item}
                                    </Link>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer contact */}
          <div className="p-4 bg-gray-50 border-t border-gray-200 text-xs text-gray-600 space-y-2">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-[#FF6B00]" />
              <span className="font-semibold">+91 98112 34567</span>
            </div>
            <div className="text-[11px] text-gray-500">
              Pan-India Medical & Dental Direct
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileDrawer;
