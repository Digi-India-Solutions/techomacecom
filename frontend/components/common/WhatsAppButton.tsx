'use client';

import React, { useEffect, useRef, useState } from 'react';
import { X, Send, ArrowUpRight, Clock } from 'lucide-react';
import { useSiteSettings } from '@/lib/settings/store';
import { formatSupportHours, isSupportOpen, whatsappUrl } from '@/lib/settings/format';

// Number, brand and support hours come from admin → Settings → Store

const quickQuestions = [
  'Wholesale quote for dental chairs & autoclaves',
  'Book a Level 3 home sleep test',
  'Is Philips EverFlo 5L available on rent?',
  'Help with GST invoice / input tax credit'
];

/** Official-style WhatsApp glyph */
const WhatsAppIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 32 32" className={className} fill="currentColor" aria-hidden="true">
    <path d="M16.04 3C9.4 3 4 8.33 4 14.9c0 2.33.69 4.6 1.98 6.54L4 29l7.8-1.98a12.2 12.2 0 0 0 4.24.76C22.67 27.78 28 22.45 28 15.88 28 9.31 22.67 3 16.04 3Zm0 22.6c-1.32 0-2.62-.26-3.83-.77l-.27-.12-4.63 1.17 1.24-4.43-.18-.28a9.63 9.63 0 0 1-1.56-5.27c0-5.36 4.4-9.72 9.83-9.72 5.42 0 9.6 4.36 9.6 9.72 0 5.36-4.4 9.7-10.2 9.7Zm5.52-7.27c-.3-.15-1.78-.87-2.06-.97-.28-.1-.48-.15-.68.15-.2.3-.78.97-.96 1.17-.18.2-.35.22-.65.07-.3-.15-1.27-.46-2.42-1.48-.9-.79-1.5-1.77-1.68-2.07-.18-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.6-.92-2.2-.24-.57-.49-.5-.67-.5h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.01-1.04 2.47 0 1.45 1.07 2.86 1.22 3.06.15.2 2.1 3.2 5.09 4.48.71.3 1.27.49 1.7.63.72.22 1.37.19 1.88.12.57-.09 1.78-.72 2.03-1.42.25-.7.25-1.3.18-1.42-.08-.13-.28-.2-.58-.35Z" />
  </svg>
);


