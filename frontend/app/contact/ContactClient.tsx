'use client';

import React, { useState } from 'react';
import { useToastStore } from '@/lib/store';
import { Phone, Mail, Clock, Send, Loader2, CheckCircle2 } from 'lucide-react';
import type { CmsPageData } from '@/lib/api/cms';
import { submitContactEnquiry } from '@/lib/api';
import { ApiClientError } from '@/lib/api/backend';

const EMPTY_FORM = { name: '', email: '', phone: '', subject: '', message: '', honeypot: '' };
type ContactForm = typeof EMPTY_FORM;

/** Same rules as the API (backend/src/modules/enquiries/validator.js → contactEnquirySchema). */
function validate(f: ContactForm): Record<string, string> {
  const errors: Record<string, string> = {};
  if (f.name.trim().length < 2) errors.name = 'Name is required';
  if (!/^[6-9]\d{9}$/.test(f.phone.replace(/\D/g, '').slice(-10))) errors.mobile = 'Enter a valid 10-digit mobile number';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) errors.email = 'Enter a valid email address';
  if (f.subject.trim().length < 2) errors.subject = 'Subject is required';
  if (f.message.trim().length < 5) errors.message = 'Please write a short message';
  return errors;
}

/**
 * Contact Us — saved by the live API (POST /enquiries/contact) and shown in
 * Admin → Enquiries → Contact Form, where staff follow up.
 */
