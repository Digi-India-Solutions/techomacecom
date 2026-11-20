import type { Address, DeviceSession, User } from '@/types';
import { apiDelete, apiFetch, apiPost, apiPut } from './backend';
import { ADDRESS_TYPE_API, type CustomerDto, toUser } from './customerAuth';

/**
 * "My account" — backend/src/modules/account (/api/v1/account/*) and the
 * signed-in devices under /api/v1/auth/sessions.
 * Every write returns the refreshed customer, so callers just do setUser(result.user).
 */

interface UserResult {
  user: User;
  message: string;
}

const withUser = async (p: Promise<{ user: CustomerDto; message?: string }>): Promise<UserResult> => {
  const data = await p;
  return { user: toUser(data.user), message: data.message || '' };
};

// ---- Addresses ----

export type AddressInput = Omit<Address, 'id' | 'alternatePhone'>;

const addressBody = (a: AddressInput) => ({
  type: ADDRESS_TYPE_API[a.type],
  name: a.name.trim(),
  phone: a.phone.trim(),
  organisationName: a.type === 'Home' ? '' : a.clinicHospitalName?.trim() || '',
  line1: a.addressLine1.trim(),
  line2: a.addressLine2?.trim() || '',
  landmark: a.landmark?.trim() || '',
  city: a.city.trim(),
  state: a.state,
  pincode: a.pincode.trim(),
  isDefault: a.isDefault,
});

export const createAddress = (a: AddressInput) =>
  withUser(apiPost<{ user: CustomerDto; message: string }>('/account/addresses', addressBody(a)));

export const updateAddress = (id: string, a: AddressInput) =>
  withUser(apiPut<{ user: CustomerDto; message: string }>(`/account/addresses/${id}`, addressBody(a)));

export const setDefaultAddress = (id: string) =>
  withUser(apiPost<{ user: CustomerDto; message: string }>(`/account/addresses/${id}/default`));

export const deleteAddress = (id: string) =>
  withUser(apiDelete<{ user: CustomerDto; message: string }>(`/account/addresses/${id}`));

// ---- GST details ----

export interface GstInput {
  gstin: string;
  legalBusinessName: string;
  billingAddress?: string;
  isDefault: boolean;
}

const gstBody = (g: GstInput) => ({
  gstin: g.gstin.trim().toUpperCase(),
  companyName: g.legalBusinessName.trim(),
  billingAddress: g.billingAddress?.trim() || '',
  isDefault: g.isDefault,
});

export const createGstProfile = (g: GstInput) =>
  withUser(apiPost<{ user: CustomerDto; message: string }>('/account/gst', gstBody(g)));

export const updateGstProfile = (id: string, g: GstInput) =>
  withUser(apiPut<{ user: CustomerDto; message: string }>(`/account/gst/${id}`, gstBody(g)));

export const setDefaultGstProfile = (id: string) =>
  withUser(apiPost<{ user: CustomerDto; message: string }>(`/account/gst/${id}/default`));

export const deleteGstProfile = (id: string) =>
  withUser(apiDelete<{ user: CustomerDto; message: string }>(`/account/gst/${id}`));

// ---- Profile photo (the API square-crops it to 256 × 256 WebP) ----

export function uploadAvatar(file: File) {
  const form = new FormData();
  form.append('file', file);
  return withUser(apiPut<{ user: CustomerDto; message: string }>('/account/avatar', form));
}

export const removeAvatar = () => withUser(apiDelete<{ user: CustomerDto; message: string }>('/account/avatar'));

// ---- Signed-in devices ----

export const listSessions = () => apiFetch<DeviceSession[]>('/auth/sessions');

export const signOutSession = (id: string) => apiDelete<{ message: string }>(`/auth/sessions/${id}`);

export const signOutOtherSessions = () => apiPost<{ count: number; message: string }>('/auth/sessions/revoke-others');
