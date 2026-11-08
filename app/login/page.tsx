'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUserStore, useToastStore } from '@/lib/store';
import { requestMobileOtp, verifyMobileOtp } from '@/lib/api';
import Logo from '@/components/common/Logo';
import { ShieldCheck, Stethoscope, ArrowRight, CheckCircle2, Lock } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useUserStore();
  const { addToast } = useToastStore();

  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('9811234567');
  const [role, setRole] = useState<'doctor' | 'clinic_admin'>('doctor');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length !== 10) {
      setError('Please enter a 10-digit mobile number');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await requestMobileOtp(phone);
      if (res.success) {
        setOtp(res.demoOtp);
        setStep('otp');
        addToast({ type: 'info', title: 'OTP Sent', message: `Demo OTP: ${res.demoOtp}` });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await verifyMobileOtp(phone, otp);
      if (res.success && res.user && res.token) {
        login(res.user, res.token);
        addToast({ type: 'success', title: 'Welcome', message: 'Signed in successfully.' });
        router.push('/account');
      } else {
        setError('Invalid OTP code');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
        <div className="bg-[#1E293B] p-6 text-center text-white space-y-2">
          <div className="flex justify-center">
            <Logo variant="dark" size="sm" showTagline={false} />
          </div>
          <h1 className="text-xl font-black">Doctor & Clinic Portal</h1>
          <p className="text-xs text-slate-300">
            Sign in with mobile OTP to access wholesale pricing and orders
          </p>
        </div>

        <div className="p-6 sm:p-8">
          {step === 'phone' ? (
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole('doctor')}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition-all ${
                    role === 'doctor'
                      ? 'border-[#0F766E] bg-teal-50 text-[#0F766E]'
                      : 'border-slate-200 text-slate-700'
                  }`}
                >
                  <Stethoscope className="w-3.5 h-3.5" />
                  Doctor / Dentist
                </button>
                <button
                  type="button"
                  onClick={() => setRole('clinic_admin')}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition-all ${
                    role === 'clinic_admin'
                      ? 'border-[#0F766E] bg-teal-50 text-[#0F766E]'
                      : 'border-slate-200 text-slate-700'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Hospital Admin
                </button>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Mobile Number (India)
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-xs font-bold text-slate-500 border-r border-slate-200 pr-2">
                    +91
                  </span>
                  <input
                    type="tel"
                    maxLength={10}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    className="w-full text-sm font-bold pl-14 pr-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:border-[#0F766E]"
                  />
                </div>
              </div>

              {error && <div className="text-xs text-red-600">{error}</div>}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#0F766E] hover:bg-[#0B5F58] text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
              >
                <span>Continue with OTP</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerify} className="space-y-4">
              <div className="text-center text-xs text-slate-500">
                Enter code sent to <strong>+91 {phone}</strong>
              </div>

              <input
                type="text"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full text-center text-2xl font-mono font-bold tracking-[0.4em] py-3 border border-slate-300 rounded-xl focus:outline-none focus:border-[#0F766E]"
              />

              {error && <div className="text-xs text-red-600 text-center">{error}</div>}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#0F766E] hover:bg-[#0B5F58] text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Verify & Enter Store</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
