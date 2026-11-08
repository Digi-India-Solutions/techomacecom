'use client';

import React, { useState } from 'react';
import { useToastStore } from '@/lib/store';
import { Phone, Mail, MapPin, Clock, Send, MessageCircle } from 'lucide-react';

export default function ContactPage() {
  const { addToast } = useToastStore();
  const [formData, setFormData] = useState({
    name: 'Dr. Vikram Malhotra',
    email: 'dr.vikram@malhotraclinic.com',
    phone: '9811234567',
    subject: 'Equipment Installation Inquiry',
    message: 'Need assistance scheduling installation for our new dental operatory unit.'
  });
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
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-8 py-10 space-y-10">
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <span className="text-xs font-bold text-[#0F766E] uppercase tracking-wider">
          Healthcare Support Helpline
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          Contact Buy Denmed India
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
          Need assistance with order tracking, warranty claims, equipment rentals, or hospital tenders? Our dedicated biomedical engineers and customer desk are here to help.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Contact Info (1 col) */}
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-gray-900 border-b border-gray-100 pb-2">
              National Helpline
            </h3>
            <div className="space-y-3 text-xs">
              <div className="flex items-start gap-3">
                <Phone className="w-4 h-4 text-[#0F766E] shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-gray-900">+91 98112 34567</div>
                  <div className="text-gray-500">Toll Free: 1800-212-3366</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail className="w-4 h-4 text-[#0F766E] shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-gray-900">support@buydenmed.com</div>
                  <div className="text-gray-500">orders@buydenmed.com</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="w-4 h-4 text-[#0F766E] shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-gray-900">Monday - Saturday</div>
                  <div className="text-gray-500">9:00 AM - 7:30 PM IST</div>
                </div>
              </div>
            </div>
          </div>

          {/* Regional Fulfillment Hubs */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-3 text-xs">
            <h3 className="font-bold text-sm text-gray-900 border-b border-gray-100 pb-2">
              Regional Fulfillment Hubs
            </h3>
            <div>
              <div className="font-bold text-gray-900">North Hub (HQ):</div>
              <div className="text-gray-500">Okhla Industrial Area Phase-III, New Delhi - 110020</div>
            </div>
            <div>
              <div className="font-bold text-gray-900">West Hub:</div>
              <div className="text-gray-500">MIDC Industrial Area, Andheri East, Mumbai - 400093</div>
            </div>
            <div>
              <div className="font-bold text-gray-900">South Hub:</div>
              <div className="text-gray-500">Peenya Industrial Area, Bengaluru - 560058</div>
            </div>
          </div>
        </div>

        {/* Contact Form (2 cols) */}
        <div className="lg:col-span-2 bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-xs space-y-6">
          <div className="border-b border-gray-100 pb-4">
            <h2 className="font-black text-lg text-gray-900">Send an Inquiry or Service Request</h2>
            <p className="text-xs text-gray-500">Our biomedical team will review your query immediately</p>
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
                  <label className="font-bold text-gray-700 block mb-1">Your Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:border-[#0F766E]"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Mobile Number *</label>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:border-[#0F766E]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:border-[#0F766E]"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Subject</label>
                  <input
                    type="text"
                    required
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:border-[#0F766E]"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Message</label>
                <textarea
                  rows={4}
                  required
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full p-3.5 border border-gray-300 rounded-xl focus:outline-none focus:border-[#0F766E]"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-[#0F766E] hover:bg-[#0B5F58] text-white font-black rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
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
}
