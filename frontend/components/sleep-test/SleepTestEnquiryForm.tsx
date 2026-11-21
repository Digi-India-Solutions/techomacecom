'use client';

import React, { useState } from 'react';
import { ArrowRight, CheckCircle2, MessageSquare, Phone } from 'lucide-react';
import { submitEnquiry } from '@/lib/api';
import { ApiClientError, errorMessage } from '@/lib/api/backend';
import { useToastStore } from '@/lib/store';

/**
 * Sleep-advisor callback form (same fields and look as the form in the /sleep-test hero).
 * Saved by the API in `enquiries` (type sleep_test); when `quiz` is given, the STOP-BANG
 * answers go with it and the API stores the recomputed risk level for the sleep team.
 */

type TestType = 'Not sure' | 'Level 2' | 'Level 3';

interface Props {
  defaultMessage?: string;
  defaultTestType?: TestType;
  quiz?: Parameters<typeof submitEnquiry>[0]['quiz'];
  heading?: string;
  subheading?: string;
}

const field =
  'w-full px-3.5 py-3.5 text-xs sm:text-sm font-body rounded-xl border bg-[#F6F9FD] focus:bg-white transition-colors focus:outline-none';
const ok = 'border-[#DCE6F2] focus:border-[#1D5FAF] focus:ring-1 focus:ring-[#1D5FAF]';
const bad = 'border-[#DC2626]';

