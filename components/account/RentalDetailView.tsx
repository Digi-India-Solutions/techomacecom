'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Rental, RentalStatus, RentalPayment } from '@/types';
import { useRentalStore, useToastStore } from '@/lib/store';
import { getProductImageUrl } from '@/lib/utils';
import { 
  Bed, 
  ShieldCheck, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  Download, 
  RotateCcw, 
  MapPin, 
  FileText, 
  Truck, 
  CreditCard,
  Layers,
  PhoneCall,
  Check,
  X
} from 'lucide-react';

interface RentalDetailViewProps {
  initialRental: Rental;
}

export default function RentalDetailView({ initialRental }: RentalDetailViewProps) {
  const { rentals, extendRental, scheduleReturn } = useRentalStore();
  const { addToast } = useToastStore();

  // Pick fresh rental from store if updated
  const rental = rentals.find((r) => r.id === initialRental.id || r.bookingNumber === initialRental.bookingNumber) || initialRental;

  // Extension Modal
  const [isExtendOpen, setIsExtendOpen] = useState(false);
  const [extraDuration, setExtraDuration] = useState(1);
  const [isExtending, setIsExtending] = useState(false);

  // Return Pickup Modal
  const [isReturnOpen, setIsReturnOpen] = useState(false);
  const [pickupDate, setPickupDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().split('T')[0];
  });
  const [pickupSlot, setPickupSlot] = useState('10:00 AM - 01:00 PM');
  const [isScheduling, setIsScheduling] = useState(false);

  const renderBadge = (status: RentalStatus) => {
    switch (status) {
      case 'pending_approval':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
            <span>Pending Approval</span>
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
            <span>Approved & Scheduled</span>
          </span>
        );
      case 'dispatched':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
            <Truck className="w-3.5 h-3.5 text-purple-600" />
            <span>Out for Delivery</span>
          </span>
        );
      case 'active':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-green-50 text-green-700 border border-green-200">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span>Active Contract</span>
          </span>
        );
      case 'extension_requested':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-cyan-50 text-cyan-800 border border-cyan-200">
            <Clock className="w-3.5 h-3.5 text-cyan-600" />
            <span>Extension Requested</span>
          </span>
        );
      case 'return_scheduled':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <Truck className="w-3.5 h-3.5 text-indigo-600" />
            <span>Return Scheduled</span>
          </span>
        );
      case 'returned':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700 border border-gray-300">
            <RotateCcw className="w-3.5 h-3.5 text-gray-500" />
            <span>Device Returned</span>
          </span>
        );
      case 'deposit_refunded':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Deposit Refunded</span>
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200">
            <X className="w-3.5 h-3.5 text-red-500" />
            <span>Cancelled</span>
          </span>
        );
    }
  };

  const handleDownloadInvoice = () => {
    const content = `BUY DENMED HEALTHCARE PVT LTD
TAX INVOICE & RENTAL CONTRACT AGREEMENT
=============================================================
Contract / Booking Number: ${rental.bookingNumber}
Date: ${rental.createdAt.split('T')[0]}
Status: ${rental.status.toUpperCase()}

CLIENT INFORMATION:
Clinic / Doctor: ${rental.address.clinicHospitalName || rental.address.name}
Doctor in Charge: ${rental.address.name}
Phone: ${rental.address.phone}
Delivery Address: ${rental.address.addressLine1}, ${rental.address.city}, ${rental.address.state} - ${rental.address.pincode}

EQUIPMENT DETAILS:
Name: ${rental.product.name}
Brand: ${rental.product.brandName}
SKU / Serial No: ${rental.product.sku}
Plan: ${rental.plan.type.toUpperCase()} (${rental.duration} units)
Period: ${rental.startDate} to ${rental.endDate}

FINANCIALS:
Rent Charges: ₹${rental.rentAmount.toLocaleString('en-IN')}
Refundable Security Deposit: ₹${rental.deposit.toLocaleString('en-IN')} (100% Refundable)
Doorstep Delivery & Return Pickup: ₹${rental.charges.deliveryPickup.toLocaleString('en-IN')}
GST (12%): ₹${(rental.charges.gst || 0).toLocaleString('en-IN')}
-------------------------------------------------------------
TOTAL AMOUNT PAID: ₹${(rental.rentAmount + rental.deposit + rental.charges.deliveryPickup + (rental.charges.gst || 0)).toLocaleString('en-IN')}

TRANSACTIONS:
${rental.payments.map((p) => `- ${p.date}: ₹${p.amount.toLocaleString('en-IN')} via ${p.method} (Ref: ${p.transactionId || 'N/A'})`).join('\n')}

TERMS:
1. 100% Security Deposit will be refunded to client within 48 to 72 hours following equipment pickup and functional verification.
2. 100% Free biomedical maintenance, periodic calibration check, and emergency breakdown replacement are covered under this contract.
Support Helpline: +91 98112 34567 | care@buydenmed.com
=============================================================`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Rental-Agreement-${rental.bookingNumber}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    addToast({
      type: 'success',
      title: 'Invoice Downloaded',
      message: `Tax invoice for rental ${rental.bookingNumber} downloaded.`
    });
  };

  const handleConfirmExtension = () => {
    setIsExtending(true);
    try {
      const extraRent = rental.plan.price * extraDuration;
      const payment: RentalPayment = {
        id: `pay-ext-${Date.now()}`,
        amount: extraRent,
        date: new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
        method: 'Razorpay Instant UPI',
        type: 'extension',
        status: 'paid',
        transactionId: `pay_rzp_ext_${Math.floor(1000000 + Math.random() * 9000000)}`
      };

      extendRental(rental.id, extraDuration, extraRent, payment);

      addToast({
        type: 'success',
        title: 'Rental Extended',
        message: `Extended by ${extraDuration} ${rental.plan.type}(s). New end date recorded.`
      });
      setIsExtendOpen(false);
    } finally {
      setIsExtending(false);
    }
  };

  const handleConfirmReturn = () => {
    setIsScheduling(true);
    try {
      scheduleReturn(rental.id, pickupDate);
      addToast({
        type: 'success',
        title: 'Return Pickup Scheduled',
        message: `Pickup confirmed for ${pickupDate}.`
      });
      setIsReturnOpen(false);
    } finally {
      setIsScheduling(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/80 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              {renderBadge(rental.status)}
              <span className="text-xs font-mono font-bold text-gray-500">
                {rental.bookingNumber}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 mt-1">
              {rental.product.name}
            </h1>
            <p className="text-xs text-gray-500">
              Brand: {rental.product.brandName} • SKU: {rental.product.sku}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadInvoice}
              className="px-4 py-2 border border-gray-300 hover:border-gray-400 bg-gray-50 text-gray-700 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Contract</span>
            </button>
          </div>
        </div>

        {/* Equipment + Photo + Tenure Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          <div className="relative w-full aspect-square rounded-2xl bg-[#FBFBFB] border border-gray-100 p-4 overflow-hidden flex items-center justify-center">
            <Image
              src={getProductImageUrl(rental.product)}
              alt={rental.product.name}
              fill
              className="object-contain"
              referrerPolicy="no-referrer"
            />
          </div>

          <div className="md:col-span-2 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-1">
                <span className="text-gray-500 text-[11px] font-semibold uppercase tracking-wider">
                  Contract Tenure
                </span>
                <div className="font-bold text-gray-900 text-sm">
                  {rental.duration} {rental.plan.type}(s) Plan
                </div>
                <div className="text-gray-600">
                  {rental.startDate} to {rental.endDate}
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-1">
                <span className="text-gray-500 text-[11px] font-semibold uppercase tracking-wider">
                  Total Rent Paid
                </span>
                <div className="font-black text-gray-900 text-sm">
                  ₹{rental.rentAmount.toLocaleString('en-IN')}
                </div>
                <div className="text-gray-500 text-[11px]">
                  Rate: ₹{rental.plan.price.toLocaleString('en-IN')}/{rental.plan.type}
                </div>
              </div>
            </div>

            {/* Refundable Security Deposit Box */}
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="space-y-0.5 text-xs">
                <div className="font-bold text-emerald-900">
                  Refundable Security Deposit: ₹{rental.deposit.toLocaleString('en-IN')}
                </div>
                <p className="text-emerald-700 leading-relaxed">
                  {rental.status === 'deposit_refunded'
                    ? 'Deposit has been refunded back to your bank account.'
                    : '100% of this deposit will be refunded within 48 hours following equipment return pickup.'}
                </p>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsExtendOpen(true)}
                className="px-5 py-2.5 bg-[#0F766E] hover:bg-[#0B5F58] text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
              >
                <Calendar className="w-4 h-4" />
                <span>Request Extension</span>
              </button>

              <button
                type="button"
                onClick={() => setIsReturnOpen(true)}
                className="px-5 py-2.5 bg-[#1E293B] hover:bg-[#273449] text-white font-bold text-xs rounded-xl transition-all flex items-center gap-1.5"
              >
                <Truck className="w-4 h-4" />
                <span>Schedule Return Pickup</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Contract & Logistics Timeline */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/80 shadow-xs space-y-4">
        <h3 className="font-black text-sm text-gray-900 uppercase tracking-wider">
          Contract Lifecycle & Logistics Status
        </h3>

        <div className="space-y-4 text-xs pl-3 border-l-2 border-gray-200">
          {[
            {
              title: '1. Booking Placed & Deposit Received',
              desc: `Booking #${rental.bookingNumber} confirmed. Deposit of ₹${rental.deposit.toLocaleString('en-IN')} secured in escrow.`,
              done: true
            },
            {
              title: '2. KYC & Clinical Prescription Verification',
              desc: 'Identity and delivery location approved by biomedical officer.',
              done: rental.status !== 'pending_approval'
            },
            {
              title: '3. Biomedical Calibration & Hospital Grade Sanitization',
              desc: 'Tested for continuous operational pressure and vacuum-sealed.',
              done: rental.status === 'dispatched' || rental.status === 'active' || rental.status === 'return_scheduled' || rental.status === 'returned' || rental.status === 'deposit_refunded'
            },
            {
              title: '4. Doorstep Installation & Training',
              desc: 'Delivered by certified biomedical technician with full operating demo.',
              done: rental.status === 'active' || rental.status === 'return_scheduled' || rental.status === 'returned' || rental.status === 'deposit_refunded'
            },
            {
              title: '5. Return Logistics & Inspection',
              desc: rental.returnPickupDate ? `Scheduled for ${rental.returnPickupDate}.` : 'Scheduled upon your completion notice.',
              done: rental.status === 'returned' || rental.status === 'deposit_refunded'
            },
            {
              title: '6. 100% Security Deposit Refund',
              desc: 'Credited directly to original payment method.',
              done: rental.status === 'deposit_refunded'
            }
          ].map((step, idx) => (
            <div key={idx} className="relative pl-4 space-y-0.5">
              <div
                className={`absolute -left-[9px] top-1 w-3.5 h-3.5 rounded-full border-2 ${
                  step.done ? 'bg-green-600 border-green-600' : 'bg-white border-gray-300'
                }`}
              />
              <div className={`font-bold ${step.done ? 'text-gray-900' : 'text-gray-400'}`}>
                {step.title}
              </div>
              <p className="text-[11px] text-gray-500 leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Payment History */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/80 shadow-xs space-y-4">
        <h3 className="font-black text-sm text-gray-900 uppercase tracking-wider">
          Payment Transactions
        </h3>

        <div className="border border-gray-200 rounded-2xl overflow-hidden divide-y divide-gray-100 text-xs">
          {rental.payments.map((p) => (
            <div key={p.id} className="p-3.5 bg-white flex items-center justify-between">
              <div>
                <div className="font-bold text-gray-900 capitalize">{p.type} Payment</div>
                <div className="text-[11px] text-gray-500">{p.date} • {p.method}</div>
                {p.transactionId && (
                  <div className="text-[10px] font-mono text-gray-400">Ref: {p.transactionId}</div>
                )}
              </div>
              <div className="text-right">
                <div className="font-black text-gray-900 text-sm">₹{p.amount.toLocaleString('en-IN')}</div>
                <span className="text-[10px] text-green-600 font-bold">Paid</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* EXTENSION MODAL */}
      {isExtendOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 space-y-4 shadow-2xl relative border border-gray-200">
            <button
              onClick={() => setIsExtendOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-lg font-bold w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
            >
              ✕
            </button>

            <div className="space-y-1">
              <div className="text-xs font-bold text-[#0F766E] uppercase tracking-wider">
                Tenure Extension
              </div>
              <h3 className="text-lg font-black text-gray-900">
                Extend Equipment Usage
              </h3>
              <p className="text-xs text-gray-500">
                Continue using {rental.product.name} without paying an additional security deposit.
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <label className="block text-xs font-bold text-gray-800">
                Extra Duration ({rental.plan.type}s):
              </label>
              <div className="flex items-center border border-gray-300 rounded-xl overflow-hidden bg-gray-50">
                <button
                  type="button"
                  onClick={() => setExtraDuration((d) => Math.max(1, d - 1))}
                  className="px-4 py-2 hover:bg-gray-200 text-gray-700 font-bold"
                >
                  -
                </button>
                <div className="flex-1 text-center font-bold text-sm text-gray-900">
                  +{extraDuration} {rental.plan.type}(s)
                </div>
                <button
                  type="button"
                  onClick={() => setExtraDuration((d) => Math.min(12, d + 1))}
                  className="px-4 py-2 hover:bg-gray-200 text-gray-700 font-bold"
                >
                  +
                </button>
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-2 text-xs">
              <div className="flex justify-between">
                <span>Rate per {rental.plan.type}</span>
                <span className="font-bold text-gray-900">₹{rental.plan.price.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span>Deposit Status</span>
                <span className="text-emerald-700 font-bold">₹{rental.deposit.toLocaleString('en-IN')} Held in Escrow</span>
              </div>
              <div className="pt-2 border-t border-gray-200 flex justify-between items-baseline">
                <span className="font-bold text-gray-900">Extension Payable Now</span>
                <span className="font-black text-base text-slate-900 font-extrabold">
                  ₹{(rental.plan.price * extraDuration).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <button
              type="button"
              disabled={isExtending}
              onClick={handleConfirmExtension}
              className="w-full py-3.5 bg-[#0F766E] hover:bg-[#0B5F58] text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <CreditCard className="w-4 h-4" />
              <span>
                {isExtending
                  ? 'Authorizing Payment...'
                  : `Pay ₹${(rental.plan.price * extraDuration).toLocaleString('en-IN')} via Razorpay`}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* SCHEDULE RETURN MODAL */}
      {isReturnOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 space-y-4 shadow-2xl relative border border-gray-200">
            <button
              onClick={() => setIsReturnOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-lg font-bold w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
            >
              ✕
            </button>

            <div className="space-y-1">
              <div className="text-xs font-bold text-[#0F766E] uppercase tracking-wider">
                Logistics Pickup
              </div>
              <h3 className="text-lg font-black text-gray-900">
                Schedule Equipment Return
              </h3>
              <p className="text-xs text-gray-500">
                Our logistics partner will arrive to inspect and safely collect the device.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-bold text-gray-800 mb-1">
                  Pickup Date:
                </label>
                <input
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  value={pickupDate}
                  onChange={(e) => setPickupDate(e.target.value)}
                  className="w-full text-xs font-semibold px-3 py-2 border border-gray-300 rounded-xl bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-800 mb-1">
                  Time Slot:
                </label>
                <select
                  value={pickupSlot}
                  onChange={(e) => setPickupSlot(e.target.value)}
                  className="w-full text-xs font-semibold px-3 py-2 border border-gray-300 rounded-xl bg-white"
                >
                  <option>10:00 AM - 01:00 PM</option>
                  <option>02:00 PM - 05:00 PM</option>
                  <option>05:00 PM - 08:00 PM</option>
                </select>
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-800 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>₹{rental.deposit.toLocaleString('en-IN')} Refund</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  Upon collection, our courier generates a digital inspection clearance. 100% of your security deposit is refunded to your payment account within 48 hours.
                </p>
              </div>
            </div>

            <button
              type="button"
              disabled={isScheduling}
              onClick={handleConfirmReturn}
              className="w-full py-3 bg-[#1E293B] hover:bg-[#273449] text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Truck className="w-4 h-4" />
              <span>
                {isScheduling ? 'Scheduling...' : 'Confirm Return Pickup'}
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
