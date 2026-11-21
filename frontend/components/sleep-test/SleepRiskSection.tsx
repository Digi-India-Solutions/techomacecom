'use client';

import React from 'react';
import { ArrowRight, ClipboardCheck, Clock, Lock } from 'lucide-react';
import QuizPhoneMockup from './QuizPhoneMockup';

/**
 * "Spot the Signs and Assess Your Risk" — teaser for the STOP-BANG risk quiz.
 * Sits just above "Do You Have These Symptoms?" on /sleep-test.
 * Clicking "Take the Quiz" opens the quiz modal inline on the page.
 */
interface Props {
  onOpenQuiz: () => void;
}

export const SleepRiskSection: React.FC<Props> = ({ onOpenQuiz }) => (
  <section id="risk-quiz" className="py-12 sm:py-16 bg-[#EAF2FC] border-b border-[#DCE6F2] overflow-hidden">
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
        <div className="lg:col-span-7 space-y-5">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-[#1D5FAF] bg-white border border-[#DCE6F2] px-3 py-1 rounded-full font-heading">
            <ClipboardCheck className="w-3.5 h-3.5" /> Free STOP-BANG Screening
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#12263F] font-heading leading-tight">
            Spot the Signs and <span className="text-[#1D5FAF]">Assess Your Risk</span>
          </h2>
          <p className="text-sm sm:text-base text-[#5B6B82] font-body leading-relaxed max-w-xl">
            Answer a few simple questions about your symptoms, sleep and health to better understand your risk for
            sleep apnea — and whether a home sleep study is right for you.
          </p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs sm:text-sm text-[#5B6B82] font-heading font-semibold">
            <span className="inline-flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-[#1D5FAF]" /> 2 minutes
            </span>
            <span className="inline-flex items-center gap-1.5">
              <ClipboardCheck className="w-4 h-4 text-[#1D5FAF]" /> 8 questions · Free
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-[#1D5FAF]" /> No account needed
            </span>
          </div>
          <button
            type="button"
            onClick={onOpenQuiz}
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-[#1D5FAF] hover:bg-[#174E90] text-white text-sm font-bold font-heading shadow-lg shadow-[#0B2545]/20 transition-all active:scale-95 cursor-pointer"
          >
            Take the Test <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="lg:col-span-5 flex justify-center">
          <div className="relative w-full max-w-sm rounded-3xl bg-gradient-to-br from-[#0B2545] via-[#13335E] to-[#1D5FAF] p-8 flex justify-center shadow-xl">
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-[#93C5FD]/20" aria-hidden="true" />
            <div className="absolute -bottom-12 -left-8 w-36 h-36 rounded-full bg-white/10" aria-hidden="true" />
            <QuizPhoneMockup className="relative" />
          </div>
        </div>
      </div>
    </div>
  </section>
);

export default SleepRiskSection;
