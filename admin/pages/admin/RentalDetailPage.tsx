import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  CalendarPlus,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Eye,
  FileCheck2,
  IndianRupee,
  MessageSquare,
  PackageCheck,
  Plus,
  RotateCw,
  Send,
  ShieldAlert,
  Trash2,
  Truck,
  X,
  XCircle,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import type {
  KycDocument,
  RentalBooking,
  RentalDeductionLine,
  RentalUnit,
} from '@/types/admin';
import {
  addRentalInternalNote,
  approveRentalExtension,
  assignRentalUnit,
  completeRentalReturnInspection,
  dispatchRentalShipment,
  getRentalById,
  markRentalDelivered,
  refundRentalDeposit,
  scheduleRentalReturnPickup,
  sendOverdueReminder,
  updateKycDocumentStatus,
} from '@/lib/api/admin/rentals';
import { listRentalUnits } from '@/lib/api/admin/rentalUnits';
import { formatDateTime, formatINR, formatShortDate } from '@/lib/api/admin/client';
import { PRODUCT_IMAGES } from '@/lib/api/admin/mockData';
import { useAuth } from '@/components/admin/AuthContext';
import { useToast } from '@/components/admin/ToastProvider';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { SafeImage } from '@/components/admin/SafeImage';
import { FormField, inputClass, selectClass, textareaClass } from '@/components/admin/FormField';

