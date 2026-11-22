'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { submitBulkEnquiry } from '@/lib/api';
import { ApiClientError } from '@/lib/api/backend';
import { useToastStore } from '@/lib/store';
import type { Enquiry } from '@/types';
import {
  CheckCircle2,
  Check,
  Phone,
  Mail,
  ArrowRight,
  ChevronRight,
  BadgePercent,
  FileText,
  Wrench,
  CalendarClock,
  Loader2
} from 'lucide-react';
import { useSiteSettings } from '@/lib/settings/store';
import { mailto } from '@/lib/settings/format';

const EQUIPMENT_OPTIONS = [
  'Dental Chairs & Units',
  'Oil-Free Air Compressors',
  'Turbines & Micromotors',
  'Class B Autoclaves & Sterilizers',
  'RVG Sensors & Handheld X-Ray',
  'Oxygen Concentrators',
  'CPAP / BiPAP Devices',
  'Patient Monitors',
  'Dental Consumables',
  'Hospital Beds & Wheelchairs'
];

const BUDGETS = [
  'Under ₹1,00,000',
  '₹1,00,000 – ₹5,00,000',
  '₹5,00,000 – ₹15,00,000',
  '₹15,00,000 – ₹50,00,000',
  'Above ₹50,00,000 (turnkey project)'
];

const TIMELINES = ['Immediately', 'Within 2–4 weeks', '1–3 months', 'Just exploring'];

const BENEFITS = [
  { icon: BadgePercent, title: 'Distributor pricing', text: 'Volume rates on equipment and consumables.' },
  { icon: FileText, title: 'GST invoice & proforma', text: 'Full input tax credit for clinics and hospitals.' },
  { icon: Wrench, title: 'Installation & AMC', text: 'Free site inspection, setup and service contracts.' },
  { icon: CalendarClock, title: 'Flexible payments', text: 'Milestone payments and EMI for large orders.' }
];

const STEPS = [
  { title: 'Share your requirement', text: 'Fill the form or call us with your list.' },
  { title: 'Get a quotation', text: 'A specialist sends a proforma within 2 working hours.' },
  { title: 'Delivery & installation', text: 'We deliver, install and train your staff.' }
];

const EMPTY_FORM: Enquiry = {
  name: '',
  organizationName: '',
  email: '',
  phone: '',
  city: '',
  state: '',
  pincode: '',
  equipmentRequired: [],
  estimatedBudget: BUDGETS[1],
  timeline: TIMELINES[1],
  message: ''
};

const inputClass =
  'w-full text-sm px-3.5 py-3 bg-white border border-[#D5DEEA] rounded-lg text-[#12263F] placeholder-[#97A3B4] focus:outline-none focus:border-[#1D5FAF] focus:ring-3 focus:ring-[#1D5FAF]/15 transition';

const Field: React.FC<{ label: string; htmlFor: string; required?: boolean; hint?: string; children: React.ReactNode }> = ({
  label,
  htmlFor,
  required,
  hint,
  children
}) => (
  <div>
    <label htmlFor={htmlFor} className="flex items-baseline justify-between text-[13px] font-semibold text-[#12263F] mb-1.5">
      <span>
        {label}
        {required && <span className="text-[#DC2626] ml-0.5">*</span>}
      </span>
      {hint && <span className="text-[12px] font-normal text-[#8A97A8]">{hint}</span>}
    </label>
    {children}
  </div>
);

const SectionTitle: React.FC<{ step: number; title: string; subtitle?: string }> = ({ step, title, subtitle }) => (
  <div className="flex items-start gap-3 mb-5">
    <span className="w-7 h-7 shrink-0 rounded-full bg-[#0B2545] text-white text-[13px] font-semibold flex items-center justify-center">
      {step}
    </span>
    <div>
      <h2 className="text-[17px] font-semibold text-[#12263F] leading-tight">{title}</h2>
      {subtitle && <p className="text-[13px] text-[#5B6B82] mt-0.5">{subtitle}</p>}
    </div>
  </div>
);

