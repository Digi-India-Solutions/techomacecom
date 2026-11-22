import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Ban,
  Building2,
  CheckCircle2,
  Mail,
  MapPin,
  Phone,
} from 'lucide-react';
import type {
  CustomerRecord,
  EnquiryRecord,
  Order,
  ProductReview,
  RentalBooking,
} from '@/types/admin';
import {
  addCustomerNote,
  getCustomerById,
  toggleCustomerBlock,
} from '@/lib/api/admin/customers';
import { listOrders } from '@/lib/api/admin/orders';
import { listRentals } from '@/lib/api/admin/rentals';
import { listEnquiries } from '@/lib/api/admin/enquiries';
import { listReviews } from '@/lib/api/admin/reviews';
import { formatINR, formatShortDate } from '@/lib/api/admin/client';
import { useAuth } from '@/components/admin/AuthContext';
import { useToast } from '@/components/admin/ToastProvider';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { textareaClass } from '@/components/admin/FormField';

export function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [customer, setCustomer] = useState<CustomerRecord | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [rentals, setRentals] = useState<RentalBooking[]>([]);
  const [enquiries, setEnquiries] = useState<EnquiryRecord[]>([]);
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [noteInput, setNoteInput] = useState('');

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    Promise.all([
      getCustomerById(id),
      listOrders().catch(() => []), // the profile still loads if orders cannot be read
      listRentals()
        .then((res) => res.items)
        .catch(() => [] as RentalBooking[]),
      listEnquiries(),
      listReviews('all'),
    ])
      .then(([cust, allOrders, allRentals, allEnquiries, allReviews]) => {
        if (cancelled) return;
        setCustomer(cust);
        if (cust) {
          setOrders(
            allOrders.filter(
              (o) => o.customerId === cust.id || o.customerName === cust.name
            )
          );
          setRentals(allRentals.filter((r) => r.customer.id === cust.id));
          setEnquiries(
            allEnquiries.filter(
              (e) =>
                e.email === cust.email ||
                e.mobile === cust.mobile ||
                e.name === cust.name
            )
          );
          setReviews(
            allReviews.filter(
              (rv) => rv.reviewerName.toLowerCase().includes(cust.name.split(' ')[0].toLowerCase())
            )
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 w-52 rounded bg-slate-200" />
        <div className="h-64 rounded-xl bg-slate-200" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="rounded-xl border border-[#DCE6F2] bg-white p-8 max-w-lg">
        <h2 className="text-lg font-semibold text-[#12263F]">Customer Not Found</h2>
        <Link
          to="/admin/customers"
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[#1D5FAF] hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Customers
        </Link>
      </div>
    );
  }

  const handleToggleBlock = async () => {
    const updated = await toggleCustomerBlock(customer.id);
    setCustomer(updated);
    showToast({
      title: updated.status === 'blocked' ? 'Customer blocked' : 'Customer unblocked',
      variant: updated.status === 'blocked' ? 'info' : 'success',
    });
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteInput.trim()) return;
    const updated = await addCustomerNote(
      customer.id,
      `${user?.name || 'Admin'}: ${noteInput.trim()}`
    );
    setCustomer(updated);
    setNoteInput('');
    showToast({ title: 'Note saved to customer profile', variant: 'success' });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            to="/admin/customers"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#5B6B82] hover:text-[#1D5FAF]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Customers
          </Link>
          <div className="mt-1.5 flex items-center gap-3">
            <h1 className="text-2xl font-bold text-[#12263F]">{customer.name}</h1>
            <StatusBadge status={customer.status} />
          </div>
          <p className="mt-1 text-xs text-[#5B6B82]">
            Joined {formatShortDate(customer.joinedAt)} · {customer.city}, {customer.state}
          </p>
        </div>

        <button
          type="button"
          onClick={handleToggleBlock}
          className={`inline-flex items-center gap-1.5 rounded-lg border px-4 py-2 text-xs font-semibold ${
            customer.status === 'active'
              ? 'border-red-200 bg-white text-red-600 hover:bg-red-50'
              : 'border-emerald-200 bg-emerald-600 text-white hover:bg-emerald-700'
          }`}
        >
          {customer.status === 'active' ? (
            <>
              <Ban className="h-4 w-4" />
              Block Customer
            </>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4" />
              Unblock Customer
            </>
          )}
        </button>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-[#DCE6F2] bg-white p-4">
          <p className="text-xs text-[#5B6B82]">Lifetime Spend</p>
          <p className="mt-1 text-2xl font-bold text-[#12263F] tabular-nums">
            {formatINR(customer.totalSpent)}
          </p>
        </div>
        <div className="rounded-xl border border-[#DCE6F2] bg-white p-4">
          <p className="text-xs text-[#5B6B82]">Total Orders</p>
          <p className="mt-1 text-2xl font-bold text-[#12263F] tabular-nums">
            {customer.ordersCount}
          </p>
        </div>
        <div className="rounded-xl border border-[#DCE6F2] bg-white p-4">
          <p className="text-xs text-[#5B6B82]">Total Rentals</p>
          <p className="mt-1 text-2xl font-bold text-[#12263F] tabular-nums">
            {customer.rentalsCount}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left 2 Cols: Orders, Rentals, Reviews, Enquiries */}
        <div className="xl:col-span-2 space-y-6">
          {/* Orders */}
          <div className="rounded-xl border border-[#DCE6F2] bg-white overflow-hidden">
            <div className="border-b border-[#DCE6F2] px-5 py-3.5">
              <h2 className="text-base font-semibold text-[#12263F]">
                Purchase Orders ({orders.length})
              </h2>
            </div>
            {orders.length === 0 ? (
              <p className="px-5 py-4 text-xs text-[#5B6B82]">No purchase orders on record.</p>
            ) : (
              <div className="divide-y divide-[#DCE6F2]">
                {orders.map((o) => (
                  <Link
                    key={o.id}
                    to={`/admin/orders/${o.id}`}
                    className="flex items-center justify-between gap-4 px-5 py-3 hover:bg-[#F6F9FD]"
                  >
                    <div>
                      <span className="font-mono text-xs font-semibold text-[#1D5FAF]">
                        {o.orderNumber}
                      </span>
                      <p className="text-xs text-[#5B6B82]">
                        {formatShortDate(o.createdAt)} · {o.items.length} item(s) · {o.paymentMethod}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-[#12263F] tabular-nums">
                        {formatINR(o.total)}
                      </span>
                      <StatusBadge status={o.orderStatus} />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Rentals */}
          <div className="rounded-xl border border-[#DCE6F2] bg-white overflow-hidden">
            <div className="border-b border-[#DCE6F2] px-5 py-3.5">
              <h2 className="text-base font-semibold text-[#12263F]">
                Equipment Rentals ({rentals.length})
              </h2>
            </div>
            {rentals.length === 0 ? (
              <p className="px-5 py-4 text-xs text-[#5B6B82]">No rentals on record.</p>
            ) : (
              <div className="divide-y divide-[#DCE6F2]">
                {rentals.map((r) => (
                  <Link
                    key={r.id}
                    to={`/admin/rentals/${r.id}`}
                    className="flex items-center justify-between gap-4 px-5 py-3 hover:bg-[#F6F9FD]"
                  >
                    <div>
                      <span className="font-mono text-xs font-semibold text-[#1D5FAF]">
                        {r.rentalNumber}
                      </span>
                      <p className="text-xs font-medium text-[#12263F]">{r.product.name}</p>
                      <p className="text-[11px] text-[#5B6B82]">
                        {r.startDate && r.endDate
                          ? `${formatShortDate(r.startDate)} → ${formatShortDate(r.endDate)}`
                          : `${r.plan.durationLabel} · starts on delivery`}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-[#12263F] tabular-nums">
                        {formatINR(r.amounts.paid)}
                      </span>
                      <StatusBadge status={r.status} label={r.statusLabel} />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Enquiries & Reviews */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="rounded-xl border border-[#DCE6F2] bg-white p-5 space-y-3">
              <h3 className="text-sm font-semibold text-[#12263F]">
                Enquiries ({enquiries.length})
              </h3>
              {enquiries.length === 0 ? (
                <p className="text-xs text-[#5B6B82]">No enquiries submitted.</p>
              ) : (
                <div className="space-y-2">
                  {enquiries.map((e) => (
                    <div key={e.id} className="rounded-lg bg-[#F6F9FD] p-3 text-xs space-y-1">
                      <div className="flex justify-between">
                        <span className="font-mono font-semibold text-[#1D5FAF]">
                          {e.enquiryNumber}
                        </span>
                        <StatusBadge status={e.status} />
                      </div>
                      <p className="text-[#12263F] line-clamp-2">{e.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-xl border border-[#DCE6F2] bg-white p-5 space-y-3">
              <h3 className="text-sm font-semibold text-[#12263F]">
                Reviews ({reviews.length})
              </h3>
              {reviews.length === 0 ? (
                <p className="text-xs text-[#5B6B82]">No product reviews yet.</p>
              ) : (
                <div className="space-y-2">
                  {reviews.map((rv) => (
                    <div key={rv.id} className="rounded-lg bg-[#F6F9FD] p-3 text-xs space-y-1">
                      <div className="flex justify-between">
                        <span className="font-semibold text-[#12263F]">{rv.title}</span>
                        <StatusBadge status={rv.status} />
                      </div>
                      <p className="text-[#5B6B82] line-clamp-2">{rv.comment}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Col: Profile, Addresses, GST, Notes */}
        <div className="space-y-5">
          <div className="rounded-xl border border-[#DCE6F2] bg-white p-5 space-y-3">
            <h3 className="text-sm font-semibold text-[#12263F]">Contact &amp; GST Details</h3>
            <div className="space-y-2 text-xs text-[#5B6B82]">
              <p className="flex items-center gap-2 text-[#12263F]">
                <Phone className="h-3.5 w-3.5 text-[#5B6B82]" />
                {customer.mobile}
              </p>
              <p className="flex items-center gap-2 text-[#12263F]">
                <Mail className="h-3.5 w-3.5 text-[#5B6B82]" />
                {customer.email}
              </p>
            </div>
            {customer.gstDetails && (
              <div className="rounded-lg border border-[#1D5FAF]/20 bg-[#EAF2FC] p-3 text-xs space-y-0.5">
                <p className="font-semibold text-[#1D5FAF] flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5" />
                  Saved B2B GSTIN
                </p>
                <p className="font-semibold text-[#12263F]">{customer.gstDetails.companyName}</p>
                <p className="font-mono text-[#12263F]">{customer.gstDetails.gstin}</p>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-[#DCE6F2] bg-white p-5 space-y-3">
            <h3 className="text-sm font-semibold text-[#12263F]">Saved Addresses</h3>
            {customer.addresses.length === 0 ? (
              <p className="text-xs text-[#5B6B82]">No saved addresses.</p>
            ) : (
              customer.addresses.map((addr, idx) => (
                <div key={idx} className="rounded-lg bg-[#F6F9FD] p-3 text-xs space-y-1">
                  <p className="font-semibold text-[#12263F] flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-[#1D5FAF]" />
                    {addr.name}
                  </p>
                  <p className="text-[#5B6B82]">{addr.line1}</p>
                  <p className="text-[#5B6B82]">
                    {addr.city}, {addr.state} – {addr.pincode}
                  </p>
                </div>
              ))
            )}
          </div>

          <div className="rounded-xl border border-[#DCE6F2] bg-white p-5 space-y-3">
            <h3 className="text-sm font-semibold text-[#12263F]">Account Notes</h3>
            <form onSubmit={handleAddNote} className="space-y-2">
              <textarea
                rows={2}
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                placeholder="Add account preference, credit terms, or risk note..."
                className={textareaClass}
              />
              <button
                type="submit"
                className="w-full rounded-lg border border-[#DCE6F2] bg-[#F6F9FD] px-3 py-1.5 text-xs font-semibold text-[#12263F] hover:bg-[#EAF2FC]"
              >
                Save Note
              </button>
            </form>
            <div className="space-y-2">
              {customer.notes.map((n, i) => (
                <p
                  key={i}
                  className="rounded-lg bg-[#F6F9FD] px-3 py-2 text-xs text-[#12263F]"
                >
                  {n}
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
