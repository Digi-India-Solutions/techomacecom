'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { 
  X, 
  Star, 
  Upload, 
  Trash2, 
  CheckCircle2, 
  ArrowRight, 
  Phone, 
  ShieldCheck, 
  Clock 
} from 'lucide-react';
import { useUserStore, useToastStore } from '@/lib/store';
import { sendReviewOtp, verifyReviewOtp, submitReview } from '@/lib/api';

interface WriteReviewModalProps {
  productId: string;
  productName: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const RATING_LABELS = ['Select rating', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

export const WriteReviewModal: React.FC<WriteReviewModalProps> = ({
  productId,
  productName,
  isOpen,
  onClose,
  onSuccess
}) => {
  const { user, isAuthenticated } = useUserStore();
  const { addToast } = useToastStore();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [name, setName] = useState(user?.name || '');
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [images, setImages] = useState<string[]>([]);

  // Step 2: Mobile OTP verification
  const [mobile, setMobile] = useState(user?.phone || '');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [resendTimer, setResendTimer] = useState(30);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Resend OTP countdown
  useEffect(() => {
    if (!otpSent || resendTimer <= 0) return;
    const interval = setInterval(() => {
      setResendTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [otpSent, resendTimer]);

  if (!isOpen) return null;

  // Handle image upload simulation
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    if (images.length + files.length > 3) {
      addToast({ type: 'warning', title: 'Limit Reached', message: 'Maximum 3 photos allowed per review.' });
      return;
    }

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result) {
          setImages((prev) => [...prev, reader.result as string].slice(0, 3));
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Step 1 Validation & Proceed
  const handleProceedToStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (rating < 1) {
      setErrorMsg('Please select a star rating.');
      return;
    }
    if (!name.trim()) {
      setErrorMsg('Please enter your full name.');
      return;
    }
    if (comment.trim().length < 20) {
      setErrorMsg('Please write at least 20 characters in your review feedback.');
      return;
    }

    // If already logged in, skip OTP step directly to submit
    if (isAuthenticated && user?.phone) {
      handleFinalSubmission(user.phone);
      return;
    }

    setStep(2);
  };

  // Send OTP
  const handleSendOtp = async () => {
    setErrorMsg('');
    const cleanMobile = mobile.replace(/\D/g, '');
    if (!/^[6-9]\d{9}$/.test(cleanMobile)) {
      setErrorMsg('Enter a valid 10-digit Indian mobile number (e.g. 9811234567)');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await sendReviewOtp(cleanMobile);
      setOtpSent(true);
      setResendTimer(30);
      addToast({
        type: 'info',
        title: 'OTP Sent',
        message: res.message
      });
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to send OTP.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Verify OTP and Submit Review
  const handleVerifyAndSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const cleanMobile = mobile.replace(/\D/g, '');

    if (!otp.trim() || otp.trim().length < 6) {
      setErrorMsg('Please enter the 6-digit OTP code.');
      return;
    }

    setIsSubmitting(true);
    try {
      await verifyReviewOtp(cleanMobile, otp);
      await handleFinalSubmission(cleanMobile);
    } catch (err: any) {
      setErrorMsg(err.message || 'Verification failed. Use 123456 as the test code.');
      setIsSubmitting(false);
    }
  };

  const handleFinalSubmission = async (verifiedMobile: string) => {
    setIsSubmitting(true);
    try {
      await submitReview({
        productId,
        name: name.trim(),
        mobile: verifiedMobile,
        rating,
        title: title.trim() || undefined,
        comment: comment.trim(),
        images,
        isVerifiedBuyer: true
      });

      setStep(3);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit review.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setErrorMsg('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 select-none">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden animate-in fade-in">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700 bg-[#1E293B] text-white">
          <div>
            <h3 className="font-heading font-bold text-base">Write a Customer Review</h3>
            <p className="text-[11px] text-slate-300 font-body truncate max-w-xs">{productName}</p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {/* ========================================================
              STEP 1: RATING, DETAILS & FEEDBACK
              ======================================================== */}
          {step === 1 && (
            <form onSubmit={handleProceedToStep2} className="space-y-4">
              {/* Star Rating Selector */}
              <div>
                <label className="text-xs font-bold font-heading text-slate-700 block mb-1">
                  Overall Rating <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => {
                      const active = hoverRating ? star <= hoverRating : star <= rating;
                      return (
                        <button
                          key={star}
                          type="button"
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          onClick={() => setRating(star)}
                          className="p-1 text-slate-300 hover:text-amber-400 transition-colors focus:outline-none"
                          aria-label={`${star} star`}
                        >
                          <Star
                            className={`w-7 h-7 ${
                              active ? 'text-amber-400 fill-amber-400' : 'text-slate-300'
                            }`}
                          />
                        </button>
                      );
                    })}
                  </div>
                  <span className="text-xs font-bold font-heading text-[#0F766E] ml-2">
                    {RATING_LABELS[hoverRating || rating]}
                  </span>
                </div>
              </div>

              {/* Full Name */}
              <div>
                <label className="text-xs font-bold font-heading text-gray-700 block mb-1">
                  Your Full Name / Clinic Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Dr. Rajesh Sharma"
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm font-body rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-[#FF6B00] focus:outline-none"
                />
              </div>

              {/* Review Title */}
              <div>
                <label className="text-xs font-bold font-heading text-gray-700 block mb-1">
                  Headline / Title <span className="text-gray-400 font-normal font-body">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Summarize your clinical experience or product performance"
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm font-body rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-[#FF6B00] focus:outline-none"
                />
              </div>

              {/* Review Comment with Live Counter */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold font-heading text-gray-700">
                    Your Review <span className="text-red-500">*</span>
                  </label>
                  <span
                    className={`text-[11px] font-mono ${
                      comment.length < 20 || comment.length > 600
                        ? 'text-gray-400'
                        : 'text-green-600 font-bold'
                    }`}
                  >
                    {comment.length}/600 chars (min 20)
                  </span>
                </div>
                <textarea
                  rows={4}
                  maxLength={600}
                  required
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="What did you like or dislike? How does it perform in your daily practice or home care?"
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm font-body rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-[#FF6B00] focus:outline-none resize-none"
                />
              </div>

              {/* Photo Upload (Max 3) */}
              <div>
                <label className="text-xs font-bold font-heading text-gray-700 block mb-1">
                  Add Photos <span className="text-gray-400 font-normal font-body">(Optional, max 3)</span>
                </label>
                <div className="flex items-center gap-2.5">
                  {images.map((img, i) => (
                    <div key={i} className="relative w-16 h-16 rounded-xl border border-gray-200 overflow-hidden group">
                      <Image
                        src={img}
                        alt={`Review preview ${i + 1}`}
                        fill
                        className="object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(i)}
                        className="absolute inset-0 bg-black/50 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  ))}

                  {images.length < 3 && (
                    <label className="w-16 h-16 rounded-xl border-2 border-dashed border-gray-300 hover:border-[#FF6B00] bg-gray-50 flex flex-col items-center justify-center cursor-pointer transition-colors text-gray-400 hover:text-[#FF6B00]">
                      <Upload className="w-5 h-5 mb-0.5" />
                      <span className="text-[9px] font-bold font-heading">Add Photo</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={handleImageUpload}
                      />
                    </label>
                  )}
                </div>
              </div>

              {errorMsg && (
                <p className="text-xs text-red-500 font-body">{errorMsg}</p>
              )}

              {/* Continue button */}
              <button
                type="submit"
                className="w-full py-3 bg-[#0F766E] hover:bg-[#0B5F58] text-white font-bold font-heading text-xs sm:text-sm rounded-xl shadow-md transition-all active:scale-98 flex items-center justify-center gap-2"
              >
                <span>Continue to Verification</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* ========================================================
              STEP 2: MOBILE NUMBER & OTP VERIFICATION
              ======================================================== */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="text-center space-y-1 mb-2">
                <div className="w-11 h-11 bg-teal-50 text-[#0F766E] rounded-full flex items-center justify-center mx-auto mb-2">
                  <Phone className="w-5 h-5" />
                </div>
                <h4 className="font-heading font-bold text-base text-slate-900">
                  Verify Your Mobile Number
                </h4>
                <p className="text-xs text-slate-500 font-body">
                  To prevent fake reviews, please verify your 10-digit mobile number with OTP. Your number is never shown publicly.
                </p>
              </div>

              {!otpSent ? (
                /* Step 2A: Enter Mobile & Send OTP */
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold font-heading text-slate-700 block mb-1">
                      Indian Mobile Number <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold font-heading text-slate-400">
                        +91
                      </span>
                      <input
                        type="tel"
                        maxLength={10}
                        value={mobile}
                        onChange={(e) => setMobile(e.target.value)}
                        placeholder="10-digit mobile number"
                        className="w-full pl-12 pr-4 py-2.5 text-xs sm:text-sm font-body rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#0F766E] focus:outline-none"
                      />
                    </div>
                  </div>

                  {errorMsg && <p className="text-xs text-red-500 font-body">{errorMsg}</p>}

                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={handleSendOtp}
                    className="w-full py-3 bg-[#0F766E] hover:bg-[#0B5F58] disabled:opacity-60 text-white font-bold font-heading text-xs sm:text-sm rounded-xl shadow-md transition-all active:scale-98"
                  >
                    {isSubmitting ? 'Sending OTP...' : 'Send OTP via SMS'}
                  </button>

                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="w-full text-center text-xs text-slate-500 font-body hover:underline"
                  >
                    ← Back to review details
                  </button>
                </div>
              ) : (
                /* Step 2B: Enter 6-digit OTP */
                <form onSubmit={handleVerifyAndSubmit} className="space-y-3.5">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold font-heading text-slate-700">
                        Enter 6-Digit OTP
                      </label>
                      <span className="text-[11px] text-slate-400 font-body">Sent to +91 {mobile}</span>
                    </div>
                    <input
                      type="text"
                      maxLength={6}
                      required
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="Enter 6-digit code (use 123456)"
                      className="w-full text-center tracking-widest text-lg font-mono py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#0F766E] focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs font-body">
                    <span className="text-slate-400">Didn&apos;t receive code?</span>
                    {resendTimer > 0 ? (
                      <span className="text-slate-400 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        Resend in {resendTimer}s
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        className="text-[#0F766E] font-bold font-heading hover:underline"
                      >
                        Resend OTP
                      </button>
                    )}
                  </div>

                  {errorMsg && <p className="text-xs text-red-500 font-body">{errorMsg}</p>}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 bg-[#0F766E] hover:bg-[#0B5F58] disabled:opacity-60 text-white font-bold font-heading text-xs sm:text-sm rounded-xl shadow-md transition-all active:scale-98"
                  >
                    {isSubmitting ? 'Verifying & Submitting...' : 'Verify & Submit Review'}
                  </button>

                  <button
                    type="button"
                    onClick={() => setOtpSent(false)}
                    className="w-full text-center text-xs text-gray-500 font-body hover:underline"
                  >
                    Change mobile number
                  </button>
                </form>
              )}
            </div>
          )}

          {/* ========================================================
              STEP 3: SUCCESS STATE
              ======================================================== */}
          {step === 3 && (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 bg-green-100 text-[#16A34A] rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div className="space-y-1.5">
                <h4 className="font-heading font-bold text-lg text-gray-900">
                  Thank you! Your review has been submitted
                </h4>
                <p className="text-xs text-gray-500 font-body leading-relaxed max-w-sm mx-auto">
                  Your feedback has been received and will be visible on the product page after brief admin moderation.
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-6 py-2.5 bg-[#2B2B2B] hover:bg-black text-white font-bold font-heading text-xs rounded-xl transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WriteReviewModal;
