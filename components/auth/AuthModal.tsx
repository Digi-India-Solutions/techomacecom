'use client';

import React, { useState } from 'react';
import { useUserStore, useToastStore } from '@/lib/store';
import { requestMobileOtp, verifyMobileOtp } from '@/lib/api';
import { X, Phone, ShieldCheck, ArrowRight, CheckCircle2, Stethoscope } from 'lucide-react';
import Logo from '@/components/common/Logo';

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, setAuthModalOpen, login } = useUserStore();
  const { addToast } = useToastStore();

  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('9811234567');
  const [role, setRole] = useState<'doctor' | 'clinic_admin' | 'procurement' | 'individual'>('doctor');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sentDemoOtp, setSentDemoOtp] = useState('');

  if (!isAuthModalOpen) return null;

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phone.trim().replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      setError('Please enter a valid 10-digit Indian mobile number');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const res = await requestMobileOtp(cleanPhone);
      if (res.success) {
        setSentDemoOtp(res.demoOtp);
        setOtp(res.demoOtp); // pre-populate demo OTP for smooth reviewer experience
        setStep('otp');
        addToast({
          type: 'info',
          title: 'OTP Sent',
          message: `Verification code sent to +91 ${cleanPhone}. Demo code: ${res.demoOtp}`
        });
      }
    } catch {
      setError('Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 4) {
      setError('Please enter the 6-digit OTP code');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const res = await verifyMobileOtp(phone, otp);
      if (res.success && res.user && res.token) {
        login(res.user, res.token);
        addToast({
          type: 'success',
          title: 'Authentication Successful',
          message: res.message || 'Logged in to Buy Denmed account'
        });
        setAuthModalOpen(false);
      } else {
        setError(res.message || 'Invalid OTP code');
      }
    } catch {
      setError('Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
        {/* Slate Header */}
        <div className="bg-[#1E293B] p-6 text-white text-center relative">
          <button
            onClick={() => setAuthModalOpen(false)}
            className="absolute top-4 right-4 text-gray-400 hover:text-white p-1"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex justify-center mb-2">
            <Logo variant="dark" size="sm" showTagline={false} />
          </div>
          <h3 className="font-bold text-lg mt-1 font-heading">Doctor & Clinic Portal</h3>
          <p className="text-xs text-gray-300 mt-1">
            Access exclusive B2B wholesale pricing, GST tax invoices & fast dispatch
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 'phone' ? (
            <form onSubmit={handleRequestOtp} className="space-y-4">
              {/* Role selection */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  I am purchasing as:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('doctor')}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold border flex items-center justify-center gap-1.5 transition-all ${
                      role === 'doctor'
                        ? 'border-[#0F766E] bg-teal-50 text-[#0F766E]'
                        : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Stethoscope className="w-3.5 h-3.5" />
                    Doctor / Dentist
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('clinic_admin')}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold border flex items-center justify-center gap-1.5 transition-all ${
                      role === 'clinic_admin'
                        ? 'border-[#0F766E] bg-teal-50 text-[#0F766E]'
                        : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Hospital / Clinic Admin
                  </button>
                </div>
              </div>

              {/* Phone input */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Mobile Number (India)
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-3 flex items-center gap-1 text-gray-500 font-semibold text-sm border-r border-gray-200 pr-2">
                    <span>🇮🇳</span>
                    <span>+91</span>
                  </div>
                  <input
                    type="tel"
                    maxLength={10}
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value.replace(/\D/g, ''));
                      setError('');
                    }}
                    placeholder="98765 43210"
                    className="w-full text-base font-semibold pl-20 pr-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:border-[#0F766E] tracking-wide"
                    autoFocus
                  />
                </div>
              </div>

              {error && (
                <div className="text-xs text-red-600 font-medium">{error}</div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#0F766E] hover:bg-[#0B5F58] text-white font-semibold text-sm rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
              >
                {loading ? 'Sending verification code...' : 'Continue with OTP'}
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="text-[11px] text-gray-400 text-center leading-relaxed">
                By continuing, you agree to Buy Denmed’s <span className="underline">Terms of Service</span> and <span className="underline">Privacy Policy</span>.
              </div>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="text-center">
                <div className="text-xs text-gray-500">
                  Enter the 6-digit verification code sent to
                </div>
                <div className="font-bold text-gray-800 text-sm mt-0.5">
                  +91 {phone}
                  <button
                    type="button"
                    onClick={() => setStep('phone')}
                    className="ml-2 text-xs text-[#0F766E] underline font-normal"
                  >
                    Change
                  </button>
                </div>
              </div>

              {sentDemoOtp && (
                <div className="p-2.5 bg-teal-50 border border-teal-200 rounded-lg text-xs text-[#0F766E] text-center font-medium">
                  Demo auto-filled code: <strong>{sentDemoOtp}</strong>
                </div>
              )}

              <div>
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => {
                    setOtp(e.target.value.replace(/\D/g, ''));
                    setError('');
                  }}
                  placeholder="• • • • • •"
                  className="w-full text-center text-2xl font-bold tracking-[0.5em] py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-[#0F766E]"
                  autoFocus
                />
              </div>

              {error && (
                <div className="text-xs text-red-600 text-center font-medium">{error}</div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#0F766E] hover:bg-[#0B5F58] text-white font-semibold text-sm rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
              >
                {loading ? 'Verifying...' : 'Verify & Enter Clinic Store'}
                <CheckCircle2 className="w-4 h-4" />
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={handleRequestOtp}
                  className="text-xs text-gray-500 hover:text-[#0F766E] transition-colors"
                >
                  Didn’t receive the code? <strong>Resend OTP</strong>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
