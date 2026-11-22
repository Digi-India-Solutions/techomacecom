import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  BellRing,
  CheckCircle2,
  CreditCard,
  Download,
  Eye,
  Loader2,
  Mail,
  MapPin,
  MessageCircle,
  ArrowDown,
  ArrowUp,
  Plus,
  ReceiptIndianRupee,
  RefreshCw,
  RotateCcw,
  Save,
  Search,
  Send,
  Smartphone,
  Store,
  Stethoscope,
  Trash2,
  Truck,
  Upload,
  XCircle,
} from 'lucide-react';
import type {
  AdminSettings,
  NotificationChannelStatus,
  NotificationLogRow,
  NotificationTemplate,
  PincodeRow,
  PincodeSummary,
  SettingsGroup,
  SettingsImage,
} from '@/types/admin';
import {
  clearPincodes,
  clearRentalPincodes,
  deletePincodeRow,
  deleteRentalPincodeRow,
  downloadPincodesCsv,
  downloadRentalPincodesCsv,
  getAdminSettings,
  getNotificationLogs,
  getNotificationTemplates,
  getPincodeSummary,
  getRentalPincodeSummary,
  importPincodesCsv,
  importRentalPincodesCsv,
  listPincodes,
  listRentalPincodes,
  removeSettingsImage,
  saveNotificationTemplates,
  saveSettingsGroup,
  sendTestNotification,
  togglePincodeCod,
  toggleRentalPincodeActive,
  toggleRentalPincodeCod,
  uploadSettingsImage,
} from '@/lib/api/admin/settings';
import { AdminApiError, formatDateTime, type ListMeta } from '@/lib/api/admin/client';
import { useAuth } from '@/components/admin/AuthContext';
import { useToast } from '@/components/admin/ToastProvider';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { FormField, inputClass, selectClass, textareaClass } from '@/components/admin/FormField';

type TabKey = 'store' | 'shipping' | 'returns' | 'payments' | 'taxInvoice' | 'notifications' | 'rental';

const TABS: { key: TabKey; label: string; icon: React.ComponentType<{ className?: string }>; group?: SettingsGroup }[] = [
  { key: 'store', label: 'Store', icon: Store, group: 'store' },
  { key: 'shipping', label: 'Shipping', icon: Truck, group: 'shipping' },
  { key: 'returns', label: 'Returns & Refunds', icon: RotateCcw, group: 'returns' },
  { key: 'payments', label: 'Payments', icon: CreditCard },
  { key: 'taxInvoice', label: 'Tax & Invoice', icon: ReceiptIndianRupee, group: 'tax' },
  { key: 'notifications', label: 'Notifications', icon: BellRing },
  { key: 'rental', label: 'Rental', icon: Stethoscope, group: 'rental' },
];

const card = 'rounded-xl border border-[#DCE6F2] bg-white p-5 sm:p-6';
const sectionTitle = 'text-base font-semibold text-[#12263F]';
const sectionHint = 'mt-0.5 text-xs text-[#5B6B82]';
const btnSecondary =
  'inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#DCE6F2] bg-white px-3 py-1.5 text-xs font-semibold text-[#12263F] hover:bg-[#EAF2FC] disabled:cursor-not-allowed disabled:opacity-50';
const checkbox = 'h-4 w-4 rounded border-[#DCE6F2] accent-[#1D5FAF]';

const errText = (err: unknown) => (err instanceof Error ? err.message : 'Please try again');
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

function Toggle({ checked, onChange, label, hint, disabled }: { checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string; disabled?: boolean }) {
  return (
    <label className={`flex items-start gap-2.5 ${disabled ? 'opacity-60' : 'cursor-pointer'}`}>
      <input type="checkbox" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} className={`${checkbox} mt-0.5`} />
      <span>
        <span className="block text-xs font-semibold text-[#12263F]">{label}</span>
        {hint && <span className="block text-[11px] text-[#5B6B82]">{hint}</span>}
      </span>
    </label>
  );
}

function Rupee({ value, onChange, disabled, id }: { value: number; onChange: (v: number) => void; disabled?: boolean; id?: string }) {
  return (
    <div className="flex">
      <span className="inline-flex items-center rounded-l-lg border border-r-0 border-[#DCE6F2] bg-[#F6F9FD] px-2.5 text-xs text-[#5B6B82]">₹</span>
      <input
        id={id}
        type="number"
        min={0}
        step="0.01"
        disabled={disabled}
        value={Number.isFinite(value) && value !== 0 ? value : ''}
        placeholder="0"
        onChange={(e) => onChange(e.target.value === '' ? 0 : Number(e.target.value))}
        className={`${inputClass} !rounded-l-none`}
      />
    </div>
  );
}

