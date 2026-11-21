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
  ArrowRight, 
  FileText, 
  ChevronRight, 
  AlertCircle, 
  Truck, 
  CreditCard,
  Layers,
  PhoneCall,
  Check,
  X,
  MapPin
} from 'lucide-react';
import { useSiteSettings } from '@/lib/settings/store';

interface RentalsTabContentProps {
  onBrowseRentals?: () => void;
}

export default function RentalsTabContent({ onBrowseRentals }: RentalsTabContentProps) {
  const { store, rental: rentalRules } = useSiteSettings();
  // Settings → Rental → deposit refund promise
  const refundWindow = `${rentalRules.depositRefundDays} day${rentalRules.depositRefundDays === 1 ? '' : 's'}`;
  const { rentals, extendRental, scheduleReturn } = useRentalStore();
  const { addToast } = useToastStore();

  // Selected rental for detail drawer / modal
  const [selectedRental, setSelectedRental] = useState<Rental | null>(null);

  // Extension Modal state
  const [isExtendModalOpen, setIsExtendModalOpen] = useState(false);
  const [rentalToExtend, setRentalToExtend] = useState<Rental | null>(null);
  const [extraDuration, setExtraDuration] = useState<number>(1);
  const [isProcessingExtension, setIsProcessingExtension] = useState(false);

  // Return Pickup Modal state
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [rentalToReturn, setRentalToReturn] = useState<Rental | null>(null);
  const [pickupDate, setPickupDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().split('T')[0];
  });
  const [pickupTimeSlot, setPickupTimeSlot] = useState('10:00 AM - 01:00 PM');
  const [isSchedulingReturn, setIsSchedulingReturn] = useState(false);

  // Helper: Status Badge Styling
  const renderStatusBadge = (status: RentalStatus) => {
    switch (status) {
      case 'pending_approval':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600 animate-pulse" />
            <span>Pending Approval</span>
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <CheckCircle2 className="w-3 h-3 text-blue-600" />
            <span>Approved & Scheduled</span>
          </span>
        );
      case 'dispatched':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
            <Truck className="w-3 h-3 text-purple-600" />
            <span>Out for Delivery</span>
          </span>
        );
      case 'active':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-bold bg-green-50 text-green-700 border border-green-200">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span>Active Contract</span>
          </span>
        );
      case 'extension_requested':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-bold bg-cyan-50 text-cyan-800 border border-cyan-200">
            <Clock className="w-3 h-3 text-cyan-600" />
            <span>Extension Requested</span>
          </span>
        );
      case 'return_scheduled':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <Truck className="w-3 h-3 text-indigo-600" />
            <span>Return Scheduled</span>
          </span>
        );
      case 'returned':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-bold bg-gray-100 text-gray-700 border border-gray-300">
            <RotateCcw className="w-3 h-3 text-gray-500" />
            <span>Device Returned</span>
          </span>
        );
      case 'deposit_refunded':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
            <ShieldCheck className="w-3 h-3 text-emerald-600" />
            <span>Deposit Refunded</span>
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-bold bg-red-50 text-red-700 border border-red-200">
            <X className="w-3 h-3 text-red-500" />
            <span>Cancelled</span>
          </span>
        );
    }
  };

  // Helper: Days remaining calculation
  const calculateDaysRemaining = (endDateStr: string) => {
    const end = new Date(endDateStr);
    const today = new Date();
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return 'Concluded';
    if (diffDays === 0) return 'Expires Today';
    if (diffDays === 1) return 'Expires Tomorrow';
    return `${diffDays} Days Remaining`;
  };

  // Helper: Invoice Download
  const handleDownloadInvoice = (rental: Rental) => {
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
Plan Type: ${rental.plan.type.toUpperCase()} (${rental.duration} units)
Contract Period: ${rental.startDate} to ${rental.endDate}

PAYMENT BREAKDOWN:
Rent Charges: ₹${rental.rentAmount.toLocaleString('en-IN')}
Refundable Security Deposit: ₹${rental.deposit.toLocaleString('en-IN')} (100% Refundable)
Doorstep Delivery & Return Pickup: ₹${rental.charges.deliveryPickup.toLocaleString('en-IN')}
GST (12%): ₹${(rental.charges.gst || 0).toLocaleString('en-IN')}
-------------------------------------------------------------
TOTAL AMOUNT PAID: ₹${(rental.rentAmount + rental.deposit + rental.charges.deliveryPickup + (rental.charges.gst || 0)).toLocaleString('en-IN')}

TRANSACTION RECORDS:
${rental.payments.map((p) => `- ${p.date}: ₹${p.amount.toLocaleString('en-IN')} via ${p.method} (Ref: ${p.transactionId || 'N/A'})`).join('\n')}

TERMS & CONDITIONS:
1. 100% Security Deposit will be refunded to client within ${refundWindow} following equipment pickup and functional verification.
2. 100% Free biomedical maintenance, periodic calibration check, and emergency breakdown replacement are covered under this contract.
3. For service support, contact: ${store.supportPhone} | ${store.supportEmail}
=============================================================`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Rental-Agreement-${rental.bookingNumber}.txt`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    // Revoke after the browser has started the download (immediate revoke breaks Safari/Firefox)
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    addToast({
      type: 'success',
      title: 'Invoice Downloaded',
      message: `Tax invoice for rental ${rental.bookingNumber} downloaded.`
    });
  };

  // Handle Extension
  const handleConfirmExtension = () => {
    if (!rentalToExtend) return;
    setIsProcessingExtension(true);

    try {
      const extraRent = rentalToExtend.plan.price * extraDuration;
      const payment: RentalPayment = {
        id: `pay-ext-${Date.now()}`,
        amount: extraRent,
        date: new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
        method: 'Razorpay Instant UPI',
        type: 'extension',
        status: 'paid',
        transactionId: `pay_rzp_ext_${Math.floor(1000000 + Math.random() * 9000000)}`
      };

      extendRental(rentalToExtend.id, extraDuration, extraRent, payment);

      addToast({
        type: 'success',
        title: 'Tenure Extended',
        message: `Contract for ${rentalToExtend.product.name.slice(0, 30)} extended by ${extraDuration} ${rentalToExtend.plan.type}(s).`
      });

      // Update selectedRental view if open
      if (selectedRental && selectedRental.id === rentalToExtend.id) {
        setSelectedRental((prev) =>
          prev
            ? {
                ...prev,
                duration: prev.duration + extraDuration,
                rentAmount: prev.rentAmount + extraRent,
                payments: [...prev.payments, payment]
              }
            : null
        );
      }

      setIsExtendModalOpen(false);
      setRentalToExtend(null);
    } finally {
      setIsProcessingExtension(false);
    }
  };

  // Handle Return Pickup
  const handleConfirmReturn = () => {
    if (!rentalToReturn) return;
    setIsSchedulingReturn(true);

    try {
      scheduleReturn(rentalToReturn.id, pickupDate);

      addToast({
        type: 'success',
        title: 'Return Pickup Scheduled',
        message: `Doorstep return pickup scheduled for ${pickupDate} (${pickupTimeSlot}).`
      });

      if (selectedRental && selectedRental.id === rentalToReturn.id) {
        setSelectedRental((prev) =>
          prev
            ? {
                ...prev,
                status: 'return_scheduled',
                returnPickupDate: pickupDate
              }
            : null
        );
      }

      setIsReturnModalOpen(false);
      setRentalToReturn(null);
    } finally {
      setIsSchedulingReturn(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
        <div>
          <h2 className="font-black text-xl text-gray-900">
            My Medical & Dental Rentals ({rentals.length})
          </h2>
          <p className="text-xs text-gray-500">
            Track active equipment, refundable deposit status, request extensions, or schedule pickups
          </p>
        </div>

        <Link
          href="/rent"
          className="px-4 py-2 bg-[#1D5FAF] hover:bg-[#174E90] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 self-start sm:self-auto shadow-xs"
        >
          <Bed className="w-3.5 h-3.5" />
          <span>Rent New Equipment</span>
        </Link>
      </div>

      {/* RENTALS LIST */}
      {rentals.length === 0 ? (
        <div className="p-12 text-center bg-[#F6F9FD] rounded-3xl border border-[#DCE6F2] space-y-3">
          <Bed className="w-12 h-12 text-[#5B6B82]/50 mx-auto" />
          <h3 className="font-black text-sm text-[#12263F]">No Active Rentals</h3>
          <p className="text-xs text-[#5B6B82] max-w-sm mx-auto">
            You currently have no active equipment rental contracts. Rent certified oxygen concentrators, CPAPs, ICU beds, or wheelchairs.
          </p>
          <Link
            href="/rent"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#1D5FAF] hover:bg-[#174E90] text-white font-bold text-xs rounded-xl shadow-md mt-2"
          >
            <span>Browse Rental Catalog</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {rentals.map((rental) => {
            const daysLeft = calculateDaysRemaining(rental.endDate);
            const isReturnable =
              rental.status === 'active' || rental.status === 'approved' || rental.status === 'extension_requested';

            return (
              <div
                key={rental.id}
                className="bg-white rounded-3xl p-5 sm:p-6 border border-gray-200 hover:border-gray-300 shadow-xs transition-all space-y-4"
              >
                {/* Top Strip: Status & Booking ID */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-gray-100">
                  <div className="flex items-center gap-2.5">
                    {renderStatusBadge(rental.status)}
                    <span className="text-xs font-mono font-bold text-gray-500">
                      {rental.bookingNumber}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[12px] font-bold text-gray-700 bg-gray-100 px-2.5 py-0.5 rounded-full">
                      {daysLeft}
                    </span>
                    <button
                      onClick={() => handleDownloadInvoice(rental)}
                      className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100"
                      title="Download Invoice"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Main Card Content */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  {/* Equipment Info */}
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gray-50 border border-gray-100 p-1 overflow-hidden shrink-0">
                      <Image
                        src={getProductImageUrl(rental.product)}
                        alt={rental.product.name}
                        fill
                        className="object-contain"
                        referrerPolicy="no-referrer"
                      />
                    </div>

                    <div className="space-y-1 min-w-0">
                      <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                        {rental.product.brandName}
                      </span>
                      <h3 className="font-bold text-sm text-gray-900 truncate">
                        {rental.product.name}
                      </h3>
                      <div className="text-xs text-gray-500 flex flex-wrap items-center gap-2">
                        <span>Plan: <strong>{rental.duration} {rental.plan.type}(s)</strong></span>
                        <span>•</span>
                        <span>Period: {rental.startDate} to {rental.endDate}</span>
                      </div>
                    </div>
                  </div>

                  {/* Financials & Deposit Status */}
                  <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end gap-1.5 text-xs shrink-0 self-stretch md:self-auto justify-between border-t md:border-t-0 pt-3 md:pt-0 border-gray-100">
                    <div className="font-black text-sm text-gray-900">
                      ₹{rental.rentAmount.toLocaleString('en-IN')} Rent Paid
                    </div>

                    {/* Deposit Status */}
                    <div className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>
                        Deposit: <strong>₹{rental.deposit.toLocaleString('en-IN')}</strong>{' '}
                        {rental.status === 'deposit_refunded' ? '(Refunded)' : '(Refundable)'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Action Strip */}
                <div className="pt-3 border-t border-[#DCE6F2] flex flex-wrap items-center justify-between gap-3">
                  <button
                    onClick={() => setSelectedRental(rental)}
                    className="text-xs font-bold text-[#1D5FAF] hover:text-[#174E90] flex items-center gap-1"
                  >
                    <span>View Full Status Timeline & Payments</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Request Extension */}
                    <button
                      type="button"
                      onClick={() => {
                        setRentalToExtend(rental);
                        setExtraDuration(1);
                        setIsExtendModalOpen(true);
                      }}
                      className="px-3.5 py-1.5 bg-[#F6F9FD] hover:bg-[#EAF2FC] hover:text-[#174E90] text-[#12263F] text-xs font-bold rounded-xl transition-colors border border-[#DCE6F2]"
                    >
                      Request Extension
                    </button>

                    {/* Schedule Return Pickup */}
                    {isReturnable && (
                      <button
                        type="button"
                        onClick={() => {
                          setRentalToReturn(rental);
                          setIsReturnModalOpen(true);
                        }}
                        className="px-3.5 py-1.5 bg-[#0B2545] hover:bg-[#13335E] text-white text-xs font-bold rounded-xl transition-colors"
                      >
                        Schedule Return Pickup
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* RENTAL DETAIL MODAL / DRAWER */}
      {selectedRental && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 shadow-2xl relative border border-gray-200">
            <button
              onClick={() => setSelectedRental(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-lg font-bold w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
            >
              ✕
            </button>

            {/* Modal Header */}
            <div className="space-y-1 pr-6 border-b border-gray-100 pb-4">
              <div className="flex items-center gap-2">
                {renderStatusBadge(selectedRental.status)}
                <span className="text-xs font-mono font-bold text-gray-500">
                  {selectedRental.bookingNumber}
                </span>
              </div>
              <h3 className="text-lg font-black text-gray-900">
                {selectedRental.product.name}
              </h3>
              <p className="text-xs text-gray-500">
                Brand: {selectedRental.product.brandName} • SKU: {selectedRental.product.sku}
              </p>
            </div>

            {/* Status Timeline */}
            <div className="space-y-3">
              <h4 className="font-bold text-xs text-gray-900 uppercase tracking-wider">
                Equipment Contract & Logistics Timeline
              </h4>

              <div className="space-y-3 text-xs pl-2 border-l-2 border-gray-200">
                {[
                  {
                    title: '1. Booking Received & Security Deposit Held in Escrow',
                    desc: `₹${selectedRental.deposit.toLocaleString('en-IN')} deposit and initial rent paid via Razorpay.`,
                    done: true
                  },
                  {
                    title: '2. Booking Confirmed',
                    desc: 'Availability and delivery slot confirmed by our rental desk.',
                    done: selectedRental.status !== 'pending_approval'
                  },
                  {
                    title: '3. Biomedical Calibration & Sterilization Check',
                    desc: 'Device tested for certified flow purity and sterile vacuum packed.',
                    done: selectedRental.status === 'dispatched' || selectedRental.status === 'active' || selectedRental.status === 'return_scheduled' || selectedRental.status === 'returned' || selectedRental.status === 'deposit_refunded'
                  },
                  {
                    title: '4. Out for Doorstep Delivery & Engineer Training',
                    desc: 'Biomedical engineer installs device at clinic/residence with demo.',
                    done: selectedRental.status === 'active' || selectedRental.status === 'return_scheduled' || selectedRental.status === 'returned' || selectedRental.status === 'deposit_refunded'
                  },
                  {
                    title: '5. Return Pickup & Functional Inspection',
                    desc: selectedRental.returnPickupDate
                      ? `Pickup scheduled for ${selectedRental.returnPickupDate}.`
                      : 'Scheduled when your medical requirement finishes.',
                    done: selectedRental.status === 'returned' || selectedRental.status === 'deposit_refunded'
                  },
                  {
                    title: '6. 100% Security Deposit Refund',
                    desc: `Deposit credited back to original payment method within ${refundWindow}.`,
                    done: selectedRental.status === 'deposit_refunded'
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
                    <p className="text-[12px] text-gray-500 leading-relaxed">{step.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Refundable Deposit Status Box */}
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="space-y-0.5 text-xs">
                <div className="font-bold text-emerald-900">
                  Refundable Security Deposit: ₹{selectedRental.deposit.toLocaleString('en-IN')}
                </div>
                <p className="text-emerald-700 leading-relaxed">
                  {selectedRental.status === 'deposit_refunded'
                    ? 'This deposit has been refunded to your original payment method.'
                    : '100% of this deposit will be refunded to your account upon equipment return inspection.'}
                </p>
              </div>
            </div>

            {/* Delivery Address */}
            <div className="p-4 bg-[#F6F9FD] rounded-2xl border border-[#DCE6F2] text-xs space-y-1">
              <div className="font-bold text-[#12263F] flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#1D5FAF]" />
                <span>Delivery & Operatory Location</span>
              </div>
              <p className="text-[#5B6B82]">
                {selectedRental.address.clinicHospitalName || selectedRental.address.name},{' '}
                {selectedRental.address.addressLine1}, {selectedRental.address.city}, {selectedRental.address.state} - {selectedRental.address.pincode}
              </p>
              <div className="text-[12px] text-[#5B6B82]">
                Contact: {selectedRental.address.name} ({selectedRental.address.phone})
              </div>
            </div>

            {/* Payment History Table */}
            <div className="space-y-2 pt-2 border-t border-[#DCE6F2]">
              <h4 className="font-bold text-xs text-[#12263F] uppercase tracking-wider">
                Payment History
              </h4>
              <div className="border border-[#DCE6F2] rounded-2xl overflow-hidden divide-y divide-[#DCE6F2] text-xs">
                {selectedRental.payments.map((p) => (
                  <div key={p.id} className="p-3 bg-white flex items-center justify-between">
                    <div>
                      <div className="font-bold text-[#12263F] capitalize">{p.type} Payment</div>
                      <div className="text-[12px] text-[#5B6B82]">{p.date} • {p.method}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-black text-[#12263F]">₹{p.amount.toLocaleString('en-IN')}</div>
                      <span className="text-[11px] text-[#16A34A] font-bold">Paid</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-[#DCE6F2]">
              <button
                type="button"
                onClick={() => handleDownloadInvoice(selectedRental)}
                className="px-4 py-2 border border-[#1D5FAF] text-xs font-bold rounded-xl text-[#1D5FAF] hover:bg-[#EAF2FC] flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Invoice</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setRentalToExtend(selectedRental);
                    setIsExtendModalOpen(true);
                  }}
                  className="px-4 py-2 bg-[#EAF2FC] text-[#174E90] hover:bg-[#DCE6F2] border border-[#1D5FAF]/20 text-xs font-bold rounded-xl"
                >
                  Request Extension
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRentalToReturn(selectedRental);
                    setIsReturnModalOpen(true);
                  }}
                  className="px-4 py-2 bg-[#0B2545] hover:bg-[#13335E] text-white text-xs font-bold rounded-xl"
                >
                  Schedule Return
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REQUEST EXTENSION MODAL */}
      {isExtendModalOpen && rentalToExtend && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 space-y-4 shadow-2xl relative border border-gray-200">
            <button
              onClick={() => setIsExtendModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-lg font-bold w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
            >
              ✕
            </button>

            <div className="space-y-1">
              <div className="text-xs font-bold text-[#1D5FAF] uppercase tracking-wider">
                Extend Equipment Usage
              </div>
              <h3 className="text-lg font-black text-[#12263F]">
                Request Rental Extension
              </h3>
              <p className="text-xs text-[#5B6B82]">
                Extend {rentalToExtend.product.name} without changing devices or paying a new security deposit.
              </p>
            </div>

            {/* Stepper */}
            <div className="space-y-2 pt-2">
              <label className="block text-xs font-bold text-[#12263F]">
                Choose Extra Duration ({rentalToExtend.plan.type}s):
              </label>
              <div className="flex items-center border border-[#DCE6F2] rounded-xl overflow-hidden bg-[#F6F9FD]">
                <button
                  type="button"
                  onClick={() => setExtraDuration((d) => Math.max(1, d - 1))}
                  className="px-4 py-2 hover:bg-[#EAF2FC] text-[#12263F] font-bold"
                >
                  -
                </button>
                <div className="flex-1 text-center font-bold text-sm text-[#12263F]">
                  +{extraDuration} {rentalToExtend.plan.type}(s)
                </div>
                <button
                  type="button"
                  onClick={() => setExtraDuration((d) => Math.min(12, d + 1))}
                  className="px-4 py-2 hover:bg-[#EAF2FC] text-[#12263F] font-bold"
                >
                  +
                </button>
              </div>
            </div>

            {/* Extension Pricing Calculation */}
            <div className="p-4 bg-[#F6F9FD] rounded-2xl border border-[#DCE6F2] space-y-2 text-xs">
              <div className="flex justify-between">
                <span>Rate per {rentalToExtend.plan.type}</span>
                <span className="font-bold text-[#12263F]">
                  ₹{rentalToExtend.plan.price.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Existing Security Deposit</span>
                <span className="text-[#16A34A] font-bold">
                  ₹{rentalToExtend.deposit.toLocaleString('en-IN')} (Carried Forward)
                </span>
              </div>
              <div className="pt-2 border-t border-[#DCE6F2] flex justify-between items-baseline">
                <span className="font-bold text-[#12263F]">Extension Payable Now</span>
                <span className="font-black text-base text-[#12263F] font-extrabold">
                  ₹{(rentalToExtend.plan.price * extraDuration).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <button
              type="button"
              disabled={isProcessingExtension}
              onClick={handleConfirmExtension}
              className="w-full py-3 bg-[#1D5FAF] hover:bg-[#174E90] text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <CreditCard className="w-4 h-4" />
              <span>
                {isProcessingExtension
                  ? 'Processing Payment...'
                  : `Pay ₹${(rentalToExtend.plan.price * extraDuration).toLocaleString('en-IN')} & Extend`}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* SCHEDULE RETURN PICKUP MODAL */}
      {isReturnModalOpen && rentalToReturn && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 space-y-4 shadow-2xl relative border border-[#DCE6F2]">
            <button
              onClick={() => setIsReturnModalOpen(false)}
              className="absolute top-4 right-4 text-[#5B6B82] hover:text-[#12263F] text-lg font-bold w-8 h-8 rounded-full bg-[#F6F9FD] flex items-center justify-center"
            >
              ✕
            </button>

            <div className="space-y-1">
              <div className="text-xs font-bold text-[#1D5FAF] uppercase tracking-wider">
                Deposit Refund & Logistics
              </div>
              <h3 className="text-lg font-black text-[#12263F]">
                Schedule Return Pickup
              </h3>
              <p className="text-xs text-[#5B6B82]">
                Our logistics partner will arrive with protective crates to inspect and collect the equipment.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-bold text-[#12263F] mb-1">
                  Preferred Pickup Date:
                </label>
                <input
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  value={pickupDate}
                  onChange={(e) => setPickupDate(e.target.value)}
                  className="w-full text-xs font-semibold px-3 py-2 border border-[#DCE6F2] rounded-xl bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#12263F] mb-1">
                  Time Slot:
                </label>
                <select
                  value={pickupTimeSlot}
                  onChange={(e) => setPickupTimeSlot(e.target.value)}
                  className="w-full text-xs font-semibold px-3 py-2 border border-[#DCE6F2] rounded-xl bg-white"
                >
                  <option>10:00 AM - 01:00 PM (Morning Slot)</option>
                  <option>02:00 PM - 05:00 PM (Afternoon Slot)</option>
                  <option>05:00 PM - 08:00 PM (Evening Slot)</option>
                </select>
              </div>

              {/* Deposit Refund Note */}
              <div className="p-3 bg-green-50 rounded-xl border border-green-200 text-xs text-green-800 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#16A34A]" />
                  <span>₹{rentalToReturn.deposit.toLocaleString('en-IN')} Refund Trigger</span>
                </div>
                <p className="text-[12px] leading-relaxed">
                  Upon functional verification at pickup, 100% of your security deposit is refunded directly to your payment method within {refundWindow}.
                </p>
              </div>
            </div>

            <button
              type="button"
              disabled={isSchedulingReturn}
              onClick={handleConfirmReturn}
              className="w-full py-3 bg-[#0B2545] hover:bg-[#13335E] text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Truck className="w-4 h-4" />
              <span>
                {isSchedulingReturn ? 'Scheduling Logistics...' : 'Confirm Return Pickup'}
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
