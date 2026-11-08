'use client';

import React from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { 
  CheckCircle2, 
  ShieldCheck, 
  Clock, 
  FileCheck, 
  Truck, 
  Download, 
  Bed, 
  PhoneCall, 
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import { useRentalStore, useToastStore } from '@/lib/store';

export default function RentalSuccessClient() {
  const searchParams = useSearchParams();
  const { addToast } = useToastStore();
  const bookingId = searchParams.get('bookingId') || 'BDM-RNT-2026-88194';
  const { rentals } = useRentalStore();

  const rental = rentals.find((r) => r.bookingNumber === bookingId || r.id === bookingId) || rentals[0];

  const handleDownloadReceipt = () => {
    if (!rental) return;
    const content = `BUY DENMED HEALTHCARE PVT LTD
RENTAL BOOKING CONFIRMATION & DEPOSIT RECEIPT
=============================================================
Booking ID: ${rental.bookingNumber}
Date: ${new Date().toLocaleDateString('en-IN')}
Status: PENDING APPROVAL (Biomedical & KYC Verification)

Equipment: ${rental.product.name}
Brand: ${rental.product.brandName}
SKU: ${rental.product.sku}
Plan: ${rental.duration} ${rental.plan.type}(s)
Start Date: ${rental.startDate}
End Date: ${rental.endDate}

FINANCIAL BREAKDOWN:
Rental Charges: ₹${rental.rentAmount.toLocaleString('en-IN')}
Refundable Security Deposit: ₹${rental.deposit.toLocaleString('en-IN')} (100% Refundable)
Doorstep Sanitized Delivery & Pickup: ₹${rental.charges.deliveryPickup.toLocaleString('en-IN')}
GST (12%): ₹${(rental.charges.gst || 0).toLocaleString('en-IN')}
TOTAL PAID: ₹${(rental.rentAmount + rental.deposit + rental.charges.deliveryPickup + (rental.charges.gst || 0)).toLocaleString('en-IN')}

INSTALLATION LOCATION:
${rental.address.clinicHospitalName || rental.address.name}
${rental.address.addressLine1}, ${rental.address.city}, ${rental.address.state} - ${rental.address.pincode}
Contact: ${rental.address.name} (${rental.address.phone})

TERMS:
1. 100% Security Deposit is returned within 48 hours following device inspection upon return.
2. 100% Free repair and emergency standby replacement included.
Support Helpline: +91 98112 34567 | support@buydenmed.com
=============================================================`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Rental-Receipt-${rental.bookingNumber}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    addToast({
      type: 'success',
      title: 'Receipt Saved',
      message: `Rental receipt for ${rental.bookingNumber} downloaded.`
    });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 py-6">
      {/* Success Hero Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-gray-200/80 shadow-xl text-center space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto border border-amber-500/20 shadow-xs">
          <Clock className="w-8 h-8 text-[#FF6B00]" />
        </div>

        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span>Booking Status: Pending Approval</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-gray-900">
            Rental Booking Confirmed!
          </h1>

          <p className="text-xs text-gray-500 max-w-md mx-auto">
            Your booking reference is <strong className="text-gray-900 font-mono">{bookingId}</strong>. Our biomedical team is verifying your KYC and sanitizing the machine for delivery.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/account?tab=rentals"
            className="px-6 py-3 bg-[#FF6B00] hover:bg-[#E65D00] text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2"
          >
            <Bed className="w-4 h-4" />
            <span>View My Rentals in Account</span>
          </Link>

          <button
            onClick={handleDownloadReceipt}
            className="px-5 py-3 border border-gray-300 hover:border-gray-400 bg-gray-50 text-gray-700 font-bold text-xs rounded-xl transition-all flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Download Rental Receipt</span>
          </button>
        </div>
      </div>

      {/* Equipment & Deposit Details Card */}
      {rental && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/80 shadow-xs space-y-6">
          <h3 className="font-black text-sm text-gray-900 uppercase tracking-wider pb-3 border-b border-gray-100">
            Booking & Equipment Details
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <span className="text-gray-500 text-[11px] uppercase tracking-wider font-semibold">Equipment</span>
              <div className="font-bold text-gray-900 text-sm">{rental.product.name}</div>
              <div className="text-gray-500">Brand: {rental.product.brandName} • SKU: {rental.product.sku}</div>
            </div>

            <div className="space-y-1">
              <span className="text-gray-500 text-[11px] uppercase tracking-wider font-semibold">Tenure & Dates</span>
              <div className="font-bold text-gray-900 text-sm">{rental.duration} {rental.plan.type}(s)</div>
              <div className="text-gray-500">From <strong>{rental.startDate}</strong> to <strong>{rental.endDate}</strong></div>
            </div>
          </div>

          {/* Refundable Deposit Notice */}
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5 text-xs">
              <div className="font-bold text-emerald-900">
                ₹{rental.deposit.toLocaleString('en-IN')} Security Deposit Held in Escrow
              </div>
              <p className="text-emerald-700 leading-relaxed">
                Your deposit is 100% refundable. Once your rental duration concludes and our logistics partner picks up the device, the entire ₹{rental.deposit.toLocaleString('en-IN')} will be refunded back to your payment account.
              </p>
            </div>
          </div>

          {/* What happens next 3-step timeline */}
          <div className="space-y-3 pt-4 border-t border-gray-100">
            <h4 className="font-bold text-xs text-gray-900">What Happens Next:</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200 space-y-1">
                <div className="text-[10px] font-black text-[#FF6B00]">STEP 1 (2-4 Hours)</div>
                <div className="font-bold text-xs text-gray-900">KYC Verification</div>
                <p className="text-[11px] text-gray-500">Our medical compliance desk validates your identity proof.</p>
              </div>

              <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200 space-y-1">
                <div className="text-[10px] font-black text-[#FF6B00]">STEP 2 (Same-Day)</div>
                <div className="font-bold text-xs text-gray-900">Biomedical Calibration</div>
                <p className="text-[11px] text-gray-500">Machine is tested for pure airflow, pressure, and sterile sealed.</p>
              </div>

              <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200 space-y-1">
                <div className="text-[10px] font-black text-[#FF6B00]">STEP 3 (Doorstep)</div>
                <div className="font-bold text-xs text-gray-900">Delivery & Demo</div>
                <p className="text-[11px] text-gray-500">Engineer arrives, sets up the machine, and trains your team.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Support Strip */}
      <div className="p-5 bg-[#2B2B2B] text-white rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3">
          <PhoneCall className="w-5 h-5 text-[#FF6B00]" />
          <div>
            <div className="font-bold">Need urgent expedited delivery?</div>
            <div className="text-gray-400 text-[11px]">Contact our emergency dispatch coordinator anytime</div>
          </div>
        </div>
        <a
          href="tel:+919811234567"
          className="px-4 py-2 bg-[#FF6B00] text-white font-bold rounded-xl whitespace-nowrap"
        >
          Call +91 98112 34567
        </a>
      </div>
    </div>
  );
}
