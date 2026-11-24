'use client';

import React from 'react';
import { CreditCard, FileText, ShieldCheck } from 'lucide-react';
import type { RentalDepositMode } from '@/types';

const inr = (n: number) => `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

interface Props {
  deposit: number;
  value: RentalDepositMode;
  onChange: (mode: RentalDepositMode) => void;
  disabled?: boolean;
  compact?: boolean;
}

/**
 * Refundable security deposit, shown on its own: the customer pays it online with the booking
 * (included in the online amount) or hands over a cheque before delivery (left out of it).
 */
export default function DepositModeChooser({ deposit, value, onChange, disabled, compact }: Props) {
  if (deposit <= 0) return null;
  const options: { mode: RentalDepositMode; icon: React.ElementType; title: string; hint: string }[] = [
    { mode: 'online', icon: CreditCard, title: 'Pay online', hint: 'Added to your online payment' },
    { mode: 'cheque', icon: FileText, title: 'Pay by cheque', hint: 'Hand a cheque to our team before delivery' },
  ];

  return (
    <div className="rounded-xl border border-[#16A34A]/25 bg-[#16A34A]/5 p-3 space-y-2.5">
      <div className="flex items-center justify-between gap-2 text-[#16A34A] font-semibold text-xs">
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 shrink-0" /> Refundable security deposit
        </span>
        <span>{inr(deposit)}</span>
      </div>
      <div role="radiogroup" aria-label="How do you want to pay the deposit?" className={`grid gap-2 ${compact ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'}`}>
        {options.map(({ mode, icon: Icon, title, hint }) => {
          const active = value === mode;
          return (
            <button
              key={mode}
              type="button"
              role="radio"
              aria-checked={active}
              disabled={disabled}
              onClick={() => onChange(mode)}
              className={`flex items-start gap-2 rounded-lg border px-2.5 py-2 text-left transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 ${
                active ? 'border-[#1D5FAF] bg-white ring-1 ring-[#1D5FAF]' : 'border-[#DCE6F2] bg-white/70 hover:border-[#1D5FAF]/50'
              }`}
            >
              <span className={`mt-0.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border ${active ? 'border-[#1D5FAF]' : 'border-[#94A3B8]'}`}>
                {active && <span className="h-1.5 w-1.5 rounded-full bg-[#1D5FAF]" />}
              </span>
              <span className="min-w-0">
                <span className="flex items-center gap-1 text-xs font-bold text-[#12263F]">
                  <Icon className="w-3.5 h-3.5 text-[#1D5FAF]" /> {title}
                </span>
                <span className="block text-[11px] text-[#5B6B82] leading-snug">{hint}</span>
              </span>
            </button>
          );
        })}
      </div>
      {value === 'cheque' && (
        <p className="text-[11px] text-[#5B6B82] leading-snug">
          The deposit is not charged online. Keep a cheque of {inr(deposit)} ready — our team collects it before the equipment is
          installed, and the deposit is refunded by bank transfer / UPI after return.
        </p>
      )}
    </div>
  );
}
