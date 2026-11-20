'use client';

import React, { useState } from 'react';
import { CheckCircle2, FileText, Loader2, Pencil, Plus, Trash2, X } from 'lucide-react';
import type { GstProfile, User } from '@/types';
import { useToastStore, useUserStore } from '@/lib/store';
import { createGstProfile, deleteGstProfile, setDefaultGstProfile, updateGstProfile, type GstInput } from '@/lib/api/account';
import { errorMessage } from '@/lib/api/backend';
import { gstinError, gstinState } from '@/lib/india';
import { apiFieldErrors, btnPrimary, btnSecondary, EmptyState, Field, inputClass, SectionHeader } from './ui';

const MAX_GST_PROFILES = 10; // backend/src/modules/account/validator.js

function GstForm({
  initial,
  editId,
  onCancel,
  onSaved,
}: {
  initial: GstInput;
  editId: string | null;
  onCancel: () => void;
  onSaved: (user: User, message: string) => void;
}) {
  const [draft, setDraft] = useState<GstInput>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState(false);
  const [saving, setSaving] = useState(false);

  const liveError = draft.gstin.length === 15 || touched ? gstinError(draft.gstin) : null;
  const valid = draft.gstin.length === 15 && !gstinError(draft.gstin);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    const er: Record<string, string> = {};
    const g = gstinError(draft.gstin);
    if (g) er.gstin = g;
    if (draft.legalBusinessName.trim().length < 2) er.companyName = 'Enter the legal name registered with GST';
    setErrors(er);
    if (Object.keys(er).length) return;

    setSaving(true);
    try {
      const res = editId ? await updateGstProfile(editId, draft) : await createGstProfile(draft);
      onSaved(res.user, res.message);
    } catch (err) {
      const fields = apiFieldErrors(err);
      setErrors(Object.keys(fields).length ? fields : { form: errorMessage(err) });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={onSubmit} noValidate className="rounded-2xl border border-[#1D5FAF]/30 bg-[#F8FAFD] p-5 sm:p-6 mb-6 max-w-2xl">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-[16px] font-semibold text-[#12263F]">{editId ? 'Edit GST details' : 'Add GST details'}</h3>
        <button type="button" onClick={onCancel} className="p-1.5 rounded-md text-[#5B6B82] hover:bg-white cursor-pointer" aria-label="Close">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-5">
        <Field label="GSTIN" htmlFor="gst-gstin" required error={errors.gstin || liveError || undefined} hint="15 characters, as on your GST certificate">
          <div className="relative">
            <input
              id="gst-gstin"
              value={draft.gstin}
              maxLength={15}
              onChange={(e) => {
                setDraft({ ...draft, gstin: e.target.value.toUpperCase().replace(/[^0-9A-Z]/g, '') });
                setErrors((x) => ({ ...x, gstin: '' }));
              }}
              onBlur={() => setTouched(true)}
              placeholder="27AAPFU0939F1ZV"
              className={`${inputClass} font-mono tracking-wider pr-10 ${errors.gstin || liveError ? '!border-[#DC2626]' : ''}`}
              autoComplete="off"
              spellCheck={false}
            />
            {valid && <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#16A34A]" />}
          </div>
        </Field>

        {valid && (
          <p className="text-[13px] text-[#5B6B82] bg-white border border-[#E8EEF5] rounded-lg px-3.5 py-2.5">
            State <span className="font-semibold text-[#12263F]">{gstinState(draft.gstin) || draft.gstin.slice(0, 2)}</span> (code{' '}
            {draft.gstin.slice(0, 2)}) · PAN <span className="font-mono font-semibold text-[#12263F]">{draft.gstin.slice(2, 12)}</span>
          </p>
        )}

        <Field label="Legal business name" htmlFor="gst-name" required error={errors.companyName}>
          <input
            id="gst-name"
            value={draft.legalBusinessName}
            maxLength={200}
            onChange={(e) => {
              setDraft({ ...draft, legalBusinessName: e.target.value });
              setErrors((x) => ({ ...x, companyName: '' }));
            }}
            placeholder="As on GST registration"
            className={inputClass}
            autoComplete="organization"
          />
        </Field>

        <Field label="Billing address" htmlFor="gst-addr" error={errors.billingAddress} hint="Registered address printed on the invoice (optional)">
          <textarea
            id="gst-addr"
            value={draft.billingAddress || ''}
            maxLength={500}
            rows={3}
            onChange={(e) => setDraft({ ...draft, billingAddress: e.target.value })}
            className={`${inputClass} resize-y`}
          />
        </Field>

        <label className="flex items-center gap-2.5 text-[14px] text-[#12263F] cursor-pointer">
          <input
            type="checkbox"
            checked={draft.isDefault}
            onChange={(e) => setDraft({ ...draft, isDefault: e.target.checked })}
            className="w-4 h-4 accent-[#1D5FAF]"
          />
          Use these details by default at checkout
        </label>
      </div>

      {errors.form && <p className="mt-4 text-[13px] text-[#DC2626]" role="alert">{errors.form}</p>}

      <div className="flex justify-end gap-2 mt-6">
        <button type="button" onClick={onCancel} className={btnSecondary}>
          Cancel
        </button>
        <button type="submit" disabled={saving} className={btnPrimary}>
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          {editId ? 'Save changes' : 'Save GST details'}
        </button>
      </div>
    </form>
  );
}

const toInput = (g?: GstProfile, first = false): GstInput =>
  g
    ? { gstin: g.gstin, legalBusinessName: g.legalBusinessName, billingAddress: g.billingAddress || '', isDefault: g.isDefault }
    : { gstin: '', legalBusinessName: '', billingAddress: '', isDefault: first };

export default function GstTab({ user }: { user: User }) {
  const { setUser } = useUserStore();
  const { addToast } = useToastStore();
  const profiles = user.gstProfiles || [];
  const [editing, setEditing] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const atLimit = profiles.length >= MAX_GST_PROFILES;
  const editingInitial =
    editing === 'new' ? toInput(undefined, profiles.length === 0) : editing ? toInput(profiles.find((g) => g.id === editing)) : null;

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
    <button type="button" onClick={() => setEditing('new')} disabled={atLimit} className={btnPrimary}>
      <Plus className="w-4 h-4" />
      Add GSTIN
    </button>
  );

  return (
    <>
      <SectionHeader
        title="GST details"
        subtitle="Added to your tax invoices so you can claim input tax credit. Save one per branch if you have several."
        action={editing === null && profiles.length > 0 && addButton}
      />

      {editingInitial && (
        <GstForm
          key={editing}
          initial={editingInitial}
          editId={editing !== 'new' ? editing : null}
          onCancel={() => setEditing(null)}
          onSaved={(u, message) => {
            setUser(u);
            setEditing(null);
            addToast({ type: 'success', title: message, message: 'It will be added to invoices at checkout.' });
          }}
        />
      )}

      {profiles.length === 0 && editing === null ? (
        <EmptyState
          icon={FileText}
          title="No GST details saved"
          text="Add your GSTIN to get a B2B tax invoice and claim input tax credit. It's optional."
          cta={addButton}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {profiles.map((g) => (
            <div
              key={g.id}
              className={`rounded-2xl border p-5 flex flex-col ${g.isDefault ? 'border-[#1D5FAF] ring-1 ring-[#1D5FAF]/20' : 'border-[#DCE6F2]'} ${
                busyId === g.id ? 'opacity-60' : ''
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[12px] font-semibold uppercase tracking-wide text-[#5B6B82] bg-[#EEF2F7] px-2 py-0.5 rounded">
                  {g.stateName || `State ${g.stateCode}`}
                </span>
                {g.isDefault && (
                  <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#1D5FAF]">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Default
                  </span>
                )}
              </div>
              <p className="text-[15px] font-semibold text-[#12263F]">{g.legalBusinessName}</p>
              <p className="font-mono text-[14px] tracking-wider text-[#12263F] mt-1">{g.gstin}</p>
              <p className="text-[13px] text-[#5B6B82] mt-1">
                PAN <span className="font-mono">{g.pan}</span>
              </p>
              {g.billingAddress && <p className="text-[13px] text-[#5B6B82] mt-1 whitespace-pre-line">{g.billingAddress}</p>}

              <div className="mt-auto pt-4">
                {confirmDeleteId === g.id ? (
                  <div className="flex flex-wrap items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-100">
                    <span className="text-[13px] text-red-800 flex-1">Remove this GSTIN?</span>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(null)}
                      className="px-3 py-1.5 rounded-md text-[13px] font-semibold text-[#12263F] bg-white border border-[#D5DEEA] cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={busyId === g.id}
                      onClick={() => run(g.id, () => deleteGstProfile(g.id), 'GST details removed')}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-semibold text-white bg-[#DC2626] hover:bg-[#B91C1C] cursor-pointer disabled:opacity-60"
                    >
                      {busyId === g.id && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-4 pt-3 border-t border-[#EEF2F7] text-[13px] font-semibold">
                    <button
                      type="button"
                      onClick={() => setEditing(g.id)}
                      disabled={busyId !== null}
                      className="inline-flex items-center gap-1.5 text-[#1D5FAF] hover:underline cursor-pointer disabled:opacity-50"
                    >
                      <Pencil className="w-3.5 h-3.5" /> Edit
                    </button>
                    {!g.isDefault && (
                      <button
                        type="button"
                        disabled={busyId !== null}
                        onClick={() => run(g.id, () => setDefaultGstProfile(g.id), 'Default GST details updated')}
                        className="text-[#1D5FAF] hover:underline cursor-pointer disabled:opacity-50"
                      >
                        Set as default
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={busyId !== null}
                      onClick={() => setConfirmDeleteId(g.id)}
                      className="inline-flex items-center gap-1.5 ml-auto text-[#5B6B82] hover:text-[#DC2626] cursor-pointer disabled:opacity-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Remove
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