export const WhatsAppButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const { store } = useSiteSettings();
  const hours = store.supportHours;
  // Computed after mount to avoid a server/client hydration mismatch
  const [online, setOnline] = useState<boolean | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const tick = () => setOnline(isSupportOpen(hours));
    tick();
    const t = setInterval(tick, 60_000);
    return () => clearInterval(t);
  }, [hours]);

  // Close on Escape / outside click; focus the input when opened
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setIsOpen(false);
    const onClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClick);
    const focusTimer = setTimeout(() => inputRef.current?.focus(), 150);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onClick);
      clearTimeout(focusTimer);
    };
  }, [isOpen]);

  const handleSend = (textToSend?: string) => {
    const finalMsg = (textToSend || message).trim() || `Hello ${store.brandName}, I need medical/dental equipment assistance.`;
    window.open(whatsappUrl(store, finalMsg), '_blank', 'noopener,noreferrer');
    setIsOpen(false);
    setMessage('');
  };


  // No WhatsApp number saved in Settings → Store: hide the widget
  if (!store.whatsappLink) return null;
  return (
    <div ref={rootRef} className="fixed bottom-20 lg:bottom-6 left-4 sm:left-6 z-40 flex flex-col items-start pointer-events-none">
      {/* ================= Chat panel ================= */}
      {/* Always mounted so it can animate both in and out */}
      <div
          role="dialog"
          aria-label={`Chat with ${store.brandName} on WhatsApp`}
          aria-hidden={!isOpen}
          inert={!isOpen}
          className={`mb-3 w-[calc(100vw-32px)] max-w-[360px] bg-white rounded-2xl shadow-[0_24px_60px_-12px_rgba(11,37,69,0.35)] border border-[#DCE6F2] overflow-hidden origin-bottom-left transition-[opacity,transform,visibility] ease-out ${
            isOpen
              ? 'opacity-100 scale-100 translate-y-0 visible pointer-events-auto duration-250'
              : 'opacity-0 scale-90 translate-y-3 invisible pointer-events-none duration-200'
          }`}
        >
          {/* Header */}
          <div className="relative bg-[#0B2545] text-white px-4 pt-4 pb-5">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Close chat"
            >
              <X className="w-4.5 h-4.5" />
            </button>

            <div className="flex items-center gap-3 pr-8">
              <div className="relative shrink-0">
                <div className="w-11 h-11 rounded-full bg-[#25D366] flex items-center justify-center">
                  <WhatsAppIcon className="w-6 h-6 text-white" />
                </div>
                <span
                  className={`absolute bottom-0 right-0 w-3 h-3 rounded-full ring-2 ring-[#0B2545] ${
                    online ? 'bg-[#4ADE80]' : 'bg-slate-400'
                  }`}
                />
              </div>
              <div className="min-w-0">
                <p className="font-heading font-semibold text-[15px] leading-tight">{store.brandName} Support</p>
                <p className="text-[12px] text-slate-300 mt-0.5">
                  {online === null
                    ? 'Equipment specialists'
                    : online
                    ? 'Online · usually replies in a few minutes'
                    : 'Away · we reply from 9 AM IST'}
                </p>
              </div>
            </div>
          </div>

          {/* Conversation */}
          <div className="relative -mt-2 rounded-t-2xl bg-[#F3F6FA] px-4 pt-4 pb-3 space-y-3 max-h-[340px] overflow-y-auto">
            <div className="max-w-[88%] bg-white rounded-2xl rounded-tl-md px-3.5 py-2.5 shadow-2xs border border-[#E3E9F1]">
              <p className="text-[13px] text-[#12263F] leading-relaxed">
                Hi Doctor 👋 Tell us what you&apos;re looking for — we&apos;ll help with pricing, stock, rentals or
                GST invoices.
              </p>
              <span className="block text-right text-[10px] text-[#8A97A8] mt-1">{store.brandName}</span>
            </div>

            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#8A97A8] mb-2 px-0.5">
                Popular questions
              </p>
              <div className="flex flex-col gap-1.5">
                {quickQuestions.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => handleSend(q)}
                    className="group flex items-center justify-between gap-2 w-full text-left text-[13px] bg-white text-[#12263F] border border-[#DCE6F2] hover:border-[#25D366] hover:bg-[#F0FBF4] px-3 py-2 rounded-xl transition-colors cursor-pointer"
                  >
                    <span>{q}</span>
                    <ArrowUpRight className="w-4 h-4 shrink-0 text-[#8A97A8] group-hover:text-[#16A34A] transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Composer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="px-3 pt-3 pb-2.5 bg-white border-t border-[#E3E9F1]"
          >
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                id="whatsapp-chat-message"
                name="chatMessage"
                type="text"
                autoComplete="off"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your requirement…"
                className="flex-1 min-w-0 text-[13px] px-3.5 py-2.5 bg-[#F3F6FA] border border-transparent text-[#12263F] rounded-full focus:outline-none focus:bg-white focus:border-[#25D366] transition-colors"
              />
              <button
                type="submit"
                className="w-10 h-10 shrink-0 rounded-full bg-[#25D366] hover:bg-[#1EBE5A] text-white flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Send on WhatsApp"
              >
                <Send className="w-4 h-4 -ml-0.5" />
              </button>
            </div>
            <p className="flex items-center justify-center gap-1 text-[11px] text-[#8A97A8] mt-2">
              <Clock className="w-3 h-3" />
              {formatSupportHours(hours)} · Opens in WhatsApp
            </p>
          </form>
      </div>

      {/* ================= Launcher ================= */}
      <button
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        aria-expanded={isOpen}
        aria-label={isOpen ? 'Close chat' : 'Need advice? Chat with us on WhatsApp'}
        className="pointer-events-auto group flex items-center bg-white text-[#12263F] p-1.5 rounded-full border border-[#DCE6F2] shadow-[0_10px_30px_-8px_rgba(11,37,69,0.35)] hover:shadow-[0_14px_36px_-8px_rgba(11,37,69,0.45)] hover:-translate-y-0.5 transition-[box-shadow,transform] duration-300 cursor-pointer"
      >
        <span className="relative w-11 h-11 rounded-full bg-[#25D366] text-white flex items-center justify-center shrink-0">
          {!isOpen && <span className="absolute inset-0 rounded-full bg-[#25D366] opacity-40 animate-ping [animation-duration:2.5s]" />}
          {/* Icon swap: WhatsApp ↔ close, with a quick rotate/fade */}
          <WhatsAppIcon
            className={`absolute w-6 h-6 transition-all duration-300 ${isOpen ? 'opacity-0 rotate-90 scale-50' : 'opacity-100 rotate-0 scale-100'}`}
          />
          <X
            className={`absolute w-5 h-5 transition-all duration-300 ${isOpen ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-50'}`}
          />
        </span>

        {/* Label — collapsed to just the logo; slides open on hover / keyboard focus (desktop) */}
        <span className="hidden sm:grid grid-cols-[0fr] group-hover:grid-cols-[1fr] group-focus-visible:grid-cols-[1fr] transition-[grid-template-columns] duration-300 ease-out">
          <span className="min-w-0 overflow-hidden">
            <span className="flex flex-col items-start leading-tight text-left whitespace-nowrap pl-3 pr-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 group-focus-visible:opacity-100 group-focus-visible:translate-x-0 transition-[opacity,transform] duration-200 group-hover:delay-100">
              <span className="text-[11px] font-medium text-[#5B6B82] flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${online ? 'bg-[#22C55E]' : 'bg-slate-400'}`} />
                Need advice?
              </span>
              <span className="text-[14px] font-heading font-semibold text-[#12263F] group-hover:text-[#16A34A] transition-colors">
                {isOpen ? 'Close chat' : 'Chat with an expert'}
              </span>
            </span>
          </span>
        </span>
      </button>
    </div>
  );
};

export default WhatsAppButton;
