'use client';

import React, { useState } from 'react';
import { Product } from '@/types';
import { X, CreditCard, ShieldCheck, Check } from 'lucide-react';

interface EmiModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export const EmiModal: React.FC<EmiModalProps> = ({ product, isOpen, onClose }) => {
  const [selectedBank, setSelectedBank] = useState<string>('HDFC Bank');

  if (!isOpen || !product) return null;

  const banks = [
    { name: 'HDFC Bank', rates: [ { m: 3, r: 0, noCost: true }, { m: 6, r: 12 }, { m: 9, r: 13 }, { m: 12, r: 14 } ] },
    { name: 'ICICI Bank', rates: [ { m: 3, r: 0, noCost: true }, { m: 6, r: 12 }, { m: 12, r: 14 } ] },
    { name: 'Bajaj Finserv (No Cost)', rates: [ { m: 3, r: 0, noCost: true }, { m: 6, r: 0, noCost: true } ] },
    { name: 'Axis Bank', rates: [ { m: 6, r: 12 }, { m: 9, r: 13 }, { m: 12, r: 14 } ] },
    { name: 'State Bank of India (SBI)', rates: [ { m: 6, r: 11.5 }, { m: 12, r: 13.5 } ] }
  ];

  const currentBankData = banks.find((b) => b.name === selectedBank) || banks[0];

  const calculateMonthly = (tenure: number, rate: number, isNoCost?: boolean) => {
    const P = product.price;
    if (isNoCost || rate === 0) {
      return Math.round(P / tenure);
    }
    const r = rate / 12 / 100;
    const emi = (P * r * Math.pow(1 + r, tenure)) / (Math.pow(1 + r, tenure) - 1);
    return Math.round(emi);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-[#DCE6F2] max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-[#0B2545] text-white p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#1D5FAF] flex items-center justify-center text-white">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg">Flexible EMI Options</h3>
              <p className="text-xs text-[#EAF2FC]/80">
                Medical equipment financing starting from ₹{product.emiStartingFrom?.toLocaleString('en-IN') || '1,499'}/month
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white p-1 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Product summary banner */}
        <div className="p-4 bg-[#F6F9FD] border-b border-[#DCE6F2] flex items-center justify-between text-xs sm:text-sm">
          <div className="truncate max-w-[70%]">
            <span className="font-semibold text-[#12263F]">{product.name}</span>
          </div>
          <div className="text-right shrink-0">
            <div className="text-xs text-[#5B6B82]">Order Amount</div>
            <div className="font-bold text-[#1D5FAF] text-base">₹{product.price.toLocaleString('en-IN')}</div>
          </div>
        </div>

        {/* Bank Selection Tabs */}
        <div className="p-4 border-b border-[#DCE6F2] bg-white overflow-x-auto no-scrollbar flex gap-2 shrink-0">
          {banks.map((b) => (
            <button
              key={b.name}
              onClick={() => setSelectedBank(b.name)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                selectedBank === b.name
                  ? 'bg-[#1D5FAF] text-white shadow-sm'
                  : 'bg-[#F6F9FD] text-[#12263F] hover:bg-[#EAF2FC] hover:text-[#174E90]'
              }`}
            >
              {b.name}
            </button>
          ))}
        </div>

        {/* Plans Table */}
        <div className="p-5 overflow-y-auto flex-1 space-y-3">
          <div className="text-xs font-semibold text-[#5B6B82] uppercase tracking-wider mb-2">
            Available Plans for {selectedBank}:
          </div>

          <div className="space-y-2.5">
            {currentBankData.rates.map((plan) => {
              const monthly = calculateMonthly(plan.m, plan.r, plan.noCost);
              const totalPayable = plan.noCost ? product.price : monthly * plan.m;
              const interest = totalPayable - product.price;

              return (
                <div
                  key={plan.m}
                  className={`p-3.5 rounded-xl border transition-all flex items-center justify-between ${
                    plan.noCost
                      ? 'border-[#16A34A]/40 bg-[#16A34A]/5'
                      : 'border-[#DCE6F2] bg-white hover:border-[#1D5FAF]'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#12263F] text-base">
                        ₹{monthly.toLocaleString('en-IN')}
                      </span>
                      <span className="text-xs text-[#5B6B82] font-medium">x {plan.m} Months</span>
                      {plan.noCost && (
                        <span className="text-[11px] bg-[#16A34A] text-white font-bold px-2 py-0.5 rounded-full uppercase">
                          No Cost EMI
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-[#5B6B82] mt-1">
                      {plan.noCost ? (
                        <span className="text-[#16A34A] font-medium">Zero interest charged. Overall cost = ₹{product.price.toLocaleString('en-IN')}</span>
                      ) : (
                        <span>Annual Interest: {plan.r}% (₹{interest.toLocaleString('en-IN')} total interest)</span>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs text-[#5B6B82]">Total Payable</div>
                    <div className="font-bold text-[#12263F] text-sm">
                      ₹{totalPayable.toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Features info */}
          <div className="mt-4 p-3 bg-[#F6F9FD] rounded-xl text-xs text-[#5B6B82] space-y-1 border border-[#DCE6F2]">
            <div className="flex items-center gap-1.5 font-medium text-[#12263F]">
              <ShieldCheck className="w-4 h-4 text-[#16A34A]" />
              100% Secure Instant Bank Authorization via Razorpay
            </div>
            <p className="text-[12px] text-[#5B6B82]">
              Select &quot;EMI on Cards&quot; or &quot;Bajaj Finserv&quot; at final checkout screen to complete payment. No manual paperwork required for pre-approved cards.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#F6F9FD] border-t border-[#DCE6F2] flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#0B2545] hover:bg-[#13335E] text-white text-xs font-semibold rounded-lg transition-colors"
          >
            Got it, Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmiModal;
