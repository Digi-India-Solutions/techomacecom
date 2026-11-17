import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary' | 'warning';
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  const confirmBtnClass =
    variant === 'danger'
      ? 'bg-red-600 hover:bg-red-700 text-white'
      : variant === 'warning'
        ? 'bg-[#F28C38] hover:bg-[#d97724] text-white'
        : 'bg-[#1D5FAF] hover:bg-[#174D8F] text-white';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B2545]/45 backdrop-blur-[1px] p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <div className="w-full max-w-md rounded-xl border border-[#DCE6F2] bg-white shadow-xl">
        <div className="flex items-start justify-between gap-3 border-b border-[#DCE6F2] px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                variant === 'danger'
                  ? 'bg-red-50 text-red-600'
                  : variant === 'warning'
                    ? 'bg-[#F28C38]/15 text-[#F28C38]'
                    : 'bg-[#EAF2FC] text-[#1D5FAF]'
              }`}
            >
              <AlertTriangle className="h-5 w-5" />
            </div>
            <h3
              id="confirm-dialog-title"
              className="text-base font-semibold text-[#12263F]"
            >
              {title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg p-1.5 text-[#5B6B82] hover:bg-[#EAF2FC] hover:text-[#12263F] transition-colors"
            aria-label="Close dialog"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-5 py-4">
          <p className="text-sm text-[#5B6B82] leading-relaxed">{description}</p>
        </div>

        <div className="flex items-center justify-end gap-2.5 border-t border-[#DCE6F2] px-5 py-3.5 bg-[#F6F9FD] rounded-b-xl">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded-lg border border-[#DCE6F2] bg-white px-4 py-2 text-sm font-medium text-[#12263F] hover:bg-[#EAF2FC] transition-colors whitespace-nowrap shrink-0"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap shrink-0 disabled:opacity-60 ${confirmBtnClass}`}
          >
            {loading ? 'Processing...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
