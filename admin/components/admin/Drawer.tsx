import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  widthClass?: string;
  footer?: React.ReactNode;
  children: React.ReactNode;
}

export function Drawer({
  open,
  onClose,
  title,
  subtitle,
  widthClass = 'max-w-xl',
  footer,
  children,
}: DrawerProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex justify-end" role="dialog" aria-modal="true">
      <div
        className="fixed inset-0 bg-[#0B2545]/40 backdrop-blur-[1px] transition-opacity"
        onClick={onClose}
      />
      <div
        className={`relative z-50 flex h-full w-full ${widthClass} flex-col border-l border-[#DCE6F2] bg-white shadow-2xl`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#DCE6F2] px-6 py-4">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-[#12263F] truncate">{title}</h2>
            {subtitle && <p className="mt-0.5 text-xs text-[#5B6B82] truncate">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#5B6B82] hover:bg-[#EAF2FC] hover:text-[#12263F] transition-colors shrink-0"
            aria-label="Close drawer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>

        {footer && (
          <div className="border-t border-[#DCE6F2] bg-[#F6F9FD] px-6 py-3.5 flex items-center justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
