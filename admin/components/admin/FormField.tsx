import React from 'react';

interface FormFieldProps {
  label: string;
  htmlFor?: string;
  required?: boolean;
  hint?: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}

export function FormField({
  label,
  htmlFor,
  required,
  hint,
  error,
  className = '',
  children,
}: FormFieldProps) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <label
        htmlFor={htmlFor}
        className="block text-xs font-semibold text-[#12263F]"
      >
        {label}
        {required && <span className="ml-1 text-red-600">*</span>}
      </label>
      {children}
      {error ? (
        <p className="text-xs font-medium text-red-600">{error}</p>
      ) : hint ? (
        <p className="text-xs text-[#5B6B82]">{hint}</p>
      ) : null}
    </div>
  );
}

export const inputClass =
  'w-full rounded-lg border border-[#DCE6F2] bg-white px-3 py-2 text-sm text-[#12263F] placeholder-[#5B6B82]/60 focus:border-[#1D5FAF] focus:outline-none focus:ring-2 focus:ring-[#1D5FAF]/20 transition-colors disabled:bg-[#F6F9FD] disabled:text-[#5B6B82]';

export const selectClass =
  'w-full rounded-lg border border-[#DCE6F2] bg-white px-3 py-2 text-sm text-[#12263F] focus:border-[#1D5FAF] focus:outline-none focus:ring-2 focus:ring-[#1D5FAF]/20 transition-colors disabled:bg-[#F6F9FD]';

export const textareaClass =
  'w-full rounded-lg border border-[#DCE6F2] bg-white px-3 py-2 text-sm text-[#12263F] placeholder-[#5B6B82]/60 focus:border-[#1D5FAF] focus:outline-none focus:ring-2 focus:ring-[#1D5FAF]/20 transition-colors min-h-[88px]';
