'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, X } from 'lucide-react';
import QuizPhoneMockup from './QuizPhoneMockup';

/**
 * Popup shown after a short delay when a visitor opens /sleep-test.
 * Instead of navigating to /sleep-test/quiz, it now calls onOpenQuiz()
 * which opens the full quiz INLINE as a modal on the same page.
 *
 * Shows once per browser session (sessionStorage). Closes on ✕, Esc, or backdrop click.
 */
const SEEN_KEY = 'bd_sleep_quiz_popup_seen';
const OPEN_DELAY_MS = 900;

interface Props {
  onOpenQuiz: () => void;
}

export const SleepQuizPopup: React.FC<Props> = ({ onOpenQuiz }) => {
  const [open, setOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    let seen = false;
    try {
      seen = sessionStorage.getItem(SEEN_KEY) === '1';
    } catch {
      /* storage blocked → just show it */
    }
    if (seen) return;
    const t = setTimeout(() => {
      setOpen(true);
      try {
        sessionStorage.setItem(SEEN_KEY, '1');
      } catch {
        /* ignore */
      }
    }, OPEN_DELAY_MS);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  if (!open) return null;

  const handleStartQuiz = () => {
    setOpen(false);
    onOpenQuiz();
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[#0B2545]/70 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sleep-quiz-popup-title"
      onClick={() => setOpen(false)}
    >
      <div
        className="relative w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-3xl bg-white shadow-2xl grid grid-cols-1 md:grid-cols-2"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          ref={closeRef}
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Close"
          className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-white/90 border border-[#DCE6F2] text-[#12263F] hover:bg-[#EAF2FC] flex items-center justify-center cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="hidden md:flex items-center justify-center bg-gradient-to-br from-[#0B2545] via-[#13335E] to-[#1D5FAF] p-8">
          <QuizPhoneMockup />
        </div>

        <div className="p-7 sm:p-10 flex flex-col justify-center text-center md:text-left space-y-4 bg-[#F6F9FD]">
          <span className="text-[11px] font-bold uppercase tracking-widest text-[#1D5FAF] font-heading">
            2-minute risk check
          </span>
          <h2 id="sleep-quiz-popup-title" className="text-2xl sm:text-3xl font-bold text-[#12263F] font-heading leading-tight">
            What&apos;s Your Sleep Apnea Risk Level?
          </h2>
          <p className="text-sm text-[#5B6B82] font-body leading-relaxed">
            Snoring, daytime sleepiness and morning headaches could be warning signs. Answer 8 quick questions to
            find out where you stand.
          </p>
          <p className="text-sm font-bold text-[#12263F] font-heading">Get answers. Take action.</p>
          <button
            type="button"
            onClick={handleStartQuiz}
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#1D5FAF] hover:bg-[#174E90] text-white text-sm font-bold font-heading shadow-lg transition-all active:scale-95 cursor-pointer"
          >
            Take the Sleep Apnea Test <ArrowRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="text-xs font-semibold text-[#5B6B82] hover:text-[#12263F] cursor-pointer"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
};

export default SleepQuizPopup;
