'use client';

import React, { useState, useEffect } from 'react';
import type { Coupon } from '@/types';
import { Check, Copy, Tag } from 'lucide-react';
import { BACKEND_API_URL } from '@/lib/config';

export default function OffersCouponGrid({ coupons: initialCoupons = [] }: { coupons?: Coupon[] }) {
  const [coupons, setCoupons] = useState<Coupon[]>(initialCoupons);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    // Keep synced with initialCoupons from SSR
    if (initialCoupons && initialCoupons.length > 0) {
      setCoupons(initialCoupons);
    }

    // Refresh client-side so any coupon added/edited in Admin reflects immediately
    let mounted = true;
    async function fetchLatest() {
      try {
        const res = await fetch(`${BACKEND_API_URL}/coupons/public`);
        if (res.ok) {
          const body = await res.json();
          if (mounted && body?.success && Array.isArray(body.data) && body.data.length > 0) {
            setCoupons(body.data);
          }
        }
      } catch {
        // keep current coupons
      }
    }

    fetchLatest();
    return () => {
      mounted = false;
    };
  }, [initialCoupons]);

  const handleCopy = (code: string) => {
    try {
      navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => {
        setCopiedCode((curr) => (curr === code ? null : curr));
      }, 2500);
    } catch {
      // fallback
    }
  };

  if (!coupons || coupons.length === 0) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-[#DCE6F2] text-center text-[#5B6B82]">
        <Tag className="w-8 h-8 mx-auto mb-2 text-[#8A97A8]" />
        <p className="text-sm font-medium">No active discount vouchers right now. Check back soon!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {coupons.map((coupon) => {
        const isCopied = copiedCode === coupon.code;
        return (
          <div
            key={coupon.code}
            onClick={() => handleCopy(coupon.code)}
            className="group bg-white p-5 rounded-2xl border-2 border-dashed border-[#DCE6F2] hover:border-[#1D5FAF] hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-3 relative overflow-hidden"
          >
            <div>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-mono font-bold text-base text-[#174E90] bg-[#EAF2FC] group-hover:bg-[#1D5FAF] group-hover:text-white transition-colors px-2.5 py-1 rounded-lg">
                    {coupon.code}
                  </span>
                  {(coupon as any).firstOrderOnly && (
                    <span className="text-[10px] font-semibold bg-[#F28C38]/15 text-[#B85A0E] px-1.5 py-0.5 rounded-md">
                      1st Order
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-[#5B6B82] font-medium whitespace-nowrap">
                  Valid till {coupon.expiresAt}
                </span>
              </div>

              <p className="text-xs text-[#5B6B82] mt-2 font-medium leading-relaxed line-clamp-2">
                {coupon.description}
              </p>
            </div>

            <div className="pt-2 border-t border-[#DCE6F2] flex items-center justify-between text-[12px] text-[#5B6B82] font-heading">
              <span>
                Min Order: ₹{coupon.minOrderValue ? coupon.minOrderValue.toLocaleString('en-IN') : '0'}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCopy(coupon.code);
                }}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                  isCopied
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'text-[#1D5FAF] hover:bg-[#EAF2FC]'
                }`}
              >
                {isCopied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>1-Click Apply</span>
                  </>
                )}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
