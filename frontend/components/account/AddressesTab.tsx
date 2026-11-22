'use client';

import React, { useState } from 'react';
import { CheckCircle2, Loader2, MapPin, Pencil, Plus, Trash2, X } from 'lucide-react';
import type { Address, User } from '@/types';
import { useToastStore, useUserStore } from '@/lib/store';
import { createAddress, deleteAddress, setDefaultAddress, updateAddress, type AddressInput } from '@/lib/api/account';
import { errorMessage } from '@/lib/api/backend';
import { formatMobile, INDIAN_STATES, normalizeMobile } from '@/lib/india';
import { apiFieldErrors, btnPrimary, btnSecondary, EmptyState, Field, inputClass, SectionHeader } from './ui';

const MAX_ADDRESSES = 20; // backend/src/modules/account/validator.js
const TYPES: Address['type'][] = ['Clinic', 'Hospital', 'Office', 'Home'];

export const blankAddress = (name = '', phone = '', first = false): AddressInput => ({
  type: 'Clinic',
  name,
  clinicHospitalName: '',
  phone,
  addressLine1: '',
  addressLine2: '',
  landmark: '',
  pincode: '',
  city: '',
  state: '',
  isDefault: first,
});

// API field names → form keys, so server messages land under the right input
const API_FIELD: Record<string, keyof AddressInput> = {
  name: 'name',
  phone: 'phone',
  organisationName: 'clinicHospitalName',
  line1: 'addressLine1',
  line2: 'addressLine2',
  landmark: 'landmark',
  city: 'city',
  state: 'state',
  pincode: 'pincode',
  type: 'type',
};

function validate(a: AddressInput): Record<string, string> {
  const e: Record<string, string> = {};
  if (a.name.trim().length < 2) e.name = "Enter the contact person's name";
  if (!normalizeMobile(a.phone)) e.phone = 'Enter a valid 10-digit Indian mobile number';
  if (a.addressLine1.trim().length < 3) e.addressLine1 = 'Enter the building, floor and street';
  if (a.city.trim().length < 2) e.city = 'Enter the city';
  if (!a.state) e.state = 'Choose a state';
  if (!/^[1-9][0-9]{5}$/.test(a.pincode)) e.pincode = 'Enter a valid 6-digit PIN code';
  return e;
}