export const SleepTestEnquiryForm: React.FC<Props> = ({
  defaultMessage = '',
  defaultTestType = 'Not sure',
  quiz,
  heading = 'Get a CALLBACK from our Sleep Advisor',
  subheading = 'Free diagnostic consultation. No upfront booking fee or credit card required.',
}) => {
  const { addToast } = useToastStore();
  const [form, setForm] = useState({
    fullName: '',
    mobile: '',
    city: '',
    preferredDate: '',
    testType: defaultTestType as TestType,
    message: defaultMessage,
    consent: true,
    honeypot: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<{ id: string; name: string; mobile: string } | null>(null);

  const set = (name: string, value: string | boolean) => {
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((e) => {
      if (!e[name]) return e;
      const next = { ...e };
      delete next[name];
      return next;
    });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const er: Record<string, string> = {};
    const mobile = form.mobile.replace(/\D/g, '');
    if (form.fullName.trim().length < 2) er.fullName = 'Full Name is required';
    if (!mobile) er.mobile = 'Mobile Number is required';
    else if (!/^[6-9]\d{9}$/.test(mobile)) er.mobile = 'Enter a valid 10-digit Indian mobile number';
    if (form.city.trim().length < 2) er.city = 'City / Town is required';
    if (!form.consent) er.consent = 'Please authorise contact to proceed';
    setErrors(er);
    if (Object.keys(er).length) return;

    setSubmitting(true);
    try {
      const res = await submitEnquiry({
        type: 'sleep_test',
        fullName: form.fullName.trim(),
        mobile,
        city: form.city.trim(),
        preferredDate: form.preferredDate,
        testType: form.testType,
        message: form.message.trim(),
        consent: form.consent,
        honeypot: form.honeypot,
        quiz,
      });
      setDone({ id: res.enquiryId, name: form.fullName.trim(), mobile });
      addToast({ type: 'success', title: 'Enquiry Received!', message: 'Our clinical sleep advisor will call you shortly.' });
    } catch (err) {
      // Map API field errors (e.g. name → fullName) onto the form
      if (err instanceof ApiClientError && err.fields) {
        const map: Record<string, string> = { name: 'fullName', mobile: 'mobile', city: 'city', consent: 'consent' };
        const fieldErrors: Record<string, string> = {};
        for (const [k, v] of Object.entries(err.fields)) if (map[k]) fieldErrors[map[k]] = v;
        setErrors(fieldErrors);
      }
      addToast({ type: 'error', title: 'Submission Failed', message: errorMessage(err, 'Could not send enquiry. Please call +91 98112 34567.') });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl text-[#12263F] border-2 border-[#1D5FAF]/30 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-2 bg-[#1D5FAF]" />
      <div className="mb-6">
        <h3 className="text-xl sm:text-2xl font-bold font-heading text-[#12263F] leading-tight">{heading}</h3>
        <p className="text-xs text-[#5B6B82] font-body mt-1">{subheading}</p>
      </div>

      {done ? (
        <div className="py-6 px-4 text-center space-y-4 bg-[#EAF2FC] rounded-2xl border border-[#DCE6F2]">
          <div className="w-14 h-14 bg-[#16A34A]/15 text-[#16A34A] rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#5B6B82] font-heading">
              Enquiry ID: <span className="font-mono text-[#12263F]">{done.id}</span>
            </span>
            <h4 className="text-lg font-bold font-heading text-[#12263F] mt-1">Thank You, {done.name}!</h4>
            <p className="text-xs text-[#5B6B82] font-body leading-relaxed mt-1">
              Our clinical sleep coordinator will call you at <strong className="text-[#12263F]">+91 {done.mobile}</strong>
              {quiz ? ' with your quiz result in hand' : ''} to confirm your preferred test date.
            </p>
          </div>
          <div className="pt-2 flex flex-col sm:flex-row gap-2">
            <a
              href="tel:+919811234567"
              className="flex-1 py-3.5 px-3 rounded-xl bg-[#0B2545] hover:bg-[#13335E] text-white text-xs font-bold font-heading flex items-center justify-center gap-1.5"
            >
              <Phone className="w-3.5 h-3.5 text-[#93C5FD]" /> Call Advisor
            </a>
            <a
              href="https://wa.me/919811234567?text=Hi%20Buy%20Denmed,%20I%20took%20the%20sleep%20apnea%20risk%20quiz"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-3.5 px-3 rounded-xl bg-[#25D366] hover:bg-[#20BD5A] text-white text-xs font-bold font-heading flex items-center justify-center gap-1.5"
            >
              <MessageSquare className="w-3.5 h-3.5" /> WhatsApp
            </a>
          </div>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4" noValidate>
          {/* Spam trap — hidden from people */}
          <div aria-hidden="true" style={{ display: 'none' }}>
            <input tabIndex={-1} autoComplete="off" value={form.honeypot} onChange={(e) => set('honeypot', e.target.value)} />
          </div>

          <div>
            <label htmlFor="sq-fullName" className="text-xs font-bold font-heading text-[#12263F] block mb-2">
              Full Name <span className="text-[#DC2626]">*</span>
            </label>
            <input
              id="sq-fullName"
              autoComplete="name"
              placeholder="Enter patient full name"
              value={form.fullName}
              maxLength={120}
              onChange={(e) => set('fullName', e.target.value)}
              className={`${field} ${errors.fullName ? bad : ok}`}
            />
            {errors.fullName && <p className="text-[11px] text-[#DC2626] mt-1">{errors.fullName}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="sq-mobile" className="text-xs font-bold font-heading text-[#12263F] block mb-2">
                Mobile Number <span className="text-[#DC2626]">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold font-heading text-[#5B6B82]">+91</span>
                <input
                  id="sq-mobile"
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  autoComplete="tel-national"
                  placeholder="10-digit number"
                  value={form.mobile}
                  onChange={(e) => set('mobile', e.target.value.replace(/\D/g, ''))}
                  className={`${field} pl-11 ${errors.mobile ? bad : ok}`}
                />
              </div>
              {errors.mobile && <p className="text-[11px] text-[#DC2626] mt-1">{errors.mobile}</p>}
            </div>
            <div>
              <label htmlFor="sq-city" className="text-xs font-bold font-heading text-[#12263F] block mb-2">
                City / Location <span className="text-[#DC2626]">*</span>
              </label>
              <input
                id="sq-city"
                autoComplete="address-level2"
                placeholder="e.g. Mumbai, Delhi NCR"
                value={form.city}
                maxLength={80}
                onChange={(e) => set('city', e.target.value)}
                className={`${field} ${errors.city ? bad : ok}`}
              />
              {errors.city && <p className="text-[11px] text-[#DC2626] mt-1">{errors.city}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="sq-date" className="text-xs font-bold font-heading text-[#12263F] block mb-2">
                Preferred Date <span className="text-[#5B6B82] font-normal">(Optional)</span>
              </label>
              <input
                id="sq-date"
                type="date"
                min={new Date().toISOString().slice(0, 10)}
                value={form.preferredDate}
                onChange={(e) => set('preferredDate', e.target.value)}
                className={`${field} ${ok} px-3`}
              />
            </div>
            <div>
              <label htmlFor="sq-testType" className="text-xs font-bold font-heading text-[#12263F] block mb-2">
                Test Type
              </label>
              <select
                id="sq-testType"
                value={form.testType}
                onChange={(e) => set('testType', e.target.value)}
                className={`${field} ${ok} px-3`}
              >
                <option value="Not sure">Not sure (Advisor will recommend)</option>
                <option value="Level 2">Level 2 (Comprehensive 16-channel)</option>
                <option value="Level 3">Level 3 (Cardiorespiratory 7-channel)</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="sq-message" className="text-xs font-bold font-heading text-[#12263F] flex items-center justify-between mb-1">
              <span>Message / Symptoms</span>
              <span className="text-[11px] text-[#5B6B82] font-normal">Optional</span>
            </label>
            <textarea
              id="sq-message"
              rows={3}
              maxLength={1000}
              value={form.message}
              onChange={(e) => set('message', e.target.value)}
              className={`${field} ${ok} resize-none`}
            />
          </div>

          <div>
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={form.consent}
                onChange={(e) => set('consent', e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-[#1D5FAF] focus:ring-[#1D5FAF] border-[#DCE6F2] cursor-pointer"
              />
              <span className="text-[12px] text-[#5B6B82] font-body leading-tight">
                I authorise Buy Denmed representative to contact/WhatsApp me{quiz ? ' and share my quiz answers with the sleep team' : ''}.{' '}
                <span className="text-[#DC2626]">*</span>
              </span>
            </label>
            {errors.consent && <p className="text-[11px] text-[#DC2626] mt-1">{errors.consent}</p>}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 rounded-xl bg-[#1D5FAF] hover:bg-[#174E90] disabled:opacity-60 text-white font-bold font-heading text-xs sm:text-sm shadow-lg shadow-[#0B2545]/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {submitting ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Submitting Request...
              </>
            ) : (
              <>
                Submit Callback Request <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
          <p className="text-center text-xs text-[#5B6B82]">
            or{' '}
            <a href="tel:+919811234567" className="font-bold text-[#12263F] hover:text-[#1D5FAF]">
              Call: +91 98112 34567
            </a>
          </p>
        </form>
      )}
    </div>
  );
};

export default SleepTestEnquiryForm;
