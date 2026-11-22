'use client';

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { X, Star, Upload, Trash2, CheckCircle2, Loader2, LogIn, ShieldCheck, Info } from 'lucide-react';
import { useUserStore, useToastStore } from '@/lib/store';
import { ApiClientError } from '@/lib/api/backend';
import { getMyReview, submitReview, uploadReviewPhoto, type MyReview } from '@/lib/api/reviews';
// Mobile-OTP review verification is switched off — writing a review now needs a signed-in account.
// import { sendReviewOtp, verifyReviewOtp } from '@/lib/api';

interface WriteReviewModalProps {
  productId: string;
  productName: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (review?: MyReview) => void;
}

const RATING_LABELS = ['Select rating', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];
const MAX_PHOTOS = 3;
const MAX_PHOTO_MB = 8;
const MIN_COMMENT = 20;
const MAX_COMMENT = 600;

interface Photo {
  path: string;
  url: string;
}

/**
 * Write / edit a product review.
 *   signed out → "Sign in to write a review" (opens the sign-in modal)
 *   signed in  → form prefilled with the customer's existing review (one per product)
 *   submit     → POST /reviews → "pending" until staff approve it
 */
export const WriteReviewModal: React.FC<WriteReviewModalProps> = (props) =>
  // Mounted only while open, so every opening starts with fresh state
  props.isOpen ? <WriteReviewModalBody {...props} /> : null;