export function AddressForm({
  initial,
  isEdit,
  onCancel,
  onSaved,
}: {
  initial: AddressInput;
  isEdit: string | null;
  onCancel: () => void;
  onSaved: (user: User, message: string) => void;
}) {
  const [draft, setDraft] = useState<AddressInput>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof AddressInput>(k: K, v: AddressInput[K]) => {
    setDraft((d) => ({ ...d, [k]: v }));
    setErrors((e) => ({ ...e, [k]: '' }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const er = validate(draft);
    setErrors(er);
    if (Object.keys(er).length) return;
    setSaving(true);
    try {
      const res = isEdit ? await updateAddress(isEdit, draft) : await createAddress(draft);
      onSaved(res.user, res.message);
    } catch (err) {
      const fields = apiFieldErrors(err);
      setErrors(Object.fromEntries(Object.entries(fields).map(([k, v]) => [API_FIELD[k] || k, v])));
      if (!Object.keys(fields).length) setErrors({ form: errorMessage(err) });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={onSubmit} noValidate className="rounded-2xl border border-[#1D5FAF]/30 bg-[#F8FAFD] p-5 sm:p-6 mb-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-[16px] font-semibold text-[#12263F]">{isEdit ? 'Edit address' : 'Add a new address'}</h3>
        <button type="button" onClick={onCancel} className="p-1.5 rounded-md text-[#5B6B82] hover:bg-white cursor-pointer" aria-label="Close">
          <X className="w-4 h-4" />
        </button>
      </div>

      <fieldset className="mb-5">
        <legend className="text-[13px] font-semibold text-[#12263F] mb-2">Address type</legend>
        <div className="flex flex-wrap gap-2">
          {TYPES.map((t) => (
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
        <Field label="Contact name" htmlFor="ad-name" required error={errors.name}>
          <input id="ad-name" value={draft.name} maxLength={120} onChange={(e) => set('name', e.target.value)} className={inputClass} autoComplete="name" />
        </Field>
        <Field label="Mobile number" htmlFor="ad-phone" required error={errors.phone} hint="The courier calls this number">
          <input
            id="ad-phone"
            type="tel"
            inputMode="tel"
            maxLength={16}
            value={draft.phone}
            onChange={(e) => set('phone', e.target.value)}
            className={inputClass}
            autoComplete="tel"
          />
        </Field>
        {draft.type !== 'Home' && (
          <div className="sm:col-span-2">
            <Field label={draft.type === 'Office' ? 'Company / organisation name' : 'Clinic / hospital name'} htmlFor="ad-org" error={errors.clinicHospitalName}>
              <input
                id="ad-org"
                maxLength={200}
                value={draft.clinicHospitalName || ''}
                onChange={(e) => set('clinicHospitalName', e.target.value)}
                className={inputClass}
                autoComplete="organization"
              />
            </Field>
          </div>
        )}
        <div className="sm:col-span-2">
          <Field label="Address line 1" htmlFor="ad-l1" required error={errors.addressLine1}>
            <input
              id="ad-l1"
              maxLength={200}
              placeholder="Building, floor, street"
              value={draft.addressLine1}
              onChange={(e) => set('addressLine1', e.target.value)}
              className={inputClass}
              autoComplete="address-line1"
            />
          </Field>
        </div>
        <Field label="Address line 2" htmlFor="ad-l2" error={errors.addressLine2}>
          <input
            id="ad-l2"
            maxLength={200}
            placeholder="Area, sector (optional)"
            value={draft.addressLine2 || ''}
            onChange={(e) => set('addressLine2', e.target.value)}
            className={inputClass}
            autoComplete="address-line2"
          />
        </Field>
        <Field label="Landmark" htmlFor="ad-lm" error={errors.landmark}>
          <input
            id="ad-lm"
            maxLength={200}
            placeholder="Near … (optional)"
            value={draft.landmark || ''}
            onChange={(e) => set('landmark', e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="PIN code" htmlFor="ad-pin" required error={errors.pincode}>
          <input
            id="ad-pin"
            inputMode="numeric"
            maxLength={6}
            value={draft.pincode}
            onChange={(e) => set('pincode', e.target.value.replace(/\D/g, ''))}
            className={inputClass}
            autoComplete="postal-code"
          />
        </Field>
        <Field label="City" htmlFor="ad-city" required error={errors.city}>
          <input id="ad-city" maxLength={80} value={draft.city} onChange={(e) => set('city', e.target.value)} className={inputClass} autoComplete="address-level2" />
        </Field>
        <Field label="State / UT" htmlFor="ad-state" required error={errors.state} hint="Decides CGST + SGST or IGST on your invoice">
          <select
            id="ad-state"
            value={draft.state}
            onChange={(e) => set('state', e.target.value)}
            className={`${inputClass} cursor-pointer`}
            autoComplete="address-level1"
          >
            <option value="">Select state</option>
            {INDIAN_STATES.map((s) => (
              <option key={s.code} value={s.name}>
                {s.name}
              </option>
            ))}
          </select>
        </Field>
        <label className="flex items-center gap-2.5 self-end pb-2.5 text-[14px] text-[#12263F] cursor-pointer">
          <input type="checkbox" checked={draft.isDefault} onChange={(e) => set('isDefault', e.target.checked)} className="w-4 h-4 accent-[#1D5FAF]" />
          Make this my default address
        </label>
      </div>

      {errors.form && <p className="mt-4 text-[13px] text-[#DC2626]" role="alert">{errors.form}</p>}

      <div className="flex justify-end gap-2 mt-6">
        <button type="button" onClick={onCancel} className={btnSecondary}>
          Cancel
        </button>
        <button type="submit" disabled={saving} className={btnPrimary}>
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          {isEdit ? 'Save changes' : 'Save address'}
        </button>
      </div>
    </form>
  );
}

export default function AddressesTab({ user }: { user: User }) {
  const { setUser } = useUserStore();
  const { addToast } = useToastStore();
  // null = closed, 'new' = adding, otherwise the id being edited
  const [editing, setEditing] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const atLimit = user.addresses.length >= MAX_ADDRESSES;

  const editingInitial: AddressInput | null =
    editing === 'new'
      ? blankAddress(user.name, user.phone, user.addresses.length === 0)
      : editing
        ? (() => {
            const a = user.addresses.find((x) => x.id === editing);
            if (!a) return null;
            const { id: _id, alternatePhone: _alt, ...rest } = a;
            return { ...rest, addressLine2: rest.addressLine2 || '', landmark: rest.landmark || '', clinicHospitalName: rest.clinicHospitalName || '' };
          })()
        : null;

  const run = async (id: string, action: () => Promise<{ user: User; message: string }>, title: string) => {
    setBusyId(id);
    try {
      const res = await action();
      setUser(res.user);
      addToast({ type: 'success', title, message: res.message });
    } catch (err) {
      addToast({ type: 'error', title: 'Something went wrong', message: errorMessage(err) });
    } finally {
      setBusyId(null);
      setConfirmDeleteId(null);
    }
  };

  const addButton = (
    <button type="button" onClick={() => setEditing('new')} disabled={atLimit} className={btnPrimary} title={atLimit ? `You can save up to ${MAX_ADDRESSES} addresses` : undefined}>
      <Plus className="w-4 h-4" />
      Add address
    </button>
  );

  return (
    <>
      <SectionHeader
        title="Saved addresses"
        subtitle={`Clinic, hospital and home delivery locations${user.addresses.length ? ` · ${user.addresses.length} of ${MAX_ADDRESSES}` : ''}.`}
        action={editing === null && addButton}
      />

      {editingInitial && (
        <AddressForm
          key={editing}
          initial={editingInitial}
          isEdit={editing !== 'new' ? editing : null}
          onCancel={() => setEditing(null)}
          onSaved={(u, message) => {
            setUser(u);
            setEditing(null);
            addToast({ type: 'success', title: message, message: 'You can select it at checkout.' });
          }}
        />
      )}

      {user.addresses.length === 0 && editing === null ? (
        <EmptyState icon={MapPin} title="No saved addresses" text="Add your clinic or hospital address for faster checkout." cta={addButton} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {user.addresses.map((addr) => (
            <div
              key={addr.id}
              className={`rounded-2xl border p-5 flex flex-col transition-opacity ${addr.isDefault ? 'border-[#1D5FAF] ring-1 ring-[#1D5FAF]/20' : 'border-[#DCE6F2]'} ${
                busyId === addr.id ? 'opacity-60' : ''
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[12px] font-semibold uppercase tracking-wide text-[#5B6B82] bg-[#EEF2F7] px-2 py-0.5 rounded">{addr.type}</span>
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
                {addr.landmark && (
                  <>
                    <br />
                    Landmark: {addr.landmark}
                  </>
                )}
                <br />
                {addr.city}, {addr.state} – {addr.pincode}
              </p>
              <p className="text-[13px] text-[#5B6B82] mt-1">Phone: {formatMobile(addr.phone)}</p>

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
                      disabled={busyId === addr.id}
                      onClick={() => run(addr.id, () => deleteAddress(addr.id), 'Address deleted')}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-semibold text-white bg-[#DC2626] hover:bg-[#B91C1C] cursor-pointer disabled:opacity-60"
                    >
                      {busyId === addr.id && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      Delete
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-4 pt-3 border-t border-[#EEF2F7] text-[13px] font-semibold">
                    <button
                      type="button"
                      onClick={() => setEditing(addr.id)}
                      disabled={busyId !== null}
                      className="inline-flex items-center gap-1.5 text-[#1D5FAF] hover:underline cursor-pointer disabled:opacity-50"
                    >
                      <Pencil className="w-3.5 h-3.5" /> Edit
                    </button>
                    {!addr.isDefault && (
                      <button
                        type="button"
                        disabled={busyId !== null}
                        onClick={() => run(addr.id, () => setDefaultAddress(addr.id), 'Default address updated')}
                        className="text-[#1D5FAF] hover:underline cursor-pointer disabled:opacity-50"
                      >
                        Set as default
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={busyId !== null}
                      onClick={() => setConfirmDeleteId(addr.id)}
                      className="inline-flex items-center gap-1.5 ml-auto text-[#5B6B82] hover:text-[#DC2626] cursor-pointer disabled:opacity-50"
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
  );
}
