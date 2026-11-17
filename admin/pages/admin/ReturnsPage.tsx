import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Eye, RefreshCw, Truck, XCircle } from 'lucide-react';
import type { ReturnRequest } from '@/types/admin';
import {
  listReturnRequests,
  processReturnRefund,
  updateReturnRequest,
} from '@/lib/api/admin/orders';
import { formatDateTime, formatINR } from '@/lib/api/admin/client';
import { useAuth } from '@/components/admin/AuthContext';
import { useToast } from '@/components/admin/ToastProvider';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { Drawer } from '@/components/admin/Drawer';
import { SafeImage } from '@/components/admin/SafeImage';
import { FormField, inputClass, selectClass, textareaClass } from '@/components/admin/FormField';

export function ReturnsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ReturnRequest | null>(null);

  // Action states inside drawer
  const [adminNote, setAdminNote] = useState('');
  const [pickupDate, setPickupDate] = useState('2026-11-19');
  const [pickupCourier, setPickupCourier] = useState('BlueDart Reverse');
  const [refundAmount, setRefundAmount] = useState(0);
  const [refundMethod, setRefundMethod] = useState<'Razorpay' | 'Bank Transfer (NEFT/IMPS)'>('Razorpay');
  const [refundRef, setRefundRef] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      setReturns(await listReturnRequests());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openDrawer = (r: ReturnRequest) => {
    setSelected(r);
    setAdminNote(r.adminNote || '');
    setPickupDate(r.pickupDate || '2026-11-19');
    setPickupCourier(r.pickupCourier || 'BlueDart Reverse');
    const eligible = r.items.reduce((acc, i) => acc + i.refundEligibleAmount, 0);
    setRefundAmount(eligible);
    setRefundMethod(r.paymentMethod === 'COD' ? 'Bank Transfer (NEFT/IMPS)' : 'Razorpay');
    setRefundRef('');
  };

  const handleStatusUpdate = async (status: ReturnRequest['status']) => {
    if (!selected) return;
    const updated = await updateReturnRequest({
      id: selected.id,
      status,
      adminNote,
      pickupDate: status === 'pickup_scheduled' ? pickupDate : undefined,
      pickupCourier: status === 'pickup_scheduled' ? pickupCourier : undefined,
    });
    setSelected(updated);
    showToast({ title: `Return marked ${status.replace('_', ' ')}`, variant: 'success' });
    load();
  };

  const handleProcessRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    const updated = await processReturnRefund({
      id: selected.id,
      amount: refundAmount,
      method: refundMethod,
      reference: refundRef || `RFND-${Date.now().toString().slice(-6)}`,
      processedBy: user?.name || 'Admin',
    });
    setSelected(updated);
    showToast({
      title: `Refund of ${formatINR(refundAmount)} processed`,
      variant: 'success',
    });
    load();
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-[#12263F] tracking-tight">
          Returns &amp; Refunds
        </h1>
        <p className="mt-0.5 text-sm text-[#5B6B82]">
          Review RMA photo evidence, schedule reverse logistics pickup, and process Razorpay or COD bank refunds.
        </p>
      </div>

      <div className="rounded-xl border border-[#DCE6F2] bg-white overflow-hidden">
        {loading ? (
          <div className="p-8 text-sm text-[#5B6B82]">Loading return requests...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-[#DCE6F2] bg-[#F6F9FD] text-xs font-semibold text-[#5B6B82]">
                  <th className="px-4 py-3">RMA # / Order</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Items &amp; Reason</th>
                  <th className="px-4 py-3">Photos</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DCE6F2]">
                {returns.map((r) => (
                  <tr key={r.id} className="hover:bg-[#F6F9FD]">
                    <td className="px-4 py-3">
                      <p className="font-mono text-xs font-semibold text-[#12263F]">
                        {r.returnNumber}
                      </p>
                      <Link
                        to={`/admin/orders/${r.orderId}`}
                        className="font-mono text-xs text-[#1D5FAF] hover:underline"
                      >
                        {r.orderNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs font-semibold text-[#12263F]">{r.customerName}</p>
                      <p className="text-[11px] text-[#5B6B82]">
                        {r.customerPhone} · {r.paymentMethod}
                      </p>
                    </td>
                    <td className="px-4 py-3 max-w-xs">
                      <p className="text-xs font-medium text-[#12263F] truncate">
                        {r.items.map((i) => `${i.productName} ×${i.qty}`).join(', ')}
                      </p>
                      <p className="text-xs text-[#5B6B82] line-clamp-1">{r.reason}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {r.photos.map((url, idx) => (
                          <div
                            key={idx}
                            className="h-9 w-9 overflow-hidden rounded-md border border-[#DCE6F2]"
                          >
                            <SafeImage src={url} alt="Return evidence" />
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => openDrawer(r)}
                        className="inline-flex items-center gap-1 rounded-lg border border-[#DCE6F2] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#1D5FAF] hover:bg-[#EAF2FC]"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Process
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Drawer
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected ? `Return Request ${selected.returnNumber}` : ''}
        subtitle={selected ? `Order ${selected.orderNumber} · ${selected.customerName}` : ''}
      >
        {selected && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <StatusBadge status={selected.status} />
              <span className="text-xs text-[#5B6B82] tabular-nums">
                Requested {formatDateTime(selected.createdAt)}
              </span>
            </div>

            <div className="rounded-xl border border-[#DCE6F2] bg-[#F6F9FD] p-3.5 text-xs space-y-1">
              <p className="font-semibold text-[#12263F]">Reason: {selected.reason}</p>
              <p className="text-[#5B6B82]">{selected.customerNote}</p>
            </div>

            {selected.photos.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-[#12263F] mb-2">Customer Photos</p>
                <div className="flex gap-2">
                  {selected.photos.map((p, idx) => (
                    <div
                      key={idx}
                      className="h-24 w-24 overflow-hidden rounded-xl border border-[#DCE6F2]"
                    >
                      <SafeImage src={p} alt="Return photo" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <FormField label="Admin Review Note">
              <textarea
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder="Verification or QC remarks..."
                className={textareaClass}
              />
            </FormField>

            {/* Step actions */}
            <div className="flex flex-wrap gap-2">
              {selected.status === 'requested' && (
                <>
                  <button
                    type="button"
                    onClick={() => handleStatusUpdate('approved')}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#1D5FAF] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#174D8F]"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Approve Return
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStatusUpdate('rejected')}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2 text-xs font-semibold text-red-700 hover:bg-red-100"
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    Reject
                  </button>
                </>
              )}

              {selected.status === 'approved' && (
                <div className="w-full rounded-xl border border-[#DCE6F2] p-3.5 space-y-3">
                  <p className="text-xs font-semibold text-[#12263F]">Schedule Reverse Pickup</p>
                  <div className="grid grid-cols-2 gap-2.5">
                    <input
                      type="date"
                      value={pickupDate}
                      onChange={(e) => setPickupDate(e.target.value)}
                      className={inputClass}
                    />
                    <select
                      value={pickupCourier}
                      onChange={(e) => setPickupCourier(e.target.value)}
                      className={selectClass}
                    >
                      <option value="BlueDart Reverse">BlueDart Reverse</option>
                      <option value="Delhivery Reverse">Delhivery Reverse</option>
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleStatusUpdate('pickup_scheduled')}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#1D5FAF] px-3.5 py-2 text-xs font-semibold text-white"
                  >
                    <Truck className="h-3.5 w-3.5" />
                    Schedule Pickup
                  </button>
                </div>
              )}

              {selected.status === 'pickup_scheduled' && (
                <button
                  type="button"
                  onClick={() => handleStatusUpdate('received')}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#1D5FAF] px-3.5 py-2 text-xs font-semibold text-white"
                >
                  Mark Received at Warehouse
                </button>
              )}
            </div>

            {/* Refund Section */}
            {(selected.status === 'received' || selected.status === 'approved') && (
              <form
                onSubmit={handleProcessRefund}
                className="rounded-xl border border-[#DCE6F2] bg-[#F6F9FD] p-4 space-y-3"
              >
                <p className="text-xs font-semibold text-[#12263F]">
                  Process Full or Partial Refund
                </p>

                {selected.bankDetails && (
                  <div className="rounded-lg bg-white border border-[#DCE6F2] p-2.5 text-xs">
                    <p className="font-semibold text-[#1D5FAF]">COD Bank Details</p>
                    <p>
                      {selected.bankDetails.accountHolder} · {selected.bankDetails.accountNumber} ·{' '}
                      {selected.bankDetails.ifsc}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <FormField label="Refund Amount (₹)">
                    <input
                      type="number"
                      min={1}
                      value={refundAmount}
                      onChange={(e) => setRefundAmount(Number(e.target.value))}
                      className={`${inputClass} tabular-nums`}
                    />
                  </FormField>
                  <FormField label="Refund Method">
                    <select
                      value={refundMethod}
                      onChange={(e) =>
                        setRefundMethod(
                          e.target.value as 'Razorpay' | 'Bank Transfer (NEFT/IMPS)'
                        )
                      }
                      className={selectClass}
                    >
                      <option value="Razorpay">Razorpay Original Method</option>
                      <option value="Bank Transfer (NEFT/IMPS)">
                        Bank Transfer (NEFT/IMPS for COD)
                      </option>
                    </select>
                  </FormField>
                </div>
                <FormField label="Transaction / UTR Reference">
                  <input
                    type="text"
                    value={refundRef}
                    onChange={(e) => setRefundRef(e.target.value)}
                    placeholder="e.g. rfnd_PK99102 or UTR1290412"
                    className={`${inputClass} font-mono`}
                  />
                </FormField>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Issue Refund
                </button>
              </form>
            )}

            {/* Refund History */}
            {selected.refundHistory.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-[#12263F]">Refund History</p>
                {selected.refundHistory.map((h) => (
                  <div
                    key={h.id}
                    className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs flex justify-between items-center"
                  >
                    <div>
                      <p className="font-semibold text-emerald-800">
                        {formatINR(h.amount)} via {h.method}
                      </p>
                      <p className="font-mono text-[11px] text-emerald-700">
                        Ref: {h.reference} · By {h.processedBy}
                      </p>
                    </div>
                    <span className="text-[11px] text-emerald-700 tabular-nums">
                      {formatDateTime(h.processedAt)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
}