export function RentalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [rental, setRental] = useState<RentalBooking | null>(null);
  const [availableUnits, setAvailableUnits] = useState<RentalUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  // KYC Document Viewer (zoom + rotate) & Rejection reason
  const [viewerDoc, setViewerDoc] = useState<KycDocument | null>(null);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [kycReasonTarget, setKycReasonTarget] = useState<{
    docId: string;
    mode: 'rejected' | 'reupload_requested';
  } | null>(null);
  const [kycReason, setKycReason] = useState('');

  // Assign unit
  const [selectedUnitId, setSelectedUnitId] = useState('');

  // Dispatch Shiprocket modal
  const [dispatchOpen, setDispatchOpen] = useState(false);
  const [courier, setCourier] = useState('Buy Denmed Van Delivery');

  // Extension form
  const [extEndDate, setExtEndDate] = useState('');
  const [extPaymentStatus, setExtPaymentStatus] = useState<'paid' | 'pending'>('paid');

  // Return & Inspection
  const [pickupDate, setPickupDate] = useState('2026-11-19');
  const [inspectOpen, setInspectOpen] = useState(false);
  const [inspectCondition, setInspectCondition] = useState<'good' | 'needs_service' | 'damaged'>('good');
  const [inspectNotes, setInspectNotes] = useState('');
  const [inspectPhotos, setInspectPhotos] = useState<string[]>([]);

  // Deposit Refund
  const [deductions, setDeductions] = useState<RentalDeductionLine[]>([]);
  const [refundMethod, setRefundMethod] = useState<'Razorpay' | 'Bank Transfer' | 'UPI'>('Razorpay');
  const [refundRef, setRefundRef] = useState('');

  // Internal Note
  const [noteInput, setNoteInput] = useState('');

  const load = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await getRentalById(id);
      setRental(data);
      if (data) {
        setExtEndDate(data.extensionRequest?.requestedEndDate || data.endDate);
        setExtPaymentStatus(data.extensionRequest?.paymentStatus || 'paid');
        const units = await listRentalUnits({
          productId: data.productId,
          status: 'available',
        });
        setAvailableUnits(units);
        if (units.length > 0) setSelectedUnitId(units[0].id);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 w-56 rounded bg-slate-200" />
        <div className="h-96 rounded-xl bg-slate-200" />
      </div>
    );
  }

  if (!rental) {
    return (
      <div className="rounded-xl border border-[#DCE6F2] bg-white p-8 max-w-lg">
        <h2 className="text-lg font-semibold text-[#12263F]">Rental Booking Not Found</h2>
        <Link
          to="/admin/rentals"
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[#1D5FAF] hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Rentals
        </Link>
      </div>
    );
  }

  const actor = user?.name || 'Admin';

  const handleKycApprove = async (docId: string) => {
    setBusy(true);
    try {
      const updated = await updateKycDocumentStatus({
        rentalId: rental.id,
        docId,
        status: 'approved',
        actor,
      });
      setRental(updated);
      showToast({ title: 'KYC document approved', variant: 'success' });
    } finally {
      setBusy(false);
    }
  };

  const handleKycReasonSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kycReasonTarget) return;
    setBusy(true);
    try {
      const updated = await updateKycDocumentStatus({
        rentalId: rental.id,
        docId: kycReasonTarget.docId,
        status: kycReasonTarget.mode,
        reason: kycReason,
        actor,
      });
      setRental(updated);
      setKycReasonTarget(null);
      setKycReason('');
      showToast({
        title:
          kycReasonTarget.mode === 'rejected'
            ? 'KYC document rejected'
            : 'Re-upload requested from customer',
        variant: 'info',
      });
    } finally {
      setBusy(false);
    }
  };

  const handleAssignUnit = async () => {
    const unit = availableUnits.find((u) => u.id === selectedUnitId);
    if (!unit) return;
    setBusy(true);
    try {
      const updated = await assignRentalUnit({
        rentalId: rental.id,
        unitId: unit.id,
        unitCode: unit.unitCode,
        serialNumber: unit.serialNumber,
        actor,
      });
      setRental(updated);
      showToast({
        title: `Assigned ${unit.unitCode} (${unit.serialNumber})`,
        description: 'Unit status changed to Reserved in Inventory.',
        variant: 'success',
      });
      load();
    } finally {
      setBusy(false);
    }
  };

  const handleDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const updated = await dispatchRentalShipment({
        rentalId: rental.id,
        courier,
        actor,
      });
      setRental(updated);
      setDispatchOpen(false);
      showToast({
        title: 'Rental dispatched via Shiprocket',
        description: `AWB ${updated.shipment?.awb} generated; unit marked In Transit.`,
        variant: 'success',
      });
    } finally {
      setBusy(false);
    }
  };

  const handleMarkDelivered = async () => {
    setBusy(true);
    try {
      const updated = await markRentalDelivered(rental.id, actor);
      setRental(updated);
      showToast({
        title: 'Rental marked Delivered & Active',
        description: 'Assigned unit status updated to With Customer.',
        variant: 'success',
      });
    } finally {
      setBusy(false);
    }
  };

  const handleApproveExtension = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const updated = await approveRentalExtension({
        rentalId: rental.id,
        newEndDate: extEndDate,
        paymentStatus: extPaymentStatus,
        actor,
      });
      setRental(updated);
      showToast({ title: `Extension approved through ${extEndDate}`, variant: 'success' });
    } finally {
      setBusy(false);
    }
  };

  const handleScheduleReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const updated = await scheduleRentalReturnPickup({
        rentalId: rental.id,
        pickupDate,
        actor,
      });
      setRental(updated);
      showToast({ title: `Reverse pickup scheduled for ${pickupDate}`, variant: 'success' });
    } finally {
      setBusy(false);
    }
  };

  const handleCompleteInspection = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const updated = await completeRentalReturnInspection({
        rentalId: rental.id,
        condition: inspectCondition,
        notes: inspectNotes || `Inspected in ${inspectCondition} condition`,
        photos: inspectPhotos,
        actor,
      });
      setRental(updated);
      setInspectOpen(false);
      showToast({
        title: 'Return received & unit inspected',
        description: `Inventory unit automatically marked ${
          inspectCondition === 'good' ? 'Available' : 'Under Service'
        }.`,
        variant: 'success',
      });
    } finally {
      setBusy(false);
    }
  };

  const totalDeductions = deductions.reduce((s, d) => s + (Number(d.amount) || 0), 0);
  const netDepositRefund = Math.max(0, rental.depositAmount - totalDeductions);

  const handleRefundDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const updated = await refundRentalDeposit({
        rentalId: rental.id,
        deductions: deductions.filter((d) => d.reason.trim() && d.amount > 0),
        method: refundMethod,
        reference: refundRef || `DEP-${Date.now().toString().slice(-6)}`,
        actor,
      });
      setRental(updated);
      showToast({
        title: `Deposit refund processed (${formatINR(netDepositRefund)})`,
        variant: 'success',
      });
    } finally {
      setBusy(false);
    }
  };

  const handleReminder = async (channel: 'WhatsApp' | 'SMS') => {
    setBusy(true);
    try {
      const updated = await sendOverdueReminder(rental.id, channel, actor);
      setRental(updated);
      showToast({ title: `${channel} reminder logged & dispatched`, variant: 'success' });
    } finally {
      setBusy(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteInput.trim()) return;
    const updated = await addRentalInternalNote(rental.id, `${actor}: ${noteInput.trim()}`);
    setRental(updated);
    setNoteInput('');
    showToast({ title: 'Internal note saved', variant: 'success' });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            to="/admin/rentals"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#5B6B82] hover:text-[#1D5FAF]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Rentals
          </Link>
          <div className="mt-1.5 flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-[#12263F] font-mono">
              {rental.rentalNumber}
            </h1>
            <StatusBadge status={rental.status} />
            <StatusBadge status={rental.kycStatus} label={`KYC: ${rental.kycStatus.replace('_', ' ')}`} />
          </div>
          <p className="mt-1 text-xs text-[#5B6B82]">
            {rental.productName} · <span className="capitalize">{rental.planType}</span> ({formatINR(rental.planRate)}) · {formatShortDate(rental.startDate)} → {formatShortDate(rental.endDate)}
          </p>
        </div>

        {/* Top Workflow Quick Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {rental.status === 'overdue' && (
            <>
              <button
                type="button"
                disabled={busy}
                onClick={() => handleReminder('WhatsApp')}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#F28C38] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#d97724]"
              >
                <MessageSquare className="h-3.5 w-3.5" />
                Send WhatsApp Reminder
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => handleReminder('SMS')}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#F28C38]/40 bg-[#F28C38]/10 px-3.5 py-2 text-xs font-semibold text-[#B85A0E] hover:bg-[#F28C38]/20"
              >
                <Send className="h-3.5 w-3.5" />
                Send SMS
              </button>
            </>
          )}

          {(rental.status === 'approved' || rental.status === 'pending_approval') &&
            rental.assignedUnitId &&
            !rental.shipment && (
              <button
                type="button"
                disabled={busy}
                onClick={() => setDispatchOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#1D5FAF] px-4 py-2 text-xs font-semibold text-white hover:bg-[#174D8F]"
              >
                <Truck className="h-4 w-4" />
                Dispatch via Shiprocket
              </button>
            )}

          {rental.status === 'dispatched' && (
            <button
              type="button"
              disabled={busy}
              onClick={handleMarkDelivered}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
            >
              <PackageCheck className="h-4 w-4" />
              Mark Delivered (Active)
            </button>
          )}
        </div>
      </div>

      {/* Main 3-Col Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          {/* a) KYC Section */}
          <div className="rounded-xl border border-[#DCE6F2] bg-white p-5 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <FileCheck2 className="h-5 w-5 text-[#1D5FAF]" />
                <div>
                  <h2 className="text-base font-semibold text-[#12263F]">
                    a) Customer KYC &amp; Prescription Verification
                  </h2>
                  <p className="text-xs text-[#5B6B82]">
                    Inspect uploaded ID, address proof, or doctor prescription with zoom &amp; rotate viewer.
                  </p>
                </div>
              </div>
              <StatusBadge status={rental.kycStatus} />
            </div>

            {rental.kycDocs.length === 0 ? (
              <p className="rounded-lg bg-[#F6F9FD] px-4 py-3 text-xs text-[#5B6B82]">
                KYC documents verified on file from previous customer profile.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {rental.kycDocs.map((doc) => (
                  <div
                    key={doc.id}
                    className="rounded-xl border border-[#DCE6F2] bg-[#F6F9FD] p-3.5 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-xs font-semibold text-[#12263F]">{doc.docType}</p>
                        <p className="text-[11px] text-[#5B6B82]">{doc.label}</p>
                      </div>
                      <StatusBadge status={doc.status} />
                    </div>

                    <div
                      onClick={() => {
                        setViewerDoc(doc);
                        setZoom(1);
                        setRotation(0);
                      }}
                      className="group relative aspect-[16/10] w-full overflow-hidden rounded-lg border border-[#DCE6F2] bg-white cursor-pointer"
                    >
                      <SafeImage src={doc.imageUrl} alt={doc.label} />
                      <div className="absolute inset-0 flex items-center justify-center bg-[#0B2545]/40 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="inline-flex items-center gap-1 rounded-lg bg-white px-2.5 py-1 text-xs font-semibold text-[#12263F] shadow">
                          <Eye className="h-3.5 w-3.5" />
                          Inspect (Zoom / Rotate)
                        </span>
                      </div>
                    </div>

                    {doc.rejectionReason && (
                      <p className="rounded-md bg-red-50 px-2.5 py-1.5 text-[11px] text-red-700">
                        Reason: {doc.rejectionReason}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        disabled={busy || doc.status === 'approved'}
                        onClick={() => handleKycApprove(doc.id)}
                        className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-45"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Approve
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => {
                          setKycReasonTarget({ docId: doc.id, mode: 'reupload_requested' });
                          setKycReason('');
                        }}
                        className="rounded-md border border-[#F28C38]/40 bg-[#F28C38]/10 px-2.5 py-1 text-xs font-semibold text-[#B85A0E] hover:bg-[#F28C38]/20"
                      >
                        Request Re-upload
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => {
                          setKycReasonTarget({ docId: doc.id, mode: 'rejected' });
                          setKycReason('');
                        }}
                        className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-white px-2.5 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* b) Assign Unit & c) Dispatch */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="rounded-xl border border-[#DCE6F2] bg-white p-5 space-y-3">
              <h2 className="text-sm font-semibold text-[#12263F]">
                b) Assign Serialized Rental Unit
              </h2>
              {rental.assignedUnitSerial ? (
                <div className="rounded-lg border border-[#1D5FAF]/25 bg-[#EAF2FC] p-3.5 space-y-1">
                  <p className="text-xs font-semibold text-[#1D5FAF]">Assigned Unit</p>
                  <p className="font-mono text-sm font-bold text-[#12263F]">
                    {rental.assignedUnitCode} · {rental.assignedUnitSerial}
                  </p>
                  <Link
                    to={`/admin/rental-units/${rental.assignedUnitId}`}
                    className="inline-block text-xs font-semibold text-[#1D5FAF] hover:underline pt-1"
                  >
                    Open Unit Service Card →
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  <FormField label="Available Units for Product">
                    <select
                      value={selectedUnitId}
                      onChange={(e) => setSelectedUnitId(e.target.value)}
                      className={selectClass}
                    >
                      {availableUnits.length === 0 && (
                        <option value="">No available units in warehouse</option>
                      )}
                      {availableUnits.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.unitCode} — SN: {u.serialNumber} ({u.condition})
                        </option>
                      ))}
                    </select>
                  </FormField>
                  <button
                    type="button"
                    disabled={busy || !selectedUnitId}
                    onClick={handleAssignUnit}
                    className="w-full rounded-lg bg-[#1D5FAF] px-4 py-2 text-xs font-semibold text-white hover:bg-[#174D8F] disabled:opacity-50"
                  >
                    Assign Unit (Mark Reserved)
                  </button>
                </div>
              )}
            </div>

            <div className="rounded-xl border border-[#DCE6F2] bg-white p-5 space-y-3">
              <h2 className="text-sm font-semibold text-[#12263F]">
                c) Forward Dispatch (Shiprocket)
              </h2>
              {rental.shipment ? (
                <div className="rounded-lg bg-[#F6F9FD] border border-[#DCE6F2] p-3.5 text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-[#5B6B82]">Courier</span>
                    <span className="font-semibold text-[#12263F]">{rental.shipment.courier}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#5B6B82]">AWB</span>
                    <span className="font-mono font-semibold text-[#1D5FAF]">{rental.shipment.awb}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#5B6B82]">Tracking</span>
                    <span className="font-mono text-[11px] text-[#5B6B82] truncate max-w-[180px]">
                      {rental.shipment.trackingUrl}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-[#5B6B82]">
                    {rental.assignedUnitId
                      ? 'Unit reserved. Ready to book forward courier pickup via Shiprocket.'
                      : 'Assign an available serial unit first before dispatching.'}
                  </p>
                  <button
                    type="button"
                    disabled={busy || !rental.assignedUnitId}
                    onClick={() => setDispatchOpen(true)}
                    className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#DCE6F2] bg-white px-4 py-2 text-xs font-semibold text-[#1D5FAF] hover:bg-[#EAF2FC] disabled:opacity-45"
                  >
                    <Truck className="h-3.5 w-3.5" />
                    Create Forward Shipment
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* d) Extension & e) Return / Inspection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <form
              onSubmit={handleApproveExtension}
              className="rounded-xl border border-[#DCE6F2] bg-white p-5 space-y-3"
            >
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold text-[#12263F] flex items-center gap-1.5">
                  <CalendarPlus className="h-4 w-4 text-[#1D5FAF]" />
                  d) Rental Extension
                </h2>
                {rental.extensionRequest && !rental.extensionRequest.approved && (
                  <span className="rounded bg-[#F28C38]/15 px-2 py-0.5 text-[11px] font-semibold text-[#B85A0E]">
                    Requested
                  </span>
                )}
              </div>
              <FormField label="New End Date">
                <input
                  type="date"
                  value={extEndDate}
                  onChange={(e) => setExtEndDate(e.target.value)}
                  className={inputClass}
                />
              </FormField>
              <FormField label="Extension Payment Status">
                <select
                  value={extPaymentStatus}
                  onChange={(e) => setExtPaymentStatus(e.target.value as 'paid' | 'pending')}
                  className={selectClass}
                >
                  <option value="paid">Paid</option>
                  <option value="pending">Pending</option>
                </select>
              </FormField>
              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-lg bg-[#1D5FAF] px-4 py-2 text-xs font-semibold text-white hover:bg-[#174D8F]"
              >
                Approve &amp; Update End Date
              </button>
            </form>

            <div className="rounded-xl border border-[#DCE6F2] bg-white p-5 space-y-3">
              <h2 className="text-sm font-semibold text-[#12263F] flex items-center gap-1.5">
                <ClipboardCheck className="h-4 w-4 text-[#1D5FAF]" />
                e) Return Pickup &amp; Inspection
              </h2>

              {rental.returnInfo?.receivedAt ? (
                <div className="rounded-lg bg-[#F6F9FD] border border-[#DCE6F2] p-3 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[#5B6B82]">Inspection Condition</span>
                    <StatusBadge status={rental.returnInfo.inspectionCondition || 'good'} />
                  </div>
                  <p className="text-[#12263F]">{rental.returnInfo.inspectionNotes}</p>
                  <p className="text-[11px] text-[#5B6B82]">
                    Received {formatDateTime(rental.returnInfo.receivedAt)}
                  </p>
                </div>
              ) : (
                <>
                  <form onSubmit={handleScheduleReturn} className="flex items-end gap-2">
                    <div className="flex-1">
                      <FormField label="Reverse Pickup Date">
                        <input
                          type="date"
                          value={pickupDate}
                          onChange={(e) => setPickupDate(e.target.value)}
                          className={inputClass}
                        />
                      </FormField>
                    </div>
                    <button
                      type="submit"
                      disabled={busy}
                      className="rounded-lg border border-[#DCE6F2] bg-white px-3 py-2 text-xs font-semibold text-[#12263F] hover:bg-[#EAF2FC] whitespace-nowrap"
                    >
                      Schedule Pickup
                    </button>
                  </form>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setInspectOpen(true)}
                    className="w-full rounded-lg bg-[#0B2545] px-4 py-2 text-xs font-semibold text-white hover:bg-[#143766]"
                  >
                    Mark Received &amp; Inspect Condition
                  </button>
                </>
              )}
            </div>
          </div>

          {/* f) Deposit Refund */}
          <div className="rounded-xl border border-[#DCE6F2] bg-white p-5 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-base font-semibold text-[#12263F] flex items-center gap-2">
                <IndianRupee className="h-4 w-4 text-[#1D5FAF]" />
                f) Security Deposit Refund ({formatINR(rental.depositAmount)} held)
              </h2>
              <StatusBadge status={rental.depositStatus} />
            </div>

            {rental.depositRefund ? (
              <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-4 text-xs space-y-1.5">
                <p className="font-semibold text-emerald-800">
                  Refunded {formatINR(rental.depositRefund.netRefundAmount)} via{' '}
                  {rental.depositRefund.method} (Ref: {rental.depositRefund.reference})
                </p>
                {rental.depositRefund.deductions.length > 0 && (
                  <ul className="list-disc pl-4 text-emerald-900">
                    {rental.depositRefund.deductions.map((d) => (
                      <li key={d.id}>
                        {d.reason}: −{formatINR(d.amount)}
                      </li>
                    ))}
                  </ul>
                )}
                <p className="text-[11px] text-emerald-700">
                  Processed on {formatDateTime(rental.depositRefund.refundedAt)}
                </p>
              </div>
            ) : (
              <form onSubmit={handleRefundDeposit} className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#12263F]">
                      Deduction Lines (Late fees, damage, missing accessories)
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setDeductions((prev) => [
                          ...prev,
                          { id: `ded-${Date.now()}`, reason: '', amount: 0 },
                        ])
                      }
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[#1D5FAF] hover:underline"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add Deduction
                    </button>
                  </div>

                  {deductions.map((d) => (
                    <div key={d.id} className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Reason (e.g. 2-day late fee)"
                        value={d.reason}
                        onChange={(e) =>
                          setDeductions((prev) =>
                            prev.map((row) =>
                              row.id === d.id ? { ...row, reason: e.target.value } : row
                            )
                          )
                        }
                        className={`${inputClass} flex-1`}
                      />
                      <input
                        type="number"
                        min={0}
                        placeholder="Amount"
                        value={d.amount || ''}
                        onChange={(e) =>
                          setDeductions((prev) =>
                            prev.map((row) =>
                              row.id === d.id ? { ...row, amount: Number(e.target.value) } : row
                            )
                          )
                        }
                        className={`${inputClass} w-32 tabular-nums`}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setDeductions((prev) => prev.filter((row) => row.id !== d.id))
                        }
                        className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                        aria-label="Remove deduction"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <FormField label="Refund Method">
                    <select
                      value={refundMethod}
                      onChange={(e) =>
                        setRefundMethod(
                          e.target.value as 'Razorpay' | 'Bank Transfer' | 'UPI'
                        )
                      }
                      className={selectClass}
                    >
                      <option value="Razorpay">Razorpay Original Mode</option>
                      <option value="Bank Transfer">Bank Transfer (NEFT/IMPS)</option>
                      <option value="UPI">UPI Transfer</option>
                    </select>
                  </FormField>
                  <FormField label="Refund Reference / UTR">
                    <input
                      type="text"
                      value={refundRef}
                      onChange={(e) => setRefundRef(e.target.value)}
                      placeholder="e.g. rfnd_PK9910x"
                      className={inputClass}
                    />
                  </FormField>
                  <div className="flex items-end">
                    <button
                      type="submit"
                      disabled={busy}
                      className="w-full rounded-lg bg-[#1D5FAF] px-4 py-2 text-xs font-semibold text-white hover:bg-[#174D8F]"
                    >
                      Refund {formatINR(netDepositRefund)}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>

          {/* g) Payments Ledger */}
          <div className="rounded-xl border border-[#DCE6F2] bg-white overflow-hidden">
            <div className="border-b border-[#DCE6F2] px-5 py-3.5">
              <h2 className="text-base font-semibold text-[#12263F]">g) Payments Ledger</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#DCE6F2] bg-[#F6F9FD] text-xs font-semibold text-[#5B6B82]">
                    <th className="px-4 py-2.5">Date</th>
                    <th className="px-4 py-2.5">Type</th>
                    <th className="px-4 py-2.5">Description</th>
                    <th className="px-4 py-2.5">Reference</th>
                    <th className="px-4 py-2.5 text-right">Amount</th>
                    <th className="px-4 py-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DCE6F2] text-xs">
                  {rental.ledger.map((entry) => (
                    <tr key={entry.id}>
                      <td className="px-4 py-2.5 text-[#5B6B82] tabular-nums whitespace-nowrap">
                        {formatShortDate(entry.date)}
                      </td>
                      <td className="px-4 py-2.5 capitalize font-medium text-[#12263F]">
                        {entry.type.replace('_', ' ')}
                      </td>
                      <td className="px-4 py-2.5 text-[#12263F]">{entry.description}</td>
                      <td className="px-4 py-2.5 font-mono text-[#5B6B82]">
                        {entry.reference || '—'}
                      </td>
                      <td className="px-4 py-2.5 text-right font-semibold text-[#12263F] tabular-nums">
                        {formatINR(entry.amount)}
                      </td>
                      <td className="px-4 py-2.5">
                        <StatusBadge status={entry.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Sidebar: Customer, Timeline, Internal Notes */}
        <div className="space-y-5">
          <div className="rounded-xl border border-[#DCE6F2] bg-white p-5 space-y-3">
            <h3 className="text-sm font-semibold text-[#12263F]">Customer &amp; Delivery Address</h3>
            <div className="text-xs space-y-1">
              <p className="text-sm font-semibold text-[#12263F]">{rental.customerName}</p>
              <p className="text-[#5B6B82]">{rental.customerPhone}</p>
              <p className="text-[#5B6B82]">{rental.customerEmail}</p>
            </div>
            <div className="rounded-lg bg-[#F6F9FD] p-3 text-xs text-[#5B6B82]">
              <p className="font-semibold text-[#12263F]">{rental.deliveryAddress.line1}</p>
              <p>
                {rental.deliveryAddress.city}, {rental.deliveryAddress.state} –{' '}
                {rental.deliveryAddress.pincode}
              </p>
            </div>
            {rental.lastReminderSentAt && (
              <p className="text-[11px] text-[#B85A0E] flex items-center gap-1">
                <ShieldAlert className="h-3.5 w-3.5" />
                Last overdue reminder: {formatDateTime(rental.lastReminderSentAt)}
              </p>
            )}
          </div>

          <div className="rounded-xl border border-[#DCE6F2] bg-white p-5 space-y-3">
            <h3 className="text-sm font-semibold text-[#12263F]">Activity Timeline</h3>
            <ol className="space-y-3 border-l-2 border-[#DCE6F2] pl-3.5">
              {rental.timeline.map((ev) => (
                <li key={ev.id} className="relative">
                  <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-[#1D5FAF]" />
                  <p className="text-xs font-semibold text-[#12263F]">{ev.event}</p>
                  {ev.note && <p className="text-xs text-[#5B6B82]">{ev.note}</p>}
                  <p className="mt-0.5 text-[11px] text-[#5B6B82] flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDateTime(ev.timestamp)} · {ev.actor}
                  </p>
                </li>
              ))}
            </ol>
          </div>

          <div className="rounded-xl border border-[#DCE6F2] bg-white p-5 space-y-3">
            <h3 className="text-sm font-semibold text-[#12263F]">Internal Notes</h3>
            <form onSubmit={handleAddNote} className="space-y-2">
              <textarea
                rows={2}
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                placeholder="Add delivery slot, technician, or KYC observation..."
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
              {rental.internalNotes.map((n, i) => (
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

      {/* KYC Zoom & Rotate Lightbox Viewer */}
      {viewerDoc && (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-[#0B2545]/85 p-4"
          onClick={() => setViewerDoc(null)}
        >
          <div
            className="mx-auto flex w-full max-w-4xl items-center justify-between rounded-t-xl bg-white px-5 py-3 border-b border-[#DCE6F2]"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <p className="text-sm font-semibold text-[#12263F]">
                {viewerDoc.docType} — {viewerDoc.label}
              </p>
              <p className="text-xs text-[#5B6B82]">
                Zoom: {Math.round(zoom * 100)}% · Rotation: {rotation}°
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(0.5, Number((z - 0.25).toFixed(2))))}
                className="rounded-lg border border-[#DCE6F2] p-2 text-[#12263F] hover:bg-[#EAF2FC]"
                title="Zoom out"
              >
                <ZoomOut className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(2.5, Number((z + 0.25).toFixed(2))))}
                className="rounded-lg border border-[#DCE6F2] p-2 text-[#12263F] hover:bg-[#EAF2FC]"
                title="Zoom in"
              >
                <ZoomIn className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setRotation((r) => (r + 90) % 360)}
                className="inline-flex items-center gap-1 rounded-lg border border-[#DCE6F2] px-3 py-1.5 text-xs font-semibold text-[#12263F] hover:bg-[#EAF2FC]"
              >
                <RotateCw className="h-3.5 w-3.5" />
                Rotate 90°
              </button>
              <button
                type="button"
                onClick={() => {
                  setZoom(1);
                  setRotation(0);
                }}
                className="rounded-lg border border-[#DCE6F2] px-2.5 py-1.5 text-xs font-medium text-[#5B6B82] hover:bg-[#EAF2FC]"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => setViewerDoc(null)}
                className="rounded-lg p-1.5 text-[#5B6B82] hover:bg-[#EAF2FC]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div
            className="mx-auto flex flex-1 w-full max-w-4xl items-center justify-center overflow-auto rounded-b-xl bg-[#12263F] p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={viewerDoc.imageUrl}
              alt={viewerDoc.label}
              style={{
                transform: `scale(${zoom}) rotate(${rotation}deg)`,
                transition: 'transform 0.2s ease',
              }}
              className="max-h-[68vh] rounded-lg object-contain shadow-2xl"
            />
          </div>
        </div>
      )}

      {/* KYC Reject / Reupload Reason Modal */}
      {kycReasonTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B2545]/50 p-4">
          <form
            onSubmit={handleKycReasonSubmit}
            className="w-full max-w-md rounded-xl border border-[#DCE6F2] bg-white p-5 space-y-4 shadow-xl"
          >
            <h3 className="text-base font-semibold text-[#12263F]">
              {kycReasonTarget.mode === 'rejected'
                ? 'Reject KYC Document'
                : 'Request Document Re-upload'}
            </h3>
            <FormField label="Reason sent to customer" required>
              <textarea
                rows={3}
                required
                value={kycReason}
                onChange={(e) => setKycReason(e.target.value)}
                placeholder="e.g. Aadhaar back address text is blurry; please upload clear photo."
                className={textareaClass}
              />
            </FormField>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setKycReasonTarget(null)}
                className="rounded-lg border border-[#DCE6F2] px-4 py-2 text-xs font-semibold text-[#12263F]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={busy}
                className="rounded-lg bg-[#1D5FAF] px-4 py-2 text-xs font-semibold text-white hover:bg-[#174D8F]"
              >
                Submit
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Dispatch Modal */}
      {dispatchOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B2545]/50 p-4">
          <form
            onSubmit={handleDispatch}
            className="w-full max-w-md rounded-xl border border-[#DCE6F2] bg-white p-5 space-y-4 shadow-xl"
          >
            <h3 className="text-base font-semibold text-[#12263F]">
              Book Forward Rental Shipment (Shiprocket)
            </h3>
            <FormField label="Courier / Fleet Partner">
              <select
                value={courier}
                onChange={(e) => setCourier(e.target.value)}
                className={selectClass}
              >
                <option value="Buy Denmed Van Delivery">Buy Denmed Van Delivery</option>
                <option value="BlueDart Surface">BlueDart Surface</option>
                <option value="Delhivery Heavy">Delhivery Heavy</option>
              </select>
            </FormField>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDispatchOpen(false)}
                className="rounded-lg border border-[#DCE6F2] px-4 py-2 text-xs font-semibold text-[#12263F]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={busy}
                className="rounded-lg bg-[#1D5FAF] px-4 py-2 text-xs font-semibold text-white hover:bg-[#174D8F]"
              >
                Generate AWB &amp; Dispatch
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Return Inspection Modal */}
      {inspectOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B2545]/50 p-4">
          <form
            onSubmit={handleCompleteInspection}
            className="w-full max-w-md rounded-xl border border-[#DCE6F2] bg-white p-5 space-y-4 shadow-xl"
          >
            <h3 className="text-base font-semibold text-[#12263F]">
              Inspect Returned Rental Unit
            </h3>
            <FormField label="Physical & Functional Condition" required>
              <select
                value={inspectCondition}
                onChange={(e) =>
                  setInspectCondition(
                    e.target.value as 'good' | 'needs_service' | 'damaged'
                  )
                }
                className={selectClass}
              >
                <option value="good">Good — Unit becomes Available immediately</option>
                <option value="needs_service">Needs Service — Unit marked Under Service</option>
                <option value="damaged">Damaged — Unit marked Under Service</option>
              </select>
            </FormField>
            <FormField label="Inspection Notes" required>
              <textarea
                rows={3}
                required
                value={inspectNotes}
                onChange={(e) => setInspectNotes(e.target.value)}
                placeholder="Check oxygen purity, accessories, power cord, scratches..."
                className={textareaClass}
              />
            </FormField>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[#12263F]">Inspection Photos</span>
                <button
                  type="button"
                  onClick={() =>
                    setInspectPhotos((prev) => [
                      ...prev,
                      rental.productImage || PRODUCT_IMAGES.oxygenConcentrator,
                    ])
                  }
                  className="text-xs font-semibold text-[#1D5FAF] hover:underline"
                >
                  + Attach Sample Photo
                </button>
              </div>
              {inspectPhotos.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {inspectPhotos.map((p, idx) => (
                    <div
                      key={idx}
                      className="h-14 w-14 overflow-hidden rounded-lg border border-[#DCE6F2]"
                    >
                      <SafeImage src={p} alt="Inspection" />
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setInspectOpen(false)}
                className="rounded-lg border border-[#DCE6F2] px-4 py-2 text-xs font-semibold text-[#12263F]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={busy}
                className="rounded-lg bg-[#1D5FAF] px-4 py-2 text-xs font-semibold text-white hover:bg-[#174D8F]"
              >
                Complete Inspection
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