/** Logo / favicon / signature: uploads immediately (converted to WebP by the API). */
function ImageSetting({
  name,
  label,
  hint,
  url,
  boxClass,
  canEdit,
  onChanged,
}: {
  name: SettingsImage;
  label: string;
  hint: string;
  url: string | null;
  boxClass: string;
  canEdit: boolean;
  onChanged: (url: string | null, path: string) => void;
}) {
  const { showToast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<'up' | 'rm' | null>(null);

  const pick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusy('up');
    try {
      const res = await uploadSettingsImage(name, file);
      onChanged(res.url, res.path);
      showToast({ title: `${label} updated`, description: `Saved as ${res.width}×${res.height} WebP (${Math.round(res.bytes / 1024)} KB). Live on the website within a minute.`, variant: 'success' });
    } catch (err) {
      showToast({ title: `Could not upload ${label.toLowerCase()}`, description: errText(err), variant: 'error' });
    } finally {
      setBusy(null);
    }
  };

  const remove = async () => {
    setBusy('rm');
    try {
      await removeSettingsImage(name);
      onChanged(null, '');
      showToast({ title: `${label} removed`, description: 'The website falls back to its built-in image.', variant: 'success' });
    } catch (err) {
      showToast({ title: `Could not remove ${label.toLowerCase()}`, description: errText(err), variant: 'error' });
    } finally {
      setBusy(null);
    }
  };

  return (
    <FormField label={label} hint={hint}>
      <div className="flex items-center gap-3">
        <div className={`flex shrink-0 items-center justify-center overflow-hidden rounded-lg border border-dashed border-[#C5D2E3] bg-[#F6F9FD] ${boxClass}`}>
          {url ? <img src={url} alt={label} className="h-full w-full object-contain" /> : <span className="px-1 text-center text-[10px] text-[#5B6B82]">Default</span>}
        </div>
        {canEdit && (
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => inputRef.current?.click()} disabled={busy !== null} className={btnSecondary}>
              {busy === 'up' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
              {url ? 'Replace' : 'Upload'}
            </button>
            {url && (
              <button type="button" onClick={remove} disabled={busy !== null} className={`${btnSecondary} text-red-600 hover:bg-red-50`}>
                {busy === 'rm' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                Remove
              </button>
            )}
            <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={pick} />
          </div>
        )}
      </div>
    </FormField>
  );
}

// ===========================================================================

export function SettingsPage() {
  const { can } = useAuth();
  const canEdit = can('settings.edit');
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<TabKey>('store');
  const [saved, setSaved] = useState<AdminSettings | null>(null);
  const [draft, setDraft] = useState<AdminSettings | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [saving, setSaving] = useState(false);

  // Notifications tab state (separate API)
  const [templates, setTemplates] = useState<NotificationTemplate[] | null>(null);
  const [savedTemplates, setSavedTemplates] = useState<NotificationTemplate[] | null>(null);
  const [channels, setChannels] = useState<NotificationChannelStatus | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const s = await getAdminSettings();
      setSaved(s);
      setDraft(structuredClone(s));
    } catch (err) {
      setLoadError(errText(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (activeTab !== 'notifications' || templates) return;
    getNotificationTemplates()
      .then((res) => {
        setTemplates(res.events);
        setSavedTemplates(structuredClone(res.events));
        setChannels(res.channels);
      })
      .catch((err) => showToast({ title: 'Could not load notification templates', description: errText(err), variant: 'error' }));
  }, [activeTab, templates, showToast]);

  const dirtyTabs = useMemo(() => {
    const out = new Set<TabKey>();
    if (saved && draft) {
      for (const t of TABS) if (t.group && !same(saved[t.group], draft[t.group])) out.add(t.key);
    }
    if (templates && savedTemplates && !same(templates, savedTemplates)) out.add('notifications');
    return out;
  }, [saved, draft, templates, savedTemplates]);

  // Warn before leaving with unsaved changes
  useEffect(() => {
    if (!dirtyTabs.size) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [dirtyTabs]);

  const tab = TABS.find((t) => t.key === activeTab)!;
  const canSaveTab = canEdit && (tab.group !== undefined || activeTab === 'notifications');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft || !canSaveTab) return;
    setSaving(true);
    setErrors({});
    try {
      if (activeTab === 'notifications') {
        if (!templates) return;
        const res = await saveNotificationTemplates(templates);
        setTemplates(res.events);
        setSavedTemplates(structuredClone(res.events));
        setChannels(res.channels);
        showToast({ title: res.message, variant: 'success' });
      } else if (tab.group) {
        const group = tab.group;
        const res = await saveSettingsGroup(group, draft[group] as never);
        setSaved(res);
        // Keep unsaved edits on the other tabs; take the server's copy of this one
        setDraft((d) => (d ? { ...d, [group]: structuredClone(res[group]), images: res.images } : d));
        showToast({
          title: res.message,
          description: res.changed.length ? 'The website picks up changes within a minute.' : undefined,
          variant: res.changed.length ? 'success' : 'info',
        });
      }
    } catch (err) {
      if (err instanceof AdminApiError && err.fields) setErrors(err.fields);
      showToast({ title: 'Could not save settings', description: errText(err), variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const discard = () => {
    if (activeTab === 'notifications') setTemplates(savedTemplates ? structuredClone(savedTemplates) : null);
    else if (tab.group && saved && draft) setDraft({ ...draft, [tab.group]: structuredClone(saved[tab.group]) });
    setErrors({});
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-64 animate-pulse rounded-lg bg-slate-200" />
        <div className="h-12 animate-pulse rounded-xl bg-slate-200" />
        <div className="h-96 animate-pulse rounded-xl bg-slate-200" />
      </div>
    );
  }

  if (loadError || !draft || !saved) {
    return (
      <div className={`${card} max-w-lg`}>
        <h2 className={sectionTitle}>Settings could not be loaded</h2>
        <p className="mt-1 text-sm text-[#5B6B82]">{loadError || 'Unknown error'}</p>
        <button type="button" onClick={load} className={`${btnSecondary} mt-4`}>
          <RefreshCw className="h-3.5 w-3.5" /> Try again
        </button>
      </div>
    );
  }

  const set = <G extends SettingsGroup>(group: G, patch: Partial<AdminSettings[G]>) => {
    setDraft((d) => (d ? { ...d, [group]: { ...d[group], ...patch } } : d));
    setErrors((er) => {
      const next = { ...er };
      for (const k of Object.keys(patch)) delete next[k];
      return next;
    });
  };

  const tabDirty = dirtyTabs.has(activeTab);

  return (
    <form onSubmit={handleSave} className="settings-form space-y-5" noValidate>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#12263F]">Settings</h1>
          <p className="mt-0.5 text-sm text-[#5B6B82]">
            Store details, delivery, returns, GST invoices, customer notifications and rental rules. Changes appear on the website within a minute.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {tabDirty && (
            <button type="button" onClick={discard} className="text-xs font-semibold text-[#5B6B82] hover:text-[#12263F]">
              Discard changes
            </button>
          )}
          {canSaveTab && (
            <button
              type="submit"
              disabled={saving || !tabDirty}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#1D5FAF] px-4 py-2 text-xs font-semibold text-white hover:bg-[#174D8F] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saving ? 'Saving…' : `Save ${tab.label}`}
            </button>
          )}
        </div>
      </div>

      {!canEdit && (
        <p className="rounded-lg border border-[#F28C38]/35 bg-[#F28C38]/10 px-3 py-2 text-xs text-[#B85A0E]">
          You can view settings but not change them (needs Settings → Edit permission).
        </p>
      )}

      <div className="flex items-center gap-1 overflow-x-auto rounded-xl border border-[#DCE6F2] bg-white p-1.5">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = activeTab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => {
                setActiveTab(t.key);
                setErrors({});
              }}
              className={`relative inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors ${
                active ? 'bg-[#1D5FAF] text-white' : 'text-[#5B6B82] hover:bg-[#EAF2FC] hover:text-[#12263F]'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {t.label}
              {dirtyTabs.has(t.key) && <span className="h-1.5 w-1.5 rounded-full bg-[#F28C38]" aria-label="Unsaved changes" />}
            </button>
          );
        })}
      </div>

      {activeTab === 'store' && <StoreTab s={draft} set={set} errors={errors} canEdit={canEdit} setDraft={setDraft} setSaved={setSaved} />}
      {activeTab === 'shipping' && <ShippingTab s={draft} set={set} errors={errors} canEdit={canEdit} />}
      {activeTab === 'returns' && <ReturnsTab s={draft} set={set} errors={errors} canEdit={canEdit} />}
      {activeTab === 'payments' && <PaymentsTab />}
      {activeTab === 'taxInvoice' && <TaxTab s={draft} set={set} errors={errors} canEdit={canEdit} setDraft={setDraft} setSaved={setSaved} />}
      {activeTab === 'notifications' && (
        <NotificationsTab templates={templates} setTemplates={setTemplates} channels={channels} canEdit={canEdit} dirty={tabDirty} />
      )}
      {activeTab === 'rental' && <RentalTab s={draft} set={set} errors={errors} canEdit={canEdit} />}
    </form>
  );
}

type SetFn = <G extends SettingsGroup>(group: G, patch: Partial<AdminSettings[G]>) => void;
interface TabProps {
  s: AdminSettings;
  set: SetFn;
  errors: Record<string, string>;
  canEdit: boolean;
}
interface ImageTabProps extends TabProps {
  setDraft: React.Dispatch<React.SetStateAction<AdminSettings | null>>;
  setSaved: React.Dispatch<React.SetStateAction<AdminSettings | null>>;
}

/** Images are saved immediately, so both the draft and the saved copy get the new path. */
function applyImage(
  props: Pick<ImageTabProps, 'setDraft' | 'setSaved'>,
  image: SettingsImage,
  url: string | null,
  path: string
) {
  const key = { logo: 'logoPath', footerLogo: 'footerLogoPath', favicon: 'faviconPath', signatory: 'signatoryPath' }[image];
  const group = image === 'signatory' ? 'tax' : 'store';
  const update = (x: AdminSettings | null) =>
    x ? ({ ...x, images: { ...x.images, [image]: url }, [group]: { ...x[group], [key]: path } } as AdminSettings) : x;
  props.setDraft(update);
  props.setSaved(update);
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

function StoreTab(props: ImageTabProps) {
  const { s, set, errors, canEdit } = props;
  const st = s.store;
  const d = !canEdit;
  const field = (key: keyof AdminSettings['store'], label: string, opts: { required?: boolean; hint?: string; type?: string; placeholder?: string; mono?: boolean } = {}) => (
    <FormField label={label} htmlFor={`st-${key}`} required={opts.required} error={errors[key]} hint={opts.hint}>
      <input
        id={`st-${key}`}
        type={opts.type || 'text'}
        disabled={d}
        value={String(st[key] ?? '')}
        placeholder={opts.placeholder}
        onChange={(e) => set('store', { [key]: key === 'gstin' ? e.target.value.toUpperCase() : e.target.value } as Partial<AdminSettings['store']>)}
        className={`${inputClass} ${opts.mono ? 'font-mono' : ''}`}
      />
    </FormField>
  );

  return (
    <div className="space-y-5">
      <section className={card}>
        <h2 className={sectionTitle}>Business identity</h2>
        <p className={sectionHint}>Shown in the website header and footer, page titles, invoices and emails.</p>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {field('storeName', 'Registered legal name', { required: true, hint: 'Printed on invoices and the footer ©' })}
          {field('brandName', 'Brand name', { required: true, hint: 'Used in page titles, e.g. “Buy Denmed”' })}
          {field('tagline', 'Tagline', { hint: 'Short line used in page titles' })}
          {field('gstin', 'Store GSTIN', { mono: true, placeholder: '07AAACB1234F1Z5', hint: 'Printed on every tax invoice; check digit verified' })}
        </div>
      </section>

      <section className={card}>
        <h2 className={sectionTitle}>Logo &amp; favicon</h2>
        <p className={sectionHint}>Uploads are saved straight away and converted to WebP. PNG with a transparent background works best.</p>
        <div className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-3">
          <ImageSetting name="logo" label="Header logo" hint="Wide logo, at least 400 px wide" url={s.images.logo} boxClass="h-14 w-40" canEdit={canEdit} onChanged={(u, p) => applyImage(props, 'logo', u, p)} />
          <ImageSetting
            name="footerLogo"
            label="Footer logo"
            hint="Optional light version for the dark footer"
            url={s.images.footerLogo}
            boxClass="h-14 w-40 !bg-[#0B2545]"
            canEdit={canEdit}
            onChanged={(u, p) => applyImage(props, 'footerLogo', u, p)}
          />
          <ImageSetting name="favicon" label="Favicon" hint="Square, at least 192 × 192 px" url={s.images.favicon} boxClass="h-14 w-14" canEdit={canEdit} onChanged={(u, p) => applyImage(props, 'favicon', u, p)} />
        </div>
      </section>

      <section className={card}>
        <h2 className={sectionTitle}>Contact details</h2>
        <p className={sectionHint}>Used on the contact page, footer, call / WhatsApp buttons, order and rental pages.</p>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {field('supportPhone', 'Support phone', { required: true, placeholder: '+91 98112 34567' })}
          {field('salesPhone', 'Sales / office phone', { placeholder: '+91 11 4982 7000' })}
          {field('tollFreePhone', 'Toll-free number', { placeholder: '1800-212-3366' })}
          {field('supportEmail', 'Support email', { required: true, type: 'email' })}
          {field('salesEmail', 'Orders / sales email', { type: 'email', hint: 'Bulk enquiries; falls back to support email' })}
          {field('whatsappNumber', 'WhatsApp number', { placeholder: '98112 34567', hint: '10-digit mobile; powers every WhatsApp button' })}
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[2fr_1fr]">
          <FormField label="Registered address" htmlFor="st-address" required error={errors.address} hint="Contact page, footer and invoices">
            <textarea id="st-address" rows={2} disabled={d} value={st.address} onChange={(e) => set('store', { address: e.target.value })} className={textareaClass} />
          </FormField>
          {field('mapUrl', 'Google Maps link', { type: 'url', placeholder: 'https://maps.app.goo.gl/…' })}
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <FormField label="Support opens" htmlFor="st-open" error={errors.supportOpenTime}>
            <input id="st-open" type="time" disabled={d} value={st.supportOpenTime} onChange={(e) => set('store', { supportOpenTime: e.target.value })} className={inputClass} />
          </FormField>
          <FormField label="Support closes" htmlFor="st-close" error={errors.supportCloseTime}>
            <input id="st-close" type="time" disabled={d} value={st.supportCloseTime} onChange={(e) => set('store', { supportCloseTime: e.target.value })} className={inputClass} />
          </FormField>
          <div className="flex items-end pb-2">
            <Toggle checked={st.openOnSunday} disabled={d} onChange={(v) => set('store', { openOnSunday: v })} label="Open on Sundays" hint="WhatsApp widget shows “online” during these hours (IST)" />
          </div>
        </div>
      </section>

      <section className={card}>
        <h2 className={sectionTitle}>Social media</h2>
        <p className={sectionHint}>Only filled links are shown in the website footer.</p>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {field('instagramUrl', 'Instagram', { type: 'url', placeholder: 'https://instagram.com/…' })}
          {field('facebookUrl', 'Facebook', { type: 'url', placeholder: 'https://facebook.com/…' })}
          {field('linkedinUrl', 'LinkedIn', { type: 'url', placeholder: 'https://linkedin.com/company/…' })}
          {field('youtubeUrl', 'YouTube', { type: 'url', placeholder: 'https://youtube.com/@…' })}
          {field('twitterUrl', 'X (Twitter)', { type: 'url', placeholder: 'https://x.com/…' })}
        </div>
      </section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shipping
// ---------------------------------------------------------------------------

function ShippingTab({ s, set, errors, canEdit }: TabProps) {
  const sh = s.shipping;
  const d = !canEdit;
  return (
    <div className="space-y-5">
      <section className={card}>
        <h2 className={sectionTitle}>Delivery charges</h2>
        <p className={sectionHint}>Applied in the cart and checkout on the website.</p>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <FormField label="Flat shipping charge" htmlFor="sh-flat" error={errors.flatShippingCharge} hint="Per order, below the free-shipping amount">
            <Rupee id="sh-flat" disabled={d} value={sh.flatShippingCharge} onChange={(v) => set('shipping', { flatShippingCharge: v })} />
          </FormField>
          <FormField label="Free shipping above" htmlFor="sh-free" error={errors.freeShippingAbove} hint="Cart value; 0 = always free">
            <Rupee id="sh-free" disabled={d} value={sh.freeShippingAbove} onChange={(v) => set('shipping', { freeShippingAbove: v })} />
          </FormField>
          <FormField label="Default delivery time (days)" htmlFor="sh-days" error={errors.defaultDeliveryDays} hint='e.g. "3-7" — PINs in the list can override'>
            <input id="sh-days" disabled={d} value={sh.defaultDeliveryDays} onChange={(e) => set('shipping', { defaultDeliveryDays: e.target.value })} className={inputClass} />
          </FormField>
          <FormField label="Same-day dispatch cut-off" htmlFor="sh-cut" error={errors.dispatchCutoffTime} hint="Orders before this time ship today">
            <input id="sh-cut" type="time" disabled={d} value={sh.dispatchCutoffTime} onChange={(e) => set('shipping', { dispatchCutoffTime: e.target.value })} className={inputClass} />
          </FormField>
        </div>
        <p className="mt-3 rounded-lg bg-[#F6F9FD] px-3 py-2 text-[11px] text-[#5B6B82]">
          Preview: a ₹{Math.max(0, sh.freeShippingAbove - 1).toLocaleString('en-IN')} cart pays ₹{sh.flatShippingCharge.toLocaleString('en-IN')} shipping
          {sh.freeShippingAbove > 0 ? `; ₹${sh.freeShippingAbove.toLocaleString('en-IN')} and above ships free.` : '.'}
        </p>
      </section>

      <section className={card}>
        <h2 className={sectionTitle}>Cash on delivery</h2>
        <div className="mt-3">
          <Toggle checked={sh.codEnabled} disabled={d} onChange={(v) => set('shipping', { codEnabled: v })} label="Offer cash on delivery" hint="Shown as a payment option at checkout when the order and PIN code qualify" />
        </div>
        <div className={`mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 ${sh.codEnabled ? '' : 'opacity-50'}`}>
          <FormField label="Maximum COD order value" htmlFor="sh-codmax" error={errors.codMaxOrderValue} hint="Orders above this must be prepaid">
            <Rupee id="sh-codmax" disabled={d || !sh.codEnabled} value={sh.codMaxOrderValue} onChange={(v) => set('shipping', { codMaxOrderValue: v })} />
          </FormField>
          <FormField label="COD handling charge" htmlFor="sh-codfee" error={errors.codCharge} hint="Added when the customer picks COD">
            <Rupee id="sh-codfee" disabled={d || !sh.codEnabled} value={sh.codCharge} onChange={(v) => set('shipping', { codCharge: v })} />
          </FormField>
        </div>
      </section>

      <PincodePanel canEdit={canEdit} defaultDays={sh.defaultDeliveryDays} />

      <section className="rounded-xl border border-dashed border-[#C5D2E3] bg-[#F6F9FD] p-5">
        <h2 className="text-sm font-semibold text-[#12263F]">Shiprocket</h2>
        <p className="mt-1 text-xs text-[#5B6B82]">
          Courier booking, live serviceability and tracking will be connected with the Shiprocket integration. Until then, delivery coverage comes from the PIN code list above.
        </p>
      </section>
    </div>
  );
}

function PincodePanel({
  canEdit,
  defaultDays,
  type = 'ecommerce',
}: {
  canEdit: boolean;
  defaultDays: string;
  type?: 'ecommerce' | 'rental';
}) {
  const isRental = type === 'rental';
  const { showToast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [summary, setSummary] = useState<PincodeSummary | null>(null);
  const [mode, setMode] = useState<'merge' | 'replace'>('merge');
  const [busy, setBusy] = useState<'import' | 'clear' | 'export' | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [q, setQ] = useState('');
  const [rows, setRows] = useState<PincodeRow[]>([]);
  const [meta, setMeta] = useState<ListMeta | undefined>();
  const [page, setPage] = useState(1);
  const [importErrors, setImportErrors] = useState<{ line: number; message: string }[]>([]);
  const [togglingPin, setTogglingPin] = useState<string | null>(null);
  const [deletingPin, setDeletingPin] = useState<string | null>(null);

  const onToggle = async (pincode: string) => {
    setTogglingPin(pincode);
    try {
      if (isRental) {
        const res = await toggleRentalPincodeActive(pincode);
        setRows((prev) => prev.map((r) => (r.pincode === pincode ? { ...r, active: res.active } : r)));
        if (res.summary) setSummary(res.summary);
        showToast({
          title: `PIN ${pincode}`,
          description: `Rental serviceability ${res.active ? 'Active (Yes)' : 'Inactive (No)'}.`,
          variant: 'success',
        });
      } else {
        const res = await togglePincodeCod(pincode);
        setRows((prev) => prev.map((r) => (r.pincode === pincode ? { ...r, codAvailable: res.codAvailable } : r)));
        if (res.summary) setSummary(res.summary);
        showToast({
          title: `PIN ${pincode}`,
          description: `Cash on Delivery ${res.codAvailable ? 'enabled (Yes)' : 'disabled (No)'}.`,
          variant: 'success',
        });
      }
    } catch (err) {
      showToast({ title: isRental ? 'Could not update status' : 'Could not update COD', description: errText(err), variant: 'error' });
    } finally {
      setTogglingPin(null);
    }
  };

  const onDeleteSinglePin = async (pincode: string) => {
    setDeletingPin(pincode);
    try {
      const res = isRental ? await deleteRentalPincodeRow(pincode) : await deletePincodeRow(pincode);
      setRows((prev) => prev.filter((r) => r.pincode !== pincode));
      if (res.summary) setSummary(res.summary);
      showToast({
        title: `PIN ${pincode} removed`,
        description: `Removed from serviceable PIN codes.`,
        variant: 'success',
      });
    } catch (err) {
      showToast({ title: 'Could not delete PIN', description: errText(err), variant: 'error' });
    } finally {
      setDeletingPin(null);
    }
  };

  const refresh = useCallback(async () => {
    try {
      const [sum, list] = await Promise.all([
        isRental ? getRentalPincodeSummary() : getPincodeSummary(),
        isRental ? listRentalPincodes(q, page, 10) : listPincodes(q, page, 10),
      ]);
      setSummary(sum);
      setRows(list.rows);
      setMeta(list.meta);
    } catch (err) {
      showToast({ title: 'Could not load PIN codes', description: errText(err), variant: 'error' });
    }
  }, [isRental, q, page, showToast]);

  useEffect(() => {
    const t = window.setTimeout(refresh, q ? 250 : 0);
    return () => window.clearTimeout(t);
  }, [refresh, q]);

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusy('import');
    setImportErrors([]);
    try {
      const res = await (isRental ? importRentalPincodesCsv(file, mode) : importPincodesCsv(file, mode));
      setImportErrors(res.errors);
      showToast({
        title: `${res.imported.toLocaleString('en-IN')} PIN codes imported`,
        description: `${mode === 'replace' ? 'List replaced' : 'Merged'}: ${res.before.toLocaleString('en-IN')} → ${res.after.toLocaleString('en-IN')}${res.skipped ? ` · ${res.skipped} rows skipped` : ''}`,
        variant: res.skipped ? 'warning' : 'success',
      });
      setPage(1);
      refresh();
    } catch (err) {
      showToast({ title: 'Import failed', description: errText(err), variant: 'error' });
    } finally {
      setBusy(null);
    }
  };

  const onClear = async () => {
    setBusy('clear');
    try {
      const res = await (isRental ? clearRentalPincodes() : clearPincodes());
      showToast({
        title: `Removed ${res.removed.toLocaleString('en-IN')} PIN codes`,
        description: isRental ? 'Rental delivery is now open to every PIN code in India.' : 'Delivery is now open to every PIN code in India.',
        variant: 'success',
      });
      setConfirmClear(false);
      refresh();
    } catch (err) {
      showToast({ title: 'Could not clear the list', description: errText(err), variant: 'error' });
    } finally {
      setBusy(null);
    }
  };

  return (
    <section className={card}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className={sectionTitle}>
            {isRental ? 'Rental Serviceable PIN codes' : 'Serviceable PIN codes'}
          </h2>
          <p className={sectionHint}>
            {isRental
              ? summary?.restricted
                ? `Only these ${summary.active.toLocaleString('en-IN')} PIN codes are serviceable for equipment rental & setup${summary.total > summary.active ? ` (${summary.total - summary.active} inactive)` : ''}. Other PINs show “Not serviceable”.`
                : `No list uploaded — equipment rental delivery is open across India. Upload a CSV to restrict rental delivery to specific PIN codes.`
              : summary?.restricted
                ? `Only these ${summary.active.toLocaleString('en-IN')} PIN codes can order (${summary.codAvailable.toLocaleString('en-IN')} with COD). Others see “We don't deliver here yet”.`
                : `No list uploaded — every Indian PIN code is deliverable in ${defaultDays} days. Upload a CSV to limit delivery.`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {canEdit && (
            <>
              <select value={mode} onChange={(e) => setMode(e.target.value as 'merge' | 'replace')} className={`${selectClass} !w-auto !py-1.5 text-xs`} aria-label="Import mode">
                <option value="merge">Add / update</option>
                <option value="replace">Replace whole list</option>
              </select>
              <button type="button" onClick={() => fileRef.current?.click()} disabled={busy !== null} className={btnSecondary}>
                {busy === 'import' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                Upload CSV
              </button>
              <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={onFile} />
            </>
          )}
          {!!summary?.total && (
            <button
              type="button"
              disabled={busy !== null}
              onClick={async () => {
                setBusy('export');
                try {
                  if (isRental) {
                    await downloadRentalPincodesCsv();
                  } else {
                    await downloadPincodesCsv();
                  }
                } catch (err) {
                  showToast({ title: 'Download failed', description: errText(err), variant: 'error' });
                } finally {
                  setBusy(null);
                }
              }}
              className={btnSecondary}
            >
              <Download className="h-3.5 w-3.5" /> Download
            </button>
          )}
          {canEdit && !!summary?.total && (
            <button type="button" onClick={() => setConfirmClear(true)} disabled={busy !== null} className={`${btnSecondary} text-red-600 hover:bg-red-50`}>
              <Trash2 className="h-3.5 w-3.5" /> Clear
            </button>
          )}
        </div>
      </div>

      <p className="mt-3 rounded-lg bg-[#F6F9FD] px-3 py-2 font-mono text-[11px] text-[#5B6B82]">
        {isRental ? (
          <>
            pincode,city,state,active,delivery_days
            <br />
            110020,New Delhi,Delhi,yes,1-2
          </>
        ) : (
          <>
            pincode,city,state,cod,delivery_days
            <br />
            110020,New Delhi,Delhi,yes,1-2
          </>
        )}
      </p>

      {importErrors.length > 0 && (
        <div className="mt-3 rounded-lg border border-[#F28C38]/35 bg-[#F28C38]/10 px-3 py-2 text-[11px] text-[#B85A0E]">
          <p className="font-semibold">Rows that need attention:</p>
          <ul className="mt-1 max-h-28 list-disc overflow-y-auto pl-4">
            {importErrors.map((e) => (
              <li key={`${e.line}-${e.message}`}>
                Line {e.line}: {e.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {!!summary?.total && (
        <div className="mt-4">
          <div className="relative max-w-xs">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#5B6B82]" />
            <input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
              placeholder="Search PIN, city or state"
              className={`${inputClass} !pl-8`}
            />
          </div>
          <div className="mt-3 overflow-x-auto rounded-lg border border-[#DCE6F2]">
            <table className="w-full min-w-[520px] text-xs">
              <thead className="bg-[#F6F9FD] text-left text-[#5B6B82]">
                <tr>
                  <th className="px-3 py-2 font-semibold">PIN code</th>
                  <th className="px-3 py-2 font-semibold">City</th>
                  <th className="px-3 py-2 font-semibold">State</th>
                  <th className="px-3 py-2 font-semibold">{isRental ? 'Active' : 'COD'}</th>
                  <th className="px-3 py-2 font-semibold">Delivery</th>
                  {canEdit && <th className="px-3 py-2 font-semibold text-right">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DCE6F2]">
                {rows.map((r) => {
                  const isYes = isRental ? r.active : r.codAvailable;
                  return (
                    <tr key={r.pincode}>
                      <td className="px-3 py-2 font-mono font-semibold text-[#12263F]">{r.pincode}</td>
                      <td className="px-3 py-2">{r.city || '—'}</td>
                      <td className="px-3 py-2">{r.state || '—'}</td>
                      <td className="px-3 py-2">
                        <button
                          type="button"
                          disabled={!canEdit || togglingPin === r.pincode}
                          onClick={() => onToggle(r.pincode)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer disabled:opacity-50 ${
                            isYes
                              ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-300'
                              : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-300'
                          }`}
                          title={
                            canEdit
                              ? isRental
                                ? isYes
                                  ? 'Click to set Inactive (No)'
                                  : 'Click to set Active (Yes)'
                                : isYes
                                  ? 'Click to set COD to No'
                                  : 'Click to set COD to Yes'
                              : undefined
                          }
                        >
                          {togglingPin === r.pincode ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : isYes ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                          ) : (
                            <XCircle className="h-3.5 w-3.5 text-red-600" />
                          )}
                          <span>{isYes ? 'Yes' : 'No'}</span>
                        </button>
                      </td>
                      <td className="px-3 py-2">{r.deliveryDays ? `${r.deliveryDays} days` : <span className="text-[#5B6B82]">Default ({defaultDays})</span>}</td>
                      {canEdit && (
                        <td className="px-3 py-2 text-right">
                          <button
                            type="button"
                            disabled={deletingPin === r.pincode}
                            onClick={() => onDeleteSinglePin(r.pincode)}
                            className="text-[#8A97A8] hover:text-red-600 transition-colors p-1 disabled:opacity-50 inline-flex items-center"
                            title={`Delete ${r.pincode}`}
                          >
                            {deletingPin === r.pincode ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
                {!rows.length && (
                  <tr>
                    <td colSpan={canEdit ? 6 : 5} className="px-3 py-6 text-center text-[#5B6B82]">
                      No PIN codes match “{q}”.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {meta && (meta.totalPages ?? 1) > 1 && (
            <div className="mt-2 flex items-center justify-between text-[11px] text-[#5B6B82]">
              <span>
                {meta.total.toLocaleString('en-IN')} PIN codes · page {meta.page} of {meta.totalPages}
              </span>
              <div className="flex gap-2">
                <button type="button" className={btnSecondary} disabled={!meta.hasPrevPage} onClick={() => setPage((p) => p - 1)}>
                  Previous
                </button>
                <button type="button" className={btnSecondary} disabled={!meta.hasNextPage} onClick={() => setPage((p) => p + 1)}>
                  Next
                </button>
              </div>
            </div>
          )}
          {summary.lastUpdatedAt && <p className="mt-2 text-[11px] text-[#5B6B82]">Last updated {formatDateTime(summary.lastUpdatedAt)}</p>}
        </div>
      )}

      <ConfirmDialog
        open={confirmClear}
        title="Clear all serviceable PIN codes?"
        description="The website will then accept orders from every PIN code in India. You can upload a new list any time."
        confirmLabel="Clear list"
        loading={busy === 'clear'}
        onConfirm={onClear}
        onCancel={() => setConfirmClear(false)}
      />
    </section>
  );
}

// ---------------------------------------------------------------------------
// Payments (not part of this release)
// ---------------------------------------------------------------------------

function PaymentsTab() {
  return (
    <section className={`${card} max-w-2xl`}>
      <h2 className={sectionTitle}>Payments</h2>
      <p className="mt-1 text-sm text-[#5B6B82]">
        Razorpay keys, test / live mode and EMI rules will be configured here with the Razorpay integration. Nothing on this tab is active yet.
      </p>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Tax & invoice
// ---------------------------------------------------------------------------

function TaxTab(props: ImageTabProps) {
  const { s, set, errors, canEdit } = props;
  const t = s.tax;
  const d = !canEdit;
  const sample = `${t.invoicePrefix}${String(t.nextInvoiceNumber || 1).padStart(t.invoiceNumberDigits || 1, '0')}`;
  const dispatchState = s.options.states.find((x) => x.code === t.dispatchStateCode)?.name;
  const gstinState = s.store.gstin ? s.options.states.find((x) => x.code === s.store.gstin.slice(0, 2))?.name : undefined;

  return (
    <div className="space-y-5">
      <section className={card}>
        <h2 className={sectionTitle}>GST</h2>
        <div className="mt-3 space-y-3">
          <Toggle checked={t.gstEnabled} disabled={d} onChange={(v) => set('tax', { gstEnabled: v })} label="Charge GST and issue tax invoices" hint="Turn off only if the business is not GST-registered" />
          <Toggle
            checked={t.pricesIncludeGst}
            disabled={d || !t.gstEnabled}
            onChange={(v) => set('tax', { pricesIncludeGst: v })}
            label="Product prices include GST"
            hint={t.pricesIncludeGst ? 'Cart shows GST as part of the price (“incl. GST”)' : 'GST is added on top of product prices in the cart'}
          />
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <FormField label="Dispatch state (place of business)" htmlFor="tx-state" error={errors.dispatchStateCode} hint="Same state as delivery → CGST + SGST, otherwise IGST">
            <select id="tx-state" disabled={d} value={t.dispatchStateCode} onChange={(e) => set('tax', { dispatchStateCode: e.target.value })} className={selectClass}>
              {s.options.states.map((st) => (
                <option key={st.code} value={st.code}>
                  {st.code} – {st.name}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Default GST rate" htmlFor="tx-rate" error={errors.defaultGstRate} hint="Only for products without their own rate">
            <select id="tx-rate" disabled={d} value={t.defaultGstRate} onChange={(e) => set('tax', { defaultGstRate: Number(e.target.value) })} className={selectClass}>
              {s.options.gstRates.map((r) => (
                <option key={r} value={r}>
                  {r}%
                </option>
              ))}
            </select>
          </FormField>
        </div>
        {gstinState && dispatchState && gstinState !== dispatchState && (
          <p className="mt-3 rounded-lg border border-[#F28C38]/35 bg-[#F28C38]/10 px-3 py-2 text-[11px] text-[#B85A0E]">
            Your store GSTIN is registered in {gstinState}, but the dispatch state is {dispatchState}. Check this with your accountant.
          </p>
        )}
      </section>

      <section className={card}>
        <h2 className={sectionTitle}>Invoice numbering</h2>
        <p className={sectionHint}>Each paid order or rental takes the next number automatically; numbers are never reused.</p>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <FormField label="Prefix" htmlFor="tx-prefix" error={errors.invoicePrefix} hint="Change at the start of each financial year">
            <input id="tx-prefix" disabled={d} value={t.invoicePrefix} onChange={(e) => set('tax', { invoicePrefix: e.target.value.toUpperCase() })} className={`${inputClass} font-mono`} />
          </FormField>
          <FormField label="Next invoice number" htmlFor="tx-next" error={errors.nextInvoiceNumber} hint="Never set this lower than an issued number">
            <input id="tx-next" type="number" min={1} disabled={d} value={t.nextInvoiceNumber || ''} placeholder="1" onChange={(e) => set('tax', { nextInvoiceNumber: Number(e.target.value) })} className={inputClass} />
          </FormField>
          <FormField label="Digits" htmlFor="tx-digits" error={errors.invoiceNumberDigits} hint="Zero-padding">
            <select id="tx-digits" disabled={d} value={t.invoiceNumberDigits} onChange={(e) => set('tax', { invoiceNumberDigits: Number(e.target.value) })} className={selectClass}>
              {[3, 4, 5, 6, 7, 8].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </FormField>
        </div>
        <p className="mt-3 text-xs text-[#5B6B82]">
          Next invoice: <span className="rounded bg-[#EAF2FC] px-1.5 py-0.5 font-mono font-semibold text-[#1D5FAF]">{sample}</span>
        </p>
      </section>

      <section className={card}>
        <h2 className={sectionTitle}>Invoice footer &amp; signature</h2>
        <div className="mt-4 space-y-4">
          <FormField label="Terms & declarations" htmlFor="tx-terms" error={errors.footerTerms} hint="Printed at the bottom of every invoice">
            <textarea id="tx-terms" rows={4} disabled={d} value={t.footerTerms} onChange={(e) => set('tax', { footerTerms: e.target.value })} className={textareaClass} />
          </FormField>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField label="Signatory name / title" htmlFor="tx-sign" error={errors.signatoryName}>
              <input id="tx-sign" disabled={d} value={t.signatoryName} onChange={(e) => set('tax', { signatoryName: e.target.value })} className={inputClass} />
            </FormField>
            <ImageSetting
              name="signatory"
              label="Signature / stamp"
              hint="PNG with a transparent background"
              url={s.images.signatory}
              boxClass="h-14 w-36 !bg-white"
              canEdit={canEdit}
              onChanged={(u, p) => applyImage(props, 'signatory', u, p)}
            />
          </div>
        </div>
      </section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

const CHANNEL_META = {
  sms: { label: 'SMS', icon: Smartphone },
  whatsapp: { label: 'WhatsApp', icon: MessageCircle },
  email: { label: 'Email', icon: Mail },
} as const;

function channelTone(status: string) {
  if (/not connected|not configured|missing/.test(status)) return 'border-[#F28C38]/35 bg-[#F28C38]/10 text-[#B85A0E]';
  if (/console/.test(status)) return 'border-[#1D5FAF]/25 bg-[#EAF2FC] text-[#1D5FAF]';
  return 'border-emerald-200 bg-emerald-50 text-emerald-700';
}

function NotificationsTab({
  templates,
  setTemplates,
  channels,
  canEdit,
  dirty,
}: {
  templates: NotificationTemplate[] | null;
  setTemplates: React.Dispatch<React.SetStateAction<NotificationTemplate[] | null>>;
  channels: NotificationChannelStatus | null;
  canEdit: boolean;
  dirty: boolean;
}) {
  const { showToast } = useToast();
  const [testing, setTesting] = useState<string | null>(null);
  const [logs, setLogs] = useState<NotificationLogRow[] | null>(null);
  const textRefs = useRef<Record<string, HTMLTextAreaElement | null>>({});

  const loadLogs = useCallback(() => {
    getNotificationLogs()
      .then(setLogs)
      .catch(() => setLogs([]));
  }, []);
  useEffect(loadLogs, [loadLogs]);

  if (!templates) {
    return <div className="h-96 animate-pulse rounded-xl bg-slate-200" />;
  }

  const update = (event: string, patch: Partial<NotificationTemplate>) =>
    setTemplates((list) => (list ? list.map((t) => (t.event === event ? { ...t, ...patch } : t)) : list));

  const insertVar = (t: NotificationTemplate, v: string) => {
    const el = textRefs.current[t.event];
    const token = `{{${v}}}`;
    if (!el) return update(t.event, { body: `${t.body} ${token}` });
    const start = el.selectionStart ?? t.body.length;
    const end = el.selectionEnd ?? t.body.length;
    update(t.event, { body: t.body.slice(0, start) + token + t.body.slice(end) });
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + token.length, start + token.length);
    });
  };

  const test = async (t: NotificationTemplate, channel: 'email' | 'sms' | 'whatsapp') => {
    if (dirty) {
      showToast({ title: 'Save first', description: 'The test uses the saved template.', variant: 'warning' });
      return;
    }
    setTesting(`${t.event}:${channel}`);
    try {
      const r = await sendTestNotification(t.event, channel);
      showToast({
        title: r.status === 'sent' ? `Test ${CHANNEL_META[channel].label} sent` : `Test ${CHANNEL_META[channel].label} failed`,
        description: r.status === 'sent' ? `Sent to ${r.recipient}${channel === 'sms' && channels?.sms.startsWith('console') ? ' (printed in the API terminal)' : ''}` : r.error,
        variant: r.status === 'sent' ? 'success' : 'error',
      });
    } catch (err) {
      showToast({ title: 'Test not sent', description: errText(err), variant: 'error' });
    } finally {
      setTesting(null);
      loadLogs();
    }
  };

  const groups = [...new Set(templates.map((t) => t.group))];

  return (
    <div className="space-y-5">
      <section className={card}>
        <h2 className={sectionTitle}>Channels</h2>
        <p className={sectionHint}>
          Messages go out automatically when orders, rentals and enquiries change status. One message is used for SMS and WhatsApp and as the email body.
        </p>
        {channels && (
          <div className="mt-3 flex flex-wrap gap-2">
            {(Object.keys(CHANNEL_META) as (keyof typeof CHANNEL_META)[]).map((c) => {
              const Icon = CHANNEL_META[c].icon;
              return (
                <span key={c} className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] font-semibold ${channelTone(channels[c])}`}>
                  <Icon className="h-3.5 w-3.5" />
                  {CHANNEL_META[c].label}: {channels[c]}
                </span>
              );
            })}
          </div>
        )}
        <p className="mt-2 text-[11px] text-[#5B6B82]">
          SMS in India must match a DLT-approved template — paste its MSG91 template id per event. WhatsApp needs the WhatsApp Business API (not connected yet).
        </p>
      </section>

      {groups.map((group) => (
        <section key={group} className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wide text-[#5B6B82]">{group}</h3>
          {templates
            .filter((t) => t.group === group)
            .map((t) => (
              <div key={t.event} className={`${card} space-y-3`}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-[#12263F]">{t.label}</p>
                  <div className="flex flex-wrap items-center gap-4">
                    {(Object.keys(CHANNEL_META) as (keyof typeof CHANNEL_META)[]).map((c) => (
                      <label key={c} className={`flex items-center gap-1.5 text-xs font-medium text-[#12263F] ${canEdit ? 'cursor-pointer' : ''}`}>
                        <input
                          type="checkbox"
                          disabled={!canEdit}
                          checked={t[c].active}
                          onChange={(e) => update(t.event, { [c]: { ...t[c], active: e.target.checked } } as Partial<NotificationTemplate>)}
                          className={checkbox}
                        />
                        {CHANNEL_META[c].label}
                      </label>
                    ))}
                  </div>
                </div>

                <textarea
                  ref={(el) => {
                    textRefs.current[t.event] = el;
                  }}
                  rows={2}
                  disabled={!canEdit}
                  value={t.body}
                  onChange={(e) => update(t.event, { body: e.target.value })}
                  className={textareaClass}
                  aria-label={`${t.label} message`}
                />
                <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-[#5B6B82]">
                  <span>Insert:</span>
                  {t.variables.map((v) => (
                    <button
                      key={v}
                      type="button"
                      disabled={!canEdit}
                      onClick={() => insertVar(t, v)}
                      className="rounded border border-[#DCE6F2] bg-white px-1.5 py-0.5 font-mono text-[10px] text-[#1D5FAF] hover:bg-[#EAF2FC] disabled:opacity-50"
                    >
                      {`{{${v}}}`}
                    </button>
                  ))}
                  <span className="ml-auto">{t.body.length} characters</span>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <FormField label="Email subject">
                    <input disabled={!canEdit || !t.email.active} value={t.subject} onChange={(e) => update(t.event, { subject: e.target.value })} className={inputClass} />
                  </FormField>
                  <FormField label="SMS DLT / MSG91 template id">
                    <input
                      disabled={!canEdit || !t.sms.active}
                      value={t.sms.templateId}
                      onChange={(e) => update(t.event, { sms: { ...t.sms, templateId: e.target.value } })}
                      placeholder="e.g. 6640f1…"
                      className={`${inputClass} font-mono`}
                    />
                  </FormField>
                  <FormField label="WhatsApp template name">
                    <input
                      disabled={!canEdit || !t.whatsapp.active}
                      value={t.whatsapp.templateId}
                      onChange={(e) => update(t.event, { whatsapp: { ...t.whatsapp, templateId: e.target.value } })}
                      placeholder="e.g. order_confirmed"
                      className={`${inputClass} font-mono`}
                    />
                  </FormField>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#DCE6F2] pt-3">
                  {t.preview && !dirty ? (
                    <p className="flex min-w-0 items-start gap-1.5 text-[11px] text-[#5B6B82]">
                      <Eye className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{t.preview}</span>
                    </p>
                  ) : (
                    <span />
                  )}
                  {canEdit && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-[#5B6B82]">Send test:</span>
                      {(Object.keys(CHANNEL_META) as (keyof typeof CHANNEL_META)[]).map((c) => (
                        <button
                          key={c}
                          type="button"
                          disabled={!t[c].active || testing !== null}
                          onClick={() => test(t, c)}
                          className={btnSecondary}
                          title={t[c].active ? `Send a test ${CHANNEL_META[c].label} to yourself` : `${CHANNEL_META[c].label} is off for this event`}
                        >
                          {testing === `${t.event}:${c}` ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                          {CHANNEL_META[c].label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
        </section>
      ))}

      <section className={card}>
        <div className="flex items-center justify-between">
          <h2 className={sectionTitle}>Recent deliveries</h2>
          <button type="button" onClick={loadLogs} className={btnSecondary} aria-label="Refresh">
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
        {!logs ? (
          <div className="mt-3 h-20 animate-pulse rounded-lg bg-[#F6F9FD]" />
        ) : logs.length === 0 ? (
          <p className="mt-3 text-xs text-[#5B6B82]">Nothing sent yet. Use “Send test” above to check a channel.</p>
        ) : (
          <div className="mt-3 overflow-x-auto rounded-lg border border-[#DCE6F2]">
            <table className="w-full min-w-[600px] text-xs">
              <thead className="bg-[#F6F9FD] text-left text-[#5B6B82]">
                <tr>
                  <th className="px-3 py-2 font-semibold">When</th>
                  <th className="px-3 py-2 font-semibold">Event</th>
                  <th className="px-3 py-2 font-semibold">Channel</th>
                  <th className="px-3 py-2 font-semibold">To</th>
                  <th className="px-3 py-2 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DCE6F2]">
                {logs.map((l) => (
                  <tr key={l.id}>
                    <td className="whitespace-nowrap px-3 py-2">{formatDateTime(l.at)}</td>
                    <td className="px-3 py-2">{templates.find((t) => t.event === l.event)?.label || l.event}</td>
                    <td className="px-3 py-2">{CHANNEL_META[l.channel]?.label || l.channel}</td>
                    <td className="px-3 py-2">{l.recipient}</td>
                    <td className="px-3 py-2">
                      {l.status === 'sent' ? (
                        <span className="font-semibold text-emerald-700">Sent</span>
                      ) : (
                        <span className="font-semibold text-red-600" title={l.error || undefined}>
                          Failed{l.error ? ` — ${l.error}` : ''}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Rental
// ---------------------------------------------------------------------------

function RentalTab({ s, set, errors, canEdit }: TabProps) {
  const r = s.rental;
  const d = !canEdit;
  const docTypes = s.options.kycDocumentTypes || [];
  const num = (key: 'reminderDaysBeforeDue' | 'gracePeriodDays' | 'depositRefundDays' | 'minLeadDays', label: string, hint: string, min = 0) => (
    <FormField label={label} htmlFor={`rn-${key}`} error={errors[key]} hint={hint}>
      <input id={`rn-${key}`} type="number" min={min} disabled={d} value={Number.isFinite(r[key]) ? r[key] : ''} placeholder="0" onChange={(e) => set('rental', { [key]: Number(e.target.value) })} className={inputClass} />
    </FormField>
  );
  // Worked example for the advance: ₹10,000 booking
  const example = 10000;
  const advance = r.advancePaymentPercent >= 100 ? example : Math.ceil((example * (r.advancePaymentPercent || 0)) / 100);

  return (
    <div className="space-y-5">
      <section className={card}>
        <h2 className={sectionTitle}>Booking payment</h2>
        <p className={sectionHint}>
          Applies to every rental product. The booking total is rent + delivery &amp; pickup + GST + refundable deposit; customers pay this share online at checkout.
        </p>
        <div className="mt-4 grid grid-cols-1 gap-5 lg:grid-cols-2">
          <div className="space-y-3">
            <FormField label="Advance payment at booking" htmlFor="rn-advance" error={errors.advancePaymentPercent} hint="100% = full payment up front. Lower it to take a partial (advance) payment.">
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={10}
                  max={100}
                  step={5}
                  disabled={d}
                  value={r.advancePaymentPercent || 100}
                  onChange={(e) => set('rental', { advancePaymentPercent: Number(e.target.value) })}
                  className="flex-1 accent-[#1D5FAF]"
                  aria-label="Advance payment percentage"
                />
                <div className="flex w-24">
                  <input
                    id="rn-advance"
                    type="number"
                    min={1}
                    max={100}
                    disabled={d}
                    value={r.advancePaymentPercent || ''}
                    onChange={(e) => set('rental', { advancePaymentPercent: Number(e.target.value) })}
                    className={`${inputClass} !rounded-r-none tabular-nums`}
                  />
                  <span className="inline-flex items-center rounded-r-lg border border-l-0 border-[#DCE6F2] bg-[#F6F9FD] px-2.5 text-xs text-[#5B6B82]">%</span>
                </div>
              </div>
            </FormField>
            <p className="rounded-lg bg-[#F6F9FD] px-3 py-2 text-xs text-[#5B6B82]">
              Example: on a ₹10,000 booking the customer pays <strong className="text-[#12263F]">₹{advance.toLocaleString('en-IN')}</strong> at checkout
              {advance < example && (
                <>
                  {' '}
                  and <strong className="text-[#12263F]">₹{(example - advance).toLocaleString('en-IN')}</strong> later
                </>
              )}
              .
            </p>
          </div>
          <fieldset disabled={d || r.advancePaymentPercent >= 100} className={r.advancePaymentPercent >= 100 ? 'opacity-50' : ''}>
            <legend className="mb-2 text-xs font-semibold text-[#12263F]">When is the balance due?</legend>
            {[
              { v: 'before_dispatch', t: 'Before dispatch', h: 'Customer pays the rest online from My Rentals (or staff record it) before the equipment leaves.' },
              { v: 'on_delivery', t: 'On delivery', h: 'Collected by the delivery team (cash / UPI) and recorded before marking delivered.' },
            ].map((o) => (
              <label key={o.v} className={`mb-2 flex cursor-pointer items-start gap-2.5 rounded-lg border p-3 ${r.balanceDue === o.v ? 'border-[#1D5FAF] bg-[#EAF2FC]/50' : 'border-[#DCE6F2]'}`}>
                <input type="radio" name="balanceDue" checked={r.balanceDue === o.v} onChange={() => set('rental', { balanceDue: o.v as 'before_dispatch' | 'on_delivery' })} className="mt-0.5 accent-[#1D5FAF]" />
                <span>
                  <span className="block text-xs font-semibold text-[#12263F]">{o.t}</span>
                  <span className="block text-[11px] text-[#5B6B82]">{o.h}</span>
                </span>
              </label>
            ))}
            {r.advancePaymentPercent >= 100 && <p className="text-[11px] text-[#5B6B82]">Not used while customers pay 100% up front.</p>}
          </fieldset>
        </div>
      </section>

      <section className={card}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className={sectionTitle}>KYC documents</h2>
            <p className={sectionHint}>Customers upload these at checkout; staff verify them before approving the booking. Files are stored privately.</p>
          </div>
          <Toggle checked={r.kycRequired} disabled={d} onChange={(v) => set('rental', { kycRequired: v })} label="KYC required for rentals" />
        </div>
        <div className={`mt-4 space-y-4 ${r.kycRequired ? '' : 'pointer-events-none opacity-50'}`}>
          <div>
            <p className="mb-2 text-xs font-semibold text-[#12263F]">Required documents</p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {docTypes.map((t) => {
                const checked = r.kycDocuments.includes(t.key);
                return (
                  <label key={t.key} className={`flex cursor-pointer items-start gap-2.5 rounded-lg border p-3 ${checked ? 'border-[#1D5FAF] bg-[#EAF2FC]/50' : 'border-[#DCE6F2]'}`}>
                    <input
                      type="checkbox"
                      className={`${checkbox} mt-0.5`}
                      disabled={d || !r.kycRequired}
                      checked={checked}
                      onChange={(e) =>
                        set('rental', { kycDocuments: e.target.checked ? [...r.kycDocuments, t.key] : r.kycDocuments.filter((k) => k !== t.key) })
                      }
                    />
                    <span>
                      <span className="block text-xs font-semibold text-[#12263F]">{t.label}</span>
                      <span className="block text-[11px] text-[#5B6B82]">{t.hint}</span>
                    </span>
                  </label>
                );
              })}
            </div>
            {errors.kycDocuments && <p className="mt-2 text-xs font-medium text-red-600">{errors.kycDocuments}</p>}
          </div>
          <FormField label="Instructions shown to customers" htmlFor="rn-kyc-ins" error={errors.kycInstructions}>
            <textarea id="rn-kyc-ins" rows={2} disabled={d} value={r.kycInstructions} onChange={(e) => set('rental', { kycInstructions: e.target.value })} className={textareaClass} />
          </FormField>
        </div>
        <p className="mt-3 text-[11px] text-[#5B6B82]">
          A doctor&apos;s prescription is always asked for products marked “Prescription required” in their rental settings, even when KYC is off.
        </p>
      </section>

      <section className={card}>
        <h2 className={sectionTitle}>Dates, reminders, late fees &amp; deposit</h2>
        <p className={sectionHint}>Shown to customers on rental pages and checkout, and used by rental reminders.</p>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {num('minLeadDays', 'Earliest start (days from today)', '0 = same day, 1 = tomorrow')}
          {num('reminderDaysBeforeDue', 'Reminder before end date (days)', 'When the “rental due” message goes out', 1)}
          <FormField label="Late fee per day" htmlFor="rn-late" error={errors.lateFeePerDay} hint="Charged for each day past the end date">
            <Rupee id="rn-late" disabled={d} value={r.lateFeePerDay} onChange={(v) => set('rental', { lateFeePerDay: v })} />
          </FormField>
          {num('gracePeriodDays', 'Grace period (days)', 'Days after the end date before late fees start')}
          {num('depositRefundDays', 'Deposit refund within (days)', 'Promise shown to customers after pickup', 1)}
        </div>
      </section>

      <PincodePanel canEdit={canEdit} defaultDays={r.minLeadDays != null ? String(r.minLeadDays) : '1-2'} type="rental" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Returns & refunds
// ---------------------------------------------------------------------------

function ReasonList({
  label,
  hint,
  values,
  onChange,
  disabled,
  error,
}: {
  label: string;
  hint: string;
  values: string[];
  onChange: (v: string[]) => void;
  disabled: boolean;
  error?: string;
}) {
  const move = (i: number, dir: -1 | 1) => {
    const next = [...values];
    [next[i], next[i + dir]] = [next[i + dir], next[i]];
    onChange(next);
  };
  return (
    <div className="space-y-2">
      <div>
        <p className="text-xs font-semibold text-[#12263F]">{label}</p>
        <p className="text-[11px] text-[#5B6B82]">{hint}</p>
      </div>
      <ul className="space-y-1.5">
        {values.map((v, i) => (
          <li key={i} className="flex items-center gap-1.5">
            <span className="w-5 shrink-0 text-right text-[11px] tabular-nums text-[#5B6B82]">{i + 1}.</span>
            <input
              value={v}
              disabled={disabled}
              maxLength={120}
              onChange={(e) => onChange(values.map((x, j) => (j === i ? e.target.value : x)))}
              className={inputClass}
              aria-label={`${label} ${i + 1}`}
            />
            <button type="button" disabled={disabled || i === 0} onClick={() => move(i, -1)} className="rounded p-1.5 text-[#5B6B82] hover:bg-[#EAF2FC] disabled:opacity-30" aria-label="Move up">
              <ArrowUp className="h-3.5 w-3.5" />
            </button>
            <button type="button" disabled={disabled || i === values.length - 1} onClick={() => move(i, 1)} className="rounded p-1.5 text-[#5B6B82] hover:bg-[#EAF2FC] disabled:opacity-30" aria-label="Move down">
              <ArrowDown className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              disabled={disabled || values.length <= 1}
              onClick={() => onChange(values.filter((_, j) => j !== i))}
              className="rounded p-1.5 text-[#5B6B82] hover:bg-red-50 hover:text-red-600 disabled:opacity-30"
              aria-label="Remove"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </li>
        ))}
      </ul>
      {error && <p className="text-xs font-medium text-red-600">{error}</p>}
      {!disabled && values.length < 20 && (
        <button type="button" onClick={() => onChange([...values, ''])} className={btnSecondary}>
          <Plus className="h-3.5 w-3.5" /> Add reason
        </button>
      )}
    </div>
  );
}

function ReturnsTab({ s, set, errors, canEdit }: TabProps) {
  const r = s.returns;
  const d = !canEdit;
  const [catQuery, setCatQuery] = useState('');
  const categories = s.options.categories || [];
  const selected = new Set(r.nonReturnableCategoryIds);
  const visible = categories.filter((c) => c.path.toLowerCase().includes(catQuery.trim().toLowerCase()));
  const fieldError = (prefix: string) => Object.entries(errors).find(([k]) => k === prefix || k.startsWith(`${prefix}.`))?.[1];

  return (
    <div className="space-y-5">
      <section className={card}>
        <h2 className={sectionTitle}>Return policy</h2>
        <p className={sectionHint}>Controls the “Return or replace” button in My Orders, the returns policy page and checkout copy.</p>
        <div className="mt-4 space-y-4">
          <Toggle
            checked={r.returnsEnabled}
            disabled={d}
            onChange={(v) => set('returns', { returnsEnabled: v })}
            label="Customers can request returns online"
            hint="When off, customers are asked to contact support instead."
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <FormField label="Return window (days after delivery)" htmlFor="rt-window" error={errors.returnWindowDays} hint="Most medical equipment stores use 7 days">
              <input
                id="rt-window"
                type="number"
                min={1}
                max={90}
                disabled={d || !r.returnsEnabled}
                value={r.returnWindowDays || ''}
                onChange={(e) => set('returns', { returnWindowDays: Number(e.target.value) })}
                className={inputClass}
              />
            </FormField>
            <FormField label="Refund reaches the customer within" htmlFor="rt-days" error={errors.refundProcessingDays} hint='Business days, e.g. "5-7" — shown to customers'>
              <input id="rt-days" disabled={d} value={r.refundProcessingDays} onChange={(e) => set('returns', { refundProcessingDays: e.target.value })} className={inputClass} />
            </FormField>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-[#DCE6F2] p-3">
              <Toggle checked={r.refundEnabled} disabled={d || !r.returnsEnabled} onChange={(v) => set('returns', { refundEnabled: v })} label="Allow refunds" hint="Item is picked up and the money is returned" />
            </div>
            <div className="rounded-lg border border-[#DCE6F2] p-3">
              <Toggle
                checked={r.replacementEnabled}
                disabled={d || !r.returnsEnabled}
                onChange={(v) => set('returns', { replacementEnabled: v })}
                label="Allow replacements"
                hint="Item is picked up and the same product is sent again"
              />
            </div>
          </div>
          {errors.refundEnabled && <p className="text-xs font-medium text-red-600">{errors.refundEnabled}</p>}
        </div>
      </section>

      <section className={card}>
        <h2 className={sectionTitle}>Photos</h2>
        <p className={sectionHint}>Photos of the product and packaging help staff approve damage and defect claims quickly.</p>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Toggle checked={r.photosRequired} disabled={d} onChange={(v) => set('returns', { photosRequired: v })} label="At least one photo is required" />
          <FormField label="Maximum photos per request" htmlFor="rt-photos" error={errors.maxPhotos}>
            <input id="rt-photos" type="number" min={1} max={10} disabled={d} value={r.maxPhotos || ''} onChange={(e) => set('returns', { maxPhotos: Number(e.target.value) })} className={inputClass} />
          </FormField>
        </div>
      </section>

      <section className={card}>
        <h2 className={sectionTitle}>Reasons customers can choose</h2>
        <p className={sectionHint}>Shown as options when a customer requests a return or cancels an order. Keep “Other” last.</p>
        <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ReasonList
            label="Return / replacement reasons"
            hint="My Orders → Return or replace"
            values={r.returnReasons}
            onChange={(v) => set('returns', { returnReasons: v })}
            disabled={d}
            error={fieldError('returnReasons')}
          />
          <ReasonList
            label="Cancellation reasons"
            hint="My Orders → Cancel order"
            values={r.cancelReasons}
            onChange={(v) => set('returns', { cancelReasons: v })}
            disabled={d}
            error={fieldError('cancelReasons')}
          />
        </div>
      </section>

      <section className={card}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className={sectionTitle}>Non-returnable categories</h2>
            <p className={sectionHint}>
              Products in these categories (and their sub-categories) cannot be returned online — e.g. opened sterile consumables.
            </p>
          </div>
          <span className="rounded-md bg-[#EAF2FC] px-2 py-1 text-xs font-semibold text-[#1D5FAF]">{selected.size} selected</span>
        </div>
        {categories.length === 0 ? (
          <p className="mt-4 text-xs text-[#5B6B82]">No categories yet.</p>
        ) : (
          <>
            <div className="relative mt-4 max-w-sm">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5B6B82]" />
              <input value={catQuery} onChange={(e) => setCatQuery(e.target.value)} placeholder="Search categories" className={`${inputClass} pl-8`} />
            </div>
            <div className="mt-3 grid max-h-72 grid-cols-1 gap-1 overflow-y-auto rounded-lg border border-[#DCE6F2] p-2 sm:grid-cols-2">
              {visible.map((c) => (
                <label key={c.id} className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-xs ${d ? '' : 'cursor-pointer hover:bg-[#F6F9FD]'}`}>
                  <input
                    type="checkbox"
                    className={checkbox}
                    disabled={d}
                    checked={selected.has(c.id)}
                    onChange={(e) =>
                      set('returns', {
                        nonReturnableCategoryIds: e.target.checked
                          ? [...r.nonReturnableCategoryIds, c.id]
                          : r.nonReturnableCategoryIds.filter((x) => x !== c.id),
                      })
                    }
                  />
                  <span className="text-[#12263F]">{c.path}</span>
                  {!c.active && <span className="text-[10px] text-[#5B6B82]">(inactive)</span>}
                </label>
              ))}
              {visible.length === 0 && <p className="p-2 text-xs text-[#5B6B82]">No category matches “{catQuery}”.</p>}
            </div>
          </>
        )}
      </section>

      <section className={card}>
        <h2 className={sectionTitle}>Return conditions</h2>
        <p className={sectionHint}>Shown to customers in the return form and on the returns policy page.</p>
        <FormField label="Conditions" htmlFor="rt-conditions" error={errors.conditions} className="mt-4">
          <textarea id="rt-conditions" rows={4} disabled={d} value={r.conditions} onChange={(e) => set('returns', { conditions: e.target.value })} className={textareaClass} />
        </FormField>
      </section>
    </div>
  );
}
