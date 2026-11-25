'use client';

import React from 'react';
import { X, MessageCircle } from 'lucide-react';
import { useUserStore } from '@/lib/store';
import Logo from '@/components/common/Logo';
import CustomerAuthForm from './CustomerAuthForm';
import { useSiteSettings } from '@/lib/settings/store';
import { whatsappUrl } from '@/lib/settings/format';

/** Global sign-in / sign-up modal (opened via useUserStore.setAuthModalOpen). */
export const AuthModal: React.FC = () => {
  const { store } = useSiteSettings();
  const { isAuthModalOpen, setAuthModalOpen } = useUserStore();

  if (!isAuthModalOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs animate-in fade-in duration-200 font-body"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div className="relative w-full max-w-lg max-h-[92vh] flex flex-col bg-white rounded-3xl shadow-2xl border border-[#DCE6F2] overflow-hidden">
        {/* Navy Header — fixed, never scrolls off or gets cut off */}
        <div className="bg-[#0B2545] px-6 py-4 text-white text-center relative border-b border-[#13335E] shrink-0">
          <button
            onClick={() => setAuthModalOpen(false)}
            className="absolute top-3.5 right-4 text-white/70 hover:text-white p-1.5 rounded-lg hover:bg-[#13335E] transition-colors cursor-pointer z-10"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex justify-center mb-1">
            <Logo variant="dark" size="md" showTagline={false} />
          </div>
          <h3 id="auth-modal-title" className="font-bold text-lg font-heading">
            Welcome to Buy Denmed
          </h3>
        </div>

        {/* Scrollable Form Body only if viewport is small */}
        <div className="p-5 sm:p-7 overflow-y-auto flex-1 overscroll-contain">
          <CustomerAuthForm onSuccess={() => setAuthModalOpen(false)} />

          <div className="mt-5 pt-4 border-t border-[#DCE6F2] text-center space-y-2">
            <a
              href={whatsappUrl(store, 'Hi Buy Denmed, I need assistance logging in')}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-[#5B6B82] hover:text-[#16A34A] transition-colors font-medium"
            >
              <span>Need help?</span>
              <span className="font-bold text-[#16A34A] flex items-center gap-1">
                WhatsApp Support <MessageCircle className="w-3.5 h-3.5 fill-current" />
              </span>
            </a>
            <p className="text-[12px] text-[#5B6B82]">
              By continuing, you agree to Buy Denmed&apos;s{' '}
              <a href="/policies/terms" className="underline hover:text-[#1D5FAF]">
                Terms of Sale
              </a>{' '}
              &amp;{' '}
              <a href="/policies/privacy" className="underline hover:text-[#1D5FAF]">
                Privacy Policy
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
