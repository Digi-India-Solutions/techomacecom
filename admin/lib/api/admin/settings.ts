import type {
  AdminSettings,
  NotificationChannelStatus,
  NotificationLogRow,
  NotificationTemplate,
  PincodeImportResult,
  PincodeRow,
  PincodeSummary,
  SettingsGroup,
  SettingsImage,
} from '@/types/admin';
import { adminDelete, adminFetch, adminGet, adminPatch, adminPost, adminPut, getApiBaseUrl, type ListMeta } from './client';

/**
 * Settings — backend/src/modules/settings (/api/v1/admin/settings/*).
 * Store, Shipping, Returns, Tax & Invoice and Rental are saved one tab at a time; the storefront
 * reads the public part from /api/v1/settings/public.
 */

export const getAdminSettings = async (): Promise<AdminSettings> => {
  try {
    return await adminGet<AdminSettings>('/admin/settings');
  } catch (err) {
    try {
      const pubRes = await fetch(`${getApiBaseUrl()}/settings/public`).then((r) => r.json());
      if (pubRes?.success && pubRes.data) {
        return {
          store: {
            ...pubRes.data.store,
            logoPath: '',
            footerLogoPath: '',
            faviconPath: '',
            supportOpenTime: pubRes.data.store.supportHours?.open || '09:00',
            supportCloseTime: pubRes.data.store.supportHours?.close || '19:30',
            openOnSunday: pubRes.data.store.supportHours?.openOnSunday || false,
            instagramUrl: pubRes.data.store.social?.instagram || '',
            facebookUrl: pubRes.data.store.social?.facebook || '',
            linkedinUrl: pubRes.data.store.social?.linkedin || '',
            youtubeUrl: pubRes.data.store.social?.youtube || '',
            twitterUrl: pubRes.data.store.social?.twitter || '',
          },
          shipping: pubRes.data.shipping,
          tax: {
            ...pubRes.data.tax,
            invoicePrefix: 'BDM/26-27/',
            nextInvoiceNumber: 1,
            invoiceNumberDigits: 4,
            footerTerms: pubRes.data.tax.invoiceFooterTerms || '',
            signatoryPath: '',
          },
          rental: { ...pubRes.data.rental, kycDocuments: (pubRes.data.rental?.kycDocuments || []).map((d: { key: string }) => d.key) },
          returns: { ...pubRes.data.returns, nonReturnableCategoryIds: [] },
          images: {
            logo: pubRes.data.store.logoUrl,
            footerLogo: pubRes.data.store.footerLogoUrl,
            favicon: pubRes.data.store.faviconUrl,
            signatory: pubRes.data.tax.signatoryUrl,
          },
          options: {
            states: [{ code: pubRes.data.tax.dispatchStateCode, name: pubRes.data.tax.dispatchState }],
            gstRates: [0, 5, 12, 18, 28],
          },
        } as AdminSettings;
      }
    } catch {
      // Fallback failed, throw original error
    }
    throw err;
  }
};

/** Saves one tab. Returns every tab again plus which fields changed. */
export const saveSettingsGroup = <G extends SettingsGroup>(group: G, values: AdminSettings[G]) =>
  adminPut<AdminSettings & { changed: string[]; message: string }>(`/admin/settings/${group}`, values);

export async function uploadSettingsImage(name: SettingsImage, file: File) {
  const form = new FormData();
  form.append('file', file);
  return adminPut<{ name: SettingsImage; path: string; url: string; width: number; height: number; bytes: number }>(
    `/admin/settings/images/${name}`,
    form
  );
}

export const removeSettingsImage = (name: SettingsImage) => adminDelete<{ message: string }>(`/admin/settings/images/${name}`);

// ---- Serviceable PIN codes ----

export const getPincodeSummary = () => adminGet<PincodeSummary>('/admin/settings/pincodes/summary');

export async function listPincodes(q = '', page = 1, limit = 20): Promise<{ rows: PincodeRow[]; meta?: ListMeta }> {
  const params = new URLSearchParams({ page: String(page), limit: String(limit), ...(q ? { q } : {}) });
  const { data, meta } = await adminFetch<PincodeRow[]>(`/admin/settings/pincodes?${params}`);
  return { rows: data, meta };
}

export async function importPincodesCsv(file: File, mode: 'merge' | 'replace') {
  const form = new FormData();
  form.append('mode', mode);
  form.append('file', file);
  return adminPost<PincodeImportResult>('/admin/settings/pincodes/import', form);
}

