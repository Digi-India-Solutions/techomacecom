'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { BadgeCheck, Laptop, Loader2, LogOut, RefreshCw, Smartphone, Tablet } from 'lucide-react';
import type { DeviceSession, User } from '@/types';
import { useToastStore } from '@/lib/store';
import { listSessions, signOutOtherSessions, signOutSession } from '@/lib/api/account';
import { errorMessage } from '@/lib/api/backend';
import { formatMobile } from '@/lib/india';
import { btnSecondary, formatDateTime, SectionHeader, timeAgo } from './ui';

const DEVICE_ICON = { desktop: Laptop, mobile: Smartphone, tablet: Tablet } as const;

/** Sign-in methods and the browsers/apps where this account is signed in. */
export default function SecurityTab({ user }: { user: User }) {
  const { addToast } = useToastStore();
  const [sessions, setSessions] = useState<DeviceSession[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmAll, setConfirmAll] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setSessions(await listSessions());
    } catch (err) {
      addToast({ type: 'error', title: 'Could not load devices', message: errorMessage(err) });
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    let alive = true;
    listSessions()
      .then((list) => alive && setSessions(list))
      .catch((err) => addToast({ type: 'error', title: 'Could not load devices', message: errorMessage(err) }))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [addToast]);

  const others = (sessions || []).filter((s) => !s.current);

  const signOut = async (s: DeviceSession) => {
    setBusyId(s.id);
    try {
      const res = await signOutSession(s.id);
      setSessions((list) => (list || []).filter((x) => x.id !== s.id));
      addToast({ type: 'success', title: 'Device signed out', message: res.message });
    } catch (err) {
      addToast({ type: 'error', title: 'Could not sign out device', message: errorMessage(err) });
      load();
    } finally {
      setBusyId(null);
    }
  };

  const signOutAll = async () => {
    setBusyId('all');
    try {
      const res = await signOutOtherSessions();
      addToast({ type: 'success', title: 'Other devices signed out', message: res.message });
      setConfirmAll(false);
      load();
    } catch (err) {
      addToast({ type: 'error', title: 'Could not sign out devices', message: errorMessage(err) });
    } finally {
      setBusyId(null);
    }
  };

  const methods = [
    {
      label: 'Mobile OTP',
      detail: user.phone ? formatMobile(user.phone) : 'No mobile number yet — add one under Profile',
      on: Boolean(user.phone && user.mobileVerified),
    },
    {
      label: 'Google',
      detail: user.hasGoogle ? user.email : 'Use “Continue with Google” on the sign-in screen to link it',
      on: Boolean(user.hasGoogle),
    },
  ];

  return (
    <>
      <SectionHeader title="Login & devices" subtitle="How you sign in, and where your account is signed in right now." />

      <div className="max-w-3xl space-y-6">
        <section>
          <h3 className="text-[15px] font-semibold text-[#12263F] mb-3">Sign-in methods</h3>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {methods.map((m) => (
              <li key={m.label} className="rounded-2xl border border-[#DCE6F2] p-4">
                <p className="flex items-center justify-between gap-2 text-[14px] font-semibold text-[#12263F]">
                  {m.label}
                  <span
                    className={`inline-flex items-center gap-1 text-[12px] font-semibold px-2 py-0.5 rounded-full ${
                      m.on ? 'text-[#16A34A] bg-[#DCFCE7]' : 'text-[#5B6B82] bg-[#EEF2F7]'
                    }`}
                  >
                    {m.on && <BadgeCheck className="w-3.5 h-3.5" />}
                    {m.on ? 'Active' : 'Not set up'}
                  </span>
                </p>
                <p className="text-[13px] text-[#5B6B82] mt-1 break-words">{m.detail}</p>
              </li>
            ))}
          </ul>
          {user.lastLoginAt && (
            <p className="text-[12px] text-[#8A97A8] mt-2">Last sign-in: {formatDateTime(user.lastLoginAt)}</p>
          )}
        </section>

        <section>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <h3 className="text-[15px] font-semibold text-[#12263F]">Signed-in devices</h3>
            <div className="flex items-center gap-2">
              <button type="button" onClick={load} disabled={loading} className={`${btnSecondary} !px-3 !py-2`} aria-label="Refresh" title="Refresh">
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
              {others.length > 0 && !confirmAll && (
                <button
                  type="button"
                  onClick={() => setConfirmAll(true)}
                  className={`${btnSecondary} !py-2 !text-[13px] hover:!border-[#DC2626]/50 hover:!text-[#DC2626]`}
                >
                  <LogOut className="w-4 h-4" />
                  Sign out all other devices
                </button>
              )}
            </div>
          </div>

          {confirmAll && (
            <div className="flex flex-wrap items-center gap-2 p-3 mb-3 rounded-lg bg-red-50 border border-red-100">
              <span className="text-[13px] text-red-800 flex-1">
                Sign out {others.length} other device{others.length === 1 ? '' : 's'}? This browser stays signed in.
              </span>
              <button
                type="button"
                onClick={() => setConfirmAll(false)}
                className="px-3 py-1.5 rounded-md text-[13px] font-semibold text-[#12263F] bg-white border border-[#D5DEEA] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={busyId === 'all'}
                onClick={signOutAll}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-semibold text-white bg-[#DC2626] hover:bg-[#B91C1C] cursor-pointer disabled:opacity-60"
              >
                {busyId === 'all' && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Sign out others
              </button>
            </div>
          )}

          <ul className="divide-y divide-[#EEF2F7] rounded-2xl border border-[#DCE6F2]">
            {loading && !sessions
              ? Array.from({ length: 2 }).map((_, i) => (
                  <li key={i} className="flex items-center gap-3 px-4 py-4">
                    <span className="skeleton w-10 h-10 rounded-full" />
                    <span className="flex-1 space-y-2">
                      <span className="skeleton block h-3.5 w-44" />
                      <span className="skeleton block h-3 w-64 max-w-full" />
                    </span>
                  </li>
                ))
              : (sessions || []).map((s) => {
                  const Icon = DEVICE_ICON[s.type] || Laptop;
                  return (
                    <li key={s.id} className="flex flex-wrap items-center gap-3 px-4 py-4">
                      <span
                        className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                          s.current ? 'bg-[#1D5FAF] text-white' : 'bg-[#EAF2FC] text-[#1D5FAF]'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-semibold text-[#12263F] flex flex-wrap items-center gap-2">
                          {s.label}
                          {s.current && (
                            <span className="text-[11px] font-semibold text-[#16A34A] bg-[#DCFCE7] px-2 py-0.5 rounded-full">This device</span>
                          )}
                        </p>
                        <p className="text-[13px] text-[#5B6B82] mt-0.5">
                          {[s.ipAddress && `IP ${s.ipAddress}`, `Active ${timeAgo(s.lastActiveAt)}`].filter(Boolean).join(' · ')}
                        </p>
                      </div>
                      {!s.current && (
                        <button
                          type="button"
                          disabled={busyId !== null}
                          onClick={() => signOut(s)}
                          className={`${btnSecondary} !py-2 !text-[13px]`}
                        >
                          {busyId === s.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
                          Sign out
                        </button>
                      )}
                    </li>
                  );
                })}
          </ul>
          <p className="text-[12px] text-[#8A97A8] mt-2">Don&rsquo;t recognise a device? Sign it out, then sign in again with a fresh OTP.</p>
        </section>
      </div>
    </>
  );
}
