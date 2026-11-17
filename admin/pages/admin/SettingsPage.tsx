import React, { useEffect, useState } from 'react';
import {
  BellRing,
  CreditCard,
  ReceiptIndianRupee,
  Save,
  Store,
  Stethoscope,
  Truck,
  Upload,
} from 'lucide-react';
import type { AdminSettings } from '@/types/admin';
import { getAdminSettings, saveAdminSettings } from '@/lib/api/admin/settings';
import { useToast } from '@/components/admin/ToastProvider';
import { SafeImage } from '@/components/admin/SafeImage';
import { FormField, inputClass, selectClass, textareaClass } from '@/components/admin/FormField';

type SettingsTabKey =
  | 'store'
  | 'shipping'
  | 'payments'
  | 'taxInvoice'
  | 'notifications'
  | 'rental';

const TABS: { key: SettingsTabKey; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: 'store', label: 'Store', icon: Store },
  { key: 'shipping', label: 'Shipping', icon: Truck },
  { key: 'payments', label: 'Payments', icon: CreditCard },
  { key: 'taxInvoice', label: 'Tax & Invoice', icon: ReceiptIndianRupee },
  { key: 'notifications', label: 'Notifications', icon: BellRing },
  { key: 'rental', label: 'Rental', icon: Stethoscope },
];

const KYC_DOC_OPTIONS: AdminSettings['rental']['requiredKycDocTypes'] = [
  'Aadhaar Card',
  'PAN Card',
  'Address Proof',
  'Doctor Prescription',
];

