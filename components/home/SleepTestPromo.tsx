'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Moon, ArrowRight, CheckCircle2, ShieldCheck, Stethoscope } from 'lucide-react';

export const SleepTestPromo: React.FC = () => {
  return (
    <section className="my-8 sm:my-12">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6">
        <div className="relative rounded-3xl bg-gradient-to-r from-[#1E293B] via-[#0F172A] to-[#1E293B] text-white p-6 sm:p-10 lg:p-12 overflow-hidden shadow-xl border border-blue-900/40">
          {/* Ambient Blue/Orange Glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-2 bg-blue-500/20 text-blue-300 border border-blue-400/30 px-3 py-1 rounded-full text-xs font-bold font-heading uppercase tracking-wider">
                <Moon className="w-3.5 h-3.5" />
                <span>At-Home Sleep Diagnostics • Pan-India</span>
              </div>

              <h2 className="text-2xl sm:text-4xl font-bold font-heading tracking-tight leading-tight">
                Snoring? Feeling Tired All Day? <br />
                <span className="text-teal-300">Get a Sleep Study at Home</span>
              </h2>

              <p className="text-xs sm:text-sm text-slate-300 font-body leading-relaxed max-w-xl">
                Diagnose Obstructive Sleep Apnea (OSA) comfortably in your own bed without hospital overnight stays. Our certified technician visits your home, hooks up calibrated sensors, and our board-certified Pulmonologists evaluate your report within 24–48 hours.
              </p>

              {/* 3 Value Props */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs font-body">
                <div className="flex items-center gap-2 text-slate-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>No hospital stay</span>
                </div>
                <div className="flex items-center gap-2 text-slate-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Doorstep technician setup</span>
                </div>
                <div className="flex items-center gap-2 text-slate-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Doctor-verified report</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 flex flex-wrap gap-3 sm:gap-4">
                <Link
                  href="/sleep-test"
                  className="px-6 py-3 bg-[#0F766E] hover:bg-[#0B5F58] text-white font-bold text-xs sm:text-sm font-heading rounded-xl shadow-lg shadow-teal-950/30 transition-all flex items-center gap-2 active:scale-95"
                >
                  <span>Enquire for Sleep Test</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <a
                  href="tel:+919811234567"
                  className="px-5 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs sm:text-sm font-heading rounded-xl border border-white/20 transition-colors"
                >
                  Call Sleep Advisor
                </a>
              </div>
            </div>

            {/* Right Visual Image Showcase */}
            <div className="lg:col-span-5 relative w-full aspect-4/3 sm:aspect-16/10 rounded-2xl overflow-hidden border border-white/15 shadow-2xl bg-white/5">
              <Image
                src="/images/patient_sleeping_peaceful_1793803357708.jpg"
                alt="Patient sleeping peacefully during home sleep study"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 480px"
                referrerPolicy="no-referrer"
              />
              <div className="absolute bottom-3 left-3 right-3 bg-[#1E293B]/90 backdrop-blur-md px-3.5 py-2.5 rounded-xl border border-white/15 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Stethoscope className="w-4 h-4 text-teal-400" />
                  <div>
                    <div className="font-bold text-white font-heading">Level 2 & Level 3 HSAT</div>
                    <div className="text-[10px] text-slate-300 font-body">Doctor-Verified 24–48h Reports</div>
                  </div>
                </div>
                <Link
                  href="/sleep-test"
                  className="px-3 py-1 bg-[#0F766E] hover:bg-[#0B5F58] text-white text-[11px] font-bold font-heading rounded-lg transition-colors"
                >
                  Details →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SleepTestPromo;
