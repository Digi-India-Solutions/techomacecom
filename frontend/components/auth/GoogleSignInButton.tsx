'use client';

import React, { useEffect, useRef, useState } from 'react';

/**
 * Official "Sign in with Google" button (Google Identity Services).
 * Google returns an ID token (credential); the API verifies it server-side
 * against GOOGLE_CLIENT_ID, so nothing here is trusted on its own.
 */

interface GoogleCredentialResponse {
  credential: string;
}

interface GoogleIdApi {
  initialize: (config: {
    client_id: string;
    callback: (response: GoogleCredentialResponse) => void;
    ux_mode?: 'popup' | 'redirect';
    auto_select?: boolean;
    cancel_on_tap_outside?: boolean;
  }) => void;
  renderButton: (
    parent: HTMLElement,
    options: { theme?: string; size?: string; text?: string; shape?: string; width?: number; logo_alignment?: string }
  ) => void;
}

declare global {
  interface Window {
    google?: { accounts: { id: GoogleIdApi } };
  }
}

const SCRIPT_SRC = 'https://accounts.google.com/gsi/client';
let scriptPromise: Promise<void> | null = null;

function loadGoogleScript(): Promise<void> {
  if (window.google?.accounts?.id) return Promise.resolve();
  scriptPromise ??= new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => {
      scriptPromise = null;
      reject(new Error('Could not load Google sign-in'));
    };
    document.head.appendChild(script);
  });
  return scriptPromise;
}

interface GoogleSignInButtonProps {
  clientId: string;
  onCredential: (credential: string) => void;
  disabled?: boolean;
}

export const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({ clientId, onCredential, disabled }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const callbackRef = useRef(onCredential);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    callbackRef.current = onCredential;
  }, [onCredential]);

  useEffect(() => {
    let cancelled = false;
    loadGoogleScript()
      .then(() => {
        if (cancelled || !containerRef.current || !window.google) return;
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => callbackRef.current(response.credential),
          ux_mode: 'popup',
          cancel_on_tap_outside: true,
        });
        const width = Math.min(400, Math.max(200, containerRef.current.offsetWidth || 320));
        window.google.accounts.id.renderButton(containerRef.current, {
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          shape: 'rectangular',
          logo_alignment: 'center',
          width,
        });
      })
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, [clientId]);

  if (failed) {
    return <p className="text-xs text-center text-[#5B6B82]">Google sign-in could not load. Please use mobile OTP.</p>;
  }

  return (
    <div
      ref={containerRef}
      className={`w-full flex justify-center min-h-[44px] ${disabled ? 'pointer-events-none opacity-50' : ''}`}
      aria-label="Continue with Google"
    />
  );
};

export default GoogleSignInButton;