const WriteReviewModalBody: React.FC<WriteReviewModalProps> = ({ productId, productName, onClose, onSuccess }) => {
  const { user, isAuthenticated, setAuthModalOpen } = useUserStore();
  const { addToast } = useToastStore();

  const [step, setStep] = useState<'form' | 'done'>('form');
  const [loadingExisting, setLoadingExisting] = useState(isAuthenticated);
  const [needsLogin, setNeedsLogin] = useState(!isAuthenticated);
  const [existing, setExisting] = useState<MyReview | null>(null);
  const [verifiedBuyer, setVerifiedBuyer] = useState(false);

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [uploading, setUploading] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [resultMessage, setResultMessage] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);

  // Load the customer's own review (prefill) each time the modal opens while signed in
  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    getMyReview(productId)
      .then(({ review, verifiedBuyer: vb }) => {
        if (cancelled) return;
        setExisting(review);
        setVerifiedBuyer(vb || Boolean(review?.isVerifiedBuyer));
        setRating(review?.rating || 0);
        setName(review?.name || user?.name || '');
        setTitle(review?.title || '');
        setComment(review?.comment || '');
        setPhotos(
          review ? review.imagePaths.map((path, i) => ({ path, url: review.images?.[i] || path })) : []
        );
      })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof ApiClientError && err.status === 401) {
          setNeedsLogin(true); // session expired — local store still said "signed in"
        } else if (err instanceof ApiClientError && (err.status === 404 || err.status === 422)) {
          setErrorMsg('This product is not available for reviews right now.');
        } else {
          // Prefill failed, the form still works
          setExisting(null);
          setName(user?.name || '');
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingExisting(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, productId, user?.name]);

  const handleClose = () => onClose();

  const openSignIn = () => {
    onClose();
    setAuthModalOpen(true);
  };

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = ''; // allow picking the same file again
    if (!files.length) return;
    const room = MAX_PHOTOS - photos.length - uploading;
    if (room <= 0) {
      addToast({ type: 'warning', title: 'Limit reached', message: `Maximum ${MAX_PHOTOS} photos per review.` });
      return;
    }
    const accepted = files.slice(0, room).filter((f) => {
      if (!f.type.startsWith('image/')) {
        addToast({ type: 'error', title: 'Not an image', message: `"${f.name}" is not an image file.` });
        return false;
      }
      if (f.size > MAX_PHOTO_MB * 1024 * 1024) {
        addToast({ type: 'error', title: 'Photo too large', message: `"${f.name}" is over ${MAX_PHOTO_MB} MB.` });
        return false;
      }
      return true;
    });
    if (files.length > room) {
      addToast({ type: 'warning', title: 'Limit reached', message: `Only ${MAX_PHOTOS} photos are allowed per review.` });
    }

    for (const file of accepted) {
      setUploading((n) => n + 1);
      try {
        const photo = await uploadReviewPhoto(file);
        setPhotos((prev) => [...prev, photo].slice(0, MAX_PHOTOS));
      } catch (err) {
        if (err instanceof ApiClientError && err.status === 401) {
          setNeedsLogin(true);
          return;
        }
        addToast({
          type: 'error',
          title: 'Upload failed',
          message: err instanceof Error ? err.message : 'Could not upload the photo.',
        });
      } finally {
        setUploading((n) => n - 1);
      }
    }
  };

  const removePhoto = (index: number) => setPhotos((prev) => prev.filter((_, i) => i !== index));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const errors: Record<string, string> = {};
    if (rating < 1) errors.rating = 'Please select a star rating.';
    if (name.trim().length < 2) errors.name = 'Please enter your name.';
    if (comment.trim().length < MIN_COMMENT) errors.comment = `Please write at least ${MIN_COMMENT} characters.`;
    setFieldErrors(errors);
    if (Object.keys(errors).length) return;
    if (uploading) {
      setErrorMsg('Please wait until the photos finish uploading.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await submitReview({
        productId,
        name,
        rating,
        title,
        comment,
        images: photos.map((p) => p.path),
      });
      setResultMessage(res.message);
      setExisting(res.review);
      setStep('done');
      onSuccess?.(res.review);
    } catch (err) {
      if (err instanceof ApiClientError) {
        if (err.status === 401) {
          setNeedsLogin(true);
          return;
        }
        if (err.fields) setFieldErrors(err.fields);
        setErrorMsg(err.message);
      } else {
        setErrorMsg('Failed to submit the review. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputBase =
    'w-full px-3.5 py-2.5 text-xs sm:text-sm font-body rounded-xl border bg-[#F6F9FD] focus:bg-white focus:border-[#1D5FAF] focus:outline-none text-[#12263F]';
  const border = (field: string) => (fieldErrors[field] ? 'border-[#DC2626]' : 'border-[#DCE6F2]');
  const commentLength = comment.trim().length;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="write-review-title"
    >
      <div className="relative w-full max-w-lg max-h-[92vh] overflow-y-auto bg-white rounded-3xl shadow-2xl border border-[#DCE6F2] animate-in fade-in">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-[#13335E] bg-[#0B2545] text-white">
          <div className="min-w-0">
            <h3 id="write-review-title" className="font-heading font-bold text-base">
              {existing ? 'Edit Your Review' : 'Write a Customer Review'}
            </h3>
            <p className="text-[12px] text-slate-300 font-body truncate max-w-xs">{productName}</p>
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

        <div className="p-6">
          {/* Signed out */}
          {needsLogin && (
            <div className="text-center py-6 space-y-4">
              <div className="w-14 h-14 bg-[#EAF2FC] text-[#174E90] rounded-full flex items-center justify-center mx-auto">
                <LogIn className="w-7 h-7" />
              </div>
              <div className="space-y-1.5">
                <h4 className="font-heading font-bold text-base text-[#12263F]">Sign in to write a review</h4>
                <p className="text-xs text-[#5B6B82] font-body max-w-sm mx-auto leading-relaxed">
                  Only signed-in customers can review products. This keeps reviews genuine — buyers who received
                  this product get a <strong>Verified Buyer</strong> badge automatically.
                </p>
              </div>
              <button
                type="button"
                onClick={openSignIn}
                className="px-6 py-2.5 bg-[#1D5FAF] hover:bg-[#174E90] text-white font-bold font-heading text-xs sm:text-sm rounded-xl shadow-md transition-colors"
              >
                Sign in / Create account
              </button>
            </div>
          )}

          {!needsLogin && step === 'form' && loadingExisting && (
            <div className="flex items-center justify-center gap-2 py-12 text-xs text-[#5B6B82] font-body">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading…
            </div>
          )}

          {!needsLogin && step === 'form' && !loadingExisting && (
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {existing && (
                <div
                  className={`flex gap-2 rounded-xl border px-3.5 py-2.5 text-[12px] font-body ${
                    existing.status === 'rejected'
                      ? 'border-red-200 bg-red-50 text-red-700'
                      : 'border-[#DCE6F2] bg-[#F6F9FD] text-[#12263F]'
                  }`}
                >
                  <Info className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    {existing.status === 'pending' && 'Your review is waiting for moderation. '}
                    {existing.status === 'approved' && 'Your review is live. '}
                    {existing.status === 'rejected' &&
                      `Your review was not published${existing.rejectionReason ? `: ${existing.rejectionReason}` : ''}. `}
                    Saving changes sends it for moderation again.
                  </span>
                </div>
              )}
              {verifiedBuyer && (
                <p className="inline-flex items-center gap-1 text-[12px] text-[#16A34A] bg-green-50 px-2.5 py-1 rounded-full font-heading font-semibold border border-green-200/50">
                  <ShieldCheck className="w-3.5 h-3.5" /> Your review will show a Verified Buyer badge
                </p>
              )}

              {/* Star rating */}
              <div>
                <label className="text-xs font-bold font-heading text-[#12263F] block mb-1">
                  Overall Rating <span className="text-[#DC2626]">*</span>
                </label>
                <div className="flex items-center gap-2" role="radiogroup" aria-label="Star rating">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => {
                      const active = hoverRating ? star <= hoverRating : star <= rating;
                      return (
                        <button
                          key={star}
                          type="button"
                          role="radio"
                          aria-checked={rating === star}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          onClick={() => {
                            setRating(star);
                            setFieldErrors(({ rating: _r, ...rest }) => rest);
                          }}
                          className="p-1 text-[#DCE6F2] hover:text-[#F5B841] transition-colors focus:outline-none"
                          aria-label={`${star} star${star === 1 ? '' : 's'}`}
                        >
                          <Star className={`w-7 h-7 ${active ? 'text-[#F5B841] fill-[#F5B841]' : 'text-[#DCE6F2]'}`} />
                        </button>
                      );
                    })}
                  </div>
                  <span className="text-xs font-bold font-heading text-[#1D5FAF] ml-2">
                    {RATING_LABELS[hoverRating || rating]}
                  </span>
                </div>
                {fieldErrors.rating && <p className="mt-1 text-[12px] text-[#DC2626]">{fieldErrors.rating}</p>}
              </div>

              {/* Name */}
              <div>
                <label htmlFor="review-author-name" className="text-xs font-bold font-heading text-[#12263F] block mb-1">
                  Name shown on the review <span className="text-[#DC2626]">*</span>
                </label>
                <input
                  id="review-author-name"
                  name="authorName"
                  type="text"
                  maxLength={80}
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Dr. Rajesh Sharma"
                  className={`${inputBase} ${border('name')}`}
                />
                {fieldErrors.name && <p className="mt-1 text-[12px] text-[#DC2626]">{fieldErrors.name}</p>}
              </div>

              {/* Title */}
              <div>
                <label htmlFor="review-headline-title" className="text-xs font-bold font-heading text-[#12263F] block mb-1">
                  Headline / Title <span className="text-[#5B6B82] font-normal font-body">(Optional)</span>
                </label>
                <input
                  id="review-headline-title"
                  name="reviewTitle"
                  type="text"
                  maxLength={150}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Summarize your experience"
                  className={`${inputBase} ${border('title')}`}
                />
                {fieldErrors.title && <p className="mt-1 text-[12px] text-[#DC2626]">{fieldErrors.title}</p>}
              </div>

              {/* Comment */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="review-comment" className="text-xs font-bold font-heading text-[#12263F]">
                    Your Review <span className="text-[#DC2626]">*</span>
                  </label>
                  <span
                    className={`text-[12px] font-mono ${
                      commentLength < MIN_COMMENT ? 'text-[#5B6B82]' : 'text-[#16A34A] font-bold'
                    }`}
                  >
                    {comment.length}/{MAX_COMMENT} (min {MIN_COMMENT})
                  </span>
                </div>
                <textarea
                  id="review-comment"
                  rows={4}
                  maxLength={MAX_COMMENT}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="What did you like or dislike? How does it perform in your practice or home care?"
                  className={`${inputBase} ${border('comment')} resize-none`}
                />
                {fieldErrors.comment && <p className="mt-1 text-[12px] text-[#DC2626]">{fieldErrors.comment}</p>}
              </div>

              {/* Photos */}
              <div>
                <label className="text-xs font-bold font-heading text-[#12263F] block mb-1">
                  Add Photos <span className="text-[#5B6B82] font-normal font-body">(Optional, max {MAX_PHOTOS})</span>
                </label>
                <div className="flex flex-wrap items-center gap-2.5">
                  {photos.map((photo, i) => (
                    <div key={photo.path} className="relative w-16 h-16 rounded-xl border border-[#DCE6F2] overflow-hidden group">
                      <Image src={photo.url} alt={`Review photo ${i + 1}`} fill sizes="64px" unoptimized className="object-cover" />
                      <button
                        type="button"
                        onClick={() => removePhoto(i)}
                        className="absolute inset-0 bg-black/50 text-white opacity-0 group-hover:opacity-100 focus:opacity-100 flex items-center justify-center transition-opacity"
                        aria-label={`Remove photo ${i + 1}`}
                      >
                        <Trash2 className="w-4 h-4 text-red-300" />
                      </button>
                    </div>
                  ))}
                  {Array.from({ length: uploading }).map((_, i) => (
                    <div
                      key={`up-${i}`}
                      className="w-16 h-16 rounded-xl border border-[#DCE6F2] bg-[#F6F9FD] flex items-center justify-center"
                    >
                      <Loader2 className="w-5 h-5 animate-spin text-[#1D5FAF]" />
                    </div>
                  ))}
                  {photos.length + uploading < MAX_PHOTOS && (
                    <button
                      type="button"
                      onClick={() => fileInput.current?.click()}
                      className="w-16 h-16 rounded-xl border-2 border-dashed border-[#DCE6F2] hover:border-[#1D5FAF] bg-[#F6F9FD] flex flex-col items-center justify-center cursor-pointer transition-colors text-[#5B6B82] hover:text-[#1D5FAF]"
                    >
                      <Upload className="w-5 h-5 mb-0.5" />
                      <span className="text-[10px] font-bold font-heading">Add Photo</span>
                    </button>
                  )}
                  <input
                    ref={fileInput}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                    multiple
                    className="hidden"
                    onChange={handlePhotoSelect}
                  />
                </div>
                {fieldErrors.images && <p className="mt-1 text-[12px] text-[#DC2626]">{fieldErrors.images}</p>}
              </div>

              {errorMsg && (
                <p className="text-xs text-[#DC2626] font-body" role="alert">
                  {errorMsg}
                </p>
              )}

              <button
                type="submit"
                disabled={isSubmitting || uploading > 0}
                className="w-full py-3 bg-[#1D5FAF] hover:bg-[#174E90] disabled:opacity-60 text-white font-bold font-heading text-xs sm:text-sm rounded-xl shadow-md transition-all active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{isSubmitting ? 'Submitting…' : existing ? 'Update Review' : 'Submit Review'}</span>
              </button>
              <p className="text-center text-[11px] text-[#5B6B82] font-body">
                Reviews are published after a quick check by our team.
              </p>
            </form>
          )}

          {!needsLogin && step === 'done' && (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 bg-green-100 text-[#16A34A] rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div className="space-y-1.5">
                <h4 className="font-heading font-bold text-lg text-[#12263F]">Thank you for your review!</h4>
                <p className="text-xs text-[#5B6B82] font-body leading-relaxed max-w-sm mx-auto">
                  {resultMessage || 'It will be visible on the product page after moderation.'}
                </p>
              </div>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-6 py-2.5 bg-[#0B2545] hover:bg-[#13335E] text-white font-bold font-heading text-xs rounded-xl transition-colors"
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
