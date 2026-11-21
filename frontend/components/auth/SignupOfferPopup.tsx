'use client';

import React, { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { BadgePercent, CheckCircle2, X } from 'lucide-react';
import { usePincodeStore, useUserStore } from '@/lib/store';
import Logo from '@/components/common/Logo';
import CustomerAuthForm from './CustomerAuthForm';
import { SIGNUP_OFFER, SIGNUP_OFFER_EXCLUDED_PATHS } from '@/lib/signupOffer';

/**
 * "Sign up & save" popup — opens after SIGNUP_OFFER.delaySeconds on the site for visitors
 * who are signed out, with the regular sign-up / sign-in form inside.
 *
 * Never interrupts: signed-in customers, sign-in / checkout / quiz pages, or while the login
 * or pincode modal is open. Shows at most once per browser session; closing it (✕, Esc,
 * backdrop, "No thanks") snoozes it for SIGNUP_OFFER.snoozeDays on this browser.
 * The timer runs across page changes (the layout stays mounted), i.e. "15 s on the site".
 */

const SHOWN_KEY = 'bd_signup_offer_shown'; // sessionStorage
const SNOOZE_KEY = 'bd_signup_offer_snoozed_until'; // localStorage

function readStorage(storage: 'local' | 'session', key: string): string | null {
  try {
    return (storage === 'local' ? localStorage : sessionStorage).getItem(key);
  } catch {
    return null; // private mode / blocked storage
  }
}
function writeStorage(storage: 'local' | 'session', key: string, value: string) {
  try {
    (storage === 'local' ? localStorage : sessionStorage).setItem(key, value);
  } catch {
    /* ignore */
  }
}

export const SignupOfferPopup: React.FC = () => {
  const pathname = usePathname();
  const { isAuthenticated, isAuthModalOpen } = useUserStore();
  const { isPincodeModalOpen } = usePincodeStore();

  const [due, setDue] = useState(false); // the delay has passed and it may still be shown
  const [closed, setClosed] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  // Start the countdown once per session (unless snoozed)
  useEffect(() => {
    if (readStorage('session', SHOWN_KEY) === '1') return;
    const snoozedUntil = Number(readStorage('local', SNOOZE_KEY) || 0);
    if (snoozedUntil > Date.now()) return;
    const t = setTimeout(() => setDue(true), SIGNUP_OFFER.delaySeconds * 1000);
    return () => clearTimeout(t);
  }, []);

  const excluded = SIGNUP_OFFER_EXCLUDED_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  const open = due && !closed && !isAuthenticated && !excluded && !isAuthModalOpen && !isPincodeModalOpen;

  // Count it as shown the moment it appears; lock page scroll; Esc closes
  useEffect(() => {
    if (!open) return;
    writeStorage('session', SHOWN_KEY, '1');
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dismiss();
    };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  /** Closed without signing up → don't nag again for a few days. */
  function dismiss() {
    writeStorage('local', SNOOZE_KEY, String(Date.now() + SIGNUP_OFFER.snoozeDays * 24 * 60 * 60 * 1000));
    setClosed(true);
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[55] flex items-center justify-center p-3 sm:p-4 bg-[#0B2545]/70 backdrop-blur-xs animate-in fade-in duration-200"
      style={{ fontFamily: "'Poppins', sans-serif" }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="signup-offer-title"
      onClick={dismiss}
    >
      <div
        className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl sm:rounded-3xl bg-white shadow-2xl grid grid-cols-1 md:grid-cols-5"
        style={{ fontFamily: "'Poppins', sans-serif" }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          ref={closeRef}
          type="button"
          onClick={dismiss}
          aria-label="Close"
          className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white/95 border border-[#DCE6F2] text-[#5B6B82] hover:text-[#0B2545] hover:bg-[#EAF2FC] flex items-center justify-center cursor-pointer transition-colors shadow-2xs"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Offer panel: sleek, compact, premium */}
        <div className="md:col-span-2 bg-gradient-to-br from-[#0B2545] via-[#13335E] to-[#1D5FAF] text-white p-5 sm:p-6 flex flex-col justify-between gap-3.5 relative overflow-hidden">
          <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-[#93C5FD]/15 pointer-events-none" aria-hidden="true" />
          
          <div className="relative space-y-2">
            <Logo variant="dark" size="sm" showTagline={false} />
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[#93C5FD] font-heading">
              <BadgePercent className="w-3.5 h-3.5 text-[#F28C38]" /> {SIGNUP_OFFER.eyebrow}
            </span>
            <h2 id="signup-offer-title" className="text-xl sm:text-2xl font-extrabold font-heading leading-tight">
              {SIGNUP_OFFER.title}
            </h2>
          </div>

          <div className="relative grid grid-cols-2 md:grid-cols-1 gap-2.5">
            {SIGNUP_OFFER.offers.map((o) => (
              <div key={o.detail} className="rounded-xl bg-white/10 border border-white/20 p-2.5 sm:p-3 backdrop-blur-xs">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl sm:text-3xl font-black font-heading text-white">{o.value}</span>
                  <span className="text-sm font-black font-heading text-[#F28C38]">{o.label}</span>
                </div>
                <p className="text-[11px] text-[#EAF2FC]/90 mt-0.5 leading-snug">{o.detail}</p>
              </div>
            ))}
          </div>

          <ul className="relative space-y-1.5 hidden md:block text-[11px] text-[#EAF2FC]">
            {SIGNUP_OFFER.perks.map((p) => (
              <li key={p} className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#93C5FD] shrink-0" /> {p}
              </li>
            ))}
          </ul>
          <p className="relative text-[10px] text-[#EAF2FC]/70">{SIGNUP_OFFER.finePrint}</p>
        </div>

        {/* Sign up / sign in */}
        <div className="md:col-span-3 p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <CustomerAuthForm initialMode="signup" onSuccess={() => setClosed(true)} />
          </div>
          <button
            type="button"
            onClick={dismiss}
            className="mt-3 w-full text-center text-xs font-semibold text-[#5B6B82] hover:text-[#0B2545] cursor-pointer transition-colors"
          >
            No thanks, continue browsing
          </button>
        </div>
      </div>
    </div>
  );
};

export default SignupOfferPopup;
