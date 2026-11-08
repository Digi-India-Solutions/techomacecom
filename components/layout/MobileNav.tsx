'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Layers, Bed, ShoppingBag, User } from 'lucide-react';
import { useCartStore, useUserStore } from '@/lib/store';

interface MobileNavProps {
  onOpenCategoriesDrawer: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ onOpenCategoriesDrawer }) => {
  const pathname = usePathname();
  const { getItemCount, setIsCartOpen } = useCartStore();
  const { isAuthenticated, setAuthModalOpen } = useUserStore();

  const cartCount = getItemCount();

  const navItems = [
    { label: 'Home', href: '/', icon: Home, isActive: pathname === '/' },
    { label: 'Categories', onClick: onOpenCategoriesDrawer, icon: Layers, isActive: false },
    { label: 'Rent', href: '/rent', icon: Bed, isActive: pathname === '/rent' },
    { label: 'Cart', onClick: () => setIsCartOpen(true), icon: ShoppingBag, isActive: false, badge: cartCount },
    {
      label: 'Account',
      href: isAuthenticated ? '/account' : undefined,
      onClick: !isAuthenticated ? () => setAuthModalOpen(true) : undefined,
      icon: User,
      isActive: pathname.startsWith('/account')
    }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#2B2B2B] text-white border-t border-white/10 lg:hidden shadow-2xl pb-safe">
      <div className="flex items-center justify-around h-14 px-2">
        {navItems.map((item, idx) => {
          const Icon = item.icon;
          const content = (
            <div className="flex flex-col items-center justify-center w-full py-1 relative">
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-colors ${
                    item.isActive ? 'text-[#FF6B00]' : 'text-gray-300'
                  }`}
                />
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-[#FF6B00] text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </div>
              <span
                className={`text-[10px] font-medium mt-1 ${
                  item.isActive ? 'text-[#FF6B00] font-bold' : 'text-gray-300'
                }`}
              >
                {item.label}
              </span>
            </div>
          );

          if (item.href) {
            return (
              <Link key={idx} href={item.href} className="flex-1 flex justify-center">
                {content}
              </Link>
            );
          }

          return (
            <button
              key={idx}
              onClick={item.onClick}
              className="flex-1 flex justify-center focus:outline-none"
            >
              {content}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default MobileNav;
