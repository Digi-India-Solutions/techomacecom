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
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#0B2545] text-white border-t border-[#13335E] lg:hidden shadow-2xl pb-safe">
      <div className="flex items-center justify-around h-15 px-2">
        {navItems.map((item, idx) => {
          const Icon = item.icon;
          const content = (
            <div className="flex flex-col items-center justify-center w-full py-1 relative">
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-colors ${
                    item.isActive ? 'text-[#93C5FD]' : 'text-slate-300'
                  }`}
                />
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 bg-[#F28C38] text-white text-[11px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center shadow-xs">
                    {item.badge}
                  </span>
                )}
              </div>
              <span
                className={`text-[12px] font-medium mt-1 font-heading ${
                  item.isActive ? 'text-[#93C5FD] font-bold' : 'text-slate-300'
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
              className="flex-1 flex justify-center focus:outline-none cursor-pointer"
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
