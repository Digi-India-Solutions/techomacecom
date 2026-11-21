'use client';

import React, { useState, useEffect, Suspense, useCallback, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useUserStore, useWishlistStore, useRentalStore, useToastStore } from '@/lib/store';
import { getOrders } from '@/lib/api';
import type { Order } from '@/types';
import type { SiteSettings } from '@/lib/settings/types';
import { useSiteSettings } from '@/lib/settings/store';
import ProductCard from '@/components/product/ProductCard';
import RentalsTabContent from '@/components/account/RentalsTabContent';
import WriteReviewModal from '@/components/product/WriteReviewModal';
import ProfileHeader from '@/components/account/ProfileHeader';
import ProfileTab from '@/components/account/ProfileTab';
import AddressesTab from '@/components/account/AddressesTab';
import GstTab from '@/components/account/GstTab';
import SecurityTab from '@/components/account/SecurityTab';
import { EmptyState, SectionHeader, btnPrimary, btnSecondary } from '@/components/account/ui';
import {
  User as UserIcon,
  Package,
  MapPin,
  FileText,
  Heart,
  Bed,
  Download,
  Check,
  ChevronDown,
  Star,
  Truck,
  KeyRound,
  Lock,
  XCircle,
  RotateCcw,
  X
} from 'lucide-react';
import { cancelCustomerOrder, requestOrderReturn } from '@/lib/api/orders';
import { useHydrated } from '@/hooks/use-hydrated';
import { AccountSkeleton, OrderListSkeleton } from '@/components/skeletons/PageSkeletons';
import { fetchCurrentCustomer, logoutCustomer } from '@/lib/api/customerAuth';

type Tab = 'orders' | 'rentals' | 'wishlist' | 'addresses' | 'gst' | 'profile' | 'security';
const TABS: Tab[] = ['orders', 'rentals', 'wishlist', 'addresses', 'gst', 'profile', 'security'];

const formatINR = (n: number) => `₹${n.toLocaleString('en-IN')}`;
const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

const STATUS_STYLES: Record<string, string> = {
  Placed: 'bg-slate-100 text-slate-700',
  Confirmed: 'bg-blue-50 text-blue-700',
  Packed: 'bg-amber-50 text-amber-800',
  Dispatched: 'bg-indigo-50 text-indigo-700',
  Delivered: 'bg-green-50 text-green-700',
  Cancelled: 'bg-red-50 text-red-700',
  'Return Requested': 'bg-purple-100 text-purple-800 border border-purple-200',
  'Return Approved': 'bg-blue-100 text-blue-800 border border-blue-200',
  'Pickup Scheduled': 'bg-sky-100 text-sky-800 border border-sky-200',
  'Return Received': 'bg-amber-100 text-amber-800 border border-amber-200',
  Refunded: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
  'Return Rejected': 'bg-rose-100 text-rose-700 border border-rose-200',
  Returned: 'bg-purple-100 text-purple-800 border border-purple-200'
};

/** Opens a print-ready GST invoice in a new tab (user can Save as PDF).
 *  If the backend has already generated a PDF (order.invoiceUrl), opens that
 *  directly instead of building an HTML print page.
 */
const esc = (v: string) => v.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string);

