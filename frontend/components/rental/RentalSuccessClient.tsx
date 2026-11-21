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
import { useSiteSettings } from '@/lib/settings/store';

export default function RentalSuccessClient() {
  const { store, rental: rentalRules } = useSiteSettings();
  // Settings → Rental → deposit refund promise
  const refundWindow = `${rentalRules.depositRefundDays} day${rentalRules.depositRefundDays === 1 ? '' : 's'}`;
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
Status: PENDING APPROVAL (Availability & Biomedical Check)

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
1. 100% Security Deposit is returned within ${refundWindow} following device inspection upon return.
2. 100% Free repair and emergency standby replacement included.
Support Helpline: ${store.supportPhone} | ${store.supportEmail}
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
      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-[#DCE6F2] shadow-xl text-center space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-[#EAF2FC] text-[#1D5FAF] flex items-center justify-center mx-auto border border-[#1D5FAF]/20 shadow-xs">
          <Clock className="w-8 h-8 text-[#1D5FAF]" />
        </div>

        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EAF2FC] text-[#174E90] border border-[#1D5FAF]/20 text-xs font-bold uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-[#1D5FAF] animate-pulse" />
            <span>Booking Status: Pending Approval</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-[#12263F]">
            Rental Booking Confirmed!
          </h1>

          <p className="text-xs text-[#5B6B82] max-w-md mx-auto">
            Your booking reference is <strong className="text-[#12263F] font-mono">{bookingId}</strong>. Our team is confirming availability and sanitizing the machine for delivery.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/account?tab=rentals"
            className="px-6 py-3 bg-[#1D5FAF] hover:bg-[#174E90] text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2"
          >
            <Bed className="w-4 h-4" />
            <span>View My Rentals in Account</span>
          </Link>

          <button
            onClick={handleDownloadReceipt}
            className="px-5 py-3 border border-[#1D5FAF] hover:bg-[#EAF2FC] bg-white text-[#1D5FAF] font-bold text-xs rounded-xl transition-all flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Download Rental Receipt</span>
          </button>
        </div>
      </div>

      {/* Equipment & Deposit Details Card */}
      {rental && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#DCE6F2] shadow-xs space-y-6">
          <h3 className="font-black text-sm text-[#12263F] uppercase tracking-wider pb-3 border-b border-[#DCE6F2]">
            Booking & Equipment Details
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <span className="text-[#5B6B82] text-[12px] uppercase tracking-wider font-semibold">Equipment</span>
              <div className="font-bold text-[#12263F] text-sm">{rental.product.name}</div>
              <div className="text-[#5B6B82]">Brand: {rental.product.brandName} • SKU: {rental.product.sku}</div>
            </div>

            <div className="space-y-1">
              <span className="text-[#5B6B82] text-[12px] uppercase tracking-wider font-semibold">Tenure & Dates</span>
              <div className="font-bold text-[#12263F] text-sm">{rental.duration} {rental.plan.type}(s)</div>
              <div className="text-[#5B6B82]">From <strong>{rental.startDate}</strong> to <strong>{rental.endDate}</strong></div>
            </div>
          </div>

          {/* Refundable Deposit Notice */}
          <div className="p-4 rounded-2xl bg-[#16A34A]/5 border border-[#16A34A]/30 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-[#16A34A] shrink-0 mt-0.5" />
            <div className="space-y-0.5 text-xs">
              <div className="font-bold text-[#12263F]">
                ₹{rental.deposit.toLocaleString('en-IN')} Security Deposit Held in Escrow
              </div>
              <p className="text-[#16A34A] leading-relaxed">
                Your deposit is 100% refundable. Once your rental duration concludes and our logistics partner picks up the device, the entire ₹{rental.deposit.toLocaleString('en-IN')} will be refunded back to your payment account.
              </p>
            </div>
          </div>

          {/* What happens next 3-step timeline */}
          <div className="space-y-3 pt-4 border-t border-[#DCE6F2]">
            <h4 className="font-bold text-xs text-[#12263F]">What Happens Next:</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 bg-[#F6F9FD] rounded-xl border border-[#DCE6F2] space-y-1">
                <div className="text-[11px] font-black text-[#1D5FAF]">STEP 1 (2-4 Hours)</div>
                <div className="font-bold text-xs text-[#12263F]">Booking Confirmation</div>
                <p className="text-[12px] text-[#5B6B82]">We confirm stock and your delivery slot by phone.</p>
              </div>

              <div className="p-3.5 bg-[#F6F9FD] rounded-xl border border-[#DCE6F2] space-y-1">
                <div className="text-[11px] font-black text-[#1D5FAF]">STEP 2 (Same-Day)</div>
                <div className="font-bold text-xs text-[#12263F]">Biomedical Calibration</div>
                <p className="text-[12px] text-[#5B6B82]">Machine is tested for pure airflow, pressure, and sterile sealed.</p>
              </div>

              <div className="p-3.5 bg-[#F6F9FD] rounded-xl border border-[#DCE6F2] space-y-1">
                <div className="text-[11px] font-black text-[#1D5FAF]">STEP 3 (Doorstep)</div>
                <div className="font-bold text-xs text-[#12263F]">Delivery & Demo</div>
                <p className="text-[12px] text-[#5B6B82]">Engineer arrives, sets up the machine, and trains your team.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Support Strip */}
      <div className="p-5 bg-[#0B2545] text-white rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3">
          <PhoneCall className="w-5 h-5 text-[#93C5FD]" />
          <div>
            <div className="font-bold">Need urgent expedited delivery?</div>
            <div className="text-[#EAF2FC]/75 text-[12px]">Contact our emergency dispatch coordinator anytime</div>
          </div>
        </div>
        <a
          href={store.supportPhoneHref}
          className="px-4 py-2 bg-[#1D5FAF] hover:bg-[#174E90] text-white font-bold rounded-xl whitespace-nowrap transition-colors"
        >
          Call {store.supportPhone}
        </a>
      </div>
    </div>
  );
}
