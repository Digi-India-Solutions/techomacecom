'use client';

import React, { useState } from 'react';
import {
  Building2,
  Building,
  Mail,
  FileCheck2,
  Globe2,
  Plus,
  X,
  CheckCircle2,
  ArrowRight,
  Phone,
  MessageSquare,
  Store,
} from 'lucide-react';
import { submitSellerRegistration, type SellerRegistrationInput } from '@/lib/api';
import { ApiClientError, errorMessage } from '@/lib/api/backend';
import { useToastStore } from '@/lib/store';

const COMPANY_REGISTRATION_TYPES = [
  'Private Limited Company',
  'Proprietorship',
  'Partnership Firm',
  'Limited Liability Partnership (LLP)',
  'Public Limited Company',
  'One Person Company (OPC)',
];

const VENDOR_TYPES = [
  'Manufacturer',
  'Authorized Importer',
  'Authorized Distributor / Dealer',
  'Wholesaler / Stockist',
  'Dental Consumables Supplier',
];

const COUNTRIES = [
  'India',
  'Germany',
  'United States',
  'Japan',
  'South Korea',
  'Switzerland',
  'United Kingdom',
  'Italy',
  'France',
  'China',
  'Taiwan',
  'Other',
];

const inputClass =
  'w-full px-3.5 py-2.5 sm:py-3 text-xs sm:text-sm font-body rounded-xl border bg-white focus:bg-white transition-all focus:outline-none shadow-2xs';
const normalBorder = 'border-[#D5E3F0] focus:border-[#1D5FAF] focus:ring-1 focus:ring-[#1D5FAF]';
const errorBorder = 'border-[#DC2626] focus:border-[#DC2626] focus:ring-1 focus:ring-[#DC2626]';