/** Seller details, footer terms and signature come from admin → Settings (Store, Tax & Invoice). */
function openInvoice(order: Order, { store, tax }: Pick<SiteSettings, 'store' | 'tax'>) {
  // If backend already generated a PDF → open it directly
  if (order.invoiceUrl) {
    window.open(order.invoiceUrl, '_blank', 'noopener,noreferrer');
    return true;
  }

  const addr = order.shippingAddress;
  const rows = order.items
    .map(
      (it, i) => `<tr><td>${i + 1}</td><td>${esc(it.productName)}<div class="muted">${esc(it.brandName)} · SKU ${esc(it.sku)}${it.variantName ? ` · ${esc(it.variantName)}` : ''}</div></td>
      <td class="r">${it.quantity}</td><td class="r">${formatINR(it.unitPrice)}</td><td class="r">${formatINR(it.totalPrice)}</td></tr>`
    )
    .join('');

  // Build charges rows
  const discountRow = order.discount > 0
    ? `<tr><td>Discount${order.couponCode ? ` (${esc(order.couponCode)})` : ''}</td><td class="r">−${formatINR(order.discount)}</td></tr>`
    : '';
  const shippingRow = `<tr><td>Shipping & Handling</td><td class="r">${order.shipping ? formatINR(order.shipping) : 'Free'}</td></tr>`;
  const gstLabel = tax.pricesIncludeGst ? 'GST (included in price)' : 'GST';
  const gstRow = `<tr><td>${gstLabel}</td><td class="r">${formatINR(order.gstAmount)}</td></tr>`;

  const invoiceRef = order.invoiceNumber || order.orderNumber;

  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Invoice ${esc(invoiceRef)}</title>
  <style>
    body{font-family:Poppins,system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#12263F;margin:40px;font-size:13px}
    h1{font-size:20px;margin:0}.muted{color:#5B6B82;font-size:12px}.r{text-align:right}
    .top{display:flex;justify-content:space-between;border-bottom:2px solid #12263F;padding-bottom:16px;margin-bottom:20px}
    .grid{display:flex;gap:40px;margin-bottom:24px}table{width:100%;border-collapse:collapse}
    th,td{padding:10px 8px;border-bottom:1px solid #E2E8F0;vertical-align:top}th{text-align:left;background:#F6F9FD;font-size:12px}
    .tot{width:280px;margin-left:auto;margin-top:16px}.tot td{border:0;padding:4px 8px}.tot .g td{font-weight:700;font-size:15px;border-top:2px solid #12263F;padding-top:8px}
    @media print{body{margin:16mm}button{display:none}}
  </style></head><body>
  <div class="top"><div>${store.logoUrl ? `<img src="${esc(store.logoUrl)}" alt="" style="height:40px;margin-bottom:8px">` : ''}<h1>${esc(store.storeName)}</h1><div class="muted" style="white-space:pre-line">${esc(store.address)}</div>
  ${store.gstin ? `<div class="muted">GSTIN: <strong>${esc(store.gstin)}</strong></div>` : ''}<div class="muted">${esc(store.supportPhone)} · ${esc(store.supportEmail)}</div></div>
  <div class="r"><strong>TAX INVOICE</strong><div class="muted">${esc(invoiceRef)}</div><div class="muted">${formatDate(order.date)}</div></div></div>
  <div class="grid"><div><div class="muted">Bill / ship to</div><strong>${esc(addr.clinicHospitalName || addr.name)}</strong><div>${esc(addr.name)}</div>
  <div>${esc(addr.addressLine1)}${addr.addressLine2 ? ', ' + esc(addr.addressLine2) : ''}</div><div>${esc(addr.city)}, ${esc(addr.state)} – ${esc(addr.pincode)}</div></div>
  <div><div class="muted">GSTIN</div><strong>${esc(order.gstDetails?.gstin || '—')}</strong>
  ${order.gstDetails?.legalBusinessName ? `<div class="muted" style="margin-top:4px">${esc(order.gstDetails.legalBusinessName)}</div>` : ''}
  <div class="muted" style="margin-top:8px">Payment</div><div>${esc(order.paymentMethod)} · ${esc(order.paymentStatus)}</div>
  ${order.trackingNumber ? `<div class="muted" style="margin-top:8px">Tracking</div><div style="font-family:monospace">${esc(order.trackingNumber)}</div>` : ''}
  </div></div>
  <table><thead><tr><th>#</th><th>Item</th><th class="r">Qty</th><th class="r">Unit price</th><th class="r">Amount</th></tr></thead><tbody>${rows}</tbody></table>
  <table class="tot"><tr><td>Subtotal</td><td class="r">${formatINR(order.subtotal)}</td></tr>
  ${discountRow}${shippingRow}${gstRow}
  <tr class="g"><td>Total</td><td class="r">${formatINR(order.totalAmount)}</td></tr></table>
  <div style="display:flex;justify-content:space-between;align-items:flex-end;gap:24px;margin-top:36px">
    <div class="muted" style="white-space:pre-line;max-width:60%">${esc(tax.invoiceFooterTerms)}</div>
    <div style="text-align:center">${tax.signatoryUrl ? `<img src="${esc(tax.signatoryUrl)}" alt="" style="height:56px;display:block;margin:0 auto 4px">` : '<div style="height:56px"></div>'}
    <div style="border-top:1px solid #12263F;padding-top:4px;font-size:12px">For ${esc(store.storeName)}<br>${esc(tax.signatoryName)}</div></div>
  </div>
  <p class="muted" style="margin-top:24px">This is a computer-generated invoice.</p>
  <button onclick="window.print()" style="margin-top:12px;padding:10px 18px;border:0;border-radius:8px;background:#1D5FAF;color:#fff;font-weight:600;cursor:pointer">Print / Save as PDF</button>
  </body></html>`;
  const w = window.open('', '_blank');
  if (!w) return false;
  w.document.open();
  w.document.write(html);
  w.document.close();
  return true;
}

/* ─────────────────────────────── Modals ─────────────────────────────── */

const CANCEL_REASONS = [
  'Ordered by mistake',
  'Found a better price / alternative elsewhere',
  'Delivery timeframe is too long',
  'Need to modify clinic delivery address or GST details',
  'Decided on a different equipment model',
  'Other reason'
];

interface CancelOrderModalProps {
  order: Order;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedOrder: Order) => void;
}

function CancelOrderModal({ order, isOpen, onClose, onSuccess }: CancelOrderModalProps) {
  const [reason, setReason] = useState(CANCEL_REASONS[0]);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { addToast } = useToastStore();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const updated = await cancelCustomerOrder(order.id, { reason, note });
      addToast({
        type: 'success',
        title: 'Order Cancelled',
        message: `Order #${order.orderNumber} has been successfully cancelled.`
      });
      onSuccess(updated);
      onClose();
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Cancellation Failed',
        message: err.message || 'Could not cancel order. Please contact support.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const isPrepaid = order.paymentMethod.includes('Razorpay') || order.paymentStatus === 'Paid';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B2545]/60 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-[#DCE6F2] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-[#E8EEF5] px-6 py-4 bg-[#F8FAFD]">
          <div>
            <h3 className="text-base font-bold text-[#12263F]">Cancel Order</h3>
            <p className="text-xs text-[#5B6B82] font-mono mt-0.5">{order.orderNumber}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-[#8A97A8] hover:bg-[#EAF2FC] hover:text-[#12263F]">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs sm:text-sm">
          <div>
            <label className="block text-xs font-semibold text-[#12263F] mb-1.5">
              Reason for Cancellation <span className="text-red-500">*</span>
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-xl border border-[#DCE6F2] bg-[#F8FAFD] px-3.5 py-2.5 text-xs text-[#12263F] focus:outline-none focus:border-[#1D5FAF]"
            >
              {CANCEL_REASONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#12263F] mb-1.5">
              Additional Details / Comments (Optional)
            </label>
            <textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Tell us what happened or why you would like to cancel..."
              className="w-full rounded-xl border border-[#DCE6F2] bg-white px-3.5 py-2.5 text-xs text-[#12263F] placeholder:text-[#8A97A8] focus:outline-none focus:border-[#1D5FAF]"
            />
          </div>

          {isPrepaid ? (
            <div className="rounded-xl border border-blue-200 bg-[#EAF2FC]/60 p-3.5 text-xs text-[#1D5FAF] leading-relaxed">
              <span className="font-semibold block mb-0.5">Prepaid Order Refund Policy:</span>
              Your total payment of <strong>{formatINR(order.totalAmount)}</strong> will be refunded to your original payment method within <strong>3-5 business days</strong>.
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs text-[#5B6B82] leading-relaxed">
              <span className="font-semibold text-[#12263F] block mb-0.5">Cash on Delivery Order:</span>
              No amount has been collected. Your order will be immediately cancelled with no fee.
            </div>
          )}

          <div className="flex justify-end gap-2.5 pt-2 border-t border-[#E8EEF5]">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-xl border border-[#DCE6F2] px-4 py-2.5 text-xs font-semibold text-[#12263F] hover:bg-[#F8FAFD]"
            >
              Keep Order
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-red-600 hover:bg-red-700 px-5 py-2.5 text-xs font-semibold text-white shadow-xs disabled:opacity-50"
            >
              {submitting ? 'Cancelling...' : 'Confirm Cancellation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const RETURN_REASONS = [
  'Defective / Not powering on or functioning properly',
  'Physical damage received during courier transit',
  'Wrong product model or variant delivered',
  'Missing accessories, cables, or manufacturer components',
  'Performance does not match technical specifications',
  'Other reason'
];

interface ReturnOrderModalProps {
  order: Order;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedOrder: Order) => void;
}

function ReturnOrderModal({ order, isOpen, onClose, onSuccess }: ReturnOrderModalProps) {
  const [reason, setReason] = useState(RETURN_REASONS[0]);
  const [customerNote, setCustomerNote] = useState('');
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>(order.items.map((it) => it.productId));
  const [accountHolder, setAccountHolder] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [bankName, setBankName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { addToast } = useToastStore();

  if (!isOpen) return null;

  const isCod = order.paymentMethod.includes('Cash on Delivery');

  const toggleItem = (id: string) => {
    setSelectedItemIds((prev) =>
      prev.includes(id) ? (prev.length > 1 ? prev.filter((i) => i !== id) : prev) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedItemIds.length === 0) {
      addToast({ type: 'error', title: 'Select Items', message: 'Please select at least one item to return.' });
      return;
    }
    if (isCod && (!accountHolder.trim() || !accountNumber.trim() || !ifsc.trim())) {
      addToast({ type: 'error', title: 'Bank Details Required', message: 'Please fill account holder, account number and IFSC for your COD refund.' });
      return;
    }

    setSubmitting(true);
    try {
      const res = await requestOrderReturn(order.id, {
        reason,
        customerNote,
        itemIds: selectedItemIds,
        bankDetails: isCod
          ? { accountHolder: accountHolder.trim(), accountNumber: accountNumber.trim(), ifsc: ifsc.trim().toUpperCase(), bankName: bankName.trim() }
          : undefined
      });
      addToast({
        type: 'success',
        title: 'Return Request Submitted',
        message: `RMA #${res.returnRequest.returnNumber} submitted. Our logistics team will arrange reverse pickup.`
      });
      onSuccess(res.order);
      onClose();
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Return Request Failed',
        message: err.message || 'Could not submit return request. Please try again.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B2545]/60 p-4 overflow-y-auto">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-[#DCE6F2] overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-6 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-[#E8EEF5] px-6 py-4 bg-[#F8FAFD] shrink-0">
          <div>
            <h3 className="text-base font-bold text-[#12263F]">Request Return / Replacement</h3>
            <p className="text-xs text-[#5B6B82] font-mono mt-0.5">Order #{order.orderNumber} · 7-Day Guarantee</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-[#8A97A8] hover:bg-[#EAF2FC] hover:text-[#12263F]">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs sm:text-sm overflow-y-auto flex-1">
          {/* Policy Banner */}
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3.5 text-xs text-emerald-900 leading-relaxed">
            <span className="font-semibold block mb-0.5">Doctor-Friendly 7-Day Replacement Policy</span>
            Report defects, damage, or wrong items within 7 days of delivery. Our logistics team will arrange reverse pickup from your clinic and inspect the unit.
          </div>

          {/* Select Items */}
          <div>
            <label className="block text-xs font-semibold text-[#12263F] mb-1.5">
              Select Item(s) to Return <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2 border border-[#DCE6F2] rounded-xl p-3 bg-[#F8FAFD]">
              {order.items.map((it) => {
                const checked = selectedItemIds.includes(it.productId);
                return (
                  <label key={it.productId} className="flex items-center gap-3 cursor-pointer p-1.5 rounded-lg hover:bg-white">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleItem(it.productId)}
                      className="w-4 h-4 rounded text-[#1D5FAF] focus:ring-[#1D5FAF]"
                    />
                    <div className="min-w-0 flex-1 text-xs">
                      <p className="font-medium text-[#12263F] truncate">{it.productName}</p>
                      <p className="text-[#8A97A8]">Qty: {it.quantity} · {formatINR(it.totalPrice)}</p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-xs font-semibold text-[#12263F] mb-1.5">
              Primary Reason for Return <span className="text-red-500">*</span>
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-xl border border-[#DCE6F2] bg-[#F8FAFD] px-3.5 py-2.5 text-xs text-[#12263F] focus:outline-none focus:border-[#1D5FAF]"
            >
              {RETURN_REASONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {/* Customer Note */}
          <div>
            <label className="block text-xs font-semibold text-[#12263F] mb-1.5">
              Observations / Fault Details <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={customerNote}
              onChange={(e) => setCustomerNote(e.target.value)}
              placeholder="Please describe what is wrong with the device or packaging..."
              className="w-full rounded-xl border border-[#DCE6F2] bg-white px-3.5 py-2.5 text-xs text-[#12263F] placeholder:text-[#8A97A8] focus:outline-none focus:border-[#1D5FAF]"
            />
          </div>

          {/* If COD: Bank Details */}
          {isCod && (
            <div className="rounded-xl border border-[#DCE6F2] bg-[#F8FAFD] p-3.5 space-y-3">
              <p className="font-semibold text-xs text-[#1D5FAF]">
                Bank Account for COD Refund
              </p>
              <p className="text-[11px] text-[#5B6B82]">
                Since this order was placed via Cash on Delivery, your refund will be transferred via NEFT/IMPS following warehouse inspection.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                <div>
                  <label className="block text-[11px] font-medium text-[#5B6B82] mb-1">Account Holder Name *</label>
                  <input
                    type="text"
                    required
                    value={accountHolder}
                    onChange={(e) => setAccountHolder(e.target.value)}
                    placeholder="e.g. Dr. Ankit Bowade"
                    className="w-full rounded-lg border border-[#DCE6F2] bg-white px-3 py-2 text-xs text-[#12263F]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-[#5B6B82] mb-1">Bank Name</label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="e.g. State Bank of India"
                    className="w-full rounded-lg border border-[#DCE6F2] bg-white px-3 py-2 text-xs text-[#12263F]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-[#5B6B82] mb-1">Account Number *</label>
                  <input
                    type="text"
                    required
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder="Account Number"
                    className="w-full rounded-lg border border-[#DCE6F2] bg-white px-3 py-2 text-xs text-[#12263F] font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-[#5B6B82] mb-1">IFSC Code *</label>
                  <input
                    type="text"
                    required
                    value={ifsc}
                    onChange={(e) => setIfsc(e.target.value)}
                    placeholder="e.g. SBIN0001234"
                    className="w-full rounded-lg border border-[#DCE6F2] bg-white px-3 py-2 text-xs text-[#12263F] font-mono uppercase"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2.5 pt-2 border-t border-[#E8EEF5]">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-xl border border-[#DCE6F2] px-4 py-2.5 text-xs font-semibold text-[#12263F] hover:bg-[#F8FAFD]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-[#1D5FAF] hover:bg-[#174D8F] px-5 py-2.5 text-xs font-semibold text-white shadow-xs disabled:opacity-50"
            >
              {submitting ? 'Submitting Request...' : 'Submit Return Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─────────────────────────────── Orders tab ─────────────────────────────── */

const OrderCard: React.FC<{
  order: Order;
  onReview: (id: string, name: string) => void;
  onInvoice: (o: Order) => void;
  onCancel: (o: Order) => void;
  onReturn: (o: Order) => void;
}> = ({
  order,
  onReview,
  onInvoice,
  onCancel,
  onReturn
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const doneCount = order.timeline.filter((e) => e.completed).length;

  const addr = order.shippingAddress;
  const hasTracking = !!order.trackingNumber;
  const isCancelled = order.status === 'Cancelled';
  const isDelivered = order.status === 'Delivered';

  return (
    <article className="border border-[#DCE6F2] rounded-2xl overflow-hidden transition-shadow duration-200 hover:shadow-[0_10px_30px_-12px_rgba(11,37,69,0.18)]">
      {/* Header */}
      <div className="bg-[#F8FAFD] px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 border-b border-[#E8EEF5]">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-[13px]">
          <div>
            <span className="text-[#8A97A8]">Order </span>
            <span className="font-semibold text-[#12263F]">{order.orderNumber}</span>
          </div>
          {order.invoiceNumber && (
            <div>
              <span className="text-[#8A97A8]">Invoice </span>
              <span className="text-[#12263F]">{order.invoiceNumber}</span>
            </div>
          )}
          <div>
            <span className="text-[#8A97A8]">Placed </span>
            <span className="text-[#12263F]">{formatDate(order.date)}</span>
          </div>
          <div>
            <span className="text-[#8A97A8]">Total </span>
            <span className="font-semibold text-[#12263F]">{formatINR(order.totalAmount)}</span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className={`text-[12px] font-semibold px-2.5 py-1 rounded-full ${STATUS_STYLES[order.status] || STATUS_STYLES.Placed}`}>
            {order.status}
          </span>
          {order.canCancel && (
            <button
              type="button"
              onClick={() => onCancel(order)}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-[12px] font-semibold rounded-lg border border-red-200 text-red-600 bg-red-50/70 hover:bg-red-100 transition-colors cursor-pointer"
            >
              <XCircle className="w-3.5 h-3.5" />
              Cancel Order
            </button>
          )}
          {order.canReturn && (
            <button
              type="button"
              onClick={() => onReturn(order)}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-[12px] font-semibold rounded-lg border border-[#1D5FAF] text-[#1D5FAF] bg-[#EAF2FC]/70 hover:bg-[#1D5FAF] hover:text-white transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Return Product
            </button>
          )}
          <button type="button" onClick={() => onInvoice(order)} className={`${btnSecondary} !px-3 !py-1.5 !text-[13px]`}>
            <Download className="w-3.5 h-3.5" />
            Invoice
          </button>
        </div>
      </div>

      {/* Return Request Banner */}
      {order.returnRequest && (
        <div className="mx-5 mt-4 p-3.5 rounded-xl border border-purple-200 bg-[#FAF5FF] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-purple-950 font-mono">
                {order.returnRequest.returnNumber}
              </span>
              <span className="text-purple-400">·</span>
              <span className="font-medium text-purple-900">
                Reason: {order.returnRequest.reason}
              </span>
            </div>
            <p className="text-[11px] text-purple-700 mt-0.5">
              Return request submitted on {formatDate(order.returnRequest.createdAt)} · 7-day Doctor Protection Policy
            </p>
            {order.returnRequest.adminNote && (
              <p className="text-[11px] text-[#5B6B82] mt-1 bg-white/80 p-2 rounded-lg border border-purple-100">
                <span className="font-semibold text-purple-900">Store Update: </span>
                {order.returnRequest.adminNote}
              </p>
            )}
          </div>
          <span className="px-3 py-1 rounded-full text-[11px] font-semibold tracking-wide bg-purple-100 text-purple-800 border border-purple-200 uppercase">
            {order.returnRequest.status.replace(/_/g, ' ')}
          </span>
        </div>
      )}

      {/* Cancellation Notice */}
      {order.status === 'Cancelled' && (
        <div className="mx-5 mt-4 p-3 rounded-xl border border-red-200 bg-red-50/60 text-xs text-red-700 flex flex-wrap items-center justify-between gap-2">
          <span>{order.cancelReason ? `Cancellation reason: ${order.cancelReason}` : 'Order was cancelled'}</span>
          <span className="text-[11px] text-red-600 font-medium">Payment status: {order.paymentStatus}</span>
        </div>
      )}

      {/* Items */}
      <ul className="divide-y divide-[#EEF2F7]">
        {order.items.map((item, idx) => (
          <li key={`${item.productId}-${idx}`} className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-4 min-w-0 flex-1">
              <div className="w-16 h-16 rounded-lg bg-[#F6F9FD] border border-[#E8EEF5] relative overflow-hidden shrink-0">
                {item.image ? (
                  <Image src={item.image} alt={item.productName} fill className="object-contain p-1.5" sizes="64px" referrerPolicy="no-referrer" />
                ) : (
                  <span className="flex items-center justify-center w-full h-full text-[#C5CFDC]">
                    <Package className="w-7 h-7" />
                  </span>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-[12px] uppercase tracking-wide text-[#8A97A8]">{item.brandName}</p>
                <p className="text-[14px] font-semibold text-[#12263F] line-clamp-2 leading-snug">{item.productName}</p>
                {item.variantName && (
                  <p className="text-[12px] text-[#8A97A8] mt-0.5">{item.variantName}</p>
                )}
                <p className="text-[13px] text-[#5B6B82] mt-0.5">
                  Qty {item.quantity} × {formatINR(item.unitPrice)}
                  <span className="ml-2 text-[#C5CFDC]">·</span>
                  <span className="ml-2 font-mono text-[11px] text-[#8A97A8]">{item.sku}</span>
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
              <span className="text-[15px] font-semibold text-[#12263F]">{formatINR(item.totalPrice)}</span>
              {isDelivered && (
                <button
                  type="button"
                  onClick={() => onReview(item.productId, item.productName)}
                  className={`${btnSecondary} !px-3 !py-1.5 !text-[13px]`}
                >
                  <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  Write a review
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>

      {/* Tracking stepper */}
      <div className="px-5 py-4 border-t border-[#EEF2F7]">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <p className="flex items-center gap-2 text-[13px] text-[#5B6B82]">
            <Truck className="w-4 h-4 text-[#1D5FAF]" />
            {order.courierPartner || 'Shipment'}
            {hasTracking && (
              <>
                <span className="text-[#C5CFDC]">·</span>
                {order.trackingUrl ? (
                  <a
                    href={order.trackingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-[#1D5FAF] hover:underline"
                  >
                    {order.trackingNumber}
                  </a>
                ) : (
                  <span className="font-mono text-[#12263F]">{order.trackingNumber}</span>
                )}
              </>
            )}
          </p>
          {!isDelivered && !isCancelled && order.estimatedDelivery && (
            <p className="text-[13px] text-[#5B6B82]">
              Expected by <span className="font-semibold text-[#12263F]">{formatDate(order.estimatedDelivery)}</span>
            </p>
          )}
          {isDelivered && order.estimatedDelivery && (
            <p className="text-[13px] text-[#16A34A] font-medium flex items-center gap-1">
              <Check className="w-3.5 h-3.5" />
              Delivered on {formatDate(order.estimatedDelivery)}
            </p>
          )}
        </div>

        <ol className="grid grid-cols-1 sm:grid-flow-col sm:auto-cols-fr gap-3 sm:gap-0">
          {order.timeline.map((event, i) => {
            const isLastDone = i === doneCount - 1;
            return (
              <li key={i} className="relative flex sm:flex-col items-start gap-3 sm:gap-2 sm:pr-3">
                {/* connector */}
                {i < order.timeline.length - 1 && (
                  <span
                    className={`hidden sm:block absolute top-[11px] left-6 right-0 h-0.5 ${
                      order.timeline[i + 1]?.completed ? 'bg-[#16A34A]' : 'bg-[#E2E8F0]'
                    }`}
                    aria-hidden="true"
                  />
                )}
                <span
                  className={`relative z-10 w-6 h-6 shrink-0 rounded-full flex items-center justify-center ${
                    event.completed ? 'bg-[#16A34A] text-white' : 'bg-white border-2 border-[#D5DEEA]'
                  } ${isLastDone ? 'ring-4 ring-[#16A34A]/15' : ''}`}
                >
                  {event.completed && <Check className="w-3.5 h-3.5" />}
                </span>
                <span>
                  <span className={`block text-[13px] leading-tight ${event.completed ? 'font-semibold text-[#12263F]' : 'text-[#8A97A8]'}`}>
                    {event.title}
                  </span>
                  {event.date && event.date !== 'Pending' && (
                    <span className="block text-[12px] text-[#8A97A8] mt-0.5">{event.date}</span>
                  )}
                  {event.description && event.completed && (
                    <span className="block text-[11px] text-[#8A97A8] mt-0.5 leading-snug max-w-[140px]">{event.description}</span>
                  )}
                </span>
              </li>
            );
          })}
        </ol>

        <button
          type="button"
          onClick={() => setShowDetails((s) => !s)}
          aria-expanded={showDetails}
          className="mt-4 inline-flex items-center gap-1 text-[13px] font-semibold text-[#1D5FAF] hover:underline cursor-pointer"
        >
          {showDetails ? 'Hide order details' : 'View order details'}
          <ChevronDown className={`w-4 h-4 transition-transform ${showDetails ? 'rotate-180' : ''}`} />
        </button>

        {showDetails && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-[13px]">
            {/* Delivery address */}
            <div className="rounded-xl bg-[#F8FAFD] border border-[#E8EEF5] p-4">
              <p className="font-semibold text-[#12263F] mb-1.5">Delivery address</p>
              <p className="text-[#5B6B82] leading-relaxed">
                {addr.clinicHospitalName && (
                  <>
                    <span className="font-medium text-[#12263F]">{addr.clinicHospitalName}</span>
                    <br />
                  </>
                )}
                <span className="font-medium text-[#12263F]">{addr.name}</span>
                {addr.phone && <><br /><span className="text-[12px]">{addr.phone}</span></>}
                <br />
                {addr.addressLine1}
                {addr.addressLine2 && `, ${addr.addressLine2}`}
                {addr.landmark && `, ${addr.landmark}`}
                <br />
                {addr.city}, {addr.state} – {addr.pincode}
              </p>
              {order.gstDetails && (
                <div className="mt-3 pt-3 border-t border-[#E8EEF5]">
                  <p className="text-[12px] text-[#8A97A8] mb-0.5">GST / B2B Invoice</p>
                  <p className="font-semibold text-[#12263F]">{order.gstDetails.gstin}</p>
                  {order.gstDetails.legalBusinessName && (
                    <p className="text-[12px] text-[#5B6B82]">{order.gstDetails.legalBusinessName}</p>
                  )}
                </div>
              )}
            </div>

            {/* Charges summary */}
            <div className="rounded-xl bg-[#F8FAFD] border border-[#E8EEF5] p-4 space-y-1.5">
              <div className="flex justify-between text-[#5B6B82]"><span>Subtotal</span><span>{formatINR(order.subtotal)}</span></div>
              {order.discount > 0 && (
                <div className="flex justify-between text-[#16A34A]">
                  <span>Discount{order.couponCode ? ` (${order.couponCode})` : ''}</span>
                  <span>−{formatINR(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-[#5B6B82]">
                <span>Shipping & Handling</span>
                <span>{order.shipping > 0 ? formatINR(order.shipping) : 'Free'}</span>
              </div>
              <div className="flex justify-between text-[#5B6B82]"><span>GST</span><span>{formatINR(order.gstAmount)}</span></div>
              <div className="flex justify-between font-semibold text-[#12263F] pt-1.5 border-t border-[#E2E8F0]">
                <span>Total</span><span>{formatINR(order.totalAmount)}</span>
              </div>
              <p className="text-[12px] text-[#8A97A8] pt-1">{order.paymentMethod} · {order.paymentStatus}</p>
              {order.couponCode && (
                <p className="text-[12px] text-[#1D5FAF]">Coupon: <span className="font-mono font-semibold">{order.couponCode}</span></p>
              )}
            </div>
          </div>
        )}
      </div>
    </article>
  );
};

/* ──────────────────────────────── Page ──────────────────────────────── */

function AccountInner() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab') as Tab | null;

  const { user, isAuthenticated, logout, setUser, setAuthModalOpen } = useUserStore();
  const { items: wishlistItems } = useWishlistStore();
  const { rentals } = useRentalStore();
  const { addToast } = useToastStore();
  const hydrated = useHydrated();
  const siteSettings = useSiteSettings();

  const [activeTab, setActiveTab] = useState<Tab>(tabParam && TABS.includes(tabParam) ? tabParam : 'orders');
  // Follow ?tab= when it changes (header links like "Track Order" / "Wishlist")
  const [prevTabParam, setPrevTabParam] = useState(tabParam);
  if (tabParam !== prevTabParam) {
    setPrevTabParam(tabParam);
    if (tabParam && TABS.includes(tabParam)) setActiveTab(tabParam);
  }
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [reviewModalData, setReviewModalData] = useState<{ productId: string; productName: string } | null>(null);
  const [cancelModalOrder, setCancelModalOrder] = useState<Order | null>(null);
  const [returnModalOrder, setReturnModalOrder] = useState<Order | null>(null);

  const contentRef = useRef<HTMLElement>(null);

  const changeTab = useCallback(
    (tab: Tab, scrollToContent = false) => {
      setActiveTab(tab);
      router.replace(`${pathname}?tab=${tab}`, { scroll: false });
      // Bring the section into view when it's below the fold (e.g. clicked from the header tiles on mobile)
      if (scrollToContent && contentRef.current) {
        const top = contentRef.current.getBoundingClientRect().top;
        if (top < 0 || top > window.innerHeight * 0.55) {
          contentRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    },
    [router, pathname]
  );

  // Always show the latest profile, addresses and GST details from the API
  // (they may have been changed on another device since the app loaded).
  useEffect(() => {
    if (!hydrated || !isAuthenticated) return;
    let alive = true;
    fetchCurrentCustomer()
      .then((fresh) => {
        if (!alive) return;
        if (fresh) setUser(fresh);
        else logout(); // session ended elsewhere
      })
      .catch(() => undefined); // offline: keep the cached copy
    return () => {
      alive = false;
    };
  }, [hydrated, isAuthenticated, setUser, logout]);

  // Load orders
  useEffect(() => {
    let alive = true;
    getOrders()
      .then((o) => alive && setOrders(o))
      .finally(() => alive && setOrdersLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  /* ── Signed-out state ── */
  if (!hydrated) return <AccountSkeleton />;

  if (!isAuthenticated || !user) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="w-14 h-14 rounded-full bg-[#EAF2FC] text-[#1D5FAF] flex items-center justify-center mx-auto">
          <Lock className="w-7 h-7" />
        </div>
        <h1 className="mt-5 text-2xl font-semibold text-[#12263F]">Sign in to your account</h1>
        <p className="mt-2 text-[15px] text-[#5B6B82]">
          Track orders, manage rentals, save clinic addresses and GST details for faster checkout.
        </p>
        <div className="mt-7 flex flex-col sm:flex-row gap-3 justify-center">
          <button type="button" onClick={() => setAuthModalOpen(true)} className={btnPrimary}>
            Login / Sign up
          </button>
          <Link href="/" className={btnSecondary}>
            Continue shopping
          </Link>
        </div>
      </div>
    );
  }

  /* ── Handlers ── */
  const handleInvoice = (order: Order) => {
    if (!openInvoice(order, siteSettings)) {
      addToast({ type: 'error', title: 'Pop-up blocked', message: 'Allow pop-ups for this site to view the invoice.' });
    }
  };

  const handleSignOut = async () => {
    await logoutCustomer();
    logout();
    addToast({ type: 'info', title: 'Signed out', message: 'You have been signed out.' });
    router.push('/');
  };

  const navItems: { id: Tab; label: string; icon: React.ElementType; badge?: number; alert?: boolean }[] = [
    { id: 'orders', label: 'Orders', icon: Package, badge: orders.length },
    { id: 'rentals', label: 'Rentals', icon: Bed, badge: rentals.length },
    { id: 'wishlist', label: 'Wishlist', icon: Heart, badge: wishlistItems.length },
    { id: 'addresses', label: 'Addresses', icon: MapPin, badge: user.addresses.length },
    { id: 'gst', label: 'GST details', icon: FileText, badge: user.gstProfiles?.length },
    { id: 'profile', label: 'Profile', icon: UserIcon, alert: !user.phone || !user.name },
    { id: 'security', label: 'Login & devices', icon: KeyRound }
  ];

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <ProfileHeader user={user} onSignOut={handleSignOut} />

      <div className="grid grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)] gap-6 items-start">
        {/* ── Navigation ── */}
        <nav aria-label="Account sections" className="lg:sticky lg:top-6">
          <ul className="flex lg:flex-col gap-1 overflow-x-auto no-scrollbar bg-white rounded-2xl border border-[#DCE6F2] p-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <li key={item.id} className="shrink-0">
                  <button
                    type="button"
                    onClick={() => changeTab(item.id)}
                    aria-current={active ? 'page' : undefined}
                    className={`group relative w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl text-[14px] whitespace-nowrap transition-all duration-200 cursor-pointer active:scale-[0.98] ${
                      active
                        ? 'bg-[#EAF2FC] text-[#0A0A0A] font-semibold'
                        : 'text-[#0A0A0A] font-medium hover:bg-[#EEF4FC]'
                    }`}
                  >
                    {/* left indicator (desktop) */}
                    <span
                      aria-hidden="true"
                      className={`hidden lg:block absolute left-0 top-2 bottom-2 w-[3px] rounded-full bg-[#1D5FAF] transition-all duration-200 ${
                        active ? 'opacity-100' : 'opacity-0 scale-y-50 group-hover:opacity-60 group-hover:scale-y-100'
                      }`}
                    />
                    <span className="flex items-center gap-2.5 transition-transform duration-200 lg:group-hover:translate-x-0.5">
                      <Icon className={`w-[18px] h-[18px] transition-colors ${active ? 'text-[#1D5FAF]' : 'text-[#0A0A0A] group-hover:text-[#1D5FAF]'}`} />
                      {item.label}
                    </span>
                    {item.alert ? (
                      <span className="w-2 h-2 rounded-full bg-[#F28C38]" aria-label="Needs attention" />
                    ) : (
                      item.badge !== undefined &&
                      item.badge > 0 && (
                        <span
                          className={`min-w-[22px] h-[22px] px-1.5 rounded-full text-[12px] font-semibold flex items-center justify-center ${
                            active ? 'bg-[#1D5FAF] text-white' : 'bg-[#EEF2F7] text-[#0A0A0A] group-hover:bg-[#DCE8F7] group-hover:text-[#1D5FAF]'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* ── Content ── */}
        <main ref={contentRef} className="bg-white rounded-2xl border border-[#DCE6F2] p-5 sm:p-7 min-w-0 scroll-mt-6">
          {/* ORDERS */}
          {activeTab === 'orders' && (
            <>
              <SectionHeader title="Your orders" subtitle="Track shipments, download GST invoices and review products." />
              {ordersLoading ? (
                <OrderListSkeleton />
              ) : orders.length === 0 ? (
                <EmptyState
                  icon={Package}
                  title="No orders yet"
                  text="When you place an order, you can track it here."
                  cta={<Link href="/" className={btnPrimary}>Start shopping</Link>}
                />
              ) : (
                <div className="space-y-5">
                  {orders.map((order) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      onInvoice={handleInvoice}
                      onReview={(productId, productName) => setReviewModalData({ productId, productName })}
                      onCancel={(o) => setCancelModalOrder(o)}
                      onReturn={(o) => setReturnModalOrder(o)}
                    />
                  ))}
                </div>
              )}
            </>
          )}

          {/* RENTALS */}
          {activeTab === 'rentals' && <RentalsTabContent />}

          {/* WISHLIST */}
          {activeTab === 'wishlist' && (
            <>
              <SectionHeader
                title="Wishlist"
                subtitle={`${wishlistItems.length} saved ${wishlistItems.length === 1 ? 'item' : 'items'}`}
              />
              {wishlistItems.length === 0 ? (
                <EmptyState
                  icon={Heart}
                  title="Your wishlist is empty"
                  text="Tap the heart on any product to save it for later."
                  cta={<Link href="/" className={btnPrimary}>Browse products</Link>}
                />
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                  {wishlistItems.map((prod) => (
                    <ProductCard key={prod.id} product={prod} className="h-full" showSimilarStrip={false} />
                  ))}
                </div>
              )}
            </>
          )}

          {activeTab === 'addresses' && <AddressesTab user={user} />}
          {activeTab === 'gst' && <GstTab user={user} />}
          {activeTab === 'profile' && <ProfileTab user={user} />}
          {activeTab === 'security' && <SecurityTab user={user} />}
        </main>
      </div>

      {reviewModalData && (
        <WriteReviewModal
          productId={reviewModalData.productId}
          productName={reviewModalData.productName}
          isOpen
          onClose={() => setReviewModalData(null)}
          onSuccess={() => {
            setReviewModalData(null);
            addToast({ type: 'success', title: 'Review submitted', message: 'Thanks! It will appear after moderation.' });
          }}
        />
      )}

      {cancelModalOrder && (
        <CancelOrderModal
          order={cancelModalOrder}
          isOpen={Boolean(cancelModalOrder)}
          onClose={() => setCancelModalOrder(null)}
          onSuccess={(updated) => {
            setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
          }}
        />
      )}

      {returnModalOrder && (
        <ReturnOrderModal
          order={returnModalOrder}
          isOpen={Boolean(returnModalOrder)}
          onClose={() => setReturnModalOrder(null)}
          onSuccess={(updated) => {
            setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
          }}
        />
      )}
    </div>
  );
}

export default function AccountPage() {
  return (
    <Suspense
      fallback={<AccountSkeleton />}
    >
      <AccountInner />
    </Suspense>
  );
}
