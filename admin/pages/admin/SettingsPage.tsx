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
  ReceiptIndianRupee,
  RefreshCw,
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
  downloadPincodesCsv,
  getAdminSettings,
  getNotificationLogs,
  getNotificationTemplates,
  getPincodeSummary,
  importPincodesCsv,
  listPincodes,
  removeSettingsImage,
  saveNotificationTemplates,
  saveSettingsGroup,
  sendTestNotification,
  uploadSettingsImage,
} from '@/lib/api/admin/settings';
import { AdminApiError, formatDateTime, type ListMeta } from '@/lib/api/admin/client';
import { useAuth } from '@/components/admin/AuthContext';
import { useToast } from '@/components/admin/ToastProvider';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { FormField, inputClass, selectClass, textareaClass } from '@/components/admin/FormField';

type TabKey = 'store' | 'shipping' | 'payments' | 'taxInvoice' | 'notifications' | 'rental';

const TABS: { key: TabKey; label: string; icon: React.ComponentType<{ className?: string }>; group?: SettingsGroup }[] = [
  { key: 'store', label: 'Store', icon: Store, group: 'store' },
  { key: 'shipping', label: 'Shipping', icon: Truck, group: 'shipping' },
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
            Store details, delivery, GST invoices, customer notifications and rental rules. Changes appear on the website within a minute.
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

function PincodePanel({ canEdit, defaultDays }: { canEdit: boolean; defaultDays: string }) {
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

  const refresh = useCallback(async () => {
    try {
      const [sum, list] = await Promise.all([getPincodeSummary(), listPincodes(q, page, 10)]);
      setSummary(sum);
      setRows(list.rows);
      setMeta(list.meta);
    } catch (err) {
      showToast({ title: 'Could not load PIN codes', description: errText(err), variant: 'error' });
    }
  }, [q, page, showToast]);

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
      const res = await importPincodesCsv(file, mode);
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
      const res = await clearPincodes();
      showToast({ title: `Removed ${res.removed.toLocaleString('en-IN')} PIN codes`, description: 'Delivery is now open to every PIN code in India.', variant: 'success' });
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
          <h2 className={sectionTitle}>Serviceable PIN codes</h2>
          <p className={sectionHint}>
            {summary?.restricted
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
                  await downloadPincodesCsv();
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
        pincode,city,state,cod,delivery_days
        <br />
        110020,New Delhi,Delhi,yes,1-2
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
                  <th className="px-3 py-2 font-semibold">COD</th>
                  <th className="px-3 py-2 font-semibold">Delivery</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DCE6F2]">
                {rows.map((r) => (
                  <tr key={r.pincode}>
                    <td className="px-3 py-2 font-mono font-semibold text-[#12263F]">{r.pincode}</td>
                    <td className="px-3 py-2">{r.city || '—'}</td>
                    <td className="px-3 py-2">{r.state || '—'}</td>
                    <td className="px-3 py-2">{r.codAvailable ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <XCircle className="h-4 w-4 text-[#C5D2E3]" />}</td>
                    <td className="px-3 py-2">{r.deliveryDays ? `${r.deliveryDays} days` : <span className="text-[#5B6B82]">Default ({defaultDays})</span>}</td>
                  </tr>
                ))}
                {!rows.length && (
                  <tr>
                    <td colSpan={5} className="px-3 py-6 text-center text-[#5B6B82]">
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
  const num = (key: 'reminderDaysBeforeDue' | 'gracePeriodDays' | 'depositRefundDays', label: string, hint: string, min = 0) => (
    <FormField label={label} htmlFor={`rn-${key}`} error={errors[key]} hint={hint}>
      <input id={`rn-${key}`} type="number" min={min} disabled={d} value={r[key] || ''} placeholder="0" onChange={(e) => set('rental', { [key]: Number(e.target.value) })} className={inputClass} />
    </FormField>
  );

  return (
    <div className="space-y-5">
      <section className={card}>
        <h2 className={sectionTitle}>Reminders, late fees &amp; deposit</h2>
        <p className={sectionHint}>Shown to customers on rental pages and checkout, and used by rental reminders.</p>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {num('reminderDaysBeforeDue', 'Reminder before end date (days)', 'When the “rental due” message goes out', 1)}
          <FormField label="Late fee per day" htmlFor="rn-late" error={errors.lateFeePerDay} hint="Charged for each day past the end date">
            <Rupee id="rn-late" disabled={d} value={r.lateFeePerDay} onChange={(v) => set('rental', { lateFeePerDay: v })} />
          </FormField>
          {num('gracePeriodDays', 'Grace period (days)', 'Days after the end date before late fees start')}
          {num('depositRefundDays', 'Deposit refund within (days)', 'Promise shown to customers after pickup', 1)}
        </div>
      </section>

      <p className="flex items-center gap-1.5 text-[11px] text-[#5B6B82]">
        <MapPin className="h-3.5 w-3.5" /> Rental delivery uses the same serviceable PIN codes as the Shipping tab.
      </p>
    </div>
  );
}
