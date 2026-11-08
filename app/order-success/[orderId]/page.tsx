'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import confetti from 'canvas-confetti';
import { 
  CheckCircle2, 
  Package, 
  Truck, 
  FileText, 
  ArrowRight, 
  Download, 
  Clock, 
  MapPin, 
  Phone
} from 'lucide-react';
import { useUserStore } from '@/lib/store';

export default function OrderSuccessPage() {
  const params = useParams();
  const orderId = (params?.orderId as string) || 'BDM-2026-89102';
  const { user } = useUserStore();

  useEffect(() => {
    // Fire celebratory confetti on mount
    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 }
      });
    } catch {
      // ignore
    }
  }, []);

  const handleDownloadInvoice = () => {
    const textContent = `BUY DENMED HEALTHCARE PVT LTD
TAX INVOICE / B2B BILL OF SUPPLY
-----------------------------------------------
Invoice No: INV-${orderId}
Date: ${new Date().toLocaleDateString('en-IN')}
Place of Supply: Delhi NCR / Uttar Pradesh
Doctor / Clinic: ${user?.name || 'Dr. Vikram Malhotra'}
GSTIN: ${user?.gstDetails?.gstin || '09AAACM1234F1Z8'}
-----------------------------------------------
Status: Payment Verified (Razorpay / Pre-authorized)
Thank you for equipping your healthcare facility through Buy Denmed.
Support Helpline: +91 98112 34567 | support@buydenmed.com
-----------------------------------------------`;

    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Invoice-${orderId}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-8 py-12 space-y-8">
      {/* Success Card */}
      <div className="bg-white rounded-3xl border border-gray-200 p-8 sm:p-10 shadow-lg text-center space-y-4 relative overflow-hidden">
        <div className="w-16 h-16 rounded-full bg-green-100 text-[#16A34A] flex items-center justify-center mx-auto shadow-inner">
          <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
        </div>

        <span className="text-xs font-bold text-green-700 bg-green-50 px-3 py-1 rounded-full uppercase tracking-wider inline-block">
          Order Confirmed & Placed
        </span>

        <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
          Thank You, Doctor! Your Order is Booked.
        </h1>

        <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
          Your equipment order <strong className="text-slate-900 font-mono">#{orderId}</strong> has been received by our biomedical fulfillment center. We have dispatched a confirmation SMS & WhatsApp invoice.
        </p>

        {/* Action Buttons */}
        <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={handleDownloadInvoice}
            className="px-5 py-3 bg-[#1E293B] hover:bg-[#273449] text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>Download Tax Invoice (GST)</span>
          </button>

          <Link
            href="/account"
            className="px-5 py-3 bg-[#0F766E] hover:bg-[#0B5F58] text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-colors shadow-sm"
          >
            <Package className="w-4 h-4" />
            <span>Track in My Orders</span>
          </Link>
        </div>
      </div>

      {/* Shipment & Live Status Timeline */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div>
            <h3 className="font-bold text-base text-gray-900">Shipment Timeline & Fulfillment</h3>
            <p className="text-xs text-gray-500">Live courier tracking via BlueDart Air Cargo</p>
          </div>
          <span className="text-xs font-bold text-[#0F766E] bg-teal-50 px-3 py-1 rounded-lg">
            Expected in 2-3 Days
          </span>
        </div>

        <div className="space-y-6 relative pl-6 border-l-2 border-[#0F766E]/30 ml-2">
          {[
            {
              title: 'Order Verified & Serial Numbers Logged',
              time: 'Just Now',
              desc: 'Biomedical inspection completed. Manufacturer warranty registered in your clinic name.',
              done: true
            },
            {
              title: 'Crater Packaging & Shock-Proof Crating',
              time: 'Today, by 4:00 PM',
              desc: 'Multi-layer bubble wrap, foam corner braces, and tamper-evident holographic seal applied.',
              done: false
            },
            {
              title: 'Handover to BlueDart / Delhivery Air Cargo',
              time: 'Tomorrow, 9:00 AM',
              desc: 'Priority air consignment dispatched to your city regional distribution hub.',
              done: false
            },
            {
              title: 'Doorstep Clinic Delivery & Demo',
              time: 'Expected within 48-72 Hours',
              desc: 'Direct handover to clinic reception with physical tax invoice and test report.',
              done: false
            }
          ].map((step, idx) => (
            <div key={idx} className="relative group">
              <span
                className={`absolute -left-[31px] top-1 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center ${
                  step.done ? 'bg-[#0F766E]' : 'bg-gray-300'
                }`}
              />
              <div className="flex items-baseline justify-between">
                <h4 className="font-bold text-xs sm:text-sm text-gray-900">{step.title}</h4>
                <span className="text-[11px] text-gray-400 font-medium">{step.time}</span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>

        {/* Support Help box */}
        <div className="p-4 bg-gray-50 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-600">
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-[#0F766E]" />
            <span>Need prompt assistance with delivery or calibration?</span>
          </div>
          <a
            href="tel:+919811234567"
            className="font-bold text-[#1E293B] hover:text-[#0F766E] transition-colors"
          >
            Call Fulfillment Desk: +91 98112 34567
          </a>
        </div>
      </div>
    </div>
  );
}
