import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { Truck, ShieldCheck, Clock, MapPin } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Pan-India Shipping & Delivery Policy | Buy Denmed',
  description: 'Fast, secure doorstep transit policy for medical equipment, air-cargo delivery, fragile crating, and transit insurance.'
};

export default function ShippingPolicyPage() {
  return (
    <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-10 space-y-8">
      <div className="bg-white p-8 rounded-3xl border border-[#DCE6F2] shadow-xs space-y-4">
        <span className="text-xs font-bold text-[#1D5FAF] uppercase tracking-wider">
          Logistics Transparency
        </span>
        <h1 className="text-2xl sm:text-4xl font-black text-[#12263F] tracking-tight">
          Pan-India Shipping & Delivery Policy
        </h1>
        <p className="text-xs text-[#5B6B82]">Last updated: November 2026</p>
      </div>

      <div className="bg-white p-8 rounded-3xl border border-[#DCE6F2] shadow-xs space-y-6 text-xs sm:text-sm text-[#5B6B82] leading-relaxed">
        <section className="space-y-2">
          <h2 className="font-bold text-base text-[#12263F]">1. Coverage & Serviceable Pincodes</h2>
          <p>
            Buy Denmed ships to over 25,000 postal codes across all 28 states and 8 union territories in India. Our primary logistics partners include BlueDart Express, Delhivery Air, and Safexpress Heavy Cargo.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-bold text-base text-[#12263F]">2. Free Shipping Threshold</h2>
          <p>
            Orders with an invoice value exceeding <strong className="text-[#12263F]">₹1,999</strong> qualify for <strong className="text-[#12263F]">100% Free Doorstep Delivery</strong> anywhere in India. For orders below this threshold, a standard handling fee of ₹149 is applied at checkout.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-bold text-base text-[#12263F]">3. Estimated Transit Times</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong className="text-[#12263F]">Delhi NCR:</strong> Same-day or Next-day dispatch (within 24 hours).</li>
            <li><strong className="text-[#12263F]">Metro Cities (Mumbai, Bengaluru, Hyderabad, Chennai, Kolkata):</strong> 2 to 3 business days via priority air cargo.</li>
            <li><strong className="text-[#12263F]">Tier 2 & Tier 3 Regional Centers:</strong> 3 to 5 business days.</li>
            <li><strong className="text-[#12263F]">Heavy Operatory Units (Chairs, Compressors):</strong> Shipped via surface transport in 4 to 7 business days with physical offloading support.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="font-bold text-base text-[#12263F]">4. Fragile & Heavy Equipment Crating</h2>
          <p>
            Delicate items such as Class B vacuum autoclaves, intraoral RVG sensors, and dental turbines are packaged with reinforced wooden crates, moisture desiccant packs, and anti-static bubble wrap to guarantee arrival in zero-defect condition.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-bold text-base text-[#12263F]">5. 100% In-Transit Insurance</h2>
          <p>
            Every parcel dispatched from Buy Denmed distribution hubs carries comprehensive marine and transit insurance. In the rare event of transit damage, our logistics desk issues immediate replacements without protracted claims processing.
          </p>
        </section>
      </div>
    </div>
  );
}
