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
      <div className="max-w-md w-full bg-white rounded-3xl border border-[#DCE6F2] shadow-xl overflow-hidden">
        <div className="bg-[#0B2545] p-6 text-center text-white space-y-2">
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
                      ? 'border-[#1D5FAF] bg-[#EAF2FC] text-[#174E90]'
                      : 'border-[#DCE6F2] text-[#12263F]'
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
                      ? 'border-[#1D5FAF] bg-[#EAF2FC] text-[#174E90]'
                      : 'border-[#DCE6F2] text-[#12263F]'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Hospital Admin
                </button>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#12263F] block mb-1">
                  Mobile Number (India)
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-xs font-bold text-[#5B6B82] border-r border-[#DCE6F2] pr-2">
                    +91
                  </span>
                  <input
                    type="tel"
                    maxLength={10}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    className="w-full text-sm font-bold pl-14 pr-4 py-2.5 border border-[#DCE6F2] rounded-xl focus:outline-none focus:border-[#1D5FAF] text-[#12263F]"
                  />
                </div>
              </div>

              {error && <div className="text-xs text-[#DC2626]">{error}</div>}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#1D5FAF] hover:bg-[#174E90] text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
              >
                <span>Continue with OTP</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerify} className="space-y-4">
              <div className="text-center text-xs text-[#5B6B82]">
                Enter code sent to <strong className="text-[#12263F]">+91 {phone}</strong>
              </div>

              <input
                type="text"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full text-center text-2xl font-mono font-bold tracking-[0.4em] py-3 border border-[#DCE6F2] rounded-xl focus:outline-none focus:border-[#1D5FAF] text-[#12263F]"
              />

              {error && <div className="text-xs text-[#DC2626] text-center">{error}</div>}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#1D5FAF] hover:bg-[#174E90] text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
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
