import React from 'react';
import RiskGauge from './RiskGauge';

/** Phone illustration ("Your sleep apnea risk is:") used by the quiz teaser section and popup. */
export const QuizPhoneMockup: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div
    className={`relative w-[220px] sm:w-[250px] rounded-[2.2rem] bg-[#0B2545] p-2.5 shadow-2xl ring-1 ring-white/10 ${className}`}
    aria-hidden="true"
  >
    {/* notch */}
    <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-20 h-4 rounded-b-xl bg-[#0B2545] z-10" />
    <div className="rounded-[1.8rem] bg-white overflow-hidden">
      <div className="bg-[#1D5FAF] px-4 pt-7 pb-4 text-center">
        <span className="text-[11px] font-black tracking-[0.2em] text-white font-heading">BUY DENMED</span>
        <p className="text-[9px] font-semibold tracking-widest text-[#93C5FD] font-heading mt-0.5">SLEEP RISK CHECK</p>
      </div>
      <div className="px-4 pt-5 pb-6 text-center">
        <p className="text-base font-bold text-[#12263F] font-heading leading-snug">
          Your sleep apnea
          <br />
          risk is:
        </p>
        <RiskGauge className="w-full mt-3" />
        <div className="mt-2 flex justify-between text-[9px] font-bold font-heading">
          <span className="text-[#16A34A]">LOW</span>
          <span className="text-[#B45309]">MODERATE</span>
          <span className="text-[#DC2626]">HIGH</span>
        </div>
      </div>
    </div>
  </div>
);

export default QuizPhoneMockup;
