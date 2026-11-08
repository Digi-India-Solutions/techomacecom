import React from 'react';
import Link from 'next/link';
import Logo from '@/components/common/Logo';
import { 
  Phone, 
  Mail, 
  MapPin, 
  ShieldCheck, 
  Truck, 
  Award, 
  CreditCard,
  Clock
} from 'lucide-react';
import { MOCK_CATEGORIES } from '@/lib/mock/data';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#1E293B] text-slate-300 pt-12 pb-24 lg:pb-12 border-t border-slate-800 font-body">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        {/* Main 4-column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 pb-10 border-b border-slate-700/60">
          {/* Col 1 & 2: About & Identity */}
          <div className="lg:col-span-2 space-y-4">
            <Logo variant="dark" size="md" showTagline={true} />
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm font-body">
              Buy Denmed is India&apos;s leading B2C/B2B online marketplace for dental equipment, medical instruments, respiratory devices, and critical hospital consumables. We connect healthcare professionals with certified global manufacturers with guaranteed authenticity and input tax credit (GST) invoicing.
            </p>

            <div className="space-y-2 text-xs">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#0F766E] shrink-0 mt-0.5" />
                <span className="text-slate-300">
                  Denmed Logistics & Distribution Hub, Okhla Industrial Area Phase-III, New Delhi - 110020, India
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-[#0F766E] shrink-0" />
                <a href="tel:+919811234567" className="text-white font-semibold hover:text-[#0F766E] transition-colors">
                  +91 98112 34567 / 011-49827000
                </a>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-[#0F766E] shrink-0" />
                <a href="mailto:support@buydenmed.com" className="hover:text-[#0F766E] transition-colors">
                  support@buydenmed.com | orders@buydenmed.com
                </a>
              </div>
              <div className="flex items-center gap-2.5 text-slate-400">
                <Clock className="w-4 h-4 text-[#0F766E] shrink-0" />
                <span>Mon - Sat: 9:00 AM - 7:30 PM IST</span>
              </div>
            </div>
          </div>

          {/* Col 3: Categories */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4 border-l-2 border-[#0F766E] pl-2 font-heading">
              Top Categories
            </h4>
            <ul className="space-y-2 text-xs">
              {MOCK_CATEGORIES.slice(0, 7).map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/category/${c.slug}`}
                    className="hover:text-[#0F766E] transition-colors truncate block"
                  >
                    {c.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/category/respiratory-care" className="text-[#0F766E] hover:underline font-semibold font-heading">
                  View All Categories →
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Quick Links & Services */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4 border-l-2 border-[#0F766E] pl-2 font-heading">
              Equipment Services
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/rent" className="hover:text-[#0F766E] transition-colors">
                  Equipment Rentals (Monthly)
                </Link>
              </li>
              <li>
                <Link href="/sleep-test" className="hover:text-[#0F766E] transition-colors">
                  Home Sleep Apnea Test (HSAT)
                </Link>
              </li>
              <li>
                <Link href="/bulk-enquiry" className="hover:text-[#0F766E] transition-colors">
                  Hospital & Institutional Quotations
                </Link>
              </li>
              <li>
                <Link href="/brands" className="hover:text-[#0F766E] transition-colors">
                  Shop by Brands
                </Link>
              </li>
              <li>
                <Link href="/offers" className="hover:text-[#0F766E] transition-colors">
                  Special Doctor Deals & Combos
                </Link>
              </li>
              <li>
                <Link href="/blog" className="hover:text-[#0F766E] transition-colors">
                  Denmed Clinical Knowledge Hub
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-[#0F766E] transition-colors">
                  About Buy Denmed India
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-[#0F766E] transition-colors">
                  FAQs & Calibration Support
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 5: Policies & Compliance */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4 border-l-2 border-[#0F766E] pl-2 font-heading">
              Legal & Trust
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/policies/shipping" className="hover:text-[#0F766E] transition-colors">
                  Pan-India Shipping Policy
                </Link>
              </li>
              <li>
                <Link href="/policies/returns" className="hover:text-[#0F766E] transition-colors">
                  Returns & Replacement Policy
                </Link>
              </li>
              <li>
                <Link href="/policies/rental-terms" className="hover:text-[#0F766E] transition-colors">
                  Medical Rental Agreements
                </Link>
              </li>
              <li>
                <Link href="/policies/privacy" className="hover:text-[#0F766E] transition-colors">
                  Privacy & Data Security
                </Link>
              </li>
              <li>
                <Link href="/policies/terms" className="hover:text-[#0F766E] transition-colors">
                  Terms of Sale & GST Compliance
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-[#0F766E] transition-colors">
                  Grievance & Support Desk
                </Link>
              </li>
            </ul>

            {/* Trust badge box */}
            <div className="mt-4 p-3 bg-white/5 rounded-xl border border-white/10 space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-white font-heading">
                <ShieldCheck className="w-4 h-4 text-[#0F766E]" />
                Genuine Clinical Warranty
              </div>
              <p className="text-[10px] text-slate-400">
                Direct manufacturer warranties and calibrated service engineers for Philips, ResMed, 3M, Omron, W&H, Woodpecker.
              </p>
            </div>
          </div>
        </div>

        {/* Payment Partners & Bottom Bar */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-slate-400">
          <div>
            © {new Date().getFullYear()} Buy Denmed Healthcare Pvt. Ltd. All rights reserved. Pan-India Medical & Dental Solutions.
          </div>

          {/* Payment Partner Badges */}
          <div className="flex items-center flex-wrap gap-2 font-body">
            <span className="text-[11px] font-semibold text-slate-300 mr-2 font-heading">Secure Payments:</span>
            {['UPI (GPay / PhonePe)', 'RuPay', 'Visa', 'Mastercard', 'NetBanking', 'Razorpay', 'Easy EMI'].map((partner) => (
              <span
                key={partner}
                className="bg-white/10 text-slate-200 text-[10px] font-semibold px-2 py-0.5 rounded border border-white/10"
              >
                {partner}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
