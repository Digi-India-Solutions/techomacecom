'use client';
import React from 'react';
import { Metadata } from 'next';
import { getCmsPage } from '@/lib/api/cms';
import ContactClient from './ContactClient';
import React, { useState } from 'react';
import { useToastStore } from '@/lib/store';
import { useSiteSettings } from '@/lib/settings/store';
import { formatTime, mailto } from '@/lib/settings/format';
import { Phone, Mail, MapPin, Clock, Send, MessageCircle } from 'lucide-react';

export default function ContactPage() {
  const { store } = useSiteSettings();
  const { addToast } = useToastStore();
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [ticketId, setTicketId] = useState('89201');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTicketId(String(Math.floor(10000 + Math.random() * 90000)));
    setSubmitted(true);
    addToast({
      type: 'success',
      title: 'Message Received',
      message: 'Our clinical customer care team will contact you within 2 hours.'
    });


export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata(): Promise<Metadata> {
  const page = await getCmsPage('contact');
  return {
    title: page?.seoTitle || 'Contact Buy Denmed India - Clinical Support & Helpline',
    description:
      page?.seoDescription ||
      'Need assistance with order tracking, warranty claims, equipment rentals, or hospital tenders? Contact Buy Denmed.',
  };
}

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-10 space-y-10">
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <span className="text-xs font-bold text-[#1D5FAF] uppercase tracking-wider">
          Healthcare Support Helpline
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-[#12263F] tracking-tight">
          Contact Buy Denmed India
        </h1>
        <p className="text-xs sm:text-sm text-[#5B6B82] leading-relaxed">
          Need assistance with order tracking, warranty claims, equipment rentals, or hospital tenders? Our dedicated biomedical engineers and customer desk are here to help.
        </p>
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
                  <a href={store.supportPhoneHref} className="block font-bold text-[#12263F] hover:text-[#1D5FAF]">{store.supportPhone}</a>
                  {store.tollFreePhone && (
                    <a href={store.tollFreePhoneHref} className="block text-[#5B6B82] hover:text-[#1D5FAF]">Toll Free: {store.tollFreePhone}</a>
                  )}
                  {store.salesPhone && (
                    <a href={store.salesPhoneHref} className="block text-[#5B6B82] hover:text-[#1D5FAF]">Office: {store.salesPhone}</a>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail className="w-4 h-4 text-[#1D5FAF] shrink-0 mt-0.5" />
                <div>
                  <a href={mailto(store.supportEmail)} className="block font-bold text-[#12263F] hover:text-[#1D5FAF]">{store.supportEmail}</a>
                  {store.salesEmail !== store.supportEmail && (
                    <a href={mailto(store.salesEmail)} className="block text-[#5B6B82] hover:text-[#1D5FAF]">{store.salesEmail}</a>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="w-4 h-4 text-[#1D5FAF] shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-[#12263F]">{store.supportHours.openOnSunday ? 'All days' : 'Monday - Saturday'}</div>
                  <div className="text-[#5B6B82]">
                    {formatTime(store.supportHours.open)} - {formatTime(store.supportHours.close)} IST
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Registered office — Settings → Store */}
          <div className="bg-white p-6 rounded-2xl border border-[#DCE6F2] shadow-xs space-y-3 text-xs">
            <h3 className="font-bold text-sm text-[#12263F] border-b border-[#DCE6F2] pb-2">Registered Office</h3>
            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-[#1D5FAF] shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-[#12263F]">{store.storeName}</div>
                <div className="text-[#5B6B82] whitespace-pre-line">{store.address}</div>
                {store.gstin && <div className="text-[#5B6B82] mt-1">GSTIN: {store.gstin}</div>}
                {store.mapUrl && (
                  <a href={store.mapUrl} target="_blank" rel="noopener noreferrer" className="inline-block mt-1.5 font-semibold text-[#1D5FAF] hover:underline">
                    Open in Google Maps
                  </a>
                )}
              </div>
            </div>
            {store.whatsappLink && (
              <a href={store.whatsappLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 font-semibold text-[#16A34A] hover:underline">
                <MessageCircle className="w-4 h-4" /> WhatsApp {store.whatsappNumber}
              </a>
            )}
          </div>
        </div>

        {/* Contact Form (2 cols) */}
        <div className="lg:col-span-2 bg-white p-6 sm:p-8 rounded-3xl border border-[#DCE6F2] shadow-xs space-y-6">
          <div className="border-b border-[#DCE6F2] pb-4">
            <h2 className="font-black text-lg text-[#12263F]">Send an Inquiry or Service Request</h2>
            <p className="text-xs text-[#5B6B82]">Our biomedical team will review your query immediately</p>
          </div>

          {submitted ? (
            <div className="p-8 bg-green-50 rounded-2xl border border-green-200 text-center space-y-2">
              <h3 className="font-bold text-base text-green-900">Message Dispatched!</h3>
              <p className="text-xs text-green-700">
                Ticket #TKT-{ticketId} created. An engineer will follow up shortly.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-[#12263F] block mb-1">Your Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-[#DCE6F2] rounded-xl focus:outline-none focus:border-[#1D5FAF] text-[#12263F]"
                  />
                </div>
                <div>
                  <label className="font-bold text-[#12263F] block mb-1">Mobile Number *</label>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-[#DCE6F2] rounded-xl focus:outline-none focus:border-[#1D5FAF] text-[#12263F]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-[#12263F] block mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-[#DCE6F2] rounded-xl focus:outline-none focus:border-[#1D5FAF] text-[#12263F]"
                  />
                </div>
                <div>
                  <label className="font-bold text-[#12263F] block mb-1">Subject</label>
                  <input
                    type="text"
                    required
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-[#DCE6F2] rounded-xl focus:outline-none focus:border-[#1D5FAF] text-[#12263F]"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-[#12263F] block mb-1">Message</label>
                <textarea
                  rows={4}
                  required
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full p-3.5 border border-[#DCE6F2] rounded-xl focus:outline-none focus:border-[#1D5FAF] text-[#12263F]"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-[#1D5FAF] hover:bg-[#174E90] text-white font-black rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
              >
                <span>Send Message to Customer Care</span>
                <Send className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
export default async function ContactPage() {
  const page = await getCmsPage('contact');
  return <ContactClient initialPage={page} />;
}
