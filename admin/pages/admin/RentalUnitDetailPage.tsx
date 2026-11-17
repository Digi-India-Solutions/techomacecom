import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  ClipboardCheck,
  Plus,
  Save,
  ShieldAlert,
  Wrench,
  X,
} from 'lucide-react';
import type {
  RentalUnit,
  RentalUnitCondition,
  RentalUnitStatus,
} from '@/types/admin';
import {
  addSanitisationLog,
  addServiceLog,
  getRentalUnitById,
  updateRentalUnit,
} from '@/lib/api/admin/rentalUnits';
import { formatINR, formatShortDate } from '@/lib/api/admin/client';
import { useAuth } from '@/components/admin/AuthContext';
import { useToast } from '@/components/admin/ToastProvider';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { SafeImage } from '@/components/admin/SafeImage';
import { FormField, inputClass, selectClass, textareaClass } from '@/components/admin/FormField';

export function RentalUnitDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user, can } = useAuth();
  const { showToast } = useToast();

  const [unit, setUnit] = useState<RentalUnit | null>(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<RentalUnitStatus>('available');
  const [condition, setCondition] = useState<RentalUnitCondition>('good');
  const [saving, setSaving] = useState(false);

  // Add Service Modal
  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [srvDate, setSrvDate] = useState('2026-11-17');
  const [srvIssue, setSrvIssue] = useState('');
  const [srvAction, setSrvAction] = useState('');
  const [srvTech, setSrvTech] = useState('Suresh Verma');
  const [srvCost, setSrvCost] = useState(0);
  const [srvNextDue, setSrvNextDue] = useState('2027-02-17');

  // Add Sanitisation Modal
  const [sanModalOpen, setSanModalOpen] = useState(false);
  const [sanDate, setSanDate] = useState('2026-11-17');
  const [sanMethod, setSanMethod] = useState('UV-C + Medical Surface Wipe');
  const [sanChemical, setSanChemical] = useState('Bacillol 25 Surface Disinfectant');
  const [sanVerifier, setSanVerifier] = useState(user?.name || 'Vikram Singh');
  const [sanPassed, setSanPassed] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getRentalUnitById(id)
      .then((found) => {
        if (found) {
          setUnit(found);
          setNotes(found.notes);
          setStatus(found.status);
          setCondition(found.condition);
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  const canManage = can('rental_units.manage');

  const handleSaveMeta = async () => {
    if (!unit) return;
    setSaving(true);
    try {
      const updated = await updateRentalUnit(unit.id, { status, condition, notes });
      setUnit(updated);
      showToast({ title: 'Rental unit updated', variant: 'success' });
    } finally {
      setSaving(false);
    }
  };

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unit) return;
    const updated = await addServiceLog(unit.id, {
      date: srvDate,
      issue: srvIssue,
      actionTaken: srvAction,
      technician: srvTech,
      cost: srvCost,
      nextDueDate: srvNextDue,
    });
    setUnit(updated);
    setServiceModalOpen(false);
    setSrvIssue('');
    setSrvAction('');
    setSrvCost(0);
    showToast({ title: 'Service log added', variant: 'success' });
  };

  const handleAddSanitisation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unit) return;
    const updated = await addSanitisationLog(unit.id, {
      date: sanDate,
      method: sanMethod,
      chemicalUsed: sanChemical,
      verifiedBy: sanVerifier,
      passed: sanPassed,
    });
    setUnit(updated);
    setSanModalOpen(false);
    showToast({ title: 'Sanitisation log recorded', variant: 'success' });
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-[#DCE6F2] bg-white p-8 text-sm text-[#5B6B82]">
        Loading rental unit details...
      </div>
    );
  }

  if (!unit) {
    return (
      <div className="rounded-xl border border-[#DCE6F2] bg-white p-8 space-y-3">
        <p className="text-base font-semibold text-[#12263F]">Rental unit not found</p>
        <Link
          to="/admin/rental-units"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1D5FAF] hover:underline"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Rental Units
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            to="/admin/rental-units"
            className="rounded-lg border border-[#DCE6F2] bg-white p-2 text-[#12263F] hover:bg-[#EAF2FC]"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="min-w-0">
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold font-mono text-[#12263F]">
                {unit.unitCode}
              </h1>
              <StatusBadge status={unit.status} />
              <StatusBadge status={unit.condition} />
            </div>
            <p className="mt-0.5 text-sm text-[#5B6B82] truncate">
              {unit.productName} · SN: <span className="font-mono">{unit.serialNumber}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Top Grid: Summary + Status/Notes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="rounded-xl border border-[#DCE6F2] bg-white p-5 space-y-4">
          <div className="flex items-center gap-3.5">
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-[#DCE6F2] bg-[#F6F9FD]">
              <SafeImage src={unit.productImage} alt={unit.productName} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[#12263F]">{unit.productName}</p>
              <p className="mt-0.5 text-xs font-mono text-[#5B6B82]">
                Serial: {unit.serialNumber}
              </p>
            </div>
          </div>

          <div className="divide-y divide-[#DCE6F2] text-xs">
            <div className="flex justify-between py-2">
              <span className="text-[#5B6B82]">Purchase Date</span>
              <span className="font-semibold text-[#12263F] tabular-nums">
                {formatShortDate(unit.purchaseDate)}
              </span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-[#5B6B82]">Last Service</span>
              <span className="font-semibold text-[#12263F] tabular-nums">
                {formatShortDate(unit.lastServiceDate)}
              </span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-[#5B6B82]">Next Service Due</span>
              <span className="font-semibold text-[#B85A0E] tabular-nums">
                {formatShortDate(unit.nextServiceDue)}
              </span>
            </div>
            {unit.currentCustomerName && (
              <>
                <div className="flex justify-between py-2">
                  <span className="text-[#5B6B82]">Current Customer</span>
                  <span className="font-semibold text-[#12263F]">
                    {unit.currentCustomerName}
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-[#5B6B82]">Active Rental ID</span>
                  <span className="font-mono font-semibold text-[#1D5FAF]">
                    {unit.currentRentalId}
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-[#5B6B82]">Expected Return</span>
                  <span className="font-semibold text-[#12263F] tabular-nums">
                    {unit.expectedReturnDate ? formatShortDate(unit.expectedReturnDate) : '—'}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="lg:col-span-2 rounded-xl border border-[#DCE6F2] bg-white p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-[#12263F]">
              Condition, Status &amp; Operational Notes
            </h2>
            {canManage && (
              <button
                type="button"
                onClick={handleSaveMeta}
                disabled={saving}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#1D5FAF] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#174D8F]"
              >
                <Save className="h-3.5 w-3.5" />
                {saving ? 'Saving...' : 'Save Status'}
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Unit Availability Status">
              <select
                value={status}
                disabled={!canManage}
                onChange={(e) => setStatus(e.target.value as RentalUnitStatus)}
                className={selectClass}
              >
                <option value="available">Available</option>
                <option value="reserved">Reserved</option>
                <option value="with_customer">With Customer</option>
                <option value="in_transit">In Transit</option>
                <option value="under_service">Under Service</option>
                <option value="retired">Retired</option>
              </select>
            </FormField>

            <FormField label="Physical Condition">
              <select
                value={condition}
                disabled={!canManage}
                onChange={(e) => setCondition(e.target.value as RentalUnitCondition)}
                className={selectClass}
              >
                <option value="new">New</option>
                <option value="good">Good</option>
                <option value="needs_service">Needs Service</option>
                <option value="damaged">Damaged</option>
                <option value="retired">Retired</option>
              </select>
            </FormField>
          </div>

          <FormField label="Technician / Warehouse Notes">
            <textarea
              value={notes}
              disabled={!canManage}
              onChange={(e) => setNotes(e.target.value)}
              className={textareaClass}
            />
          </FormField>
        </div>
      </div>

      {/* Rental History Timeline */}
      <div className="rounded-xl border border-[#DCE6F2] bg-white p-5">
        <h2 className="text-base font-semibold text-[#12263F] mb-4">
          Rental History Timeline
        </h2>
        {unit.rentalHistory.length === 0 ? (
          <p className="text-xs text-[#5B6B82]">
            No past or active customer rentals recorded for this unit yet.
          </p>
        ) : (
          <div className="space-y-3">
            {unit.rentalHistory.map((ev) => (
              <div
                key={ev.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#DCE6F2] bg-[#F6F9FD] p-3.5"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-[#1D5FAF]">
                      {ev.rentalId}
                    </span>
                    <StatusBadge status={ev.status} />
                  </div>
                  <p className="mt-1 text-sm font-semibold text-[#12263F]">
                    {ev.customerName}{' '}
                    <span className="text-xs font-normal text-[#5B6B82] tabular-nums">
                      ({ev.customerPhone})
                    </span>
                  </p>
                  <p className="mt-0.5 text-xs text-[#5B6B82]">{ev.notes}</p>
                </div>
                <div className="text-right text-xs text-[#5B6B82] tabular-nums">
                  <p>
                    {formatShortDate(ev.startDate)} → {formatShortDate(ev.endDate)}
                  </p>
                  {ev.returnedDate && (
                    <p className="text-emerald-700 font-medium">
                      Returned {formatShortDate(ev.returnedDate)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Service Log & Sanitisation Log */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Service Log */}
        <div className="rounded-xl border border-[#DCE6F2] bg-white p-5">
          <div className="flex items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-2">
              <Wrench className="h-4 w-4 text-[#1D5FAF]" />
              <h2 className="text-base font-semibold text-[#12263F]">Service Log</h2>
            </div>
            {canManage && (
              <button
                type="button"
                onClick={() => setServiceModalOpen(true)}
                className="inline-flex items-center gap-1 rounded-lg border border-[#DCE6F2] bg-[#F6F9FD] px-3 py-1.5 text-xs font-semibold text-[#1D5FAF] hover:bg-[#EAF2FC]"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Service
              </button>
            )}
          </div>

          {unit.serviceLogs.length === 0 ? (
            <p className="text-xs text-[#5B6B82]">No service logs recorded.</p>
          ) : (
            <div className="space-y-3">
              {unit.serviceLogs.map((s) => (
                <div
                  key={s.id}
                  className="rounded-xl border border-[#DCE6F2] bg-[#F6F9FD] p-3.5 space-y-1.5"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#12263F] tabular-nums">
                      {formatShortDate(s.date)}
                    </span>
                    <span className="font-semibold text-[#12263F] tabular-nums">
                      {formatINR(s.cost)}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-[#12263F]">{s.issue}</p>
                  <p className="text-xs text-[#5B6B82]">{s.actionTaken}</p>
                  <p className="text-[11px] text-[#5B6B82] tabular-nums">
                    Tech: {s.technician} · Next due: {formatShortDate(s.nextDueDate)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sanitisation Log */}
        <div className="rounded-xl border border-[#DCE6F2] bg-white p-5">
          <div className="flex items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4 text-[#1D5FAF]" />
              <h2 className="text-base font-semibold text-[#12263F]">Sanitisation Log</h2>
            </div>
            {canManage && (
              <button
                type="button"
                onClick={() => setSanModalOpen(true)}
                className="inline-flex items-center gap-1 rounded-lg border border-[#DCE6F2] bg-[#F6F9FD] px-3 py-1.5 text-xs font-semibold text-[#1D5FAF] hover:bg-[#EAF2FC]"
              >
                <Plus className="h-3.5 w-3.5" />
                Log Sanitisation
              </button>
            )}
          </div>

          {unit.sanitisationLogs.length === 0 ? (
            <p className="text-xs text-[#5B6B82]">No sanitisation records logged.</p>
          ) : (
            <div className="space-y-3">
              {unit.sanitisationLogs.map((san) => (
                <div
                  key={san.id}
                  className="rounded-xl border border-[#DCE6F2] bg-[#F6F9FD] p-3.5 space-y-1.5"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#12263F] tabular-nums">
                      {formatShortDate(san.date)}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 font-semibold ${
                        san.passed ? 'text-emerald-700' : 'text-red-600'
                      }`}
                    >
                      {san.passed ? (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      ) : (
                        <ShieldAlert className="h-3.5 w-3.5" />
                      )}
                      {san.passed ? 'QC Passed' : 'Failed QC'}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-[#12263F]">{san.method}</p>
                  <p className="text-xs text-[#5B6B82]">
                    Agent: {san.chemicalUsed} · Verified by {san.verifiedBy}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Service Modal */}
      {serviceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B2545]/45 p-4">
          <div className="w-full max-w-md rounded-xl border border-[#DCE6F2] bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-[#DCE6F2] px-5 py-4">
              <h3 className="text-base font-semibold text-[#12263F]">Add Service Log</h3>
              <button
                type="button"
                onClick={() => setServiceModalOpen(false)}
                className="rounded-lg p-1 text-[#5B6B82] hover:bg-[#EAF2FC]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleAddService} className="p-5 space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Service Date" required>
                  <input
                    type="date"
                    required
                    value={srvDate}
                    onChange={(e) => setSrvDate(e.target.value)}
                    className={inputClass}
                  />
                </FormField>
                <FormField label="Next Service Due" required>
                  <input
                    type="date"
                    required
                    value={srvNextDue}
                    onChange={(e) => setSrvNextDue(e.target.value)}
                    className={inputClass}
                  />
                </FormField>
              </div>
              <FormField label="Reported Issue / Check" required>
                <input
                  type="text"
                  required
                  value={srvIssue}
                  onChange={(e) => setSrvIssue(e.target.value)}
                  placeholder="e.g. Filter replacement & purity check"
                  className={inputClass}
                />
              </FormField>
              <FormField label="Action Taken" required>
                <textarea
                  required
                  value={srvAction}
                  onChange={(e) => setSrvAction(e.target.value)}
                  className={textareaClass}
                />
              </FormField>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Technician" required>
                  <input
                    type="text"
                    required
                    value={srvTech}
                    onChange={(e) => setSrvTech(e.target.value)}
                    className={inputClass}
                  />
                </FormField>
                <FormField label="Service Cost (₹)">
                  <input
                    type="number"
                    min={0}
                    value={srvCost}
                    onChange={(e) => setSrvCost(Number(e.target.value))}
                    className={`${inputClass} tabular-nums`}
                  />
                </FormField>
              </div>
              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setServiceModalOpen(false)}
                  className="rounded-lg border border-[#DCE6F2] px-4 py-2 text-xs font-semibold text-[#12263F]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-[#1D5FAF] px-4 py-2 text-xs font-semibold text-white hover:bg-[#174D8F]"
                >
                  Save Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Sanitisation Modal */}
      {sanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B2545]/45 p-4">
          <div className="w-full max-w-md rounded-xl border border-[#DCE6F2] bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-[#DCE6F2] px-5 py-4">
              <h3 className="text-base font-semibold text-[#12263F]">Log Sanitisation</h3>
              <button
                type="button"
                onClick={() => setSanModalOpen(false)}
                className="rounded-lg p-1 text-[#5B6B82] hover:bg-[#EAF2FC]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleAddSanitisation} className="p-5 space-y-3.5">
              <FormField label="Sanitisation Date" required>
                <input
                  type="date"
                  required
                  value={sanDate}
                  onChange={(e) => setSanDate(e.target.value)}
                  className={inputClass}
                />
              </FormField>
              <FormField label="Method" required>
                <input
                  type="text"
                  required
                  value={sanMethod}
                  onChange={(e) => setSanMethod(e.target.value)}
                  className={inputClass}
                />
              </FormField>
              <FormField label="Disinfectant / Chemical Used" required>
                <input
                  type="text"
                  required
                  value={sanChemical}
                  onChange={(e) => setSanChemical(e.target.value)}
                  className={inputClass}
                />
              </FormField>
              <FormField label="Verified By" required>
                <input
                  type="text"
                  required
                  value={sanVerifier}
                  onChange={(e) => setSanVerifier(e.target.value)}
                  className={inputClass}
                />
              </FormField>
              <label className="flex items-center gap-2 text-xs font-medium text-[#12263F] cursor-pointer">
                <input
                  type="checkbox"
                  checked={sanPassed}
                  onChange={(e) => setSanPassed(e.target.checked)}
                  className="rounded border-[#DCE6F2] text-[#1D5FAF]"
                />
                Passed post-return clinical hygiene inspection
              </label>
              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setSanModalOpen(false)}
                  className="rounded-lg border border-[#DCE6F2] px-4 py-2 text-xs font-semibold text-[#12263F]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-[#1D5FAF] px-4 py-2 text-xs font-semibold text-white hover:bg-[#174D8F]"
                >
                  Record Sanitisation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
