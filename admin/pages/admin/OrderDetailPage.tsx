import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Banknote,
  BellRing,
  CheckCircle2,
  ExternalLink,
  FileText,
  Loader2,
  PackageCheck,
  Printer,
  RefreshCw,
  RotateCcw,
  Truck,
  X,
  XCircle,
} from 'lucide-react';
import type { AdminSettings, Order, RefundMode } from '@/types/admin';
import {
  addOrderInternalNote,
  createOrderShipment,
  getOrderById,
  issueOrderRefund,
  syncOrderRefund,
  updateOrderStatus,
} from '@/lib/api/admin/orders';
import { getAdminSettings } from '@/lib/api/admin/settings';
import { AdminApiError, formatDateTime, formatINR } from '@/lib/api/admin/client';
import { useAuth } from '@/components/admin/AuthContext';
import { useToast } from '@/components/admin/ToastProvider';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { SafeImage } from '@/components/admin/SafeImage';
import { FormField, inputClass, selectClass, textareaClass } from '@/components/admin/FormField';

export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user, can } = useAuth();
  const { showToast } = useToast();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [busy, setBusy] = useState(false);

  // Refund modal
  const [refundOpen, setRefundOpen] = useState(false);
  const [refundForm, setRefundForm] = useState<{ amount: number; mode: RefundMode; reference: string; note: string; reason: 'goodwill' | 'cancel' | 'return' }>({
    amount: 0,
    mode: 'gateway',
    reference: '',
    note: '',
    reason: 'goodwill',
  });
  const [refundErrors, setRefundErrors] = useState<Record<string, string>>({});
  const [noteInput, setNoteInput] = useState('');

  // Shiprocket modal
  const [shipModalOpen, setShipModalOpen] = useState(false);
  const [courier, setCourier] = useState('BlueDart Air Express');
  const [weightKg, setWeightKg] = useState(14.5);
  const [lengthCm, setLengthCm] = useState(45);
  const [widthCm, setWidthCm] = useState(35);
  const [heightCm, setHeightCm] = useState(55);

  // Cancel modal
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  // Invoice modal
  const [invoiceOpen, setInvoiceOpen] = useState(false);

  // Admin store & tax settings
  const [settings, setSettings] = useState<AdminSettings | null>(null);

  useEffect(() => {
    getAdminSettings()
      .then(setSettings)
      .catch((err) => console.warn('Could not load settings:', err));
  }, []);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setLoadError('');
    getOrderById(id)
      .then(setOrder)
      .catch((err) => setLoadError(err instanceof Error ? err.message : 'Could not load the order'))
      .finally(() => setLoading(false));
  }, [id]);

  const fail = (title: string, err: unknown) =>
    showToast({ title, description: err instanceof Error ? err.message : 'Please try again', variant: 'error' });

  const handleStatusChange = async (
    nextStatus: Order['orderStatus'],
    note?: string
  ) => {
    if (!order) return false;
    setBusy(true);
    try {
      const updated = await updateOrderStatus({
        id: order.id,
        status: nextStatus,
        actor: user?.name || 'Admin',
        note,
      });
      setOrder(updated);
      const cancelRefund = nextStatus === 'cancelled' ? [...updated.refunds].reverse().find((r) => r.reason === 'cancel') : undefined;
      showToast({
        title: `Order marked ${nextStatus}`,
        description:
          nextStatus !== 'cancelled'
            ? undefined
            : cancelRefund?.status === 'failed'
              ? `Automatic refund failed: ${cancelRefund.failureReason || 'see Refunds'}. Issue it manually from Returns & refunds.`
              : cancelRefund
                ? `Refund of ${formatINR(cancelRefund.amount)} initiated to the original payment method.`
                : updated.refundSummary.balance > 0
                  ? `${formatINR(updated.refundSummary.balance)} was paid — issue the refund from Returns & refunds.`
                  : undefined,
        variant: nextStatus === 'cancelled' ? 'warning' : 'success',
      });
      return true;
    } catch (err) {
      fail('Could not update the order', err);
      return false;
    } finally {
      setBusy(false);
    }
  };

  const handleCreateShipment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;
    setBusy(true);
    try {
      const updated = await createOrderShipment({
        id: order.id,
        courier,
        weightKg,
        lengthCm,
        widthCm,
        heightCm,
        actor: user?.name || 'Admin',
      });
      setOrder(updated);
      setShipModalOpen(false);
      showToast({
        title: 'Shipment created via Shiprocket',
        description: `AWB: ${updated.shipment?.awb}`,
        variant: 'success',
      });
    } catch (err) {
      fail('Could not create the shipment', err);
    } finally {
      setBusy(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order || !noteInput.trim()) return;
    try {
      const updated = await addOrderInternalNote(order.id, noteInput.trim());
      setOrder(updated);
      setNoteInput('');
      showToast({ title: 'Internal note added', variant: 'info' });
    } catch (err) {
      fail('Could not add the note', err);
    }
  };

  const openRefund = () => {
    if (!order) return;
    setRefundErrors({});
    setRefundForm({
      amount: order.refundSummary.balance,
      mode: order.refundSummary.gatewayAvailable && order.paymentMethod !== 'COD' ? 'gateway' : 'bank_transfer',
      reference: '',
      note: '',
      reason: order.orderStatus === 'cancelled' ? 'cancel' : 'goodwill',
    });
    setRefundOpen(true);
  };

  const handleRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;
    setBusy(true);
    setRefundErrors({});
    try {
      const updated = await issueOrderRefund(order.id, {
        amount: refundForm.amount,
        mode: refundForm.mode,
        reason: refundForm.reason,
        reference: refundForm.reference.trim() || undefined,
        note: refundForm.note.trim() || undefined,
      });
      setOrder(updated);
      setRefundOpen(false);
      showToast({ title: `Refund of ${formatINR(refundForm.amount)} issued`, description: 'The customer has been notified.', variant: 'success' });
    } catch (err) {
      if (err instanceof AdminApiError && err.fields) setRefundErrors(err.fields);
      fail('Refund failed', err);
      getOrderById(order.id).then(setOrder).catch(() => undefined); // a failed gateway attempt is still recorded
    } finally {
      setBusy(false);
    }
  };

  const handleSyncRefund = async (refundId: string) => {
    if (!order) return;
    try {
      const updated = await syncOrderRefund(order.id, refundId);
      setOrder(updated);
      const r = updated.refunds.find((x) => x.id === refundId);
      showToast({ title: `Refund is ${r?.status || 'up to date'}`, variant: 'info' });
    } catch (err) {
      fail('Could not refresh the refund', err);
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-[#DCE6F2] bg-white p-8 text-sm text-[#5B6B82]">
        Loading order details...
      </div>
    );
  }

  if (!order) {
    return (
      <div className="rounded-xl border border-[#DCE6F2] bg-white p-8 space-y-3">
        <p className="text-base font-semibold text-[#12263F]">{loadError ? 'Could not load this order' : 'Order not found'}</p>
        {loadError && <p className="text-sm text-[#5B6B82]">{loadError}</p>}
        <Link to="/admin/orders" className="text-xs font-semibold text-[#1D5FAF] hover:underline">
          Back to Orders
        </Link>
      </div>
    );
  }

  const isB2B = Boolean(order.gstDetails?.gstin);

  const seller = order.seller;

  const sellerName =
    seller?.name ||
    settings?.store?.storeName ||
    settings?.store?.brandName ||
    'Buy Denmed Healthcare Pvt Ltd';

  const sellerAddress =
    seller?.address ||
    settings?.store?.address ||
    '';

  const sellerGstin = seller?.gstin || settings?.store?.gstin || '';

  const sellerPhone =
    seller?.supportPhone || settings?.store?.supportPhone || '';

  const sellerEmail =
    seller?.supportEmail || settings?.store?.supportEmail || '';

  const sellerLogo =
    seller?.logoUrl || settings?.images?.logo || null;

  const invoicePrefix =
    seller?.invoicePrefix || settings?.tax?.invoicePrefix || 'BDM/26-27/';

  const digits =
    seller?.invoiceNumberDigits || settings?.tax?.invoiceNumberDigits || 4;

  const numPart = order.orderNumber ? order.orderNumber.replace(/^[^\d]*-?/, '') : '';

  const invoiceNumber =
    order.invoiceNumber || `${invoicePrefix}${numPart.padStart(digits, '0')}`;

  const dispatchStateName =
    seller?.dispatchStateName ||
    settings?.options?.states?.find((s) => s.code === settings?.tax?.dispatchStateCode)?.name ||
    settings?.tax?.dispatchStateCode ||
    'Delhi';

  const footerTerms =
    seller?.footerTerms || settings?.tax?.footerTerms || '';

  const signatoryName =
    seller?.signatoryName || settings?.tax?.signatoryName || 'Authorised Signatory';

  const signatoryUrl =
    seller?.signatoryUrl || settings?.images?.signatory || null;

  return (
    <div className="space-y-5">
      {/* Header & Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/orders"
            className="rounded-lg border border-[#DCE6F2] bg-white p-2 text-[#12263F] hover:bg-[#EAF2FC]"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold font-mono text-[#12263F]">
                {order.orderNumber}
              </h1>
              <StatusBadge status={order.orderStatus} />
              <StatusBadge status={order.paymentStatus} />
              {isB2B && (
                <span className="rounded-md bg-[#EAF2FC] px-2 py-0.5 text-xs font-semibold text-[#1D5FAF]">
                  B2B Tax Invoice
                </span>
              )}
            </div>
            <p className="mt-0.5 text-xs text-[#5B6B82] tabular-nums">
              Placed on {formatDateTime(order.createdAt)} · Payment: {order.paymentMethod}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {order.orderStatus === 'new' && (
            <button
              type="button"
              onClick={() => handleStatusChange('confirmed')}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#1D5FAF] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#174D8F]"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Confirm Order
            </button>
          )}
          {(order.orderStatus === 'new' || order.orderStatus === 'confirmed') && (
            <button
              type="button"
              onClick={() => handleStatusChange('packed')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#DCE6F2] bg-white px-3.5 py-2 text-xs font-semibold text-[#12263F] hover:bg-[#EAF2FC]"
            >
              <PackageCheck className="h-3.5 w-3.5 text-[#1D5FAF]" />
              Mark Packed
            </button>
          )}
          {(order.orderStatus === 'confirmed' || order.orderStatus === 'packed') && (
            <button
              type="button"
              onClick={() => setShipModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#1D5FAF] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#174D8F]"
            >
              <Truck className="h-3.5 w-3.5" />
              Create Shipment
            </button>
          )}
          {order.orderStatus === 'shipped' && (
            <button
              type="button"
              onClick={() => handleStatusChange('delivered')}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Mark Delivered
            </button>
          )}

          <button
            type="button"
            onClick={() => setInvoiceOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#DCE6F2] bg-white px-3.5 py-2 text-xs font-semibold text-[#12263F] hover:bg-[#EAF2FC]"
          >
            <FileText className="h-3.5 w-3.5 text-[#1D5FAF]" />
            GST Invoice ({isB2B ? 'B2B' : 'B2C'})
          </button>

          <button
            type="button"
            onClick={() =>
              showToast({
                title: 'Notifications resent',
                description: `SMS, WhatsApp & Email dispatched to ${order.customerPhone}`,
                variant: 'info',
              })
            }
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#DCE6F2] bg-white px-3.5 py-2 text-xs font-semibold text-[#12263F] hover:bg-[#EAF2FC]"
          >
            <BellRing className="h-3.5 w-3.5 text-[#5B6B82]" />
            Resend Notification
          </button>

          {!['cancelled', 'delivered', 'returned'].includes(order.orderStatus) && (
            <button
              type="button"
              onClick={() => setCancelModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2 text-xs font-semibold text-red-700 hover:bg-red-100"
            >
              <XCircle className="h-3.5 w-3.5" />
              Cancel Order
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Left 2 cols: Items + Price Breakdown + Timeline */}
        <div className="xl:col-span-2 space-y-5">
          {/* Items Table */}
          <div className="rounded-xl border border-[#DCE6F2] bg-white overflow-hidden">
            <div className="border-b border-[#DCE6F2] px-5 py-3.5">
              <h2 className="text-base font-semibold text-[#12263F]">Order Items</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-[#DCE6F2] bg-[#F6F9FD] text-xs font-semibold text-[#5B6B82]">
                    <th className="px-4 py-3">Product / Variant</th>
                    <th className="px-4 py-3">SKU</th>
                    <th className="px-4 py-3 text-right">Qty</th>
                    <th className="px-4 py-3 text-right">Taxable Unit</th>
                    <th className="px-4 py-3 text-right">GST</th>
                    <th className="px-4 py-3 text-right">Line Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DCE6F2]">
                  {order.items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-[#DCE6F2]">
                            <SafeImage src={item.imageUrl} alt={item.productName} />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-[#12263F]">
                              {item.productName}
                            </p>
                            <p className="text-[11px] text-[#5B6B82]">{item.variantName}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-[#5B6B82]">
                        {item.sku}
                      </td>
                      <td className="px-4 py-3 text-right text-xs font-semibold tabular-nums">
                        {item.qty}
                      </td>
                      <td className="px-4 py-3 text-right text-xs tabular-nums">
                        {formatINR(item.unitPrice)}
                      </td>
                      <td className="px-4 py-3 text-right text-xs text-[#5B6B82] tabular-nums">
                        {formatINR(item.gstAmount)} ({item.gstPercent}%)
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-semibold text-[#12263F] tabular-nums">
                        {formatINR(item.lineTotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Price Breakdown */}
            <div className="border-t border-[#DCE6F2] bg-[#F6F9FD] px-5 py-4 flex justify-end">
              <div className="w-full max-w-xs space-y-1.5 text-xs tabular-nums">
                <div className="flex justify-between text-[#5B6B82]">
                  <span>Taxable Subtotal</span>
                  <span>{formatINR(order.subtotal)}</span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-medium">
                    <span>
                      Discount {order.couponCode ? `(${order.couponCode})` : ''}
                    </span>
                    <span>-{formatINR(order.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-[#5B6B82]">
                  <span>Shipping</span>
                  <span>{order.shippingCharge === 0 ? 'Free' : formatINR(order.shippingCharge)}</span>
                </div>
                {order.codCharge && order.codCharge > 0 ? (
                  <div className="flex justify-between text-[#5B6B82]">
                    <span>COD Handling Fee</span>
                    <span>{formatINR(order.codCharge)}</span>
                  </div>
                ) : null}
                <div className="flex justify-between text-[#5B6B82]">
                  <span>Total GST</span>
                  <span>{formatINR(order.gstTotal)}</span>
                </div>
                <div className="flex justify-between border-t border-[#DCE6F2] pt-2 text-sm font-bold text-[#12263F]">
                  <span>Grand Total</span>
                  <span>{formatINR(order.total)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Shipment Tracking Card */}
          {order.shipment && (
            <div className="rounded-xl border border-[#DCE6F2] bg-white p-5 flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#1D5FAF]">
                  Shiprocket Dispatch
                </p>
                <p className="text-sm font-semibold text-[#12263F]">
                  {order.shipment.courier} · AWB:{' '}
                  <span className="font-mono">{order.shipment.awb}</span>
                </p>
                <p className="text-xs text-[#5B6B82] tabular-nums">
                  {order.shipment.weightKg} kg ({order.shipment.lengthCm}×
                  {order.shipment.widthCm}×{order.shipment.heightCm} cm) · Shipped{' '}
                  {formatDateTime(order.shipment.shippedAt)}
                </p>
              </div>
              <a
                href={order.shipment.trackingUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#DCE6F2] bg-[#EAF2FC] px-3.5 py-2 text-xs font-semibold text-[#1D5FAF] hover:bg-[#1D5FAF] hover:text-white transition-colors"
              >
                Track Shipment
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          )}

          {/* Status Timeline */}
          <div className="rounded-xl border border-[#DCE6F2] bg-white p-5">
            <h2 className="text-base font-semibold text-[#12263F] mb-4">Status Timeline</h2>
            <div className="space-y-3">
              {order.timeline.map((ev) => (
                <div
                  key={ev.id}
                  className="flex items-start justify-between gap-4 rounded-xl border border-[#DCE6F2] bg-[#F6F9FD] px-4 py-3"
                >
                  <div>
                    <p className="text-xs font-semibold text-[#12263F]">{ev.status}</p>
                    <p className="mt-0.5 text-xs text-[#5B6B82]">{ev.note}</p>
                  </div>
                  <div className="text-right text-[11px] text-[#5B6B82] shrink-0 tabular-nums">
                    <p className="font-medium text-[#12263F]">{ev.actor}</p>
                    <p>{formatDateTime(ev.timestamp)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col: Customer, Addresses, GST, Payment, Notes */}
        <div className="space-y-5">
          <div className="rounded-xl border border-[#DCE6F2] bg-white p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-[#12263F]">Customer</h2>
              <Link
                to={`/admin/customers/${order.customerId}`}
                className="text-xs font-semibold text-[#1D5FAF] hover:underline"
              >
                View Profile
              </Link>
            </div>
            <div className="text-xs space-y-1">
              <p className="text-sm font-semibold text-[#12263F]">{order.customerName}</p>
              <p className="text-[#5B6B82]">{order.customerEmail}</p>
              <p className="text-[#12263F] tabular-nums">{order.customerPhone}</p>
            </div>

            {order.gstDetails && (
              <div className="rounded-lg border border-[#DCE6F2] bg-[#EAF2FC]/50 p-3 text-xs space-y-0.5">
                <p className="font-semibold text-[#1D5FAF]">B2B GST Details</p>
                <p className="font-medium text-[#12263F]">{order.gstDetails.companyName}</p>
                <p className="font-mono text-[#5B6B82]">GSTIN: {order.gstDetails.gstin}</p>
              </div>
            )}

            <div className="border-t border-[#DCE6F2] pt-3 space-y-2 text-xs">
              <div>
                <p className="font-semibold text-[#5B6B82] uppercase text-[10px]">
                  Shipping Address
                </p>
                <p className="mt-0.5 text-[#12263F]">
                  {order.shippingAddress.line1}
                  {order.shippingAddress.line2 ? `, ${order.shippingAddress.line2}` : ''},{' '}
                  {order.shippingAddress.city}, {order.shippingAddress.state} -{' '}
                  {order.shippingAddress.pincode}
                </p>
              </div>
              <div>
                <p className="font-semibold text-[#5B6B82] uppercase text-[10px]">
                  Billing Address
                </p>
                <p className="mt-0.5 text-[#12263F]">
                  {order.billingAddress.line1}, {order.billingAddress.city},{' '}
                  {order.billingAddress.state} - {order.billingAddress.pincode}
                </p>
              </div>
            </div>
          </div>

          {/* Payment Info */}
          <div className="rounded-xl border border-[#DCE6F2] bg-white p-5 space-y-2.5 text-xs">
            <h2 className="text-base font-semibold text-[#12263F]">Payment Information</h2>
            <div className="flex justify-between">
              <span className="text-[#5B6B82]">Method</span>
              <span className="font-semibold text-[#12263F]">{order.paymentMethod}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#5B6B82]">Status</span>
              <StatusBadge status={order.paymentStatus} />
            </div>
            {order.razorpayPaymentId && (
              <div className="flex justify-between">
                <span className="text-[#5B6B82]">Razorpay ID</span>
                <span className="font-mono text-[#12263F]">{order.razorpayPaymentId}</span>
              </div>
            )}
            {order.emiPlan && (
              <div className="rounded-lg bg-[#F6F9FD] border border-[#DCE6F2] p-2.5 text-[#12263F]">
                <span className="font-semibold">EMI Plan:</span> {order.emiPlan}
              </div>
            )}
          </div>

          {/* Returns & refunds */}
          <div className="rounded-xl border border-[#DCE6F2] bg-white p-5 space-y-3 text-xs">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-base font-semibold text-[#12263F]">Returns &amp; Refunds</h2>
              {can('returns.edit') && order.refundSummary.balance > 0 && (
                <button
                  type="button"
                  onClick={openRefund}
                  className="inline-flex items-center gap-1 rounded-lg border border-[#DCE6F2] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#1D5FAF] hover:bg-[#EAF2FC]"
                >
                  <Banknote className="h-3.5 w-3.5" /> Issue refund
                </button>
              )}
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              {[
                ['Paid', order.refundSummary.paid, 'text-[#12263F]'],
                ['Refunded', order.refundSummary.refunded, 'text-emerald-700'],
                ['Refundable', order.refundSummary.balance, 'text-[#1D5FAF]'],
              ].map(([label, value, tone]) => (
                <div key={label as string} className="rounded-lg border border-[#DCE6F2] bg-[#F6F9FD] px-2 py-2">
                  <p className={`text-sm font-bold tabular-nums ${tone}`}>{formatINR(value as number)}</p>
                  <p className="text-[10px] uppercase tracking-wide text-[#5B6B82]">{label as string}</p>
                </div>
              ))}
            </div>
            {order.orderStatus === 'cancelled' && order.refundSummary.balance > 0 && (
              <p className="rounded-lg border border-[#F28C38]/35 bg-[#F28C38]/10 p-2.5 text-[#B85A0E]">
                This order is cancelled but {formatINR(order.refundSummary.balance)} has not been refunded yet.
              </p>
            )}

            {order.returns.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-[#5B6B82]">Return requests</p>
                {order.returns.map((r) => (
                  <Link
                    key={r.id}
                    to={`/admin/returns?id=${r.id}`}
                    className="flex items-center justify-between gap-2 rounded-lg border border-[#DCE6F2] px-3 py-2 hover:bg-[#EAF2FC]"
                  >
                    <span className="flex items-center gap-1.5">
                      <RotateCcw className="h-3.5 w-3.5 text-[#1D5FAF]" />
                      <span className="font-mono font-semibold text-[#12263F]">{r.returnNumber}</span>
                      <span className="text-[#5B6B82]">
                        {r.type === 'replacement' ? 'Replacement' : 'Refund'} · {r.itemCount} item{r.itemCount === 1 ? '' : 's'}
                      </span>
                    </span>
                    <StatusBadge status={r.status} label={r.statusLabel} />
                  </Link>
                ))}
              </div>
            )}

            {order.refunds.length > 0 ? (
              <div className="space-y-1.5">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-[#5B6B82]">Refund history</p>
                {order.refunds.map((r) => (
                  <div key={r.id} className="rounded-lg border border-[#DCE6F2] px-3 py-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold tabular-nums text-[#12263F]">
                        {formatINR(r.amount)} <span className="font-normal text-[#5B6B82]">· {r.methodLabel}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <StatusBadge status={r.status} />
                        {r.status === 'processing' && r.method === 'gateway' && can('returns.edit') && (
                          <button
                            type="button"
                            onClick={() => handleSyncRefund(r.id)}
                            title="Check status with Razorpay"
                            className="rounded p-1 text-[#5B6B82] hover:bg-[#EAF2FC] hover:text-[#1D5FAF]"
                          >
                            <RefreshCw className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[11px] text-[#5B6B82]">
                      {r.reason === 'cancel' ? 'Cancellation' : r.reason === 'return' ? 'Return' : 'Goodwill'} ·{' '}
                      <span className="font-mono">{r.reference || r.gatewayRefundId || `#${r.id}`}</span> · {r.processedBy} ·{' '}
                      {formatDateTime(r.processedAt || r.createdAt)}
                    </p>
                    {r.failureReason && <p className="mt-0.5 text-[11px] text-red-700">{r.failureReason}</p>}
                  </div>
                ))}
              </div>
            ) : (
              order.returns.length === 0 && <p className="text-[#5B6B82]">No returns or refunds on this order.</p>
            )}
          </div>

          {/* Internal Notes */}
          <div className="rounded-xl border border-[#DCE6F2] bg-white p-5 space-y-3">
            <h2 className="text-base font-semibold text-[#12263F]">Internal Notes</h2>
            <form onSubmit={handleAddNote} className="space-y-2">
              <textarea
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                placeholder="Add dispatch or technician note..."
                className={textareaClass}
              />
              <button
                type="submit"
                className="w-full rounded-lg bg-[#0B2545] px-3 py-2 text-xs font-semibold text-white hover:bg-[#11335E]"
              >
                Add Note
              </button>
            </form>
            {order.internalNotes.length > 0 && (
              <ul className="space-y-2 pt-1">
                {order.internalNotes.map((n, idx) => (
                  <li
                    key={idx}
                    className="rounded-lg border border-[#DCE6F2] bg-[#F6F9FD] px-3 py-2 text-xs text-[#12263F]"
                  >
                    {n}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Create Shipment Modal */}
      {shipModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B2545]/45 p-4">
          <div className="w-full max-w-md rounded-xl border border-[#DCE6F2] bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-[#DCE6F2] px-5 py-4">
              <h3 className="text-base font-semibold text-[#12263F]">
                Create Shiprocket Shipment
              </h3>
              <button
                type="button"
                onClick={() => setShipModalOpen(false)}
                className="rounded-lg p-1 text-[#5B6B82] hover:bg-[#EAF2FC]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleCreateShipment} className="p-5 space-y-4">
              <FormField label="Select Courier Partner" required>
                <select
                  value={courier}
                  onChange={(e) => setCourier(e.target.value)}
                  className={selectClass}
                >
                  <option value="BlueDart Air Express">BlueDart Air Express (₹420)</option>
                  <option value="Delhivery Surface">Delhivery Surface (₹260)</option>
                  <option value="Xpressbees Heavy Freight">Xpressbees Heavy Freight (₹850)</option>
                  <option value="DTDC Medical Priority">DTDC Medical Priority (₹390)</option>
                </select>
              </FormField>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Package Weight (kg)">
                  <input
                    type="number"
                    step="0.1"
                    value={weightKg}
                    onChange={(e) => setWeightKg(Number(e.target.value))}
                    className={`${inputClass} tabular-nums`}
                  />
                </FormField>
                <FormField label="Length (cm)">
                  <input
                    type="number"
                    value={lengthCm}
                    onChange={(e) => setLengthCm(Number(e.target.value))}
                    className={`${inputClass} tabular-nums`}
                  />
                </FormField>
                <FormField label="Width (cm)">
                  <input
                    type="number"
                    value={widthCm}
                    onChange={(e) => setWidthCm(Number(e.target.value))}
                    className={`${inputClass} tabular-nums`}
                  />
                </FormField>
                <FormField label="Height (cm)">
                  <input
                    type="number"
                    value={heightCm}
                    onChange={(e) => setHeightCm(Number(e.target.value))}
                    className={`${inputClass} tabular-nums`}
                  />
                </FormField>
              </div>
              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShipModalOpen(false)}
                  className="rounded-lg border border-[#DCE6F2] px-4 py-2 text-xs font-semibold text-[#12263F]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-[#1D5FAF] px-4 py-2 text-xs font-semibold text-white hover:bg-[#174D8F]"
                >
                  Generate AWB &amp; Dispatch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cancel Order Modal */}
      {cancelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B2545]/45 p-4">
          <div className="w-full max-w-md rounded-xl border border-[#DCE6F2] bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-[#DCE6F2] px-5 py-4">
              <h3 className="text-base font-semibold text-[#12263F]">Cancel Order</h3>
              <button
                type="button"
                onClick={() => setCancelModalOpen(false)}
                className="rounded-lg p-1 text-[#5B6B82] hover:bg-[#EAF2FC]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {order.refundSummary.balance > 0 && (
                <div className="rounded-lg border border-[#F28C38]/40 bg-[#F28C38]/10 p-3 text-xs text-[#12263F]">
                  {formatINR(order.refundSummary.balance)} has been paid on this order.{' '}
                  {order.refundSummary.gatewayAvailable
                    ? 'Cancelling refunds it automatically to the original payment method via Razorpay.'
                    : 'There is no Razorpay payment to refund automatically — after cancelling, record the bank / UPI refund from Returns & Refunds.'}
                </div>
              )}
              <FormField label="Cancellation Reason" required>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="e.g. Customer requested change of model / unserviceable freight pin"
                  className={textareaClass}
                />
              </FormField>
              <div className="flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setCancelModalOpen(false)}
                  className="rounded-lg border border-[#DCE6F2] px-4 py-2 text-xs font-semibold text-[#12263F]"
                >
                  Keep Order
                </button>
                <button
                  type="button"
                  disabled={!cancelReason.trim() || busy}
                  onClick={async () => {
                    if (await handleStatusChange('cancelled', cancelReason.trim())) setCancelModalOpen(false);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Confirm Cancellation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Issue refund modal */}
      {refundOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B2545]/45 p-4">
          <form onSubmit={handleRefund} className="w-full max-w-md rounded-xl border border-[#DCE6F2] bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-[#DCE6F2] px-5 py-4">
              <div>
                <h3 className="text-base font-semibold text-[#12263F]">Issue refund</h3>
                <p className="text-xs text-[#5B6B82]">
                  Up to {formatINR(order.refundSummary.balance)} · {order.paymentMethod}
                </p>
              </div>
              <button type="button" onClick={() => setRefundOpen(false)} className="rounded-lg p-1 text-[#5B6B82] hover:bg-[#EAF2FC]">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-4 p-5">
              <p className="rounded-lg border border-[#DCE6F2] bg-[#F6F9FD] p-2.5 text-xs text-[#5B6B82]">
                For items the customer is sending back, use the return request instead — it tracks pickup and inspection.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Amount (₹)" required error={refundErrors.amount}>
                  <input
                    type="number"
                    min={1}
                    step="0.01"
                    max={order.refundSummary.balance}
                    value={refundForm.amount || ''}
                    onChange={(e) => setRefundForm((f) => ({ ...f, amount: Number(e.target.value) }))}
                    className={`${inputClass} tabular-nums`}
                  />
                </FormField>
                <FormField label="Reason" required>
                  <select
                    value={refundForm.reason}
                    onChange={(e) => setRefundForm((f) => ({ ...f, reason: e.target.value as typeof f.reason }))}
                    className={selectClass}
                  >
                    <option value="goodwill">Goodwill / price adjustment</option>
                    <option value="cancel">Cancellation</option>
                    <option value="return">Return (no RMA)</option>
                  </select>
                </FormField>
              </div>
              <FormField label="Refund to" required error={refundErrors.mode}>
                <select
                  value={refundForm.mode}
                  onChange={(e) => setRefundForm((f) => ({ ...f, mode: e.target.value as RefundMode }))}
                  className={selectClass}
                >
                  {order.refundSummary.gatewayAvailable && order.paymentMethod !== 'COD' && (
                    <option value="gateway">Original payment method (Razorpay)</option>
                  )}
                  <option value="bank_transfer">Bank transfer (NEFT / IMPS) — already sent</option>
                  <option value="upi">UPI — already sent</option>
                </select>
              </FormField>
              {refundForm.mode !== 'gateway' && (
                <FormField label={refundForm.mode === 'upi' ? 'UPI transaction id' : 'UTR / bank reference'} required error={refundErrors.reference}>
                  <input
                    value={refundForm.reference}
                    onChange={(e) => setRefundForm((f) => ({ ...f, reference: e.target.value }))}
                    className={`${inputClass} font-mono`}
                  />
                </FormField>
              )}
              <FormField label="Note to the customer">
                <input value={refundForm.note} onChange={(e) => setRefundForm((f) => ({ ...f, note: e.target.value }))} placeholder="Optional" className={inputClass} />
              </FormField>
              <div className="flex justify-end gap-2.5 pt-1">
                <button type="button" onClick={() => setRefundOpen(false)} className="rounded-lg border border-[#DCE6F2] px-4 py-2 text-xs font-semibold text-[#12263F]">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    busy ||
                    !(refundForm.amount >= 1) ||
                    refundForm.amount > order.refundSummary.balance ||
                    (refundForm.mode !== 'gateway' && !refundForm.reference.trim())
                  }
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Banknote className="h-3.5 w-3.5" />}
                  Refund {formatINR(refundForm.amount || 0)}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* B2B / B2C GST Invoice Print Preview Modal */}
      {invoiceOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B2545]/55 p-4 print:p-0 print:bg-white print:static">
          <style>{`
            @media print {
              body * {
                visibility: hidden;
              }
              #printable-invoice, #printable-invoice * {
                visibility: visible;
              }
              #printable-invoice {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                margin: 0;
                padding: 16px;
                box-shadow: none;
                border: none;
                max-height: none !important;
                overflow: visible !important;
              }
              .no-print {
                display: none !important;
              }
            }
          `}</style>
          <div
            id="printable-invoice"
            className="w-full max-w-2xl rounded-xl border border-[#DCE6F2] bg-white shadow-2xl overflow-hidden max-h-[90vh] flex flex-col print:border-none print:shadow-none"
          >
            <div className="no-print flex items-center justify-between border-b border-[#DCE6F2] px-5 py-3.5 bg-[#F6F9FD]">
              <span className="text-sm font-semibold text-[#12263F]">
                {isB2B ? 'Tax Invoice (B2B GSTIN)' : 'Retail Tax Invoice (B2C)'} — {order.orderNumber}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#1D5FAF] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#174D8F]"
                >
                  <Printer className="h-3.5 w-3.5" />
                  Print / Save PDF
                </button>
                <button
                  type="button"
                  onClick={() => setInvoiceOpen(false)}
                  className="rounded-lg p-1 text-[#5B6B82] hover:bg-[#EAF2FC]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto space-y-5 text-xs text-[#12263F] print:p-0 print:overflow-visible">
              <div className="flex justify-between border-b border-[#DCE6F2] pb-4">
                <div className="max-w-[60%]">
                  {sellerLogo && (
                    <img
                      src={sellerLogo}
                      alt={sellerName || 'Logo'}
                      className="h-8 max-w-[180px] mb-2 object-contain"
                    />
                  )}
                  <h3 className="text-base font-bold text-[#0B2545]">{sellerName}</h3>
                  <p className="text-[#5B6B82] whitespace-pre-line leading-relaxed">{sellerAddress}</p>
                  {sellerGstin ? (
                    <p className="font-mono text-[#5B6B82] mt-0.5">Seller GSTIN: {sellerGstin}</p>
                  ) : null}
                  {(sellerPhone || sellerEmail) && (
                    <p className="text-[#5B6B82] mt-0.5">
                      {[sellerPhone, sellerEmail].filter(Boolean).join(' · ')}
                    </p>
                  )}
                </div>
                <div className="text-right tabular-nums">
                  <p className="font-bold text-[#1D5FAF]">{isB2B ? 'B2B TAX INVOICE' : 'B2C TAX INVOICE'}</p>
                  <p className="font-mono font-semibold text-[#12263F]">Invoice: {invoiceNumber}</p>
                  <p>Date: {order.createdAt.slice(0, 10)}</p>
                  {dispatchStateName && (
                    <p className="text-[#5B6B82]">Place of Supply: {dispatchStateName}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="font-semibold text-[#5B6B82] uppercase text-[10px]">Billed To</p>
                  <p className="font-semibold text-[#12263F]">
                    {order.gstDetails?.companyName || order.billingAddress.name}
                  </p>
                  <p className="text-[#5B6B82]">
                    {[order.billingAddress.line1, order.billingAddress.line2].filter(Boolean).join(', ')}
                  </p>
                  <p className="text-[#5B6B82]">{order.billingAddress.city} - {order.billingAddress.pincode}</p>
                  {order.billingAddress.state && (
                    <p className="text-[#5B6B82]">State: {order.billingAddress.state}</p>
                  )}
                  {order.gstDetails && (
                    <p className="font-mono font-semibold text-[#1D5FAF] mt-0.5">
                      Buyer GSTIN: {order.gstDetails.gstin}
                    </p>
                  )}
                </div>
                <div>
                  <p className="font-semibold text-[#5B6B82] uppercase text-[10px]">Shipped To</p>
                  <p className="font-semibold text-[#12263F]">{order.shippingAddress.name}</p>
                  <p className="text-[#5B6B82]">
                    {[order.shippingAddress.line1, order.shippingAddress.line2].filter(Boolean).join(', ')}
                  </p>
                  <p className="text-[#5B6B82]">{order.shippingAddress.city} - {order.shippingAddress.pincode}</p>
                  {order.shippingAddress.state && (
                    <p className="text-[#5B6B82]">State: {order.shippingAddress.state}</p>
                  )}
                </div>
              </div>

              <table className="w-full border border-[#DCE6F2] border-collapse">
                <thead>
                  <tr className="bg-[#F6F9FD] border-b border-[#DCE6F2]">
                    <th className="p-2 text-left">Item &amp; SKU</th>
                    <th className="p-2 text-right">Qty</th>
                    <th className="p-2 text-right">Taxable</th>
                    <th className="p-2 text-right">GST</th>
                    <th className="p-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DCE6F2] tabular-nums">
                  {order.items.map((it) => (
                    <tr key={it.id}>
                      <td className="p-2">
                        {it.productName} <span className="font-mono text-[#5B6B82]">({it.sku})</span>
                      </td>
                      <td className="p-2 text-right">{it.qty}</td>
                      <td className="p-2 text-right">{formatINR(it.unitPrice * it.qty)}</td>
                      <td className="p-2 text-right">{formatINR(it.gstAmount)} ({it.gstPercent}%)</td>
                      <td className="p-2 text-right font-semibold">{formatINR(it.lineTotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex justify-between items-end pt-2 border-t border-[#DCE6F2]">
                <div className="text-[11px] text-[#5B6B82] max-w-sm space-y-1">
                  {footerTerms && (
                    <p className="whitespace-pre-line leading-relaxed">{footerTerms}</p>
                  )}
                  <p>
                    Certified that the particulars given above are true and correct. Authorized Signatory — {signatoryName || sellerName}.
                  </p>
                  {signatoryUrl && (
                    <img src={signatoryUrl} alt="Signatory" className="h-9 mt-1 object-contain" />
                  )}
                </div>
                <div className="text-right tabular-nums space-y-1">
                  {order.discount > 0 && (
                    <p className="text-[#16A34A] text-xs">Discount: -{formatINR(order.discount)}</p>
                  )}
                  {order.shippingCharge > 0 && (
                    <p className="text-[#5B6B82] text-xs">Doorstep Air Shipping: {formatINR(order.shippingCharge)}</p>
                  )}
                  {order.codCharge && order.codCharge > 0 ? (
                    <p className="text-[#5B6B82] text-xs">COD Handling Charge: {formatINR(order.codCharge)}</p>
                  ) : null}
                  <p className="text-[#5B6B82] text-xs">Total GST: {formatINR(order.gstTotal)}</p>
                  <p className="text-base font-bold text-[#0B2545]">Invoice Total: {formatINR(order.total)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