export const clearPincodes = () => adminDelete<{ removed: number; summary: PincodeSummary }>('/admin/settings/pincodes');

export const togglePincodeCod = (pincode: string) =>
  adminPatch<PincodeRow & { summary?: PincodeSummary }>(`/admin/settings/pincodes/${pincode}/toggle-cod`);

export const togglePincodeActive = (pincode: string) =>
  adminPatch<PincodeRow & { summary?: PincodeSummary }>(`/admin/settings/pincodes/${pincode}/toggle-active`);

export const deletePincodeRow = (pincode: string) =>
  adminDelete<{ pincode: string; removed: boolean; summary?: PincodeSummary }>(`/admin/settings/pincodes/${pincode}`);

/** Downloads the current list as CSV (uses the session cookie). */
export async function downloadPincodesCsv() {
  const res = await fetch(`${getApiBaseUrl()}/admin/settings/pincodes/export`, { credentials: 'include' });
  if (!res.ok) throw new Error('Could not download the PIN code list');
  const url = URL.createObjectURL(await res.blob());
  const a = Object.assign(document.createElement('a'), { href: url, download: 'serviceable-pincodes.csv' });
  a.click();
  URL.revokeObjectURL(url);
}

// ---- Rental Serviceable PIN codes ----

export const getRentalPincodeSummary = () => adminGet<PincodeSummary>('/admin/settings/rental-pincodes/summary');

export async function listRentalPincodes(q = '', page = 1, limit = 20): Promise<{ rows: PincodeRow[]; meta?: ListMeta }> {
  const params = new URLSearchParams({ page: String(page), limit: String(limit), ...(q ? { q } : {}) });
  const { data, meta } = await adminFetch<PincodeRow[]>(`/admin/settings/rental-pincodes?${params}`);
  return { rows: data, meta };
}

export async function importRentalPincodesCsv(file: File, mode: 'merge' | 'replace') {
  const form = new FormData();
  form.append('mode', mode);
  form.append('file', file);
  return adminPost<PincodeImportResult>('/admin/settings/rental-pincodes/import', form);
}

export const clearRentalPincodes = () => adminDelete<{ removed: number; summary: PincodeSummary }>('/admin/settings/rental-pincodes');

export const toggleRentalPincodeCod = (pincode: string) =>
  adminPatch<PincodeRow & { summary?: PincodeSummary }>(`/admin/settings/rental-pincodes/${pincode}/toggle-cod`);

export const toggleRentalPincodeActive = (pincode: string) =>
  adminPatch<PincodeRow & { summary?: PincodeSummary }>(`/admin/settings/rental-pincodes/${pincode}/toggle-active`);

export const deleteRentalPincodeRow = (pincode: string) =>
  adminDelete<{ pincode: string; removed: boolean; summary?: PincodeSummary }>(`/admin/settings/rental-pincodes/${pincode}`);

/** Downloads the rental PIN code list as CSV (uses the session cookie). */
export async function downloadRentalPincodesCsv() {
  const res = await fetch(`${getApiBaseUrl()}/admin/settings/rental-pincodes/export`, { credentials: 'include' });
  if (!res.ok) throw new Error('Could not download the rental PIN code list');
  const url = URL.createObjectURL(await res.blob());
  const a = Object.assign(document.createElement('a'), { href: url, download: 'rental-serviceable-pincodes.csv' });
  a.click();
  URL.revokeObjectURL(url);
}

// ---- Notifications ----

export const getNotificationTemplates = () =>
  adminGet<{ events: NotificationTemplate[]; channels: NotificationChannelStatus }>('/admin/settings/notifications');

export const saveNotificationTemplates = (events: NotificationTemplate[]) =>
  adminPut<{ events: NotificationTemplate[]; channels: NotificationChannelStatus; changed: string[]; message: string }>(
    '/admin/settings/notifications',
    { events: events.map(({ preview: _preview, label: _label, group: _group, variables: _vars, ...rest }) => rest) }
  );

export const sendTestNotification = (event: string, channel: 'email' | 'sms' | 'whatsapp') =>
  adminPost<{ channel: string; recipient: string; status: 'sent' | 'failed'; error?: string }>(
    `/admin/settings/notifications/${event}/test`,
    { channel }
  );

export const getNotificationLogs = () => adminGet<NotificationLogRow[]>('/admin/settings/notifications/logs');