export function SettingsPage() {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<SettingsTabKey>('store');
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLoading(true);
    getAdminSettings()
      .then(setSettings)
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    try {
      const saved = await saveAdminSettings(settings);
      setSettings(saved);
      showToast({
        title: 'Settings saved',
        description: `Updated ${TABS.find((t) => t.key === activeTab)?.label} configuration.`,
        variant: 'success',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading || !settings) {
    return <div className="h-96 rounded-xl bg-slate-200 animate-pulse" />;
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#12263F] tracking-tight">Settings</h1>
          <p className="mt-0.5 text-sm text-[#5B6B82]">
            Configure store identity, Shiprocket logistics, Razorpay/EMI, GST invoices, notification templates, and rental rules.
          </p>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#1D5FAF] px-4 py-2 text-xs font-semibold text-white hover:bg-[#174D8F]"
        >
          <Save className="h-4 w-4" />
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      {/* 6 Settings Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto rounded-xl border border-[#DCE6F2] bg-white p-1.5">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = activeTab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setActiveTab(t.key)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                active
                  ? 'bg-[#1D5FAF] text-white'
                  : 'text-[#5B6B82] hover:bg-[#EAF2FC] hover:text-[#12263F]'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      <div className="rounded-xl border border-[#DCE6F2] bg-white p-6">
        {activeTab === 'store' && (
          <div className="space-y-5 max-w-4xl">
            <h2 className="text-base font-semibold text-[#12263F]">Store Profile &amp; Contact</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Store / Legal Name" required>
                <input
                  type="text"
                  value={settings.store.storeName}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      store: { ...settings.store, storeName: e.target.value },
                    })
                  }
                  className={inputClass}
                />
              </FormField>
              <FormField label="Store GSTIN" required>
                <input
                  type="text"
                  value={settings.store.gstin}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      store: { ...settings.store, gstin: e.target.value.toUpperCase() },
                    })
                  }
                  className={`${inputClass} font-mono uppercase`}
                />
              </FormField>
              <FormField label="Support Phone">
                <input
                  type="text"
                  value={settings.store.supportPhone}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      store: { ...settings.store, supportPhone: e.target.value },
                    })
                  }
                  className={inputClass}
                />
              </FormField>
              <FormField label="Sales Phone">
                <input
                  type="text"
                  value={settings.store.salesPhone}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      store: { ...settings.store, salesPhone: e.target.value },
                    })
                  }
                  className={inputClass}
                />
              </FormField>
              <FormField label="Support Email">
                <input
                  type="email"
                  value={settings.store.supportEmail}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      store: { ...settings.store, supportEmail: e.target.value },
                    })
                  }
                  className={inputClass}
                />
              </FormField>
              <FormField label="WhatsApp Business Number">
                <input
                  type="text"
                  value={settings.store.whatsappNumber}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      store: { ...settings.store, whatsappNumber: e.target.value },
                    })
                  }
                  className={inputClass}
                />
              </FormField>
            </div>

            <FormField label="Registered Warehouse / Store Address">
              <textarea
                rows={2}
                value={settings.store.address}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    store: { ...settings.store, address: e.target.value },
                  })
                }
                className={textareaClass}
              />
            </FormField>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Store Logo">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 overflow-hidden rounded-lg border border-[#DCE6F2]">
                    <SafeImage src={settings.store.logoUrl} alt="Logo" />
                  </div>
                  <label className="inline-flex items-center gap-1.5 rounded-lg border border-[#DCE6F2] px-3 py-1.5 text-xs font-semibold text-[#12263F] hover:bg-[#EAF2FC] cursor-pointer">
                    <Upload className="h-3.5 w-3.5" />
                    Upload Logo
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) {
                          setSettings({
                            ...settings,
                            store: { ...settings.store, logoUrl: URL.createObjectURL(f) },
                          });
                        }
                      }}
                    />
                  </label>
                </div>
              </FormField>
              <FormField label="Favicon">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 overflow-hidden rounded-lg border border-[#DCE6F2]">
                    <SafeImage src={settings.store.faviconUrl} alt="Favicon" />
                  </div>
                  <label className="inline-flex items-center gap-1.5 rounded-lg border border-[#DCE6F2] px-3 py-1.5 text-xs font-semibold text-[#12263F] hover:bg-[#EAF2FC] cursor-pointer">
                    <Upload className="h-3.5 w-3.5" />
                    Upload Favicon
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) {
                          setSettings({
                            ...settings,
                            store: {
                              ...settings.store,
                              faviconUrl: URL.createObjectURL(f),
                            },
                          });
                        }
                      }}
                    />
                  </label>
                </div>
              </FormField>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-[#DCE6F2]">
              <FormField label="Instagram URL">
                <input
                  type="url"
                  value={settings.store.instagramUrl}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      store: { ...settings.store, instagramUrl: e.target.value },
                    })
                  }
                  className={inputClass}
                />
              </FormField>
              <FormField label="LinkedIn URL">
                <input
                  type="url"
                  value={settings.store.linkedinUrl}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      store: { ...settings.store, linkedinUrl: e.target.value },
                    })
                  }
                  className={inputClass}
                />
              </FormField>
              <FormField label="YouTube URL">
                <input
                  type="url"
                  value={settings.store.youtubeUrl}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      store: { ...settings.store, youtubeUrl: e.target.value },
                    })
                  }
                  className={inputClass}
                />
              </FormField>
            </div>
          </div>
        )}

        {activeTab === 'shipping' && (
          <div className="space-y-5 max-w-3xl">
            <h2 className="text-base font-semibold text-[#12263F]">
              Shipping, COD &amp; Shiprocket Integration
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Flat Shipping Charge (₹)">
                <input
                  type="number"
                  value={settings.shipping.flatShippingCharge}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      shipping: {
                        ...settings.shipping,
                        flatShippingCharge: Number(e.target.value),
                      },
                    })
                  }
                  className={inputClass}
                />
              </FormField>
              <FormField label="Free Shipping Above (₹)">
                <input
                  type="number"
                  value={settings.shipping.freeShippingAbove}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      shipping: {
                        ...settings.shipping,
                        freeShippingAbove: Number(e.target.value),
                      },
                    })
                  }
                  className={inputClass}
                />
              </FormField>
              <FormField label="COD Max Order Value (₹)">
                <input
                  type="number"
                  value={settings.shipping.codMaxOrderValue}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      shipping: {
                        ...settings.shipping,
                        codMaxOrderValue: Number(e.target.value),
                      },
                    })
                  }
                  className={inputClass}
                />
              </FormField>
              <FormField label="COD Handling Charge (₹)">
                <input
                  type="number"
                  value={settings.shipping.codCharge}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      shipping: {
                        ...settings.shipping,
                        codCharge: Number(e.target.value),
                      },
                    })
                  }
                  className={inputClass}
                />
              </FormField>
            </div>

            <label className="flex items-center gap-2 text-xs font-medium text-[#12263F] cursor-pointer">
              <input
                type="checkbox"
                checked={settings.shipping.codEnabled}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    shipping: { ...settings.shipping, codEnabled: e.target.checked },
                  })
                }
                className="rounded border-[#DCE6F2] text-[#1D5FAF]"
              />
              Enable Cash on Delivery (COD) globally
            </label>

            <div className="rounded-xl border border-[#DCE6F2] bg-[#F6F9FD] p-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-[#12263F]">
                  Serviceable Pincodes CSV ({settings.shipping.serviceablePincodesCount.toLocaleString('en-IN')} active)
                </p>
                <p className="text-[11px] text-[#5B6B82]">
                  Upload pincode CSV to update delivery &amp; COD availability across India.
                </p>
              </div>
              <label className="inline-flex items-center gap-1.5 rounded-lg border border-[#DCE6F2] bg-white px-3 py-1.5 text-xs font-semibold text-[#1D5FAF] hover:bg-[#EAF2FC] cursor-pointer">
                <Upload className="h-3.5 w-3.5" />
                Upload Pincodes CSV
                <input
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={() => {
                    setSettings({
                      ...settings,
                      shipping: {
                        ...settings.shipping,
                        serviceablePincodesCount:
                          settings.shipping.serviceablePincodesCount + 120,
                      },
                    });
                    showToast({
                      title: 'Pincode CSV imported (+120 serviceable PINs)',
                      variant: 'success',
                    });
                  }}
                />
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[#DCE6F2]">
              <FormField label="Shiprocket API Account Email">
                <input
                  type="email"
                  value={settings.shipping.shiprocketEmail}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      shipping: {
                        ...settings.shipping,
                        shiprocketEmail: e.target.value,
                      },
                    })
                  }
                  className={inputClass}
                />
              </FormField>
              <FormField label="Shiprocket API Token">
                <input
                  type="text"
                  value={settings.shipping.shiprocketApiTokenMasked}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      shipping: {
                        ...settings.shipping,
                        shiprocketApiTokenMasked: e.target.value,
                      },
                    })
                  }
                  className={`${inputClass} font-mono`}
                />
              </FormField>
            </div>
          </div>
        )}

        {activeTab === 'payments' && (
          <div className="space-y-5 max-w-3xl">
            <h2 className="text-base font-semibold text-[#12263F]">
              Razorpay Gateway &amp; EMI Configuration
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Razorpay Key ID">
                <input
                  type="text"
                  value={settings.payments.razorpayKeyId}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      payments: { ...settings.payments, razorpayKeyId: e.target.value },
                    })
                  }
                  className={`${inputClass} font-mono`}
                />
              </FormField>
              <FormField label="Razorpay Key Secret">
                <input
                  type="password"
                  value={settings.payments.razorpayKeySecretMasked}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      payments: {
                        ...settings.payments,
                        razorpayKeySecretMasked: e.target.value,
                      },
                    })
                  }
                  className={`${inputClass} font-mono`}
                />
              </FormField>
              <FormField label="Gateway Environment Mode">
                <select
                  value={settings.payments.mode}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      payments: {
                        ...settings.payments,
                        mode: e.target.value as 'test' | 'live',
                      },
                    })
                  }
                  className={selectClass}
                >
                  <option value="live">Live Production</option>
                  <option value="test">Test / Sandbox</option>
                </select>
              </FormField>
              <FormField label="Minimum Order Value for EMI (₹)">
                <input
                  type="number"
                  value={settings.payments.minOrderForEmi}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      payments: {
                        ...settings.payments,
                        minOrderForEmi: Number(e.target.value),
                      },
                    })
                  }
                  className={inputClass}
                />
              </FormField>
            </div>
            <label className="flex items-center gap-2 text-xs font-medium text-[#12263F] cursor-pointer">
              <input
                type="checkbox"
                checked={settings.payments.emiEnabledGlobally}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    payments: {
                      ...settings.payments,
                      emiEnabledGlobally: e.target.checked,
                    },
                  })
                }
                className="rounded border-[#DCE6F2] text-[#1D5FAF]"
              />
              Enable Card &amp; Cardless EMI globally across eligible products
            </label>
          </div>
        )}

        {activeTab === 'taxInvoice' && (
          <div className="space-y-5 max-w-3xl">
            <h2 className="text-base font-semibold text-[#12263F]">GST &amp; Invoice Numbering</h2>
            <label className="flex items-center gap-2 text-xs font-medium text-[#12263F] cursor-pointer">
              <input
                type="checkbox"
                checked={settings.taxInvoice.gstEnabled}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    taxInvoice: {
                      ...settings.taxInvoice,
                      gstEnabled: e.target.checked,
                    },
                  })
                }
                className="rounded border-[#DCE6F2] text-[#1D5FAF]"
              />
              Enable GST calculation &amp; B2B/B2C Tax Invoices
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <FormField label="Default Dispatch State Code">
                <input
                  type="text"
                  value={settings.taxInvoice.defaultStateCode}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      taxInvoice: {
                        ...settings.taxInvoice,
                        defaultStateCode: e.target.value,
                      },
                    })
                  }
                  className={inputClass}
                />
              </FormField>
              <FormField label="Invoice Prefix">
                <input
                  type="text"
                  value={settings.taxInvoice.invoicePrefix}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      taxInvoice: {
                        ...settings.taxInvoice,
                        invoicePrefix: e.target.value,
                      },
                    })
                  }
                  className={`${inputClass} font-mono`}
                />
              </FormField>
              <FormField label="Next Invoice Sequence #">
                <input
                  type="number"
                  value={settings.taxInvoice.nextInvoiceNumber}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      taxInvoice: {
                        ...settings.taxInvoice,
                        nextInvoiceNumber: Number(e.target.value),
                      },
                    })
                  }
                  className={inputClass}
                />
              </FormField>
            </div>

            <FormField label="Invoice Footer Terms & Declarations">
              <textarea
                rows={3}
                value={settings.taxInvoice.footerTerms}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    taxInvoice: { ...settings.taxInvoice, footerTerms: e.target.value },
                  })
                }
                className={textareaClass}
              />
            </FormField>

            <FormField label="Authorized Signatory Stamp / Image">
              <div className="flex items-center gap-3">
                {settings.taxInvoice.signatoryImageUrl && (
                  <div className="h-12 w-28 overflow-hidden rounded border border-[#DCE6F2]">
                    <SafeImage
                      src={settings.taxInvoice.signatoryImageUrl}
                      alt="Authorized Signatory"
                    />
                  </div>
                )}
                <label className="inline-flex items-center gap-1.5 rounded-lg border border-[#DCE6F2] px-3 py-1.5 text-xs font-semibold text-[#12263F] hover:bg-[#EAF2FC] cursor-pointer">
                  <Upload className="h-3.5 w-3.5" />
                  Upload Signatory PNG
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) {
                        setSettings({
                          ...settings,
                          taxInvoice: {
                            ...settings.taxInvoice,
                            signatoryImageUrl: URL.createObjectURL(f),
                          },
                        });
                      }
                    }}
                  />
                </label>
              </div>
            </FormField>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-[#12263F]">
              Automated SMS, WhatsApp &amp; Email Event Templates
            </h2>
            <div className="space-y-4">
              {settings.notifications.map((tpl, idx) => (
                <div
                  key={tpl.eventKey}
                  className="rounded-xl border border-[#DCE6F2] bg-[#F6F9FD] p-4 space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-[#12263F]">{tpl.label}</p>
                    <div className="flex items-center gap-4 text-xs">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={tpl.smsEnabled}
                          onChange={(e) => {
                            const next = [...settings.notifications];
                            next[idx] = { ...tpl, smsEnabled: e.target.checked };
                            setSettings({ ...settings, notifications: next });
                          }}
                        />
                        SMS
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={tpl.whatsappEnabled}
                          onChange={(e) => {
                            const next = [...settings.notifications];
                            next[idx] = { ...tpl, whatsappEnabled: e.target.checked };
                            setSettings({ ...settings, notifications: next });
                          }}
                        />
                        WhatsApp
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={tpl.emailEnabled}
                          onChange={(e) => {
                            const next = [...settings.notifications];
                            next[idx] = { ...tpl, emailEnabled: e.target.checked };
                            setSettings({ ...settings, notifications: next });
                          }}
                        />
                        Email
                      </label>
                    </div>
                  </div>

                  <textarea
                    rows={2}
                    value={tpl.template}
                    onChange={(e) => {
                      const next = [...settings.notifications];
                      next[idx] = { ...tpl, template: e.target.value };
                      setSettings({ ...settings, notifications: next });
                    }}
                    className={textareaClass}
                  />

                  <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-[#5B6B82]">
                    <span>Insert variable:</span>
                    {tpl.variables.map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => {
                          const next = [...settings.notifications];
                          next[idx] = { ...tpl, template: `${tpl.template} ${v}` };
                          setSettings({ ...settings, notifications: next });
                        }}
                        className="rounded bg-white border border-[#DCE6F2] px-1.5 py-0.5 font-mono text-[10px] text-[#1D5FAF] hover:bg-[#EAF2FC]"
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'rental' && (
          <div className="space-y-5 max-w-2xl">
            <h2 className="text-base font-semibold text-[#12263F]">
              Rental Reminders, Late Fees &amp; Mandatory KYC Rules
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Reminder Days Before End Date">
                <input
                  type="number"
                  min={1}
                  value={settings.rental.defaultReminderDaysBeforeDue}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      rental: {
                        ...settings.rental,
                        defaultReminderDaysBeforeDue: Number(e.target.value),
                      },
                    })
                  }
                  className={inputClass}
                />
              </FormField>
              <FormField label="Overdue Late Fee Per Day (₹)">
                <input
                  type="number"
                  min={0}
                  value={settings.rental.overdueLateFeePerDay}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      rental: {
                        ...settings.rental,
                        overdueLateFeePerDay: Number(e.target.value),
                      },
                    })
                  }
                  className={inputClass}
                />
              </FormField>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold text-[#12263F]">
                Required Customer KYC Document Types
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {KYC_DOC_OPTIONS.map((docType) => {
                  const checked = settings.rental.requiredKycDocTypes.includes(docType);
                  return (
                    <label
                      key={docType}
                      className="flex items-center gap-2.5 rounded-lg border border-[#DCE6F2] bg-[#F6F9FD] px-3 py-2.5 text-xs font-medium text-[#12263F] cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => {
                          const next = checked
                            ? settings.rental.requiredKycDocTypes.filter((d) => d !== docType)
                            : [...settings.rental.requiredKycDocTypes, docType];
                          setSettings({
                            ...settings,
                            rental: { ...settings.rental, requiredKycDocTypes: next },
                          });
                        }}
                        className="rounded border-[#DCE6F2] text-[#1D5FAF]"
                      />
                      {docType}
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </form>
  );
}
