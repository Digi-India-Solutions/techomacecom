'use client';

import React from 'react';
import { X, MessageCircle } from 'lucide-react';
import { useUserStore } from '@/lib/store';
import Logo from '@/components/common/Logo';
import CustomerAuthForm from './CustomerAuthForm';

/** Global sign-in / sign-up modal (opened via useUserStore.setAuthModalOpen). */
export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, setAuthModalOpen } = useUserStore();

  if (!isAuthModalOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs animate-in fade-in duration-200 font-body"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div className="relative w-full max-w-lg max-h-[92vh] overflow-y-auto bg-white rounded-3xl shadow-2xl border border-[#DCE6F2]">
        {/* Navy Header */}
        <div className="bg-[#0B2545] p-6 text-white text-center relative border-b border-[#13335E]">
          <button
            onClick={() => setAuthModalOpen(false)}
            className="absolute top-4 right-4 text-white/70 hover:text-white p-1 rounded-lg hover:bg-[#13335E] transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex justify-center mb-2">
            <Logo variant="dark" size="md" showTagline={false} />
          </div>
          <h3 id="auth-modal-title" className="font-bold text-xl mt-1 font-heading">
            Sign in or create an account
          </h3>
          <p className="text-xs sm:text-sm text-[#EAF2FC]/80 mt-1 max-w-sm mx-auto leading-relaxed">
            GST invoices, order tracking and equipment rentals in one place
          </p>
        </div>

        <div className="p-6 sm:p-8">
          <CustomerAuthForm onSuccess={() => setAuthModalOpen(false)} />

          <div className="mt-5 pt-4 border-t border-[#DCE6F2] text-center space-y-2">
            <a
              href="https://wa.me/919811234567?text=Hi%20Buy%20Denmed,%20I%20need%20assistance%20logging%20in"
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