export const SellerRegistrationForm: React.FC = () => {
  const { addToast } = useToastStore();

  const [form, setForm] = useState({
    companyName: '',
    registeredAs: 'Private Limited Company',
    email: '',
    mobile: '',
    originCountry: 'India',
    vendorType: 'Manufacturer',
    gstNumber: '',
    honeypot: '',
  });

  const [brands, setBrands] = useState<{ name: string; country: string }[]>([]);
  const [newBrandName, setNewBrandName] = useState('');
  const [newBrandCountry, setNewBrandCountry] = useState('India');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<{
    id: string;
    companyName: string;
    email: string;
    mobile: string;
  } | null>(null);

  const handleInputChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const addBrand = () => {
    const trimmed = newBrandName.trim();
    if (!trimmed) return;
    if (brands.some((b) => b.name.toLowerCase() === trimmed.toLowerCase())) {
      addToast({ type: 'warning', title: 'Brand already added', message: `${trimmed} is already in your brand list.` });
      return;
    }
    setBrands((prev) => [...prev, { name: trimmed, country: newBrandCountry }]);
    setNewBrandName('');
  };

  const removeBrand = (index: number) => {
    setBrands((prev) => prev.filter((_, i) => i !== index));
  };

  const validate = () => {
    const err: Record<string, string> = {};
    const cleanMobile = form.mobile.replace(/\D/g, '');

    if (form.companyName.trim().length < 2) {
      err.companyName = 'Company / Business Name is required';
    }
    if (!form.registeredAs) {
      err.registeredAs = 'Select company registration type';
    }
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      err.email = 'Enter a valid official email address';
    }
    if (!cleanMobile) {
      err.mobile = 'Contact number is required';
    } else if (!/^[6-9]\d{9}$/.test(cleanMobile)) {
      err.mobile = 'Enter a valid 10-digit Indian mobile number';
    }
    if (!form.vendorType) {
      err.vendorType = 'Select vendor type';
    }
    if (form.gstNumber.trim()) {
      const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
      if (!gstRegex.test(form.gstNumber.trim().toUpperCase())) {
        err.gstNumber = 'Enter a valid 15-character GSTIN (e.g. 22AAAAA0000A1Z5)';
      }
    }

    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const payload: SellerRegistrationInput = {
        companyName: form.companyName.trim(),
        registeredAs: form.registeredAs,
        email: form.email.trim(),
        mobile: form.mobile,
        originCountry: form.originCountry,
        vendorType: form.vendorType,
        gstNumber: form.gstNumber.trim(),
        brands,
        consent: true,
        honeypot: form.honeypot,
      };

      const result = await submitSellerRegistration(payload);
      setSubmitted({
        id: result.enquiryId || `VND-${Math.floor(100000 + Math.random() * 900000)}`,
        companyName: form.companyName.trim(),
        email: form.email.trim(),
        mobile: form.mobile.replace(/\D/g, ''),
      });

      addToast({
        type: 'success',
        title: 'Application Submitted!',
        message: 'Our vendor onboarding team will review your application and contact you within 24–48 hours.',
      });
    } catch (err) {
      if (err instanceof ApiClientError && err.fields) {
        setErrors(err.fields as Record<string, string>);
      }
      addToast({
        type: 'error',
        title: 'Submission Failed',
        message: errorMessage(err, 'Could not submit seller application. Please call +91 98112 34567.'),
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setForm({
      companyName: '',
      registeredAs: 'Private Limited Company',
      email: '',
      mobile: '',
      originCountry: 'India',
      vendorType: 'Manufacturer',
      gstNumber: '',
      honeypot: '',
    });
    setBrands([]);
    setErrors({});
    setSubmitted(null);
  };

  return (
    <div className="w-full space-y-6">
      {/* ── Section Title (Matching Dentalkart Reference Structure) ── */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl sm:text-4xl font-extrabold font-heading text-[#0B2545] tracking-tight">
          Sell On <span className="text-[#1D5FAF]">Buy Denmed</span>
        </h2>
        <p className="text-xs sm:text-sm text-[#5B6B82] font-body max-w-2xl mx-auto">
          Fill out the form below with accurate information to initiate your seller journey
        </p>
      </div>

      {/* ── Full-Width In-Page Form Container (Matching Screenshot 1: Soft blue card, compact height) ── */}
      <div className="rounded-2xl sm:rounded-3xl bg-[#F0F6FC] border border-[#D5E3F0] p-5 sm:p-8 lg:p-9 shadow-xs">
        {/* Card Header inside the container */}
        <div className="mb-5 sm:mb-6">
          <p className="text-xs sm:text-sm font-semibold font-heading text-[#475569]">
            Seller Registration Form (Enter The Details And Click{' '}
            <strong className="text-[#0B2545] font-black">Continue</strong> To Proceed To The Next Step)
          </p>
        </div>

        {submitted ? (
          /* Thank You Confirmation View */
          <div className="py-8 px-4 text-center space-y-5 bg-white rounded-2xl border border-[#DCE6F2] animate-in fade-in duration-300">
            <div className="w-16 h-16 bg-[#16A34A]/15 text-[#16A34A] rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div>
              <span className="text-[11px] font-bold uppercase tracking-widest text-[#5B6B82] font-heading">
                Application Reference ID:{' '}
                <span className="font-mono text-base font-bold text-[#12263F] ml-1">{submitted.id}</span>
              </span>
              <h4 className="text-xl sm:text-2xl font-bold font-heading text-[#12263F] mt-2">
                Thank You, {submitted.companyName}!
              </h4>
              <p className="text-xs sm:text-sm text-[#5B6B82] font-body leading-relaxed max-w-xl mx-auto mt-2">
                Your seller application has been received. Our vendor compliance team will verify your tax credentials
                and contact you at <strong className="text-[#12263F]">+91 {submitted.mobile}</strong> and{' '}
                <strong className="text-[#12263F]">{submitted.email}</strong> within 24–48 business hours.
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <a
                href="tel:+919811234567"
                className="flex-1 py-3 px-4 rounded-xl bg-[#0B2545] hover:bg-[#13335E] text-white text-xs font-bold font-heading flex items-center justify-center gap-2 transition-colors shadow-xs"
              >
                <Phone className="w-4 h-4 text-[#93C5FD]" /> Call Vendor Desk
              </a>
              <a
                href="https://wa.me/919811234567?text=Hi%20Buy%20Denmed,%20I%20submitted%20my%20seller%20registration%20application"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-3 px-4 rounded-xl bg-[#25D366] hover:bg-[#20BD5A] text-white text-xs font-bold font-heading flex items-center justify-center gap-2 transition-colors shadow-xs"
              >
                <MessageSquare className="w-4 h-4" /> WhatsApp Support
              </a>
            </div>

            <button
              type="button"
              onClick={handleReset}
              className="text-xs font-semibold text-[#1D5FAF] hover:underline font-heading inline-block pt-2 cursor-pointer"
            >
              ← Submit another seller registration
            </button>
          </div>
        ) : (
          /* Form matching Screenshot 1: 4 Rows in 2-Column Grid */
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-4" noValidate>
            {/* Honeypot Spam Trap */}
            <div aria-hidden="true" style={{ display: 'none' }}>
              <input
                tabIndex={-1}
                autoComplete="off"
                value={form.honeypot}
                onChange={(e) => handleInputChange('honeypot', e.target.value)}
              />
            </div>

            {/* Row 1: Company Name & Company Registered As */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label htmlFor="sr-companyName" className="text-xs font-bold font-heading text-[#0B2545] block mb-1.5">
                  Company Name <span className="text-[#DC2626]">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5B6B82] pointer-events-none">
                    <Building2 className="w-4 h-4" />
                  </span>
                  <input
                    id="sr-companyName"
                    type="text"
                    placeholder="Enter legal business / company name"
                    value={form.companyName}
                    maxLength={150}
                    onChange={(e) => handleInputChange('companyName', e.target.value)}
                    className={`${inputClass} pl-10 ${errors.companyName ? errorBorder : normalBorder}`}
                  />
                </div>
                {errors.companyName && <p className="text-[11px] text-[#DC2626] mt-1">{errors.companyName}</p>}
              </div>

              <div>
                <label htmlFor="sr-registeredAs" className="text-xs font-bold font-heading text-[#0B2545] block mb-1.5">
                  Company Registered As <span className="text-[#DC2626]">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5B6B82] pointer-events-none">
                    <Building className="w-4 h-4" />
                  </span>
                  <select
                    id="sr-registeredAs"
                    value={form.registeredAs}
                    onChange={(e) => handleInputChange('registeredAs', e.target.value)}
                    className={`${inputClass} pl-10 ${errors.registeredAs ? errorBorder : normalBorder} cursor-pointer`}
                  >
                    {COMPANY_REGISTRATION_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
                {errors.registeredAs && <p className="text-[11px] text-[#DC2626] mt-1">{errors.registeredAs}</p>}
              </div>
            </div>

            {/* Row 2: Company Email ID & Origin Country */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label htmlFor="sr-email" className="text-xs font-bold font-heading text-[#0B2545] block mb-1.5">
                  Company Email ID <span className="text-[#DC2626]">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5B6B82] pointer-events-none">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    id="sr-email"
                    type="email"
                    autoComplete="email"
                    placeholder="e.g. sales@company.com"
                    value={form.email}
                    maxLength={150}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={`${inputClass} pl-10 ${errors.email ? errorBorder : normalBorder}`}
                  />
                </div>
                {errors.email && <p className="text-[11px] text-[#DC2626] mt-1">{errors.email}</p>}
              </div>

              <div>
                <label htmlFor="sr-originCountry" className="text-xs font-bold font-heading text-[#0B2545] block mb-1.5">
                  Origin Country of Company <span className="text-[#DC2626]">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5B6B82] pointer-events-none">
                    <Globe2 className="w-4 h-4" />
                  </span>
                  <select
                    id="sr-originCountry"
                    value={form.originCountry}
                    onChange={(e) => handleInputChange('originCountry', e.target.value)}
                    className={`${inputClass} pl-10 ${normalBorder} cursor-pointer`}
                  >
                    {COUNTRIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Row 3: Vendor Type & Company Contact Number */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label htmlFor="sr-vendorType" className="text-xs font-bold font-heading text-[#0B2545] block mb-1.5">
                  Vendor Type <span className="text-[#DC2626]">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5B6B82] pointer-events-none">
                    <Store className="w-4 h-4" />
                  </span>
                  <select
                    id="sr-vendorType"
                    value={form.vendorType}
                    onChange={(e) => handleInputChange('vendorType', e.target.value)}
                    className={`${inputClass} pl-10 ${errors.vendorType ? errorBorder : normalBorder} cursor-pointer`}
                  >
                    {VENDOR_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
                {errors.vendorType && <p className="text-[11px] text-[#DC2626] mt-1">{errors.vendorType}</p>}
              </div>

              <div>
                <label htmlFor="sr-mobile" className="text-xs font-bold font-heading text-[#0B2545] block mb-1.5">
                  Company Contact Number <span className="text-[#DC2626]">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold font-heading text-[#5B6B82]">
                    +91
                  </span>
                  <input
                    id="sr-mobile"
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    autoComplete="tel-national"
                    placeholder="10-digit mobile number"
                    value={form.mobile}
                    onChange={(e) => handleInputChange('mobile', e.target.value.replace(/\D/g, ''))}
                    className={`${inputClass} pl-11 ${errors.mobile ? errorBorder : normalBorder}`}
                  />
                </div>
                {errors.mobile && <p className="text-[11px] text-[#DC2626] mt-1">{errors.mobile}</p>}
              </div>
            </div>

            {/* Row 4: VAT/GST Number & Brand Name + Country [Add] (Exact Screenshot 1 match) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label htmlFor="sr-gstNumber" className="text-xs font-bold font-heading text-[#0B2545] block mb-1.5">
                  VAT / GST Number <span className="text-[#DC2626]">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5B6B82] pointer-events-none">
                    <FileCheck2 className="w-4 h-4" />
                  </span>
                  <input
                    id="sr-gstNumber"
                    type="text"
                    maxLength={15}
                    placeholder="Enter 15-digit GSTIN (e.g. 22AAAAA0000A1Z5)"
                    value={form.gstNumber}
                    onChange={(e) => handleInputChange('gstNumber', e.target.value.toUpperCase())}
                    className={`${inputClass} pl-10 uppercase ${errors.gstNumber ? errorBorder : normalBorder}`}
                  />
                </div>
                {errors.gstNumber && <p className="text-[11px] text-[#DC2626] mt-1">{errors.gstNumber}</p>}
              </div>

              <div>
                <label className="text-xs font-bold font-heading text-[#0B2545] block mb-1.5">
                  Brand Name &amp; Country of Origin <span className="text-[#5B6B82] font-normal">(Optional)</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Brand Name (e.g. Woodpecker)"
                    value={newBrandName}
                    maxLength={80}
                    onChange={(e) => setNewBrandName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addBrand();
                      }
                    }}
                    className={`flex-1 ${inputClass} ${normalBorder}`}
                  />
                  <select
                    value={newBrandCountry}
                    onChange={(e) => setNewBrandCountry(e.target.value)}
                    className={`w-28 sm:w-32 ${inputClass} ${normalBorder} px-2 cursor-pointer`}
                  >
                    {COUNTRIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={addBrand}
                    className="px-4 py-2.5 rounded-xl bg-[#0B2545] hover:bg-[#13335E] text-white text-xs font-bold font-heading flex items-center justify-center gap-1 transition-colors cursor-pointer shrink-0 shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#93C5FD]" /> Add
                  </button>
                </div>

                {/* Added brands chip list */}
                {brands.length > 0 && (
                  <div className="pt-2 flex flex-wrap gap-1.5">
                    {brands.map((b, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-[#DCE6F2] text-xs font-semibold text-[#12263F] font-heading shadow-2xs"
                      >
                        <span>{b.name}</span>
                        <span className="text-[10px] text-[#5B6B82] font-normal">({b.country})</span>
                        <button
                          type="button"
                          onClick={() => removeBrand(i)}
                          aria-label={`Remove brand ${b.name}`}
                          className="text-[#DC2626] hover:text-[#991B1B] cursor-pointer ml-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ── Submit Row matching Screenshot 1 (Left aligned [ Continue ] button) ── */}
            <div className="pt-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <button
                type="submit"
                disabled={submitting}
                className="px-8 py-3 rounded-xl bg-[#0B2545] hover:bg-[#13335E] active:scale-95 disabled:opacity-60 text-white font-bold font-heading text-sm shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {submitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    Continue <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>

            {/* ── Disclaimer text at the bottom matching Screenshot 1 ── */}
            <div className="pt-3 border-t border-[#D5E3F0]">
              <p className="text-[11px] text-[#5B6B82] font-body leading-relaxed">
                <strong className="text-[#0B2545]">Disclaimer:</strong> The information that you would submit will not
                be used or distributed for any reason other than to fulfill your request.
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default SellerRegistrationForm;
