import React from 'react';
import { ApiClientError } from '@/lib/api/backend';

/** Shared building blocks for the My Account sections. */

export const inputClass =
  'w-full text-sm px-3.5 py-2.5 bg-white border border-[#D5DEEA] rounded-lg text-[#12263F] placeholder-[#97A3B4] focus:outline-none focus:border-[#1D5FAF] focus:ring-3 focus:ring-[#1D5FAF]/15 transition disabled:bg-[#F6F9FD] disabled:text-[#5B6B82]';

export const btnPrimary =
  'inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#1D5FAF] hover:bg-[#174E90] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors cursor-pointer';

export const btnSecondary =
  'inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-[#D5DEEA] bg-white hover:border-[#1D5FAF] hover:text-[#1D5FAF] disabled:opacity-50 disabled:cursor-not-allowed text-[#12263F] text-sm font-semibold transition-colors cursor-pointer';

export const linkButton = 'text-[13px] font-semibold text-[#1D5FAF] hover:underline cursor-pointer disabled:opacity-50';

export const Field: React.FC<{
  label: string;
  htmlFor: string;
  required?: boolean;
  error?: string;
  hint?: React.ReactNode;
  children: React.ReactNode;
}> = ({ label, htmlFor, required, error, hint, children }) => (
  <div>
    <label htmlFor={htmlFor} className="block text-[13px] font-semibold text-[#12263F] mb-1.5">
      {label}
      {required && <span className="text-[#DC2626] ml-0.5">*</span>}
    </label>
    {children}
    {error ? (
      <p className="mt-1 text-[12px] text-[#DC2626]" role="alert">
        {error}
      </p>
    ) : hint ? (
      <p className="mt-1 text-[12px] text-[#8A97A8]">{hint}</p>
    ) : null}
  </div>
);

export const SectionHeader: React.FC<{ title: string; subtitle?: string; action?: React.ReactNode }> = ({ title, subtitle, action }) => (
  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-5 mb-6 border-b border-[#E8EEF5]">
    <div>
      <h2 className="text-xl font-semibold text-[#12263F]">{title}</h2>
      {subtitle && <p className="text-[14px] text-[#5B6B82] mt-1">{subtitle}</p>}
    </div>
    {action}
  </div>
);

export const EmptyState: React.FC<{ icon: React.ElementType; title: string; text: string; cta?: React.ReactNode }> = ({
  icon: Icon,
  title,
  text,
  cta,
}) => (
  <div className="text-center py-14 px-6 border border-dashed border-[#D5DEEA] rounded-2xl">
    <div className="w-12 h-12 rounded-full bg-[#EAF2FC] text-[#1D5FAF] flex items-center justify-center mx-auto">
      <Icon className="w-6 h-6" />
    </div>
    <h3 className="mt-4 text-[16px] font-semibold text-[#12263F]">{title}</h3>
    <p className="mt-1 text-[14px] text-[#5B6B82] max-w-sm mx-auto">{text}</p>
    {cta && <div className="mt-5">{cta}</div>}
  </div>
);

/** Per-field messages from an API validation error ({ fields: { pincode: "…" } }). */
export function apiFieldErrors(error: unknown): Record<string, string> {
  return error instanceof ApiClientError && error.fields ? error.fields : {};
}

export const formatDate = (d?: string) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

export const formatDateTime = (d?: string) =>
  d
    ? new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' })
    : '—';

/** "just now" · "5 min ago" · "3 hours ago" · "2 days ago" · date */
export function timeAgo(iso?: string | null): string {
  if (!iso) return '—';
  const seconds = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (Number.isNaN(seconds)) return '—';
  if (seconds < 45) return 'just now';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;
  return formatDate(iso);
}

export const CUSTOMER_TYPE_LABEL: Record<string, string> = {
  doctor: 'Doctor / Dentist',
  clinic_admin: 'Hospital / Clinic',
  procurement: 'Procurement',
  individual: 'Patient / Family',
};
