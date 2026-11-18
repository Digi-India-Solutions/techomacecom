import type { Address, User } from '@/types';
import { apiFetch, apiPost, apiPut } from './backend';

/**
 * Storefront customer auth — backend/src/modules/auth (/api/v1/auth/*)
 *   OTP sign-in / sign-up · Continue with Google · profile · logout
 */

export type CustomerType = User['role'];

/** What the API returns (backend toCustomerDto). */
export interface CustomerDto {
  id: string;
  name: string;
  mobile: string | null;
  email: string | null;
  customerType: CustomerType;
  qualification: string | null;
  registrationNumber: string | null;
  avatarUrl: string | null;
  mobileVerified: boolean;
  emailVerified: boolean;
  hasGoogle: boolean;
  profileComplete: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  addresses: {
    id: string;
    name: string;
    phone: string;
    organisationName: string | null;
    line1: string;
    line2: string | null;
    landmark: string | null;
    city: string;
    state: string;
    pincode: string;
    type: 'home' | 'clinic' | 'hospital' | 'other';
    isDefault: boolean;
  }[];
  gstDetails: {
    id: string;
    gstin: string;
    companyName: string;
    billingAddress: string | null;
    stateCode: string;
    stateName: string | null;
    pan: string;
    isDefault: boolean;
  }[];
}

export interface AuthResult {
  user: User;
  isNewUser: boolean;
}

export interface OtpSent {
  isNewUser: boolean;
  expiresInSeconds: number;
  resendAfterSeconds: number;
  message: string;
  /** Only in development (backend OTP_DEV_ECHO) — no SMS provider needed. */
  devOtp?: string;
}

const ADDRESS_TYPE: Record<CustomerDto['addresses'][number]['type'], Address['type']> = {
  home: 'Home',
  clinic: 'Clinic',
  hospital: 'Hospital',
  other: 'Office',
};

/** Storefront address type → API value (addresses_type_chk). */
export const ADDRESS_TYPE_API: Record<Address['type'], CustomerDto['addresses'][number]['type']> = {
  Home: 'home',
  Clinic: 'clinic',
  Hospital: 'hospital',
  Office: 'other',
};

/** API customer → the storefront's User shape used by the stores and pages. */
export function toUser(dto: CustomerDto): User {
  const gstProfiles = (dto.gstDetails || []).map((g) => ({
    id: g.id,
    gstin: g.gstin,
    legalBusinessName: g.companyName,
    billingAddress: g.billingAddress || undefined,
    stateCode: g.stateCode,
    stateName: g.stateName || undefined,
    pan: g.pan,
    isDefault: g.isDefault,
  }));
  const gst = gstProfiles.find((g) => g.isDefault) || gstProfiles[0];
  return {
    id: dto.id,
    name: dto.name,
    email: dto.email || '',
    phone: dto.mobile || '',
    role: dto.customerType,
    degree: dto.qualification || undefined,
    registrationNumber: dto.registrationNumber || undefined,
    avatarUrl: dto.avatarUrl || undefined,
    mobileVerified: dto.mobileVerified,
    emailVerified: dto.emailVerified,
    hasGoogle: dto.hasGoogle,
    profileComplete: dto.profileComplete,
    createdAt: dto.createdAt,
    lastLoginAt: dto.lastLoginAt || undefined,
    addresses: dto.addresses.map((a) => ({
      id: a.id,
      type: ADDRESS_TYPE[a.type],
      name: a.name,
      clinicHospitalName: a.organisationName || undefined,
      phone: a.phone,
      addressLine1: a.line1,
      addressLine2: a.line2 || undefined,
      landmark: a.landmark || undefined,
      pincode: a.pincode,
      city: a.city,
      state: a.state,
      isDefault: a.isDefault,
    })),
    gstDetails: gst ? { gstin: gst.gstin, legalBusinessName: gst.legalBusinessName, panNumber: gst.pan, isVerified: true } : undefined,
    gstProfiles,
  };
}

export interface AuthConfig {
  googleEnabled: boolean;
  googleClientId: string | null;
  otpLength: number;
}

export const getAuthConfig = () => apiFetch<AuthConfig>('/auth/config');

export const sendLoginOtp = (mobile: string) => apiPost<OtpSent>('/auth/otp/send', { mobile });

export async function verifyLoginOtp(input: {
  mobile: string;
  otp: string;
  customerType?: CustomerType;
  name?: string;
}): Promise<AuthResult> {
  const data = await apiPost<{ user: CustomerDto; isNewUser: boolean }>('/auth/otp/verify', input);
  return { user: toUser(data.user), isNewUser: data.isNewUser };
}

export async function signInWithGoogle(credential: string, customerType?: CustomerType): Promise<AuthResult> {
  const data = await apiPost<{ user: CustomerDto; isNewUser: boolean }>('/auth/google', { credential, customerType });
  return { user: toUser(data.user), isNewUser: data.isNewUser };
}

/** Current session's customer, or null when signed out. */
export async function fetchCurrentCustomer(): Promise<User | null> {
  try {
    const data = await apiFetch<{ user: CustomerDto }>('/auth/me');
    return toUser(data.user);
  } catch (error) {
    if ((error as { status?: number }).status === 401) return null;
    throw error;
  }
}

export async function updateCustomerProfile(input: {
  name?: string;
  email?: string;
  customerType?: CustomerType;
  qualification?: string;
  registrationNumber?: string;
}): Promise<User> {
  const data = await apiPut<{ user: CustomerDto }>('/auth/me', input);
  return toUser(data.user);
}

export const sendAddMobileOtp = (mobile: string) => apiPost<OtpSent>('/auth/me/mobile/send', { mobile });

export async function verifyAddMobileOtp(mobile: string, otp: string): Promise<User> {
  const data = await apiPost<{ user: CustomerDto }>('/auth/me/mobile/verify', { mobile, otp });
  return toUser(data.user);
}

export async function logoutCustomer(): Promise<void> {
  await apiPost('/auth/logout').catch(() => undefined);
}
