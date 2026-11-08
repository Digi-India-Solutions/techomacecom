'use client';

import React from 'react';
import { useToastStore } from '@/lib/store';
import { CheckCircle2, AlertCircle, Info, X, AlertTriangle } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        let bg = 'bg-white border-gray-200 text-gray-800';
        let icon = <Info className="w-5 h-5 text-blue-500 shrink-0" />;

        if (toast.type === 'success') {
          bg = 'bg-white border-green-200 text-gray-800 shadow-lg';
          icon = <CheckCircle2 className="w-5 h-5 text-[#16A34A] shrink-0" />;
        } else if (toast.type === 'error') {
          bg = 'bg-white border-red-200 text-gray-800 shadow-lg';
          icon = <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />;
        } else if (toast.type === 'warning') {
          bg = 'bg-white border-amber-200 text-gray-800 shadow-lg';
          icon = <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />;
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-lg border shadow-md transition-all duration-300 animate-in slide-in-from-right-5 ${bg}`}
          >
            {icon}
            <div className="flex-1 text-sm">
              {toast.title && <div className="font-semibold text-gray-900">{toast.title}</div>}
              <div className="text-gray-600 leading-snug">{toast.message}</div>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-gray-400 hover:text-gray-600 p-0.5 transition-colors"
              aria-label="Close notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default ToastContainer;
