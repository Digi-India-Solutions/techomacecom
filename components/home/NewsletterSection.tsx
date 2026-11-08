'use client';

import React, { useState } from 'react';
import { Mail, CheckCircle2, ShieldCheck } from 'lucide-react';
import { useToastStore } from '@/lib/store';

export const NewsletterSection: React.FC = () => {
  const [email, setEmail] = useState('');
  const [clinicName, setClinicName] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const { addToast } = useToastStore();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setSubscribed(true);
    addToast({
      type: 'success',
      title: 'Subscribed to Clinic Bulletins',
      message: `Wholesale discount alerts & GST updates will be sent to ${email}`
    });
  };

  return (
    <section className="bg-[#2B2B2B] text-white py-14 px-4 sm:px-8 border-t border-gray-800">
      <div className="max-w-4xl mx-auto text-center space-y-6">
        <div className="inline-flex items-center gap-2 bg-white/10 px-3.5 py-1 rounded-full text-xs font-semibold text-[#FF6B00]">
          <ShieldCheck className="w-4 h-4" />
          <span>Exclusive for Medical & Dental Professionals</span>
        </div>

        <h2 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
          Get Wholesale B2B Pricing Bulletins & <br />
          <span className="text-[#FF6B00]">Exclusive Doctor Discount Codes</span>
        </h2>

        <p className="text-xs sm:text-sm text-gray-400 max-w-xl mx-auto">
          Join 22,000+ Indian practitioners. Receive weekly alerts for clearance sales, imported European autoclaves, new dental ceramics, and GST savings.
        </p>

        {subscribed ? (
          <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-2xl max-w-md mx-auto text-green-400 text-xs flex items-center justify-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0" />
            <span>Thank you! Check your inbox for our 10% clinic starter coupon code.</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2.5 max-w-lg mx-auto">
            <input
              type="text"
              value={clinicName}
              onChange={(e) => setClinicName(e.target.value)}
              placeholder="Clinic / Hospital Name"
              className="bg-white/10 border border-white/20 text-white placeholder-gray-400 text-xs px-4 py-3 rounded-xl focus:outline-none focus:border-[#FF6B00] sm:w-1/3"
            />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Doctor's Email Address"
              className="bg-white/10 border border-white/20 text-white placeholder-gray-400 text-xs px-4 py-3 rounded-xl focus:outline-none focus:border-[#FF6B00] flex-1"
            />
            <button
              type="submit"
              className="px-6 py-3 bg-[#FF6B00] hover:bg-[#E65D00] text-white font-bold text-xs rounded-xl transition-all shadow-md shrink-0"
            >
              Subscribe
            </button>
          </form>
        )}

        <div className="text-[11px] text-gray-500">
          No spam guarantee. Unsubscribe at any time with 1-click.
        </div>
      </div>
    </section>
  );
};

export default NewsletterSection;