export default function ContactClient({ initialPage }: { initialPage: CmsPageData | null }) {
  const { addToast } = useToastStore();
  const [formData, setFormData] = useState<ContactForm>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ enquiryId: string; message: string } | null>(null);

  const update = (key: keyof ContactForm, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    const errorKey = key === 'phone' ? 'mobile' : key;
    if (errors[errorKey]) setErrors(({ [errorKey]: _removed, ...rest }) => rest);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const found = validate(formData);
    setErrors(found);
    if (Object.keys(found).length) return;

    setSubmitting(true);
    try {
      const res = await submitContactEnquiry(formData);
      setResult({ enquiryId: res.enquiryId, message: res.message });
      setFormData(EMPTY_FORM);
      addToast({ type: 'success', title: 'Message received', message: res.message });
    } catch (err) {
      if (err instanceof ApiClientError && err.fields) setErrors(err.fields);
      addToast({
        type: 'error',
        title: 'Could not send your message',
        message: err instanceof Error ? err.message : 'Please try again or call us.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = (field: string) =>
    `w-full px-3.5 py-2.5 border rounded-xl focus:outline-none focus:border-[#1D5FAF] text-[#12263F] ${
      errors[field] ? 'border-[#DC2626]' : 'border-[#DCE6F2]'
    }`;
  const fieldError = (field: string) =>
    errors[field] ? <p className="mt-1 text-[11px] text-[#DC2626]">{errors[field]}</p> : null;

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-10 space-y-10">
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <span className="text-xs font-bold text-[#1D5FAF] uppercase tracking-wider">
          Healthcare Support Helpline
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-[#12263F] tracking-tight">
          {initialPage?.title || 'Contact Buy Denmed India'}
        </h1>
        {initialPage?.contentHtml ? (
          <div
            className="text-xs sm:text-sm text-[#5B6B82] leading-relaxed prose prose-slate max-w-none"
            dangerouslySetInnerHTML={{ __html: initialPage.contentHtml }}
          />
        ) : (
          <p className="text-xs sm:text-sm text-[#5B6B82] leading-relaxed">
            Need assistance with order tracking, warranty claims, equipment rentals, or hospital tenders? Our dedicated biomedical engineers and customer desk are here to help.
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Contact Info (1 col) */}
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-2xl border border-[#DCE6F2] shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-[#12263F] border-b border-[#DCE6F2] pb-2">
              National Helpline
            </h3>
            <div className="space-y-3 text-xs">
              <div className="flex items-start gap-3">
                <Phone className="w-4 h-4 text-[#1D5FAF] shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-[#12263F]">+91 98112 34567</div>
                  <div className="text-[#5B6B82]">Toll Free: 1800-212-3366</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail className="w-4 h-4 text-[#1D5FAF] shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-[#12263F]">support@buydenmed.com</div>
                  <div className="text-[#5B6B82]">orders@buydenmed.com</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="w-4 h-4 text-[#1D5FAF] shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-[#12263F]">Monday - Saturday</div>
                  <div className="text-[#5B6B82]">9:00 AM - 7:30 PM IST</div>
                </div>
              </div>
            </div>
          </div>

          {/* Regional Fulfillment Hubs */}
          <div className="bg-white p-6 rounded-2xl border border-[#DCE6F2] shadow-xs space-y-3 text-xs">
            <h3 className="font-bold text-sm text-[#12263F] border-b border-[#DCE6F2] pb-2">
              Regional Fulfillment Hubs
            </h3>
            <div>
              <div className="font-bold text-[#12263F]">North Hub (HQ):</div>
              <div className="text-[#5B6B82]">Okhla Industrial Area Phase-III, New Delhi - 110020</div>
            </div>
            <div>
              <div className="font-bold text-[#12263F]">West Hub:</div>
              <div className="text-[#5B6B82]">MIDC Industrial Area, Andheri East, Mumbai - 400093</div>
            </div>
            <div>
              <div className="font-bold text-[#12263F]">South Hub:</div>
              <div className="text-[#5B6B82]">Peenya Industrial Area, Bengaluru - 560058</div>
            </div>
          </div>
        </div>

        {/* Contact Form (2 cols) */}
        <div className="lg:col-span-2 bg-white p-6 sm:p-8 rounded-3xl border border-[#DCE6F2] shadow-xs space-y-6">
          <div className="border-b border-[#DCE6F2] pb-4">
            <h2 className="font-black text-lg text-[#12263F]">Send an Inquiry or Service Request</h2>
            <p className="text-xs text-[#5B6B82]">Our biomedical team will review your query immediately</p>
          </div>

          {result ? (
            <div className="p-8 bg-green-50 rounded-2xl border border-green-200 text-center space-y-3">
              <CheckCircle2 className="w-10 h-10 text-green-600 mx-auto" />
              <h3 className="font-bold text-base text-green-900">Message received!</h3>
              <p className="text-xs text-green-700">
                Your reference number is <strong className="font-mono">{result.enquiryId}</strong>. {result.message}
              </p>
              <button
                type="button"
                onClick={() => setResult(null)}
                className="text-xs font-bold text-[#1D5FAF] hover:underline"
              >
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs" noValidate>
              {/* Spam trap: hidden from people, bots fill it */}
              <input
                type="text"
                name="company_website"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                value={formData.honeypot}
                onChange={(e) => update('honeypot', e.target.value)}
                className="hidden"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="contact-name" className="font-bold text-[#12263F] block mb-1">Your Name *</label>
                  <input
                    id="contact-name"
                    type="text"
                    autoComplete="name"
                    maxLength={120}
                    value={formData.name}
                    onChange={(e) => update('name', e.target.value)}
                    placeholder="e.g. Dr. Vikram Malhotra"
                    className={inputClass('name')}
                  />
                  {fieldError('name')}
                </div>
                <div>
                  <label htmlFor="contact-phone" className="font-bold text-[#12263F] block mb-1">Mobile Number *</label>
                  <input
                    id="contact-phone"
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel-national"
                    maxLength={10}
                    value={formData.phone}
                    onChange={(e) => update('phone', e.target.value.replace(/\D/g, ''))}
                    placeholder="10-digit mobile number"
                    className={inputClass('mobile')}
                  />
                  {fieldError('mobile')}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="contact-email" className="font-bold text-[#12263F] block mb-1">Email Address *</label>
                  <input
                    id="contact-email"
                    type="email"
                    autoComplete="email"
                    maxLength={200}
                    value={formData.email}
                    onChange={(e) => update('email', e.target.value)}
                    placeholder="you@clinic.com"
                    className={inputClass('email')}
                  />
                  {fieldError('email')}
                </div>
                <div>
                  <label htmlFor="contact-subject" className="font-bold text-[#12263F] block mb-1">Subject *</label>
                  <input
                    id="contact-subject"
                    type="text"
                    maxLength={150}
                    value={formData.subject}
                    onChange={(e) => update('subject', e.target.value)}
                    placeholder="e.g. Equipment installation enquiry"
                    className={inputClass('subject')}
                  />
                  {fieldError('subject')}
                </div>
              </div>

              <div>
                <label htmlFor="contact-message" className="font-bold text-[#12263F] block mb-1">Message *</label>
                <textarea
                  id="contact-message"
                  rows={4}
                  maxLength={2000}
                  value={formData.message}
                  onChange={(e) => update('message', e.target.value)}
                  placeholder="How can we help you?"
                  className={`${inputClass('message')} p-3.5`}
                />
                {fieldError('message')}
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 bg-[#1D5FAF] hover:bg-[#174E90] disabled:opacity-60 text-white font-black rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                <span>{submitting ? 'Sending…' : 'Send Message to Customer Care'}</span>
                {!submitting && <Send className="w-4 h-4" />}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
