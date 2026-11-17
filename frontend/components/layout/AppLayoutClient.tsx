'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import MobileNav from '@/components/layout/MobileNav';
import MobileDrawer from '@/components/layout/MobileDrawer';
import CartDrawer from '@/components/cart/CartDrawer';
import AuthModal from '@/components/auth/AuthModal';
import PincodeModal from '@/components/common/PincodeModal';
import WhatsAppButton from '@/components/common/WhatsAppButton';
import ToastContainer from '@/components/common/ToastContainer';

interface AppLayoutClientProps {
  children: React.ReactNode;
}

export const AppLayoutClient: React.FC<AppLayoutClientProps> = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const isSleepTestLanding = pathname === '/sleep-test';

  if (isSleepTestLanding) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F6F9FD] text-[#12263F] antialiased selection:bg-[#1D5FAF] selection:text-white">
        <main className="flex-1">{children}</main>
        <ToastContainer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F6F9FD] text-[#12263F] antialiased selection:bg-[#1D5FAF] selection:text-white">
      {/* Global Header */}
      <Header onOpenMobileMenu={() => setIsMobileMenuOpen(true)} />

      {/* Main Content Area */}
      <main className="flex-1 pb-16 lg:pb-0">{children}</main>

      {/* Global Footer */}
      <Footer />

      {/* Mobile Sticky Bottom Nav */}
      <MobileNav onOpenCategoriesDrawer={() => setIsMobileMenuOpen(true)} />

      {/* Mobile Slideout Drawer */}
      <MobileDrawer
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />

      {/* Global Slideover Cart Drawer */}
      <CartDrawer />

      {/* Global Auth Modal */}
      <AuthModal />

      {/* Global Pincode Check Modal */}
      <PincodeModal />

      {/* Floating WhatsApp Quick Contact Button */}
      <WhatsAppButton />

      {/* Global Toast Notifications */}
      <ToastContainer />
    </div>
  );
};

export default AppLayoutClient;
