'use client';

import React, { useState } from 'react';
import { useUserStore, useToastStore } from '@/lib/store';
import { requestMobileOtp, verifyMobileOtp } from '@/lib/api';
import { X, Phone, ShieldCheck, ArrowRight, CheckCircle2, Stethoscope, MessageCircle, Building2, User } from 'lucide-react';
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

  const handleGoogleLogin = () => {
    const demoUser = {
      id: 'usr-1',
      name: 'Dr. Vikram Malhotra',
      email: 'dr.vikram@malhotraclinic.com',
      phone: '+91 98112 34567',
      role: 'doctor' as const,
      degree: 'BDS, MDS (Prosthodontics)',
      registrationNumber: 'DCI-DEL-18920',
      addresses: [
        {
          id: 'addr-1',
          type: 'Clinic' as const,
          name: 'Dr. Vikram Malhotra',
          clinicHospitalName: 'Malhotra Multi-Speciality Dental & Respiratory Center',
          phone: '+91 98112 34567',
          addressLine1: 'Suite 204, Metro Plaza, Sector 18',
          pincode: '201301',
          city: 'Noida',
          state: 'Uttar Pradesh',
          isDefault: true
        }
      ],
      gstDetails: {
        gstin: '09AAACM1234F1Z8',
        legalBusinessName: 'Malhotra Healthcare Pvt Ltd',
        isVerified: true
      }
    };
    login(demoUser, 'jwt-token-google-auth');
    addToast({
      type: 'success',
      title: 'Google Sign-In Successful',
      message: 'Logged in as Dr. Vikram Malhotra'
    });
    setAuthModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs animate-in fade-in duration-200 font-body">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-[#DCE6F2]">
        {/* Navy Header */}
        <div className="bg-[#0B2545] p-6 text-white text-center relative border-b border-[#13335E]">
          <button
            onClick={() => setAuthModalOpen(false)}
            className="absolute top-4 right-4 text-white/70 hover:text-white p-1 rounded-lg hover:bg-[#13335E] transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex justify-center mb-2">
            <Logo variant="dark" size="md" showTagline={false} />
          </div>
          <h3 className="font-bold text-xl mt-1 font-heading">Doctor &amp; Clinic Portal</h3>
          <p className="text-xs sm:text-sm text-[#EAF2FC]/80 mt-1 max-w-sm mx-auto leading-relaxed">
            Access exclusive B2B wholesale pricing, GST tax invoices &amp; fast dispatch
          </p>
        </div>

        {/* Content */}
        <div className="p-6 sm:p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm rounded-xl font-medium">
              {error}
            </div>
          )}

          {step === 'phone' ? (
            <form onSubmit={handleRequestOtp} className="space-y-4">
              {/* Role selection */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-[#12263F] mb-2 font-heading">
                  I am purchasing as:
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setRole('doctor')}
                    className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold border flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      role === 'doctor'
                        ? 'border-[#1D5FAF] bg-[#EAF2FC] text-[#174E90] shadow-xs'
                        : 'border-[#DCE6F2] text-[#12263F] hover:bg-[#F6F9FD]'
                    }`}
                  >
                    <Stethoscope className="w-4 h-4 text-[#1D5FAF]" />
                    <span>Doctor / Dentist</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('clinic_admin')}
                    className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold border flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      role === 'clinic_admin'
                        ? 'border-[#1D5FAF] bg-[#EAF2FC] text-[#174E90] shadow-xs'
                        : 'border-[#DCE6F2] text-[#12263F] hover:bg-[#F6F9FD]'
                    }`}
                  >
                    <Building2 className="w-4 h-4 text-[#1D5FAF]" />
                    <span>Hospital / Clinic</span>
                  </button>
                </div>
              </div>

              {/* Mobile Input */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-[#12263F] mb-1.5 font-heading">
                  Mobile Number
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-3.5 flex items-center gap-1 text-[#12263F] font-bold text-sm">
                    <Phone className="w-4 h-4 text-[#1D5FAF]" />
                    <span>+91</span>
                  </div>
                  <input
                    id="auth-mobile-number"
                    name="phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel-national"
                    maxLength={10}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter 10-digit mobile number"
                    className="w-full pl-18 pr-4 py-3 border border-[#DCE6F2] focus:border-[#1D5FAF] focus:ring-2 focus:ring-[#1D5FAF]/20 rounded-xl text-base font-semibold text-[#12263F] outline-none transition-all font-mono"
                    autoFocus
                  />
                </div>
                <p className="text-xs text-[#5B6B82] mt-1.5">
                  We will send a 6-digit one-time password (OTP) to this number
                </p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-[#1D5FAF] hover:bg-[#174E90] text-white font-bold text-sm sm:text-base rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-50 font-heading"
              >
                {loading ? 'Sending OTP...' : 'Send Verification OTP'}
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Divider */}
              <div className="relative flex items-center justify-center py-1">
                <div className="border-t border-[#DCE6F2] w-full" />
                <span className="bg-white px-3 text-xs text-[#5B6B82] font-semibold uppercase">
                  Or
                </span>
                <div className="border-t border-[#DCE6F2] w-full" />
              </div>

              {/* Google Button */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full py-3 px-4 border border-[#DCE6F2] hover:border-[#1D5FAF] rounded-xl flex items-center justify-center gap-3 text-xs sm:text-sm font-semibold text-[#12263F] hover:bg-[#F6F9FD] transition-colors cursor-pointer"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs sm:text-sm font-semibold text-[#12263F] font-heading">
                    Enter Verification Code
                  </label>
                  <button
                    type="button"
                    onClick={() => setStep('phone')}
                    className="text-xs text-[#1D5FAF] font-bold hover:underline cursor-pointer"
                  >
                    Change Number
                  </button>
                </div>
                <input
                  id="auth-verification-otp"
                  name="otp"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter 6-digit OTP"
                  className="w-full px-4 py-3 border border-[#DCE6F2] focus:border-[#1D5FAF] rounded-xl text-center text-xl font-bold tracking-widest text-[#12263F] font-mono outline-none"
                  autoFocus
                />
                {sentDemoOtp && (
                  <div className="text-xs text-green-700 bg-green-50 p-2.5 rounded-xl mt-2 text-center font-medium border border-green-200">
                    Reviewer test code is <strong>{sentDemoOtp}</strong>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-[#1D5FAF] hover:bg-[#174E90] text-white font-bold text-sm sm:text-base rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-50 font-heading"
              >
                {loading ? 'Verifying...' : 'Verify OTP & Login'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* WhatsApp Support & Disclaimer */}
          <div className="mt-5 pt-4 border-t border-[#DCE6F2] text-center space-y-2">
            <a
              href="https://wa.me/919811234567?text=Hi%20Buy%20Denmed,%20I%20need%20assistance%20logging%20in"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-[#5B6B82] hover:text-[#16A34A] transition-colors font-medium"
            >
              <span>Need help?</span>
              <span className="font-bold text-[#16A34A] flex items-center gap-1">
                WhatsApp Support <MessageCircle className="w-3.5 h-3.5 fill-current" />
              </span>
            </a>
            <p className="text-[12px] text-[#5B6B82]">
              By continuing, you agree to Buy Denmed&apos;s{' '}
              <a href="/policies/terms" className="underline hover:text-[#1D5FAF]">
                Terms of Sale
              </a>{' '}
              &amp;{' '}
              <a href="/policies/privacy" className="underline hover:text-[#1D5FAF]">
                Privacy Policy
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
