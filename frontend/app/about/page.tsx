import React from 'react';
import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ShieldCheck, Truck, Award, Users, CheckCircle2, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'About Buy Denmed - India\'s Medical & Dental Equipment Store',
  description: 'Buy Denmed connects over 15,000 healthcare professionals with certified manufacturers, official warranties, and transparent B2B pricing.'
};

export default function AboutPage() {
  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-10 space-y-12">
      <div className="bg-[#0B2545] text-white p-8 sm:p-12 rounded-3xl shadow-xl space-y-4">
        <span className="text-xs font-bold text-[#93C5FD] uppercase tracking-wider">
          Our Mission & Healthcare Heritage
        </span>
        <h1 className="text-3xl sm:text-5xl font-black tracking-tight">
          Empowering Indian Clinics with Genuine Medical & Dental Technology.
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
          Founded to bridge the trust and accessibility gap for healthcare practitioners across Tier 1, 2, and 3 Indian cities, Buy Denmed delivers authorized equipment with verified GST invoices, calibrated warranties, and doorstep biomedical engineer support.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
        {[
          { num: '15,000+', label: 'Registered Doctors & Clinics' },
          { num: '25,000+', label: 'Indian Pincodes Served' },
          { num: '100%', label: 'Genuine Brand Warranties' },
          { num: '48 Hours', label: 'Average Air-Cargo Dispatch' }
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-[#DCE6F2] shadow-xs space-y-1">
            <div className="text-2xl sm:text-3xl font-black text-[#1D5FAF]">{stat.num}</div>
            <div className="text-xs text-[#5B6B82] font-medium">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-3xl border border-[#DCE6F2] p-8 sm:p-10 shadow-xs space-y-6">
        <h2 className="text-xl sm:text-2xl font-black text-[#12263F]">Why Doctors Trust Buy Denmed</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-[#5B6B82] leading-relaxed">
          <div className="space-y-2">
            <h3 className="font-bold text-sm text-[#12263F] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#1D5FAF]" />
              Authorized Distributor Channel
            </h3>
            <p>
              We bypass gray-market importers. Every batch of 3M composites, Dentsply files, Philips oxygen concentrators, and W&H turbines comes directly from certified regional channels with intact holographic authentication.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="font-bold text-sm text-[#12263F] flex items-center gap-2">
              <Truck className="w-4 h-4 text-[#1D5FAF]" />
              Temperature-Controlled Air Cargo
            </h3>
            <p>
              Dental bonding agents, impression materials, and delicate optics are sensitive to Indian summer heat. Our fulfillment centers utilize temperature-monitored packaging and express air freight.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="font-bold text-sm text-[#12263F] flex items-center gap-2">
              <Award className="w-4 h-4 text-[#1D5FAF]" />
              100% Tax Invoices with Full Input Tax Credit
            </h3>
            <p>
              Every transaction issues a complete B2B GST tax invoice allowing clinics to claim 12% to 18% input tax credit on their annual tax returns.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="font-bold text-sm text-[#12263F] flex items-center gap-2">
              <Users className="w-4 h-4 text-[#1D5FAF]" />
              Biomedical Engineering Field Team
            </h3>
            <p>
              From installing Confident dental chairs in Guwahati to calibrating ResMed bi-level ventilators in Kochi, our certified engineers provide nationwide installation and preventative AMC visits.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
