'use client';

import React, { useEffect, useState } from 'react';
import { usePincodeStore, useToastStore } from '@/lib/store';
import { checkPincodeServiceability } from '@/lib/api';
import { getPopularHubs } from '@/lib/settings/pincode-api';
import { MapPin, X, CheckCircle, Truck, AlertCircle, ArrowRight } from 'lucide-react';
import { useSiteSettings } from '@/lib/settings/store';

export const PincodeModal: React.FC = () => {
  const { pincode, isPincodeModalOpen, setPincodeModalOpen, setPincode } = usePincodeStore();
  const { addToast } = useToastStore();

  const settings = useSiteSettings();
  const [inputPin, setInputPin] = useState(pincode || '');
  const [loading, setLoading] = useState(false);
  const [hubs, setHubs] = useState<{ name: string; pin: string }[]>([]);
  const [result, setResult] = useState<{
    serviceable: boolean;
    city: string;
    state: string;
    deliveryDays: string;
    codAvailable: boolean;
  } | null>(null);
  const [error, setError] = useState('');

  // Keep input in sync with stored pincode when opened or rehydrated from localStorage
  useEffect(() => {
    if (isPincodeModalOpen) {
      const current = pincode || '';
      setInputPin(current);
      setError('');
      if (current && /^\d{6}$/.test(current)) {
        checkPincodeServiceability(current)
          .then((res) => setResult(res))
          .catch(() => setResult(null));
      } else {
        setResult(null);
      }
    }
  }, [pincode, isPincodeModalOpen]);

  useEffect(() => {
    let alive = true;
    getPopularHubs().then((data) => {
      if (alive && data.length > 0) setHubs(data);
    });
    return () => {
      alive = false;
    };
  }, []);

  if (!isPincodeModalOpen) return null;

  const handleCheck = async (pinToCheck?: string) => {
    const pin = (typeof pinToCheck === 'string' ? pinToCheck : inputPin).trim();
    if (!/^\d{6}$/.test(pin)) {
      setError('Please enter a valid 6-digit Indian PIN code');
      setResult(null);
      return;
    }

    setError('');
    setLoading(true);
    try {
      const res = await checkPincodeServiceability(pin);
      setResult(res);
      if (res.serviceable) {
        setPincode(pin, res.city, res.state, res.deliveryDays);
        addToast({
          type: 'success',
          title: 'Location Updated',
          message: `Delivery set to ${res.city}, ${res.state} (${pin})`
        });
      }
    } catch {
      setError('Could not verify pincode. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSelect = (pin: string) => {
    setInputPin(pin);
    handleCheck(pin);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 border border-[#DCE6F2]">
        <button
          onClick={() => setPincodeModalOpen(false)}
          className="absolute top-4 right-4 text-[#5B6B82] hover:text-[#12263F] p-1"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-[#EAF2FC] flex items-center justify-center text-[#1D5FAF]">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-[#12263F] text-lg">Check Delivery Pincode</h3>
            <p className="text-xs text-[#5B6B82]">Find delivery speed & COD availability for your clinic</p>
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleCheck();
          }}
          className="space-y-3"
        >
          <div className="relative flex items-center">
            <input
              id="delivery-pincode-input"
              name="pincode"
              type="text"
              inputMode="numeric"
              autoComplete="postal-code"
              maxLength={6}
              value={inputPin}
              onChange={(e) => {
                setInputPin(e.target.value.replace(/\D/g, ''));
                setError('');
              }}
              placeholder="Enter 6-digit Pincode (e.g. 110001)"
              className="w-full text-base font-semibold px-4 py-3 border border-[#DCE6F2] text-[#12263F] rounded-xl focus:outline-none focus:border-[#1D5FAF] tracking-wider"
              autoFocus
            />
            <button
              type="submit"
              disabled={loading}
              className="absolute right-2 px-4 py-2 bg-[#1D5FAF] hover:bg-[#174E90] text-white font-semibold text-xs rounded-lg transition-colors flex items-center gap-1 disabled:opacity-50"
            >
              {loading ? 'Checking...' : 'Check'}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {error && (
            <div className="flex items-center gap-1.5 text-xs text-[#DC2626] font-medium p-2.5 rounded-lg bg-red-50 border border-red-200">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {result && !result.serviceable && !error && (
            <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800 space-y-1">
              <p className="font-semibold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                PIN code {inputPin} is currently not serviceable
              </p>
              <p className="text-[11px] text-amber-700">
                {settings.shipping.restrictedToListedPincodes
                  ? "We only ship to our verified courier pincodes right now."
                  : "We're expanding our medical logistics to this area soon."}
              </p>
            </div>
          )}

          {result && result.serviceable && (
            <div className="p-3.5 bg-[#16A34A]/5 rounded-xl border border-[#16A34A]/30 space-y-1.5">
              <div className="flex items-center gap-2 text-[#12263F] font-semibold text-sm">
                <CheckCircle className="w-4 h-4 text-[#16A34A]" />
                Serviceable in {[result.city, result.state].filter(Boolean).join(', ')}
              </div>
              <div className="flex items-center gap-2 text-xs text-[#16A34A]">
                <Truck className="w-4 h-4" />
                Estimated Delivery: <span className="font-semibold">{result.deliveryDays}</span>
              </div>
              <div className="text-[12px] text-[#16A34A]">
                {[
                  settings.shipping.freeShippingAbove > 0 && settings.shipping.flatShippingCharge > 0
                    ? `✓ Free shipping on orders over ₹${settings.shipping.freeShippingAbove.toLocaleString('en-IN')}`
                    : '✓ Free shipping',
                  result.codAvailable ? 'Cash on Delivery available' : 'Prepaid orders only'
                ].join(' • ')}
              </div>
            </div>
          )}
        </form>

        {/* Popular Cities */}
        <div className="mt-5 pt-4 border-t border-[#DCE6F2]">
          <div className="text-xs font-semibold text-[#5B6B82] mb-2">Popular Healthcare Hubs:</div>
          <div className="flex flex-wrap gap-1.5">
            {hubs.map((city) => (
              <button
                key={city.pin}
                type="button"
                onClick={() => handleQuickSelect(city.pin)}
                className="text-xs bg-[#F6F9FD] hover:bg-[#EAF2FC] hover:text-[#174E90] hover:border-[#1D5FAF]/30 border border-[#DCE6F2] px-2.5 py-1 rounded-md transition-colors font-medium text-[#12263F] cursor-pointer"
              >
                {city.name} ({city.pin})
              </button>
            ))}
          </div>
        </div>

        {result?.serviceable && (
          <button
            onClick={() => setPincodeModalOpen(false)}
            className="w-full mt-4 py-2.5 bg-[#0B2545] hover:bg-[#13335E] text-white font-semibold text-sm rounded-xl transition-colors"
          >
            Confirm & Continue Shopping
          </button>
        )}
      </div>
    </div>
  );
};

export default PincodeModal;
