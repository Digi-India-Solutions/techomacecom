'use client';

import React, { useState } from 'react';
import { CheckCircle2, ArrowRight } from 'lucide-react';
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
    <section className="relative overflow-hidden bg-[#2B2B2B] text-white py-10 sm:py-20 px-3 sm:px-8 font-body">
      {/* Soft orange glow accents */}
      <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[640px] h-[320px] rounded-full bg-[#F07A30]/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-24 w-[360px] h-[360px] rounded-full bg-[#F07A30]/5 blur-3xl" />

      <div className="relative max-w-4xl mx-auto text-center space-y-4 sm:space-y-6">
        <h2 className="text-xl sm:text-3xl lg:text-4xl font-black tracking-tight leading-tight font-heading">
          Get Wholesale B2B Pricing Bulletins &amp; <br className="hidden sm:inline" />
          <span className="text-[#F07A30] block sm:inline mt-1 sm:mt-0">Exclusive Doctor Discount Codes</span>
        </h2>

        <p className="text-xs sm:text-sm text-[#B5B5B5] max-w-xl mx-auto leading-relaxed">
          Join 22,000+ Indian practitioners. Receive weekly alerts for clearance sales, imported European autoclaves, new dental ceramics, and GST savings.
        </p>

        {subscribed ? (
          <div className="p-3.5 sm:p-4 bg-green-500/15 border border-green-400/30 rounded-xl sm:rounded-2xl max-w-md mx-auto text-[#4ADE80] text-xs sm:text-sm flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-[#4ADE80] shrink-0" />
            <span>Thank you! Check your inbox for our 10% clinic starter coupon code.</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 max-w-xl mx-auto">
            <input
              id="newsletter-clinic-name"
              name="clinicName"
              type="text"
              autoComplete="organization"
              value={clinicName}
              onChange={(e) => setClinicName(e.target.value)}
              placeholder="Clinic / Hospital Name"
              className="bg-[#3A3A3A] hover:bg-[#424242] border border-white/20 hover:border-white/40 text-white placeholder-[#A3A3A3] text-xs sm:text-sm px-3.5 py-3 sm:px-4 sm:py-3.5 rounded-xl focus:outline-none focus:border-[#F07A30] focus:ring-2 focus:ring-[#F07A30]/30 transition-all duration-200 sm:w-1/3 outline-none"
            />
            <input
              id="newsletter-doctor-email"
              name="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Doctor's Email Address"
              className="bg-[#3A3A3A] hover:bg-[#424242] border border-white/20 hover:border-white/40 text-white placeholder-[#A3A3A3] text-xs sm:text-sm px-3.5 py-3 sm:px-4 sm:py-3.5 rounded-xl focus:outline-none focus:border-[#F07A30] focus:ring-2 focus:ring-[#F07A30]/30 transition-all duration-200 flex-1 outline-none"
            />
            <button
              type="submit"
              className="group inline-flex items-center justify-center gap-2 px-6 py-3 sm:py-3.5 bg-[#F07A30] hover:bg-[#E0661C] text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-[#F07A30]/20 hover:shadow-lg hover:shadow-[#F07A30]/40 hover:-translate-y-0.5 transition-all duration-300 shrink-0 cursor-pointer font-heading active:scale-95"
            >
              <span>Subscribe</span>
              <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
            </button>
          </form>
        )}

        <div className="text-[11px] sm:text-xs text-[#8A8A8A]">
          No spam guarantee. Unsubscribe at any time with 1-click.
        </div>
      </div>
    </section>
  );
};

export default NewsletterSection;
