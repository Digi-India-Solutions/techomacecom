'use client';

import React, { useState, useEffect, Suspense, useCallback, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useUserStore, useWishlistStore, useRentalStore, useToastStore } from '@/lib/store';
import { getOrders } from '@/lib/api';
import type { Order, Address } from '@/types';
import ProductCard from '@/components/product/ProductCard';
import RentalsTabContent from '@/components/account/RentalsTabContent';
import WriteReviewModal from '@/components/product/WriteReviewModal';
import {
  User as UserIcon,
  Package,
  MapPin,
  FileText,
  Heart,
  Bed,
  Download,
  Plus,
  Trash2,
  Pencil,
  Check,
  CheckCircle2,
  Clock,
  ChevronDown,
  LogOut,
  Star,
  Truck,
  Loader2,
  ShieldCheck,
  X,
  Lock
} from 'lucide-react';

type Tab = 'orders' | 'rentals' | 'wishlist' | 'addresses' | 'gst' | 'profile';
const TABS: Tab[] = ['orders', 'rentals', 'wishlist', 'addresses', 'gst', 'profile'];

const GSTIN_REGEX = /^[0-3][0-9][A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

const inputClass =
  'w-full text-sm px-3.5 py-2.5 bg-white border border-[#D5DEEA] rounded-lg text-[#12263F] placeholder-[#97A3B4] focus:outline-none focus:border-[#1D5FAF] focus:ring-3 focus:ring-[#1D5FAF]/15 transition disabled:bg-[#F6F9FD] disabled:text-[#5B6B82]';

const btnPrimary =
  'inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#1D5FAF] hover:bg-[#174E90] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors cursor-pointer';
const btnSecondary =
  'inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-[#D5DEEA] bg-white hover:border-[#1D5FAF] hover:text-[#1D5FAF] text-[#12263F] text-sm font-semibold transition-colors cursor-pointer';

const formatINR = (n: number) => `₹${n.toLocaleString('en-IN')}`;
const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

const STATUS_STYLES: Record<string, string> = {
  Placed: 'bg-slate-100 text-slate-700',
  Confirmed: 'bg-blue-50 text-blue-700',
  Packed: 'bg-amber-50 text-amber-800',
  Dispatched: 'bg-indigo-50 text-indigo-700',
  Delivered: 'bg-green-50 text-green-700',
  Cancelled: 'bg-red-50 text-red-700'
};

/* ─────────────────────────── Small building blocks ─────────────────────────── */

const Field: React.FC<{ label: string; htmlFor: string; required?: boolean; error?: string; hint?: string; children: React.ReactNode }> = ({
  label,
  htmlFor,
  required,
  error,
  hint,
  children
}) => (
  <div>
    <label htmlFor={htmlFor} className="block text-[13px] font-semibold text-[#12263F] mb-1.5">
      {label}
      {required && <span className="text-[#DC2626] ml-0.5">*</span>}
    </label>
    {children}
    {error ? (
      <p className="mt-1 text-[12px] text-[#DC2626]">{error}</p>
    ) : hint ? (
      <p className="mt-1 text-[12px] text-[#8A97A8]">{hint}</p>
    ) : null}
  </div>
);

const SectionHeader: React.FC<{ title: string; subtitle?: string; action?: React.ReactNode }> = ({ title, subtitle, action }) => (
  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-5 mb-6 border-b border-[#E8EEF5]">
    <div>
      <h2 className="text-xl font-semibold text-[#12263F]">{title}</h2>
      {subtitle && <p className="text-[14px] text-[#5B6B82] mt-1">{subtitle}</p>}
    </div>
    {action}
  </div>
);

const EmptyState: React.FC<{ icon: React.ElementType; title: string; text: string; cta?: React.ReactNode }> = ({
  icon: Icon,
  title,
  text,
  cta
}) => (
  <div className="text-center py-14 px-6 border border-dashed border-[#D5DEEA] rounded-2xl">
    <div className="w-12 h-12 rounded-full bg-[#EAF2FC] text-[#1D5FAF] flex items-center justify-center mx-auto">
      <Icon className="w-6 h-6" />
    </div>
    <h3 className="mt-4 text-[16px] font-semibold text-[#12263F]">{title}</h3>
    <p className="mt-1 text-[14px] text-[#5B6B82] max-w-sm mx-auto">{text}</p>
    {cta && <div className="mt-5">{cta}</div>}
  </div>
);

/** Opens a print-ready GST invoice in a new tab (user can Save as PDF). */
function openInvoice(order: Order) {
  const addr = order.shippingAddress;
  const rows = order.items
    .map(
      (it, i) => `<tr><td>${i + 1}</td><td>${it.productName}<div class="muted">${it.brandName} · SKU ${it.sku}</div></td>
      <td class="r">${it.quantity}</td><td class="r">${formatINR(it.unitPrice)}</td><td class="r">${formatINR(it.totalPrice)}</td></tr>`
    )
    .join('');
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Invoice ${order.orderNumber}</title>
  <style>
    body{font-family:Poppins,system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#12263F;margin:40px;font-size:13px}
    h1{font-size:20px;margin:0}.muted{color:#5B6B82;font-size:12px}.r{text-align:right}
    .top{display:flex;justify-content:space-between;border-bottom:2px solid #12263F;padding-bottom:16px;margin-bottom:20px}
    .grid{display:flex;gap:40px;margin-bottom:24px}table{width:100%;border-collapse:collapse}
    th,td{padding:10px 8px;border-bottom:1px solid #E2E8F0;vertical-align:top}th{text-align:left;background:#F6F9FD;font-size:12px}
    .tot{width:280px;margin-left:auto;margin-top:16px}.tot td{border:0;padding:4px 8px}.tot .g td{font-weight:700;font-size:15px;border-top:2px solid #12263F;padding-top:8px}
    @media print{body{margin:16mm}button{display:none}}
  </style></head><body>
  <div class="top"><div><h1>Buy Denmed Healthcare Pvt. Ltd.</h1><div class="muted">Okhla Industrial Area Phase-III, New Delhi – 110020</div></div>
  <div class="r"><strong>TAX INVOICE</strong><div class="muted">${order.orderNumber}</div><div class="muted">${formatDate(order.date)}</div></div></div>
  <div class="grid"><div><div class="muted">Bill / ship to</div><strong>${addr.clinicHospitalName || addr.name}</strong><div>${addr.name}</div>
  <div>${addr.addressLine1}${addr.addressLine2 ? ', ' + addr.addressLine2 : ''}</div><div>${addr.city}, ${addr.state} – ${addr.pincode}</div></div>
  <div><div class="muted">GSTIN</div><strong>${order.gstDetails?.gstin || '—'}</strong><div class="muted" style="margin-top:8px">Payment</div><div>${order.paymentMethod} · ${order.paymentStatus}</div></div></div>
  <table><thead><tr><th>#</th><th>Item</th><th class="r">Qty</th><th class="r">Unit price</th><th class="r">Amount</th></tr></thead><tbody>${rows}</tbody></table>
  <table class="tot"><tr><td>Subtotal</td><td class="r">${formatINR(order.subtotal)}</td></tr>
  ${order.discount ? `<tr><td>Discount</td><td class="r">−${formatINR(order.discount)}</td></tr>` : ''}
  <tr><td>Shipping</td><td class="r">${order.shipping ? formatINR(order.shipping) : 'Free'}</td></tr>
  <tr><td>GST</td><td class="r">${formatINR(order.gstAmount)}</td></tr>
  <tr class="g"><td>Total</td><td class="r">${formatINR(order.totalAmount)}</td></tr></table>
  <p class="muted" style="margin-top:40px">This is a computer-generated invoice.</p>
  <button onclick="window.print()" style="margin-top:12px;padding:10px 18px;border:0;border-radius:8px;background:#1D5FAF;color:#fff;font-weight:600;cursor:pointer">Print / Save as PDF</button>
  </body></html>`;
  const w = window.open('', '_blank');
  if (!w) return false;
  w.document.open();
  w.document.write(html);
  w.document.close();
  return true;
}

/* ─────────────────────────────── Orders tab ─────────────────────────────── */

const OrderCard: React.FC<{ order: Order; onReview: (id: string, name: string) => void; onInvoice: (o: Order) => void }> = ({
  order,
  onReview,
  onInvoice
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const doneCount = order.timeline.filter((e) => e.completed).length;

  return (
    <article className="border border-[#DCE6F2] rounded-2xl overflow-hidden transition-shadow duration-200 hover:shadow-[0_10px_30px_-12px_rgba(11,37,69,0.18)]">
      {/* Header */}
      <div className="bg-[#F8FAFD] px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 border-b border-[#E8EEF5]">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-[13px]">
          <div>
            <span className="text-[#8A97A8]">Order </span>
            <span className="font-semibold text-[#12263F]">{order.orderNumber}</span>
          </div>
          <div>
            <span className="text-[#8A97A8]">Placed </span>
            <span className="text-[#12263F]">{formatDate(order.date)}</span>
          </div>
          <div>
            <span className="text-[#8A97A8]">Total </span>
            <span className="font-semibold text-[#12263F]">{formatINR(order.totalAmount)}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-[12px] font-semibold px-2.5 py-1 rounded-full ${STATUS_STYLES[order.status] || STATUS_STYLES.Placed}`}>
            {order.status}
          </span>
          <button type="button" onClick={() => onInvoice(order)} className={`${btnSecondary} !px-3 !py-1.5 !text-[13px]`}>
            <Download className="w-3.5 h-3.5" />
            Invoice
          </button>
        </div>
      </div>

      {/* Items */}
      <ul className="divide-y divide-[#EEF2F7]">
        {order.items.map((item, idx) => (
          <li key={`${item.productId}-${idx}`} className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-4 min-w-0 flex-1">
              <div className="w-16 h-16 rounded-lg bg-[#F6F9FD] border border-[#E8EEF5] relative overflow-hidden shrink-0">
                <Image src={item.image} alt={item.productName} fill className="object-contain p-1.5" sizes="64px" referrerPolicy="no-referrer" />
              </div>
              <div className="min-w-0">
                <p className="text-[12px] uppercase tracking-wide text-[#8A97A8]">{item.brandName}</p>
                <p className="text-[14px] font-semibold text-[#12263F] line-clamp-2 leading-snug">{item.productName}</p>
                <p className="text-[13px] text-[#5B6B82] mt-0.5">
                  Qty {item.quantity} × {formatINR(item.unitPrice)}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
              <span className="text-[15px] font-semibold text-[#12263F]">{formatINR(item.totalPrice)}</span>
              {order.status !== 'Cancelled' && (
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
            {order.courierPartner || 'Courier'}
            {order.trackingNumber && (
              <>
                <span className="text-[#C5CFDC]">·</span>
                <span className="font-mono text-[#12263F]">{order.trackingNumber}</span>
              </>
            )}
          </p>
          {order.status !== 'Delivered' && order.status !== 'Cancelled' && order.estimatedDelivery && (
            <p className="text-[13px] text-[#5B6B82]">
              Expected by <span className="font-semibold text-[#12263F]">{formatDate(order.estimatedDelivery)}</span>
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
                  <span className="block text-[12px] text-[#8A97A8] mt-0.5">{event.date}</span>
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
            <div className="rounded-xl bg-[#F8FAFD] border border-[#E8EEF5] p-4">
              <p className="font-semibold text-[#12263F] mb-1.5">Delivery address</p>
              <p className="text-[#5B6B82] leading-relaxed">
                {order.shippingAddress.clinicHospitalName && (
                  <>
                    <span className="text-[#12263F]">{order.shippingAddress.clinicHospitalName}</span>
                    <br />
                  </>
                )}
                {order.shippingAddress.addressLine1}
                {order.shippingAddress.addressLine2 && `, ${order.shippingAddress.addressLine2}`}
                <br />
                {order.shippingAddress.city}, {order.shippingAddress.state} – {order.shippingAddress.pincode}
              </p>
            </div>
            <div className="rounded-xl bg-[#F8FAFD] border border-[#E8EEF5] p-4 space-y-1.5">
              <div className="flex justify-between text-[#5B6B82]"><span>Subtotal</span><span>{formatINR(order.subtotal)}</span></div>
              {order.discount > 0 && (
                <div className="flex justify-between text-[#16A34A]"><span>Discount</span><span>−{formatINR(order.discount)}</span></div>
              )}
              <div className="flex justify-between text-[#5B6B82]"><span>Shipping</span><span>{order.shipping ? formatINR(order.shipping) : 'Free'}</span></div>
              <div className="flex justify-between text-[#5B6B82]"><span>GST</span><span>{formatINR(order.gstAmount)}</span></div>
              <div className="flex justify-between font-semibold text-[#12263F] pt-1.5 border-t border-[#E2E8F0]">
                <span>Total</span><span>{formatINR(order.totalAmount)}</span>
              </div>
              <p className="text-[12px] text-[#8A97A8] pt-1">{order.paymentMethod} · {order.paymentStatus}</p>
            </div>
          </div>
        )}
      </div>
    </article>
  );
};

/* ────────────────────────────── Address form ────────────────────────────── */

type AddressDraft = Omit<Address, 'id'>;

const blankAddress = (name = '', phone = ''): AddressDraft => ({
  type: 'Clinic',
  name,
  clinicHospitalName: '',
  phone,
  addressLine1: '',
  addressLine2: '',
  pincode: '',
  city: '',
  state: '',
  isDefault: false
});

const AddressForm: React.FC<{
  initial: AddressDraft;
  isEdit: boolean;
  onCancel: () => void;
  onSave: (a: AddressDraft) => void;
}> = ({ initial, isEdit, onCancel, onSave }) => {
  const [draft, setDraft] = useState<AddressDraft>(initial);
  const set = <K extends keyof AddressDraft>(k: K, v: AddressDraft[K]) => setDraft((d) => ({ ...d, [k]: v }));

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave(draft);
      }}
      className="rounded-2xl border border-[#1D5FAF]/30 bg-[#F8FAFD] p-5 sm:p-6 mb-6"
    >
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-[16px] font-semibold text-[#12263F]">{isEdit ? 'Edit address' : 'Add a new address'}</h3>
        <button type="button" onClick={onCancel} className="p-1.5 rounded-md text-[#5B6B82] hover:bg-white cursor-pointer" aria-label="Close">
          <X className="w-4 h-4" />
        </button>
      </div>

      <fieldset className="mb-5">
        <legend className="text-[13px] font-semibold text-[#12263F] mb-2">Address type</legend>
        <div className="flex flex-wrap gap-2">
          {(['Clinic', 'Hospital', 'Office', 'Home'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => set('type', t)}
              aria-pressed={draft.type === t}
              className={`px-3.5 py-1.5 rounded-full text-[13px] border transition-colors cursor-pointer ${
                draft.type === t ? 'bg-[#1D5FAF] border-[#1D5FAF] text-white' : 'bg-white border-[#D5DEEA] text-[#12263F] hover:border-[#9DB4D3]'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Contact name" htmlFor="ad-name" required>
          <input id="ad-name" required value={draft.name} onChange={(e) => set('name', e.target.value)} className={inputClass} autoComplete="name" />
        </Field>
        <Field label="Mobile number" htmlFor="ad-phone" required>
          <input
            id="ad-phone"
            required
            type="tel"
            inputMode="numeric"
            pattern="(\+91\s?)?[6-9][0-9]{9}"
            title="10-digit Indian mobile number"
            value={draft.phone}
            onChange={(e) => set('phone', e.target.value)}
            className={inputClass}
            autoComplete="tel"
          />
        </Field>
        {draft.type !== 'Home' && (
          <div className="sm:col-span-2">
            <Field label="Clinic / hospital name" htmlFor="ad-org">
              <input
                id="ad-org"
                value={draft.clinicHospitalName || ''}
                onChange={(e) => set('clinicHospitalName', e.target.value)}
                className={inputClass}
                autoComplete="organization"
              />
            </Field>
          </div>
        )}
        <div className="sm:col-span-2">
          <Field label="Address line 1" htmlFor="ad-l1" required>
            <input
              id="ad-l1"
              required
              placeholder="Building, floor, street"
              value={draft.addressLine1}
              onChange={(e) => set('addressLine1', e.target.value)}
              className={inputClass}
              autoComplete="address-line1"
            />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field label="Address line 2" htmlFor="ad-l2">
            <input
              id="ad-l2"
              placeholder="Area, landmark (optional)"
              value={draft.addressLine2 || ''}
              onChange={(e) => set('addressLine2', e.target.value)}
              className={inputClass}
              autoComplete="address-line2"
            />
          </Field>
        </div>
        <Field label="PIN code" htmlFor="ad-pin" required>
          <input
            id="ad-pin"
            required
            inputMode="numeric"
            pattern="[1-9][0-9]{5}"
            title="6-digit PIN code"
            maxLength={6}
            value={draft.pincode}
            onChange={(e) => set('pincode', e.target.value.replace(/\D/g, ''))}
            className={inputClass}
            autoComplete="postal-code"
          />
        </Field>
        <Field label="City" htmlFor="ad-city" required>
          <input id="ad-city" required value={draft.city} onChange={(e) => set('city', e.target.value)} className={inputClass} autoComplete="address-level2" />
        </Field>
        <Field label="State" htmlFor="ad-state" required>
          <input id="ad-state" required value={draft.state} onChange={(e) => set('state', e.target.value)} className={inputClass} autoComplete="address-level1" />
        </Field>
        <label className="flex items-center gap-2.5 self-end pb-2.5 text-[14px] text-[#12263F] cursor-pointer">
          <input
            type="checkbox"
            checked={draft.isDefault}
            onChange={(e) => set('isDefault', e.target.checked)}
            className="w-4 h-4 accent-[#1D5FAF]"
          />
          Make this my default address
        </label>
      </div>

      <div className="flex justify-end gap-2 mt-6">
        <button type="button" onClick={onCancel} className={btnSecondary}>
          Cancel
        </button>
        <button type="submit" className={btnPrimary}>
          {isEdit ? 'Save changes' : 'Save address'}
        </button>
      </div>
    </form>
  );
};

/* ──────────────────────────────── Page ──────────────────────────────── */

function AccountInner() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab') as Tab | null;

  const { user, isAuthenticated, logout, updateUser, addAddress, updateAddress, removeAddress, setDefaultAddress, updateGst, setAuthModalOpen } =
    useUserStore();
  const { items: wishlistItems } = useWishlistStore();
  const { rentals } = useRentalStore();
  const { addToast } = useToastStore();

  const [activeTab, setActiveTab] = useState<Tab>(tabParam && TABS.includes(tabParam) ? tabParam : 'orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [reviewModalData, setReviewModalData] = useState<{ productId: string; productName: string } | null>(null);

  // Address editor: null = closed, 'new' = adding, otherwise the id being edited
  const [editingAddress, setEditingAddress] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Profile form
  const [profile, setProfile] = useState({ name: '', phone: '', email: '', degree: '', registrationNumber: '' });
  const [profileSaving, setProfileSaving] = useState(false);

  // GST form
  const [gstin, setGstin] = useState('');
  const [legalName, setLegalName] = useState('');
  const [gstTouched, setGstTouched] = useState(false);

  // Keep the tab in sync with ?tab= (header links like "Track Order" / "Wishlist")
  useEffect(() => {
    if (tabParam && TABS.includes(tabParam)) setActiveTab(tabParam);
  }, [tabParam]);

  const contentRef = useRef<HTMLElement>(null);

  const changeTab = useCallback(
    (tab: Tab, scrollToContent = false) => {
      setActiveTab(tab);
      setEditingAddress(null);
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

  // Fill forms from the signed-in user
  useEffect(() => {
    if (!user) return;
    setProfile({
      name: user.name || '',
      phone: user.phone || '',
      email: user.email || '',
      degree: user.degree || '',
      registrationNumber: user.registrationNumber || ''
    });
    setGstin(user.gstDetails?.gstin || '');
    setLegalName(user.gstDetails?.legalBusinessName || '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  /* ── Signed-out state ── */
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
    if (!openInvoice(order)) {
      addToast({ type: 'error', title: 'Pop-up blocked', message: 'Allow pop-ups for this site to view the invoice.' });
    }
  };

  const handleSignOut = () => {
    logout();
    addToast({ type: 'info', title: 'Signed out', message: 'You have been signed out.' });
    router.push('/');
  };

  const profileDirty =
    profile.name !== (user.name || '') ||
    profile.phone !== (user.phone || '') ||
    profile.email !== (user.email || '') ||
    profile.degree !== (user.degree || '') ||
    profile.registrationNumber !== (user.registrationNumber || '');

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    await new Promise((r) => setTimeout(r, 400));
    updateUser({
      name: profile.name.trim(),
      phone: profile.phone.trim(),
      email: profile.email.trim(),
      degree: profile.degree.trim() || undefined,
      registrationNumber: profile.registrationNumber.trim() || undefined
    });
    setProfileSaving(false);
    addToast({ type: 'success', title: 'Profile updated', message: 'Your details have been saved.' });
  };

  const gstValid = GSTIN_REGEX.test(gstin);
  const gstError = gstTouched && gstin && !gstValid ? 'Enter a valid 15-character GSTIN, e.g. 09AAACM1234F1Z8' : undefined;
  const gstDirty = gstin !== (user.gstDetails?.gstin || '') || legalName !== (user.gstDetails?.legalBusinessName || '');

  const handleSaveGst = (e: React.FormEvent) => {
    e.preventDefault();
    setGstTouched(true);
    if (!gstValid || !legalName.trim()) return;
    updateGst({ gstin, legalBusinessName: legalName.trim(), isVerified: false });
    addToast({ type: 'success', title: 'GST details saved', message: 'They will be added to invoices at checkout.' });
  };

  const handleRemoveGst = () => {
    updateUser({ gstDetails: undefined });
    setGstin('');
    setLegalName('');
    setGstTouched(false);
    addToast({ type: 'info', title: 'GST details removed', message: 'Invoices will be issued without a GSTIN.' });
  };

  const handleSaveAddress = (draft: AddressDraft) => {
    if (editingAddress === 'new') {
      addAddress({ ...draft, id: `addr-${Date.now()}`, isDefault: draft.isDefault || user.addresses.length === 0 });
      addToast({ type: 'success', title: 'Address added', message: 'You can now select it at checkout.' });
    } else if (editingAddress) {
      updateAddress(editingAddress, draft);
      addToast({ type: 'success', title: 'Address updated', message: 'Your changes have been saved.' });
    }
    setEditingAddress(null);
  };

  const handleDeleteAddress = (id: string) => {
    removeAddress(id);
    setConfirmDeleteId(null);
    addToast({ type: 'info', title: 'Address removed', message: 'The address was deleted.' });
  };

  const navItems: { id: Tab; label: string; icon: React.ElementType; badge?: number }[] = [
    { id: 'orders', label: 'Orders', icon: Package, badge: orders.length },
    { id: 'rentals', label: 'Rentals', icon: Bed, badge: rentals.length },
    { id: 'wishlist', label: 'Wishlist', icon: Heart, badge: wishlistItems.length },
    { id: 'addresses', label: 'Addresses', icon: MapPin, badge: user.addresses.length },
    { id: 'gst', label: 'GST details', icon: FileText },
    { id: 'profile', label: 'Profile', icon: UserIcon }
  ];

  const initials = user.name
    .replace(/^Dr\.?\s*/i, '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');

  const editingInitial: AddressDraft | null =
    editingAddress === 'new'
      ? blankAddress(user.name, user.phone)
      : editingAddress
      ? (() => {
          const a = user.addresses.find((x) => x.id === editingAddress);
          if (!a) return null;
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { id, ...rest } = a;
          return rest;
        })()
      : null;

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 sm:py-8">
      {/* ── Profile header ── */}
      <section className="bg-white rounded-2xl border border-[#DCE6F2] p-5 sm:p-6 mb-6 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#0B2545] text-white flex items-center justify-center text-xl font-semibold shrink-0">
            {initials || <UserIcon className="w-7 h-7" />}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-semibold text-[#12263F] truncate">{user.name}</h1>
              {user.registrationNumber && (
                <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#16A34A] bg-[#DCFCE7] px-2 py-0.5 rounded-full">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Registered practitioner
                </span>
              )}
            </div>
            <p className="text-[14px] text-[#5B6B82] mt-1 truncate">
              {[user.degree, user.registrationNumber && `Reg. ${user.registrationNumber}`].filter(Boolean).join(' · ') || user.email}
            </p>
            <p className="text-[13px] text-[#8A97A8] mt-0.5 truncate">
              {user.phone && `+91 ${user.phone.replace(/^\+91\s?/, '')}`} {user.phone && user.email && '·'} {user.email}
            </p>
          </div>
        </div>

        <div className="flex items-center">
          <button
            type="button"
            onClick={handleSignOut}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-[#D5DEEA] bg-white text-[#12263F] text-sm font-semibold shrink-0 cursor-pointer transition-colors hover:border-[#DC2626]/50 hover:bg-red-50 hover:text-[#DC2626]"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </section>

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
                    {item.badge !== undefined && item.badge > 0 && (
                      <span
                        className={`min-w-[22px] h-[22px] px-1.5 rounded-full text-[12px] font-semibold flex items-center justify-center ${
                          active ? 'bg-[#1D5FAF] text-white' : 'bg-[#EEF2F7] text-[#0A0A0A] group-hover:bg-[#DCE8F7] group-hover:text-[#1D5FAF]'
                        }`}
                      >
                        {item.badge}
                      </span>
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
                <div className="space-y-4">
                  {[0, 1].map((i) => (
                    <div key={i} className="h-48 rounded-2xl bg-[#F3F6FA] animate-pulse" />
                  ))}
                </div>
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

          {/* ADDRESSES */}
          {activeTab === 'addresses' && (
            <>
              <SectionHeader
                title="Saved addresses"
                subtitle="Clinic, hospital and home delivery locations."
                action={
                  editingAddress === null && (
                    <button type="button" onClick={() => setEditingAddress('new')} className={btnPrimary}>
                      <Plus className="w-4 h-4" />
                      Add address
                    </button>
                  )
                }
              />

              {editingInitial && (
                <AddressForm
                  key={editingAddress}
                  initial={editingInitial}
                  isEdit={editingAddress !== 'new'}
                  onCancel={() => setEditingAddress(null)}
                  onSave={handleSaveAddress}
                />
              )}

              {user.addresses.length === 0 && editingAddress === null ? (
                <EmptyState
                  icon={MapPin}
                  title="No saved addresses"
                  text="Add your clinic or hospital address for faster checkout."
                  cta={
                    <button type="button" onClick={() => setEditingAddress('new')} className={btnPrimary}>
                      <Plus className="w-4 h-4" /> Add address
                    </button>
                  }
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {user.addresses.map((addr) => (
                    <div
                      key={addr.id}
                      className={`rounded-2xl border p-5 flex flex-col ${
                        addr.isDefault ? 'border-[#1D5FAF] ring-1 ring-[#1D5FAF]/20' : 'border-[#DCE6F2]'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[12px] font-semibold uppercase tracking-wide text-[#5B6B82] bg-[#EEF2F7] px-2 py-0.5 rounded">
                          {addr.type}
                        </span>
                        {addr.isDefault && (
                          <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#1D5FAF]">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Default
                          </span>
                        )}
                      </div>
                      <p className="text-[15px] font-semibold text-[#12263F]">{addr.clinicHospitalName || addr.name}</p>
                      {addr.clinicHospitalName && <p className="text-[14px] text-[#12263F]">{addr.name}</p>}
                      <p className="text-[14px] text-[#5B6B82] mt-1 leading-relaxed">
                        {addr.addressLine1}
                        {addr.addressLine2 && `, ${addr.addressLine2}`}
                        <br />
                        {addr.city}, {addr.state} – {addr.pincode}
                      </p>
                      <p className="text-[13px] text-[#5B6B82] mt-1">Phone: {addr.phone}</p>

                      <div className="mt-auto pt-4">
                        {confirmDeleteId === addr.id ? (
                          <div className="flex flex-wrap items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-100">
                            <span className="text-[13px] text-red-800 flex-1">Delete this address?</span>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(null)}
                              className="px-3 py-1.5 rounded-md text-[13px] font-semibold text-[#12263F] bg-white border border-[#D5DEEA] cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteAddress(addr.id)}
                              className="px-3 py-1.5 rounded-md text-[13px] font-semibold text-white bg-[#DC2626] hover:bg-[#B91C1C] cursor-pointer"
                            >
                              Delete
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-4 pt-3 border-t border-[#EEF2F7] text-[13px] font-semibold">
                            <button
                              type="button"
                              onClick={() => setEditingAddress(addr.id)}
                              className="inline-flex items-center gap-1.5 text-[#1D5FAF] hover:underline cursor-pointer"
                            >
                              <Pencil className="w-3.5 h-3.5" /> Edit
                            </button>
                            {!addr.isDefault && (
                              <button
                                type="button"
                                onClick={() => {
                                  setDefaultAddress(addr.id);
                                  addToast({ type: 'success', title: 'Default address updated', message: addr.clinicHospitalName || addr.name });
                                }}
                                className="text-[#1D5FAF] hover:underline cursor-pointer"
                              >
                                Set as default
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(addr.id)}
                              className="inline-flex items-center gap-1.5 ml-auto text-[#5B6B82] hover:text-[#DC2626] cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* GST */}
          {activeTab === 'gst' && (
            <>
              <SectionHeader title="GST details" subtitle="Added to your tax invoices so you can claim input tax credit." />
              <form onSubmit={handleSaveGst} className="max-w-xl space-y-5" noValidate>
                <Field label="GSTIN" htmlFor="gst-gstin" required error={gstError} hint="15 characters, as on your GST certificate">
                  <div className="relative">
                    <input
                      id="gst-gstin"
                      value={gstin}
                      maxLength={15}
                      onChange={(e) => setGstin(e.target.value.toUpperCase().replace(/[^0-9A-Z]/g, ''))}
                      onBlur={() => setGstTouched(true)}
                      placeholder="09AAACM1234F1Z8"
                      className={`${inputClass} font-mono tracking-wider pr-10 ${gstError ? '!border-[#DC2626]' : ''}`}
                    />
                    {gstValid && <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#16A34A]" />}
                  </div>
                </Field>
                <Field
                  label="Legal business name"
                  htmlFor="gst-name"
                  required
                  error={gstTouched && !legalName.trim() ? 'Enter the name registered with GST' : undefined}
                >
                  <input
                    id="gst-name"
                    value={legalName}
                    onChange={(e) => setLegalName(e.target.value)}
                    placeholder="As on GST registration"
                    className={inputClass}
                  />
                </Field>

                {gstValid && (
                  <p className="text-[13px] text-[#5B6B82] bg-[#F8FAFD] border border-[#E8EEF5] rounded-lg px-3.5 py-2.5">
                    State code <span className="font-semibold text-[#12263F]">{gstin.slice(0, 2)}</span> · PAN{' '}
                    <span className="font-mono font-semibold text-[#12263F]">{gstin.slice(2, 12)}</span>
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <button type="submit" disabled={!gstDirty} className={btnPrimary}>
                    Save GST details
                  </button>
                  {user.gstDetails?.gstin && (
                    <button type="button" onClick={handleRemoveGst} className="text-[14px] font-semibold text-[#5B6B82] hover:text-[#DC2626] cursor-pointer">
                      Remove
                    </button>
                  )}
                </div>
              </form>
            </>
          )}

          {/* PROFILE */}
          {activeTab === 'profile' && (
            <>
              <SectionHeader title="Profile" subtitle="Your details appear on quotations and invoices." />
              <form onSubmit={handleSaveProfile} className="max-w-2xl">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <Field label="Full name" htmlFor="pf-name" required>
                    <input
                      id="pf-name"
                      required
                      value={profile.name}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                      className={inputClass}
                      autoComplete="name"
                    />
                  </Field>
                  <Field label="Mobile number" htmlFor="pf-phone" required>
                    <input
                      id="pf-phone"
                      required
                      type="tel"
                      inputMode="numeric"
                      pattern="(\+91\s?)?[6-9][0-9]{9}"
                      title="10-digit Indian mobile number"
                      value={profile.phone}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                      className={inputClass}
                      autoComplete="tel"
                    />
                  </Field>
                  <div className="sm:col-span-2">
                    <Field label="Email" htmlFor="pf-email" required>
                      <input
                        id="pf-email"
                        required
                        type="email"
                        value={profile.email}
                        onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                        className={inputClass}
                        autoComplete="email"
                      />
                    </Field>
                  </div>
                  <Field label="Qualification" htmlFor="pf-degree" hint="e.g. BDS, MDS (Prosthodontics)">
                    <input
                      id="pf-degree"
                      value={profile.degree}
                      onChange={(e) => setProfile({ ...profile, degree: e.target.value })}
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Council registration no." htmlFor="pf-reg" hint="Dental / Medical Council number">
                    <input
                      id="pf-reg"
                      value={profile.registrationNumber}
                      onChange={(e) => setProfile({ ...profile, registrationNumber: e.target.value.toUpperCase() })}
                      className={`${inputClass} font-mono`}
                    />
                  </Field>
                </div>

                <div className="flex flex-wrap items-center gap-3 mt-7 pt-5 border-t border-[#E8EEF5]">
                  <button type="submit" disabled={!profileDirty || profileSaving} className={btnPrimary}>
                    {profileSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    {profileSaving ? 'Saving…' : 'Save changes'}
                  </button>
                  {profileDirty && !profileSaving && (
                    <button
                      type="button"
                      onClick={() =>
                        setProfile({
                          name: user.name || '',
                          phone: user.phone || '',
                          email: user.email || '',
                          degree: user.degree || '',
                          registrationNumber: user.registrationNumber || ''
                        })
                      }
                      className="text-[14px] font-semibold text-[#5B6B82] hover:text-[#12263F] cursor-pointer"
                    >
                      Discard changes
                    </button>
                  )}
                </div>
              </form>
            </>
          )}
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
    </div>
  );
}

export default function AccountPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-[1400px] mx-auto p-12 flex items-center justify-center gap-3 text-[#5B6B82]">
          <Clock className="w-5 h-5 animate-spin text-[#1D5FAF]" />
          Loading your account…
        </div>
      }
    >
      <AccountInner />
    </Suspense>
  );
}
