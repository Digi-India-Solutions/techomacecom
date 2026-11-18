'use client';

import React, { useRef, useState } from 'react';
import { BadgeCheck, Calendar, Camera, Loader2, LogOut, ShieldCheck, Trash2, User as UserIcon } from 'lucide-react';
import type { User } from '@/types';
import { useToastStore, useUserStore } from '@/lib/store';
import { removeAvatar, uploadAvatar } from '@/lib/api/account';
import { errorMessage } from '@/lib/api/backend';
import { formatMobile } from '@/lib/india';
import { CUSTOMER_TYPE_LABEL, formatDate } from './ui';

const MAX_PHOTO_MB = 10;

function initialsOf(name: string) {
  return name
    .replace(/^Dr\.?\s*/i, '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
}

/** Account page header: photo (upload / remove), name, badges, contact and sign-out. */
export default function ProfileHeader({ user, onSignOut }: { user: User; onSignOut: () => void }) {
  const { setUser } = useUserStore();
  const { addToast } = useToastStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<'upload' | 'remove' | null>(null);
  const [imgFailed, setImgFailed] = useState<string | null>(null);

  const initials = initialsOf(user.name || '');
  const showPhoto = Boolean(user.avatarUrl) && imgFailed !== user.avatarUrl;

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > MAX_PHOTO_MB * 1024 * 1024) {
      addToast({ type: 'error', title: 'Photo too large', message: `Choose an image under ${MAX_PHOTO_MB} MB.` });
      return;
    }
    setBusy('upload');
    try {
      const res = await uploadAvatar(file);
      setUser(res.user);
      addToast({ type: 'success', title: 'Photo updated', message: 'Your new profile photo is saved.' });
    } catch (err) {
      addToast({ type: 'error', title: 'Could not upload photo', message: errorMessage(err) });
    } finally {
      setBusy(null);
    }
  };

  const onRemove = async () => {
    setBusy('remove');
    try {
      const res = await removeAvatar();
      setUser(res.user);
      addToast({ type: 'info', title: 'Photo removed', message: 'Your initials will be shown instead.' });
    } catch (err) {
      addToast({ type: 'error', title: 'Could not remove photo', message: errorMessage(err) });
    } finally {
      setBusy(null);
    }
  };

  return (
    <section className="bg-white rounded-2xl border border-[#DCE6F2] p-5 sm:p-6 mb-6 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
      <div className="flex items-center gap-4 min-w-0">
        <div className="relative shrink-0">
          <div className="w-16 h-16 sm:w-[72px] sm:h-[72px] rounded-full bg-[#0B2545] text-white flex items-center justify-center text-xl font-semibold overflow-hidden">
            {showPhoto ? (
              // eslint-disable-next-line @next/next/no-img-element -- tiny 256px WebP from our API or a Google photo
              <img
                src={user.avatarUrl}
                alt=""
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
                onError={() => setImgFailed(user.avatarUrl || null)}
              />
            ) : (
              initials || <UserIcon className="w-7 h-7" />
            )}
          </div>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={busy !== null}
            aria-label="Change profile photo"
            title="Change profile photo"
            className="absolute -bottom-0.5 -right-0.5 w-7 h-7 rounded-full bg-[#1D5FAF] hover:bg-[#174E90] text-white border-2 border-white flex items-center justify-center shadow cursor-pointer disabled:opacity-60"
          >
            {busy === 'upload' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
          </button>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif" className="hidden" onChange={onPick} />
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-semibold text-[#12263F] truncate">{user.name || 'Your account'}</h1>
            {user.registrationNumber && (
              <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#16A34A] bg-[#DCFCE7] px-2 py-0.5 rounded-full">
                <ShieldCheck className="w-3.5 h-3.5" />
                Registered practitioner
              </span>
            )}
            <span className="text-[12px] font-semibold text-[#1D5FAF] bg-[#EAF2FC] px-2 py-0.5 rounded-full">
              {CUSTOMER_TYPE_LABEL[user.role] || 'Customer'}
            </span>
          </div>
          <p className="text-[14px] text-[#5B6B82] mt-1 truncate">
            {[user.degree, user.registrationNumber && `Reg. ${user.registrationNumber}`].filter(Boolean).join(' · ') ||
              'Add your qualification and council registration under Profile.'}
          </p>
          <p className="text-[13px] text-[#8A97A8] mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5">
            {user.phone && (
              <span className="inline-flex items-center gap-1">
                {formatMobile(user.phone)}
                {user.mobileVerified && <BadgeCheck className="w-3.5 h-3.5 text-[#16A34A]" aria-label="Verified" />}
              </span>
            )}
            {user.email && (
              <span className="inline-flex items-center gap-1 min-w-0 truncate">
                {user.email}
                {user.emailVerified && <BadgeCheck className="w-3.5 h-3.5 text-[#16A34A]" aria-label="Verified" />}
              </span>
            )}
            {user.createdAt && (
              <span className="inline-flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                Member since {formatDate(user.createdAt)}
              </span>
            )}
          </p>
          {user.avatarUrl && (
            <button
              type="button"
              onClick={onRemove}
              disabled={busy !== null}
              className="mt-1.5 inline-flex items-center gap-1 text-[12px] font-semibold text-[#8A97A8] hover:text-[#DC2626] cursor-pointer disabled:opacity-50"
            >
              {busy === 'remove' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
              Remove photo
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center">
        <button
          type="button"
          onClick={onSignOut}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-[#D5DEEA] bg-white text-[#12263F] text-sm font-semibold shrink-0 cursor-pointer transition-colors hover:border-[#DC2626]/50 hover:bg-red-50 hover:text-[#DC2626]"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Sign out</span>
        </button>
      </div>
    </section>
  );
}