export default function BulkEnquiryPage() {
  const { store } = useSiteSettings();
  const { addToast } = useToastStore();
  const [formData, setFormData] = useState<Enquiry>(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [submittedId, setSubmittedId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [honeypot, setHoneypot] = useState('');

  const set = <K extends keyof Enquiry>(key: K, value: Enquiry[K]) =>
    setFormData((prev) => ({ ...prev, [key]: value }));

  const toggleEquipment = (item: string) =>
    setFormData((prev) => ({
      ...prev,
      equipmentRequired: prev.equipmentRequired.includes(item)
        ? prev.equipmentRequired.filter((e) => e !== item)
        : [...prev.equipmentRequired, item]
    }));

  /** Same rules as the API (backend/src/modules/enquiries/validator.js → bulkEnquirySchema). */
  const validate = (f: Enquiry): Record<string, string> => {
    const found: Record<string, string> = {};
    if (f.name.trim().length < 2) found.name = 'Contact name is required';
    if (f.organizationName.trim().length < 2) found.organizationName = 'Clinic / hospital name is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) found.email = 'Enter a valid email address';
    if (!/^[6-9]\d{9}$/.test(f.phone)) found.mobile = 'Enter a valid 10-digit mobile number';
    if (f.city.trim().length < 2) found.city = 'City is required';
    if (f.pincode && !/^[1-9][0-9]{5}$/.test(f.pincode)) found.pincode = 'Enter a valid 6-digit PIN code';
    return found;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const found = validate(formData);
    setErrors(found);
    if (Object.keys(found).length) {
      addToast({ type: 'error', title: 'Please check the form', message: Object.values(found)[0] });
      return;
    }
    setLoading(true);
    try {
      // Saved by the live API (POST /enquiries/bulk) → Admin → Enquiries → Bulk / B2B
      const res = await submitBulkEnquiry({ ...formData, honeypot });
      setSubmittedId(res.enquiryId);
      addToast({ type: 'success', title: 'Enquiry submitted', message: res.message });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      if (err instanceof ApiClientError && err.fields) setErrors(err.fields);
      addToast({
        type: 'error',
        title: 'Could not submit your enquiry',
        message: err instanceof Error ? err.message : 'Please try again or call our procurement desk.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-[1320px] mx-auto px-4 sm:px-6 py-6 sm:py-8">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[13px] text-[#5B6B82] mb-5">
        <Link href="/" className="hover:text-[#1D5FAF]">
          Home
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-[#12263F] font-medium">Bulk &amp; Institutional Orders</span>
      </nav>

      {/* Page header */}
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-7 mb-8 border-b border-[#DCE6F2]">
        <div className="max-w-2xl">
          <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-[#1D5FAF]">For clinics & hospitals</p>
          <h1 className="mt-2 text-[28px] sm:text-[36px] font-bold text-[#12263F] leading-tight tracking-tight">
            Request a bulk quotation
          </h1>
          <p className="mt-3 text-[15px] text-[#5B6B82] leading-relaxed">
            Setting up a new clinic, upgrading an ICU or restocking consumables? Tell us what you need and get
            distributor pricing with a GST proforma invoice.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 shrink-0">
          <a
            href={store.supportPhoneHref}
            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white border border-[#DCE6F2] hover:border-[#1D5FAF] transition-colors"
          >
            <Phone className="w-5 h-5 text-[#1D5FAF]" />
            <span className="leading-tight">
              <span className="block text-[12px] text-[#5B6B82]">Call procurement desk</span>
              <span className="block text-[15px] font-semibold text-[#12263F]">{store.supportPhone}</span>
            </span>
          </a>
          <a
            href={mailto(store.salesEmail)}
            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white border border-[#DCE6F2] hover:border-[#1D5FAF] transition-colors"
          >
            <Mail className="w-5 h-5 text-[#1D5FAF]" />
            <span className="leading-tight">
              <span className="block text-[12px] text-[#5B6B82]">Email your list</span>
              <span className="block text-[15px] font-semibold text-[#12263F]">{store.salesEmail}</span>
            </span>
          </a>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-8 items-start">
        {/* ── Form / success ───────────────────────────────── */}
        {submittedId ? (
          <div className="bg-white rounded-2xl border border-[#DCE6F2] px-6 py-12 sm:px-12 text-center">
            <div className="w-14 h-14 rounded-full bg-[#DCFCE7] text-[#16A34A] flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="mt-5 text-2xl font-bold text-[#12263F]">Thanks, we&apos;ve got your request</h2>
            <p className="mt-2 text-[13px] text-[#5B6B82]">
              Reference number <span className="font-mono font-semibold text-[#12263F]">{submittedId}</span>
            </p>
            <p className="mt-4 text-[15px] text-[#5B6B82] max-w-md mx-auto leading-relaxed">
              A procurement specialist will email a quotation to{' '}
              <strong className="text-[#12263F]">{formData.email}</strong> and call you on{' '}
              <strong className="text-[#12263F]">+91 {formData.phone}</strong> within 2 working hours.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/"
                className="px-6 py-3 rounded-lg bg-[#1D5FAF] hover:bg-[#174E90] text-white text-sm font-semibold transition-colors"
              >
                Continue shopping
              </Link>
              <button
                type="button"
                onClick={() => {
                  setSubmittedId(null);
                  setFormData(EMPTY_FORM);
                  setErrors({});
                }}
                className="px-6 py-3 rounded-lg border border-[#D5DEEA] hover:border-[#1D5FAF] text-[#12263F] text-sm font-semibold transition-colors cursor-pointer"
              >
                Submit another request
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-[#DCE6F2] divide-y divide-[#E8EEF5]">
            {/* 1. Contact */}
            <section className="p-6 sm:p-8">
              <SectionTitle step={1} title="Your details" subtitle="Who should we send the quotation to?" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Field label="Contact name" htmlFor="be-name" required>
                  <input
                    id="be-name"
                    type="text"
                    required
                    autoComplete="name"
                    value={formData.name}
                    onChange={(e) => set('name', e.target.value)}
                    placeholder="Dr. Anjali Sharma"
                    className={inputClass}
                  />
                </Field>
                <Field label="Clinic / hospital name" htmlFor="be-org" required>
                  <input
                    id="be-org"
                    type="text"
                    required
                    autoComplete="organization"
                    value={formData.organizationName}
                    onChange={(e) => set('organizationName', e.target.value)}
                    placeholder="As on GST registration"
                    className={inputClass}
                  />
                </Field>
                <Field label="Email" htmlFor="be-email" required>
                  <input
                    id="be-email"
                    type="email"
                    required
                    autoComplete="email"
                    value={formData.email}
                    onChange={(e) => set('email', e.target.value)}
                    placeholder="you@clinic.com"
                    className={inputClass}
                  />
                </Field>
                <Field label="Mobile number" htmlFor="be-phone" required>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-[#D5DEEA] bg-[#F6F9FD] text-sm text-[#5B6B82]">
                      +91
                    </span>
                    <input
                      id="be-phone"
                      type="tel"
                      required
                      inputMode="numeric"
                      autoComplete="tel-national"
                      pattern="[6-9][0-9]{9}"
                      title="Enter a valid 10-digit Indian mobile number"
                      maxLength={10}
                      value={formData.phone}
                      onChange={(e) => set('phone', e.target.value.replace(/\D/g, ''))}
                      placeholder="10-digit number"
                      className={`${inputClass} rounded-l-none`}
                    />
                  </div>
                </Field>
              </div>
            </section>

            {/* 2. Location & scope */}
            <section className="p-6 sm:p-8">
              <SectionTitle step={2} title="Delivery location & budget" />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <Field label="City" htmlFor="be-city" required>
                  <input
                    id="be-city"
                    type="text"
                    required
                    autoComplete="address-level2"
                    value={formData.city}
                    onChange={(e) => set('city', e.target.value)}
                    placeholder="e.g. Noida"
                    className={inputClass}
                  />
                </Field>
                <Field label="State" htmlFor="be-state" required>
                  <input
                    id="be-state"
                    type="text"
                    required
                    autoComplete="address-level1"
                    value={formData.state}
                    onChange={(e) => set('state', e.target.value)}
                    placeholder="e.g. Uttar Pradesh"
                    className={inputClass}
                  />
                </Field>
                <Field label="PIN code" htmlFor="be-pin">
                  <input
                    id="be-pin"
                    type="text"
                    inputMode="numeric"
                    autoComplete="postal-code"
                    pattern="[1-9][0-9]{5}"
                    title="Enter a valid 6-digit PIN code"
                    maxLength={6}
                    value={formData.pincode}
                    onChange={(e) => set('pincode', e.target.value.replace(/\D/g, ''))}
                    placeholder="6 digits"
                    className={inputClass}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-5">
                <Field label="Estimated budget" htmlFor="be-budget">
                  <select
                    id="be-budget"
                    value={formData.estimatedBudget}
                    onChange={(e) => set('estimatedBudget', e.target.value)}
                    className={`${inputClass} cursor-pointer`}
                  >
                    {BUDGETS.map((b) => (
                      <option key={b}>{b}</option>
                    ))}
                  </select>
                </Field>

                <fieldset>
                  <legend className="text-[13px] font-semibold text-[#12263F] mb-1.5">When do you need it?</legend>
                  <div className="grid grid-cols-2 gap-2">
                    {TIMELINES.map((t) => {
                      const active = formData.timeline === t;
                      return (
                        <label
                          key={t}
                          className={`text-center text-[13px] px-2 py-2.5 rounded-lg border cursor-pointer transition-colors ${
                            active
                              ? 'border-[#1D5FAF] bg-[#EAF2FC] text-[#174E90] font-semibold'
                              : 'border-[#D5DEEA] text-[#12263F] hover:border-[#9DB4D3]'
                          }`}
                        >
                          <input
                            type="radio"
                            name="timeline"
                            value={t}
                            checked={active}
                            onChange={() => set('timeline', t)}
                            className="sr-only"
                          />
                          {t}
                        </label>
                      );
                    })}
                  </div>
                </fieldset>
              </div>
            </section>

            {/* 3. Requirement */}
            <section className="p-6 sm:p-8">
              <SectionTitle
                step={3}
                title="What do you need?"
                subtitle="Pick the categories, then add models and quantities below."
              />
              <div className="flex flex-wrap gap-2">
                {EQUIPMENT_OPTIONS.map((item) => {
                  const active = formData.equipmentRequired.includes(item);
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => toggleEquipment(item)}
                      aria-pressed={active}
                      className={`inline-flex items-center gap-1.5 text-[13px] px-3.5 py-2 rounded-full border transition-colors cursor-pointer ${
                        active
                          ? 'border-[#1D5FAF] bg-[#1D5FAF] text-white'
                          : 'border-[#D5DEEA] bg-white text-[#12263F] hover:border-[#9DB4D3]'
                      }`}
                    >
                      {active && <Check className="w-3.5 h-3.5" />}
                      {item}
                    </button>
                  );
                })}
              </div>

              <div className="mt-6">
                <Field label="Models, brands & quantities" htmlFor="be-message" hint="Optional">
                  <textarea
                    id="be-message"
                    rows={5}
                    value={formData.message}
                    onChange={(e) => set('message', e.target.value)}
                    placeholder={'e.g.\n2 × dental chair units\n1 × Class B autoclave (22–24 L)\n5 boxes composite (A2, A3)'}
                    className={`${inputClass} resize-y leading-relaxed`}
                  />
                </Field>
              </div>
            </section>

            {/* Spam trap: hidden from people, bots fill it */}
            <input
              type="text"
              name="company_website"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
              className="hidden"
            />

            {Object.keys(errors).length > 0 && (
              <div role="alert" className="px-6 sm:px-8 py-4 bg-red-50 text-[13px] text-[#B91C1C]">
                <p className="font-semibold">Please fix the following:</p>
                <ul className="mt-1 list-disc pl-5 space-y-0.5">
                  {Object.entries(errors).map(([field, msg]) => (
                    <li key={field}>{msg}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Submit */}
            <div className="p-6 sm:p-8 bg-[#FAFBFD] rounded-b-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <p className="text-[13px] text-[#5B6B82] max-w-sm">
                By submitting, you agree to be contacted by our team on phone, email or WhatsApp about this request.
              </p>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-lg bg-[#1D5FAF] hover:bg-[#174E90] disabled:opacity-60 text-white text-[15px] font-semibold transition-colors cursor-pointer shrink-0"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting…
                  </>
                ) : (
                  <>
                    Get my quotation
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* ── Sidebar ─────────────────────────────────────── */}
        <aside className="space-y-6 lg:sticky lg:top-6">
          <div className="bg-white rounded-2xl border border-[#DCE6F2] p-6">
            <h2 className="text-[15px] font-semibold text-[#12263F]">Why order in bulk with us</h2>
            <ul className="mt-5 space-y-5">
              {BENEFITS.map(({ icon: Icon, title, text }) => (
                <li key={title} className="flex gap-3.5">
                  <span className="w-9 h-9 shrink-0 rounded-lg bg-[#EAF2FC] text-[#1D5FAF] flex items-center justify-center">
                    <Icon className="w-[18px] h-[18px]" />
                  </span>
                  <span>
                    <span className="block text-[14px] font-semibold text-[#12263F]">{title}</span>
                    <span className="block text-[13px] text-[#5B6B82] mt-0.5 leading-snug">{text}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white rounded-2xl border border-[#DCE6F2] p-6">
            <h2 className="text-[15px] font-semibold text-[#12263F]">How it works</h2>
            <ol className="mt-5 relative">
              {STEPS.map((step, i) => (
                <li key={step.title} className="relative flex gap-3.5 pb-6 last:pb-0">
                  {i < STEPS.length - 1 && (
                    <span className="absolute left-[13px] top-8 bottom-1 w-px bg-[#DCE6F2]" aria-hidden="true" />
                  )}
                  <span className="relative w-7 h-7 shrink-0 rounded-full border border-[#D5DEEA] bg-white text-[13px] font-semibold text-[#12263F] flex items-center justify-center">
                    {i + 1}
                  </span>
                  <span>
                    <span className="block text-[14px] font-semibold text-[#12263F]">{step.title}</span>
                    <span className="block text-[13px] text-[#5B6B82] mt-0.5 leading-snug">{step.text}</span>
                  </span>
                </li>
              ))}
            </ol>
          </div>

          <p className="text-[13px] text-[#5B6B82] px-1">
            Need a single item?{' '}
            <Link href="/" className="text-[#1D5FAF] font-semibold hover:underline">
              Shop the catalogue
            </Link>{' '}
            — prices include GST.
          </p>
        </aside>
      </div>
    </div>
  );
}
